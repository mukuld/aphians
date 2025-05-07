const express = require('express');
const passport = require('../auth/passport');
const router = express.Router();
const fs = require('fs');

const logFile = '/var/log/aphians-server.log';
const pid = process.pid;

const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [PID:${pid}] ${message}\n`;
  console.log(logMessage.trim());
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    console.error(`File log error: ${err.message}`);
  }
};

router.use((req, res, next) => {
  log('Auth route accessed: ' + JSON.stringify({
    method: req.method,
    url: req.originalUrl,
    sessionID: req.sessionID,
    session: req.session,
    cookies: req.headers.cookie || 'none'
  }));
  next();
});

router.get('/google', (req, res, next) => {
  log('Google OAuth start: ' + JSON.stringify({
    sessionID: req.sessionID,
    state: req.query.state || 'none'
  }));
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: req.sessionID
  })(req, res, next);
});

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/aphians/' }),
  (req, res, next) => {
    log('Google OAuth callback success: ' + JSON.stringify({
      user: req.user,
      sessionID: req.sessionID,
      session: req.session,
      state: req.query.state || 'none',
      code: req.query.code ? 'present' : 'none'
    }));
    req.session.user = req.user;
    req.session.save((err) => {
      if (err) {
        log('Session save error in callback: ' + err.message);
        return next(err);
      }
      log('Session saved in callback');
      req.sessionStore.get(req.sessionID, (err, sessionData) => {
        if (err) {
          log('Session store get error: ' + err.message);
          return next(err);
        }
        log('Session data in store: ' + JSON.stringify(sessionData));
        res.redirect('/aphians/profile');
      });
    });
  }
);

router.get('/logout', (req, res) => {
  log('Logout request: ' + JSON.stringify({
    sessionID: req.sessionID,
    session: req.session
  }));
  req.logout((err) => {
    if (err) {
      log('Logout error: ' + err.message);
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy(() => {
      res.redirect('/aphians/');
    });
  });
});

module.exports = router;