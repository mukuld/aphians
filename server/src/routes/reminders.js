import nodemailer from 'nodemailer';
import cron from 'node-cron';
import moment from 'moment-timezone';
import dotenv from 'dotenv';
import log from '../utils/logger.js';
import db from '../config/db.js'; // Importing the database connection pool from db.js

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
  // Test the transporter
  await transporter.verify();
  log.info('Nodemailer transporter configured successfully');
} catch (err) {
  log.error('Failed to configure Nodemailer transporter:', { message: err.message, stack: err.stack });
  process.exit(1); // Exit if email setup fails, as it's critical
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
  } catch (err) {
    log.error('Error sending email:', { message: err.message, stack: err.stack, to });
    // throw err;
  }
}

// Helper to fetch upcoming reminders directly from the database
async function fetchUpcomingReminders() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();

    // Query to fetch all profiles with upcoming events (same logic as in profile.routes.js)
    // We fetch all profiles and filter in code to respect time zones
    const query = `
      SELECT user_id, full_name, email_id, birthday, marriage_anniversary, timezone, receive_email_reminders
      FROM profiles
      WHERE receive_email_reminders = 1
      AND (
        (MONTH(birthday) = ? AND DAY(birthday) BETWEEN ? AND ?)
        OR (MONTH(marriage_anniversary) = ? AND DAY(marriage_anniversary) BETWEEN ? AND ?)
      )
    `;
    const [rows] = await db.query(query);
    log.debug('Fetched profiles for reminders:', { count: rows.length });

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
        if (bdayMonth === currentMonthInTz && bdayDay >= currentDayInTz && bdayDay <= currentDayInTz + 7) {
          events.push({
            type: 'Birthday',
            date: bday.format('YYYY-MM-DD'),
          });
        }
      }
      if (marriage_anniversary) {
        const anni = moment(marriage_anniversary).tz(userTz);
        const anniMonth = anni.month() + 1;
        const anniDay = anni.date();
        if (anniMonth === currentMonthInTz && anniDay >= currentDayInTz && anniDay <= currentDayInTz + 7) {
          events.push({
            type: 'Marriage Anniversary',
            date: anni.format('YYYY-MM-DD'),
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

    log.info('Processed reminders:', { count: reminders.length });
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

      await sendEmail(email_id, subject, text);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay to avoid rate limiting.
      log.info('Processed reminder for user:', { user_id: reminder.user_id, email: email_id, events: eventMessages });
    }

    log.info('Finished processing reminders.', { total: reminders.length });
  } catch (err) {
    log.error('Error in processReminders:', { message: err.message, stack: err.stack });
  }
}

// Schedule the reminder job to run daily at 8:00 AM UTC
// Adjust the time as needed, or make it configurable via .env
cron.schedule('0 8 * * *', () => {
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