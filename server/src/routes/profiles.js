const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

router.get('/', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
  db.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id], (err, results) => {
    res.json(results[0] || {});
  });
});

router.post('/', upload.single('latest_photo'), (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
  const profileData = { ...req.body, user_id: req.user.id };
  if (req.file) {
    profileData.latest_photo = `/uploads/${req.file.filename}`;
  }
  db.query('INSERT INTO profiles SET ? ON DUPLICATE KEY UPDATE ?', [profileData, profileData], 
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true });
    });
});

module.exports = router;