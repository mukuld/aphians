import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from '../config/db.js';
import { ensureAuthenticated } from '../middleware/authMiddleware.js';
import log from '../utils/logger.js';
import fs from 'fs';
import { type } from "os";
// import { error } from "console";

dotenv.config();
const router = express.Router();

// Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use .env for upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || '../../uploads/';

// Ensure Uploads directory exists
const uploadDirPath = path.join(__dirname, '../../', UPLOAD_DIR);
if (!fs.existsSync(uploadDirPath)) {
  fs.mkdirSync(uploadDirPath, { recursive: true });
  log.info(`Created upload directory: ${uploadDirPath}`);
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    log.debug('Multer destination:', { uploadDirPath });
    cb(null, uploadDirPath);
  },
  filename: (req, file, cb) => {
    const filename = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    log.debug('Multer filename:', { filename, originalName: file.originalname });
    cb(null, filename);
  }
});
const upload = multer({ storage });

// Helper: Format date to MySQL format (YYYY-MM-DD)
function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
}

// GET current user's profile
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    log.debug('Fetching profile for user:', { userId, sessionID: req.sessionID });
    const [rows] = await db.query('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    if (rows.length === 0) {
      log.info('No profile found for user:', { userId });
      return res.status(404).json({ error: 'Profile not found' });
    }
    log.info('Profile fetched successfully:', { userId });
    res.json(rows[0]);
  } catch (err) {
    log.error('GET /profile error:', { message: err.message, stack: err.stack, sessionID: req.sessionID });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET all profiles
router.get('/all', ensureAuthenticated, async (req, res) => {
  try {
    log.info('--- [/api/profile/all] Handler Entered ---', {
      userId: req.user?.id,
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      cookies: req.cookies
    });
    if (!req.user?.id || !req.isAuthenticated()) {
      log.error('[/api/profile/all] Authentication failed', {
        user: req.user,
        sessionID: req.sessionID,
        cookies: req.cookies
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [schema] = await db.query('SHOW COLUMNS FROM profiles');
    log.debug('[/api/profile/all] Profiles table schema:', { schema });

    const [rows] = await db.query(
      'SELECT user_id, full_name, latest_photo, city FROM profiles WHERE user_id IS NOT NULL AND user_id > 0'
    );
    log.info('[/api/profile/all] Profiles fetched successfully:', { count: rows.length, rows });
    res.json(rows);
  } catch (err) {
    log.error('[/api/profile/all] Error:', {
      message: err.message,
      stack: err.stack,
      sessionID: req.sessionID,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET profile by user ID
router.get('/:userId', ensureAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId) || userId <= 0) {
      log.error(`Invalid userId in GET /profile/${userId}`, {
        rawUserId: req.params.userId,
        parsedUserId: userId,
        sessionID: req.sessionID
      });
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    log.debug('Fetching profile by user ID:', { userId, sessionID: req.sessionID });
    const [rows] = await db.query('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    if (rows.length === 0) {
      log.info('No profile found for user ID:', { userId });
      return res.status(404).json({ error: 'Profile not found' });
    }
    log.info('Profile fetched successfully:', { userId });
    res.json(rows[0]);
  } catch (err) {
    log.error(`GET /profile/${req.params.userId} error:`, {
      message: err.message,
      stack: err.stack,
      rawUserId: req.params.userId,
      sessionID: req.sessionID
    });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST profile (create or update)
router.post('/', ensureAuthenticated, upload.single('latest_photo'), async (req, res) => {
  try {
    const userId = req.user.id;
    log.debug('Creating/updating profile for user:', { userId, sessionID: req.sessionID });

    const {
      full_name,
      street_address,
      city,
      state,
      zip,
      country,
      phone_country_code,
      phone_number,
      email_id,
      birthday,
      marriage_anniversary,
      current_occupation,
      company_name,
      job_role,
      social_media_1,
      social_media_2,
      social_media_3,
      spouse_name,
      child_1_name,
      child_2_name,
      child_3_name,
      child_1_age,
      child_2_age,
      child_3_age,
      special_message,
      timezone,
      receive_email_reminders
    } = req.body;

    let latest_photo = null;

    // Check if a new file was uploaded
    if (req.file) {
      latest_photo = `/aphians/${UPLOAD_DIR}${req.file.filename}`;
      log.debug('New profile image uploaded:', {
        latest_photo,
        file: { filename: req.file.filename, path: req.file.path }
      });
    } else {
      // If no new file, retrieve the existing photo path from the database
      const [existingProfile] = await db.query('SELECT latest_photo FROM profiles WHERE user_id = ?', [userId]);
      if (existingProfile.length > 0 && existingProfile[0].latest_photo) {
        latest_photo = existingProfile[0].latest_photo;
        log.debug('Retaining existing profile photo:', { latest_photo });
      } else {
        // If it's a new profile or existing profile without a photo, and no new photo uploaded, require it.
        // This condition means no photo exists and no new photo is provided for a new profile.
        if (!full_name || !street_address || !city || !country || !phone_number || !email_id || !birthday) {
             log.error('Missing mandatory fields for new profile creation, including photo', { body: req.body });
             return res.status(400).json({ error: 'Missing mandatory fields, including profile photo for new profile.' });
        }
         log.warn('No new photo uploaded, and no existing photo found. Profile will be saved without a photo.', { userId });
      }
    }

    // Validate mandatory fields (excluding photo if it's an update without new photo)
    if (!full_name || !street_address || !city || !country || !phone_number || !email_id || !birthday) {
      log.error('Missing mandatory text fields for profile update', { body: req.body });
      return res.status(400).json({ error: 'Missing mandatory text fields' });
    }

    const formattedBirthday = formatDate(birthday);
    const formattedAnniversary = formatDate(marriage_anniversary);
    const formattedReceiveEmailReminders = receive_email_reminders === "true" || receive_email_reminders === true ? 1 : 0;

    const profileData = {
      user_id: userId,
      full_name,
      street_address,
      city,
      state: state || null,
      zip: zip || null,
      country,
      phone_country_code: phone_country_code || null,
      phone_number,
      email_id,
      birthday: formattedBirthday,
      marriage_anniversary: formattedAnniversary,
      current_occupation: current_occupation || null,
      company_name: company_name || null,
      job_role: job_role || null,
      social_media_1: social_media_1 || null,
      social_media_2: social_media_2 || null,
      social_media_3: social_media_3 || null,
      spouse_name: spouse_name || null,
      child_1_name: child_1_name || null,
      child_2_name: child_2_name || null,
      child_3_name: child_3_name || null,
      child_1_age: child_1_age ? parseInt(child_1_age, 10) : null,
      child_2_age: child_2_age ? parseInt(child_2_age, 10) : null,
      child_3_age: child_3_age ? parseInt(child_3_age, 10) : null,
      special_message: special_message || null,
      latest_photo, // This will be either the new photo path or the retained old one
      timezone: timezone || "UTC",
      receive_email_reminders: formattedReceiveEmailReminders
    };

    const query = 'INSERT INTO profiles SET ? ON DUPLICATE KEY UPDATE ?';
    await db.query(query, [profileData, profileData]);
    log.info('Profile created/updated successfully:', { userId, latest_photo });

    // Fetch the updated profile to return
    const [rows] = await db.query('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    res.json(rows[0]);
  } catch (err) {
    log.error('POST /profile error:', { message: err.message, stack: err.stack, sessionID: req.sessionID });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET profiles with upcoming birthdays or anniversaries for reminders
router.get("/reminders/upcoming", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    log.debug("Fetching profiles for reminders for user: ", { userId, sessionID: req.sessionID});

    // Current data in UTC for comparison
    const now = new Date();
    const currentMonth = now.getMonth() +1;
    const currentDay = now.getDate();

    // Query to find profiles with upcoming birthdays or anniversaries within the next 7 days
    // Exclude the current user's profile and only include users who have opted into email reminders.
    const query = `
    SELECT user_id, full_name, email_id, birthday, marriage_anniversary, timezone
    FROM profiles
    WHERE user_id != ?
    AND receive_email_reminders = 1
    AND (
      (MONTH(birthday) = ? AND DAY(birthday) BETWEEN ? AND ?)
      OR (MONTH(marriage_anniversary) = ? AND DAY(marriage_anniversary) >= BETWEEN ? AND ?)
  )
  `;
  const params = [
    userId,
    currentMonth, currentDay, currentDay + 7,
    currentMonth, currentDay, currentDay + 7
  ];

  const [rows] = await db.query(query, params);
  log.info("Fetched profiles for reminders: ", { count: rows.length, userId});

  // Format the reminder data
  const reminders = rows.map(profile => {
    const events = [];
    const birthday = profile.birthday ? new Date(profile.birthday) : null;
    const anniversary = profile.marriage_anniversary ? new Date(profile.marriage_anniversary) : null;

    if (birthday && birthday.getMonth() + 1 === currentMonth && birthday.getDate() >= currentDay && birthday.getDate() <= currentDay + 7) {
      events.push({
        type: "Birthday",
        date: birthday.toISOString().split("T")[0]
      });
    }

    if (anniversary && anniversary.getMonth() + 1 === currentMonth && anniversary.getDate() >= currentDay && anniversary.getDate() <= currentDay + 7) {
      events.push({
        type: "Marriage Anniversary",
        date: anniversary.toISOString().split("T")[0]
      });
    }

    return {
      user_id: profile.user_id,
      full_name: profile.full_name,
      email_id: profile.email_id,
      timezone: profile.timezone || "UTC",
      events
    }
  }).filter(profile => profile.events.length > 0);

  res.json(reminders);
  } catch (err) {
    log.error("GET /profile/reminders/upcoming error:", { message: err.message, stack: err.stack, sessionID: req.sessionID });
    res.status(500).json({ error: "Server error", details: err.message});
  }
});

export default router;