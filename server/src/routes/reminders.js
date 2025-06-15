import nodemailer from 'nodemailer';
import cron from 'node-cron';
import moment from 'moment-timezone';
import dotenv from 'dotenv';
import log from '../utils/logger.js';
import db from '../config/db.js';
import { formatToDDMMYYYY } from '../utils/dateUtils.js';

dotenv.config();

// Configure Nodemailer transporter
let transporter;
try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.verify();
  log.info('Nodemailer transporter configured successfully');
} catch (err) {
  log.error('Failed to configure Nodemailer transporter:', { message: err.message, stack: err.stack });
  process.exit(1);
}

// Helper to send email
async function sendEmail(to, subject, text) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Aphians App" <no-reply@aphians.com>',
      to,
      subject,
      text,
    };
    const info = await transporter.sendMail(mailOptions);
    log.info('Email sent successfully:', { messageId: info.messageId, to });
    return true;
  } catch (err) {
    log.error('Error sending email:', { message: err.message, stack: err.stack, to });
    return false;
  }
}

// Helper to fetch upcoming reminders directly from the database
async function fetchUpcomingReminders() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    log.debug('Querying for events between:', { 
      start: `${currentDay}/${currentMonth}`, 
      end: `${currentDay + 7}/${currentMonth}` 
    });

    const query = `
      SELECT user_id, full_name, email_id, birthday, marriage_anniversary, timezone, receive_email_reminders
      FROM profiles
      WHERE receive_email_reminders = 1
      AND (
        (MONTH(birthday) = ? AND DAY(birthday) BETWEEN ? AND ?)
        OR (MONTH(marriage_anniversary) = ? AND DAY(marriage_anniversary) BETWEEN ? AND ?)
      )
    `;
    const params = [
      currentMonth, currentDay, currentDay + 7,
      currentMonth, currentDay, currentDay + 7
    ];
    const [rows] = await db.query(query, params);
    log.debug('Fetched profiles for reminders:', { count: rows.length, profiles: rows });

    const reminders = [];
    for (const profile of rows) {
      const { user_id, full_name, email_id, birthday, marriage_anniversary, timezone } = profile;
      const userTz = timezone || 'UTC';
      const nowInUserTz = moment.tz(now, userTz);
      const currentMonthInTz = nowInUserTz.month() + 1;
      const currentDayInTz = nowInUserTz.date();

      const events = [];
      if (birthday) {
        const bday = moment(birthday).tz(userTz);
        const bdayMonth = bday.month() + 1;
        const bdayDay = bday.date();
        log.debug('Checking birthday:', { 
          user_id, 
          birthday: bday.format('YYYY-MM-DD'), 
          bdayMonth, 
          bdayDay, 
          currentMonthInTz, 
          currentDayInTz 
        });
        if (bdayMonth === currentMonthInTz && bdayDay >= currentDayInTz && bdayDay <= currentDayInTz + 7) {
          events.push({
            type: 'Birthday',
            date: formatToDDMMYYYY(bday)
          });
        }
      }
      if (marriage_anniversary) {
        const anni = moment(marriage_anniversary).tz(userTz);
        const anniMonth = anni.month() + 1;
        const anniDay = anni.date();
        log.debug('Checking anniversary:', { 
          user_id, 
          marriage_anniversary: anni.format('YYYY-MM-DD'), 
          anniMonth, 
          anniDay, 
          currentMonthInTz, 
          currentDayInTz 
        });
        if (anniMonth === currentMonthInTz && anniDay >= currentDayInTz && anniDay <= currentDayInTz + 7) {
          events.push({
            type: 'Marriage Anniversary',
            date: formatToDDMMYYYY(anni)
          });
        }
      }

      if (events.length > 0) {
        reminders.push({
          user_id,
          full_name,
          email_id,
          timezone: userTz,
          events,
        });
      }
    }

    log.info('Processed reminders:', { count: reminders.length, reminders });
    return reminders;
  } catch (err) {
    log.error('Error fetching upcoming reminders:', { message: err.message, stack: err.stack });
    throw err;
  }
}

// Main function to process reminders
async function processReminders() {
  try {
    log.info('Starting reminder processing...', { time: new Date().toISOString() });

    const reminders = await fetchUpcomingReminders();
    if (reminders.length === 0) {
      log.info('No upcoming reminders to process.');
      return;
    }

    for (const reminder of reminders) {
      const { full_name, email_id, events } = reminder;
      const eventMessages = events.map(event => `${event.type} on ${event.date}`).join(' and ');
      const subject = `Upcoming Event Reminder: ${full_name}`;
      const text = `Hello,\n\nThis is a reminder that ${full_name} has the following upcoming event(s):\n${eventMessages}.\n\nBest regards,\nAphians Team`;

      const emailSent = await sendEmail(email_id, subject, text);
      if (!emailSent) {
        log.warn('Email sending failed for user:', { user_id: reminder.user_id, email: email_id });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      log.info('Processed reminder for user:', { user_id: reminder.user_id, email: email_id, events: eventMessages });
    }

    log.info('Finished processing reminders.', { total: reminders.length });
  } catch (err) {
    log.error('Error in processReminders:', { message: err.message, stack: err.stack });
  }
}

// Schedule the reminder job to run every 5 minutes for testing
cron.schedule('* 4 * * *', () => {
  log.info('Running scheduled reminder job...');
  processReminders();
}, {
  scheduled: true,
  timezone: 'UTC',
});

// Optionally, run immediately on startup for testing
if (process.env.NODE_ENV === 'development') {
  log.info('Running reminders immediately on startup (development mode)...');
  processReminders();
}

export default processReminders;