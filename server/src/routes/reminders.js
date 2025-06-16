import nodemailer from 'nodemailer';
import cron from 'node-cron';
import moment from 'moment-timezone';
import dotenv from 'dotenv';
import log from '../utils/logger.js';
import db from '../config/db.js';
import { formatToDDMMYYYY } from '../utils/dateUtils.js';

dotenv.config();

log.info('Initializing reminders.js...');

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
      console.error(`Nodemailer configuration attempt ${attempt} failed:`, err.message, err.stack);
      log.error(`Nodemailer configuration attempt ${attempt} failed:`, { message: err.message, stack: err.stack });
      if (attempt === maxRetries) {
        log.error('Max retries reached. Could not configure Nodemailer transporter. Proceeding without email functionality.');
        transporter = null;
        return;
      }
      log.info(`Retrying Nodemailer configuration in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// Initialize transporter with retry
log.info('Calling configureTransporterWithRetry...');
await configureTransporterWithRetry();
log.info('Finished configuring Nodemailer transporter.');

// Helper to send email (modified to use BCC)
// 'to' parameter here will be the BCC recipients.
// A dummy 'to' address can be used, or it can be left blank if only BCC is needed.
async function sendEmail(bccRecipients, subject, text) {
  if (!transporter) {
    log.error('Cannot send email: Transporter not configured');
    return false;
  }
  if (!bccRecipients || bccRecipients.length === 0) {
    log.warn('No BCC recipients provided for email. Skipping send.');
    return false;
  }
  try {
    // For BCC-only emails, it's common practice to set the 'to' field to the sender's email
    // or a generic "undisclosed-recipients" to avoid spam filters flagging it.
    // However, Nodemailer typically handles an empty 'to' if 'bcc' is present.
    // For clarity, we'll send it to a dummy recipient or the sender itself if needed,
    // but the actual visible recipient will be empty for others.
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Aphians App" <no-reply@aphians.com>',
      to: process.env.EMAIL_FROM || '"Undisclosed Recipients" <no-reply@aphians.com>', // Dummy or sender email for 'To' field
      bcc: bccRecipients, // All actual recipients are in BCC
      subject,
      text,
    };
    log.debug(`Sending email with subject: "${subject}" to BCC recipients: ${bccRecipients.join(', ')}`);
    const info = await transporter.sendMail(mailOptions);
    log.info('Email sent successfully:', { messageId: info.messageId, bccRecipients: bccRecipients.length });
    return true;
  } catch (err) {
    log.error('Error sending email:', { message: err.message, stack: err.stack, bccRecipients });
    return false;
  }
}

// Helper to fetch all email addresses for recipients who want reminders
async function fetchAllReminderRecipientEmails() {
  try {
    const query = `
      SELECT email_id
      FROM profiles
      WHERE receive_email_reminders = 1
    `;
    const [rows] = await db.query(query);
    const emails = rows.map(row => row.email_id);
    log.debug('Fetched all reminder recipient emails:', { count: emails.length, emails });
    return emails;
  } catch (err) {
    log.error('Error fetching all reminder recipient emails:', { message: err.message, stack: err.stack });
    throw err;
  }
}


// Helper to fetch upcoming reminders directly from the database
async function fetchUpcomingReminders() {
  try {
    // Fetch all profiles that want email reminders and have a birthday or anniversary
    const query = `
      SELECT user_id, full_name, email_id, birthday, marriage_anniversary, timezone, receive_email_reminders
      FROM profiles
      WHERE receive_email_reminders = 1
      AND (birthday IS NOT NULL OR marriage_anniversary IS NOT NULL)
    `;
    const [rows] = await db.query(query);
    log.debug('Fetched profiles for reminder processing:', { count: rows.length, profiles: rows });

    const reminders = [];
    const now = moment(); // Current moment in local timezone

    for (const profile of rows) {
      const { user_id, full_name, email_id, birthday, marriage_anniversary, timezone } = profile;
      const userTz = timezone || 'UTC'; // Default to UTC if timezone is not set

      // Get current date/time in user's specified timezone, reset to start of day for accurate date comparison
      const nowInUserTz = moment.tz(now, userTz).startOf('day');

      const events = [];

      // Process Birthday
      if (birthday) {
        // Create a moment object for the birthday, setting its year to the current year in user's timezone, reset to start of day
        let nextBirthday = moment.tz(`${nowInUserTz.year()}-${moment(birthday).format('MM-DD')}`, userTz).startOf('day');

        // If the current year's birthday has already passed, move to next year
        if (nextBirthday.isBefore(nowInUserTz)) {
          nextBirthday.add(1, 'year');
        }

        // Check if this upcoming birthday is EXACTLY the current day
        if (nextBirthday.isSame(nowInUserTz, 'day')) {
          events.push({
            type: 'Birthday',
            date: formatToDDMMYYYY(nextBirthday), // Format the upcoming date
            upcomingDate: nextBirthday.format('YYYY-MM-DD') // For logging/debugging
          });
          log.debug(`Birthday for ${full_name} is today: ${nextBirthday.format('YYYY-MM-DD')}`);
        } else {
          log.debug(`Birthday for ${full_name} (${nextBirthday.format('YYYY-MM-DD')}) is not today from ${nowInUserTz.format('YYYY-MM-DD')}`);
        }
      }

      // Process Marriage Anniversary
      if (marriage_anniversary) {
        // Create a moment object for the anniversary, setting its year to the current year in user's timezone, reset to start of day
        let nextAnniversary = moment.tz(`${nowInUserTz.year()}-${moment(marriage_anniversary).format('MM-DD')}`, userTz).startOf('day');

        // If the current year's anniversary has already passed, move to next year
        if (nextAnniversary.isBefore(nowInUserTz)) {
          nextAnniversary.add(1, 'year');
        }

        // Check if this upcoming anniversary is EXACTLY the current day
        if (nextAnniversary.isSame(nowInUserTz, 'day')) {
          events.push({
            type: 'Marriage Anniversary',
            date: formatToDDMMYYYY(nextAnniversary), // Format the upcoming date
            upcomingDate: nextAnniversary.format('YYYY-MM-DD') // For logging/debugging
          });
          log.debug(`Anniversary for ${full_name} is today: ${nextAnniversary.format('YYYY-MM-DD')}`);
        } else {
          log.debug(`Anniversary for ${full_name} (${nextAnniversary.format('YYYY-MM-DD')}) is not today from ${nowInUserTz.format('YYYY-MM-DD')}`);
        }
      }

      if (events.length > 0) {
        reminders.push({
          user_id,
          full_name,
          email_id, // This is the email of the person whose event it is
          timezone: userTz,
          events,
        });
      }
    }

    log.info('Identified upcoming reminders:', { count: reminders.length, reminders });
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
      log.info(`No upcoming reminders to process: ${new Date().toISOString()}`);
      return;
    }

    // Fetch all eligible recipient emails once
    const allRecipientEmails = await fetchAllReminderRecipientEmails();
    if (allRecipientEmails.length === 0) {
      log.warn('No users configured to receive reminder emails. Cannot send any reminders.');
      return;
    }

    for (const reminder of reminders) {
      const { full_name, email_id, events } = reminder; // email_id here is the person whose event it is
      const eventMessages = events.map(event => `${event.type} on ${event.date}`).join(' and ');
      const subject = `Event Today: ${full_name}'s Event`; // Updated subject for clarity
      const text = `Hello,\n\nThis is a reminder that ${full_name} has the following event(s) today:\n${eventMessages}.\n\nBest regards,\nAphians Team`; // Updated text for clarity

      // Filter out the person whose event it is from the recipients list
      const bccRecipients = allRecipientEmails.filter(recipientEmail => recipientEmail !== email_id);

      if (bccRecipients.length === 0) {
        log.info(`No other recipients to send reminder for ${full_name}'s event via BCC.`);
        continue; // Move to the next reminder if no other recipients
      }

      // Send one email with all valid BCC recipients
      const emailSent = await sendEmail(bccRecipients, subject, text);
      if (!emailSent) {
        log.warn('Consolidated email sending failed for event:', { forUser: full_name, event: eventMessages });
      }
      // Add a small delay after each consolidated email send
      await new Promise(resolve => setTimeout(resolve, 1000));

      log.info(`Finished sending consolidated reminder for ${full_name}'s event to ${bccRecipients.length} other users via BCC.`, {
        user_id: reminder.user_id,
        eventOwnerEmail: email_id,
        events: eventMessages
      });
    }

    log.info('Finished processing all reminders.', { totalEventsProcessed: reminders.length });
  } catch (err) {
    log.error('Error in processReminders:', { message: err.message, stack: err.stack });
  }
}

// Schedule the reminder job to run daily using the schedule from .env
cron.schedule(process.env.CRON_SCHEDULE, () => {
  log.info('Running scheduled reminder job...');
  processReminders();
}, {
  scheduled: true,
  timezone: 'UTC', // Keep timezone explicitly set for consistency
});

// Optionally, run immediately on startup for testing in development mode
if (process.env.NODE_ENV === 'development') {
  log.info('Running reminders immediately on startup (development mode)...');
  processReminders();
}

export default processReminders;