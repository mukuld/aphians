import nodemailer from 'nodemailer';
import cron from 'node-cron';
import moment from 'moment-timezone';
import dotenv from 'dotenv';
import log from '../utils/logger.js';
import db from '../config/db.js';
import { formatToDDMMYYYY } from '../utils/dateUtils.js';

dotenv.config();

// Configure Nodemailer transporter with retry logic
let transporter;
const maxRetries = 3;
const retryDelay = 5000; // 5 seconds between retries

async function configureTransporterWithRetry() {
  log.info('Starting Nodemailer transporter configuration...', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? '[REDACTED]' : 'undefined'
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
      log.debug('Attempting to verify Nodemailer transporter...');
      await transporter.verify();
      log.info('Nodemailer transporter configured successfully');
      return;
    } catch (err) {
      log.error(`Nodemailer configuration attempt ${attempt} failed:`, { message: err.message });
      if (attempt === maxRetries) {
        log.error('Max retries reached. Proceeding without email functionality.');
        transporter = null;
        return;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// Helper to send email
async function sendEmail(bccRecipients, subject, text) {
  if (!transporter) {
    log.error('Cannot send email: Transporter not configured');
    return false;
  }
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Aphians App" <no-reply@aphians.com>',
      to: process.env.EMAIL_FROM || '"Undisclosed Recipients" <no-reply@aphians.com>',
      bcc: bccRecipients,
      subject,
      text,
    };
    const info = await transporter.sendMail(mailOptions);
    log.info('Email sent successfully:', { messageId: info.messageId });
    return true;
  } catch (err) {
    log.error('Error sending email:', { message: err.message });
    return false;
  }
}

// Helper to fetch recipient emails
async function fetchAllReminderRecipientEmails() {
  const query = 'SELECT email_id FROM profiles WHERE receive_email_reminders = 1';
  const [rows] = await db.query(query);
  return rows.map(row => row.email_id);
}

// Helper to fetch upcoming reminders
async function fetchUpcomingReminders() {
  const query = `
    SELECT user_id, full_name, email_id, birthday, marriage_anniversary, timezone 
    FROM profiles 
    WHERE receive_email_reminders = 1 
    AND (birthday IS NOT NULL OR marriage_anniversary IS NOT NULL)
  `;
  const [rows] = await db.query(query);
  const reminders = [];
  const now = moment();

  for (const profile of rows) {
    const userTz = profile.timezone || 'UTC';
    const nowInUserTz = moment.tz(now, userTz).startOf('day');
    const events = [];

    // Birthday Logic
    if (profile.birthday) {
      let nextBday = moment.tz(`${nowInUserTz.year()}-${moment(profile.birthday).format('MM-DD')}`, userTz).startOf('day');
      if (nextBday.isBefore(nowInUserTz)) nextBday.add(1, 'year');
      if (nextBday.isSame(nowInUserTz, 'day')) {
        events.push({ type: 'Birthday', date: formatToDDMMYYYY(nextBday) });
      }
    }

    // Anniversary Logic
    if (profile.marriage_anniversary) {
      let nextAnniv = moment.tz(`${nowInUserTz.year()}-${moment(profile.marriage_anniversary).format('MM-DD')}`, userTz).startOf('day');
      if (nextAnniv.isBefore(nowInUserTz)) nextAnniv.add(1, 'year');
      if (nextAnniv.isSame(nowInUserTz, 'day')) {
        events.push({ type: 'Marriage Anniversary', date: formatToDDMMYYYY(nextAnniv) });
      }
    }

    if (events.length > 0) {
      reminders.push({ ...profile, events });
    }
  }
  return reminders;
}

// Main processing function
export async function processReminders() {
  try {
    const reminders = await fetchUpcomingReminders();
    if (reminders.length === 0) return;

    const allRecipientEmails = await fetchAllReminderRecipientEmails();
    
    for (const reminder of reminders) {
      const eventMessages = reminder.events.map(e => `${e.type} on ${e.date}`).join(' and ');
      const bccRecipients = allRecipientEmails.filter(email => email !== reminder.email_id);

      if (bccRecipients.length > 0) {
        await sendEmail(
          bccRecipients, 
          `Event Today: ${reminder.full_name}'s Event`,
          `Hello,\n\nThis is a reminder that ${reminder.full_name} has the following event(s) today:\n${eventMessages}.`
        );
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (err) {
    log.error('Error in processReminders:', err);
  }
}

// INITIALIZATION FUNCTION (Called from index.js)
export const initReminders = async () => {
  log.info('Initializing reminder system...');
  
  // 1. Configure Email (Non-blocking)
  configureTransporterWithRetry()
    .then(() => log.info("Nodemailer setup background task finished."))
    .catch(err => log.error("Nodemailer setup failed:", err));

  // 2. Schedule the Cron Job
  cron.schedule(process.env.CRON_SCHEDULE || '0 9 * * *', () => {
    log.info('Running scheduled reminder job...');
    processReminders();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });

  // 3. Run immediately if in development
  if (process.env.NODE_ENV === 'development') {
    log.info('Running reminders immediately for testing...');
    processReminders();
  }
};

export default processReminders;