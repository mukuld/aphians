import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db from '../config/db.js';
import { ensureAuthenticated } from '../middleware/authMiddleware.js';
import log from '../utils/logger.js';
import fs from 'fs';

dotenv.config();
const router = express.Router();

// Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use .env for upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads/';

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

// GET profile by user ID
router.get(`/{userId}`, ensureAuthenticated, async (req, res) => {
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
    log.error(`GET /profile/${userId} error:`, {
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
      full_name, street_address, city, state, zip, country, phone_number, email_id,
      birthday, current_occupation, company_name, job_role,
      social_media_1, social_media_2, social_media_3,
      spouse_name, child_1_name, child_2_name, child_3_name,
      child_1_age, child_2_age, child_3_age,
      special_message
    } = req.body;

    const latest_photo = req.file ? `/aphians/${UPLOAD_DIR}${req.file.filename}` : null;
    log.debug('Profile image saved:', {
      latest_photo,
      file: req.file ? { filename: req.file.filename, path: req.file.path } : null
    });

    const formattedBirthday = formatDate(birthday);

    const profileData = {
      user_id: userId,
      full_name: full_name || null,
      street_address: street_address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      country: country || null,
      phone_number: phone_number || null,
      email_id: email_id || null,
      birthday: formattedBirthday,
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
      latest_photo
    };

    const query = 'INSERT INTO profiles SET ? ON DUPLICATE KEY UPDATE ?';
    await db.query(query, [profileData, profileData]);
    log.info('Profile created/updated successfully:', { userId, latest_photo });
    res.json({ success: true });
  } catch (err) {
    log.error('POST /profile error:', { message: err.message, stack: err.stack, sessionID: req.sessionID });
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

export default router;