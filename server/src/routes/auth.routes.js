import { Router } from 'express';
import passport from 'passport';
import db from '../config/db.js'; // Assuming db.js is in ../config/
import dotenv from 'dotenv';
import log from '../utils/logger.js'; // Assuming logger.js is in ../utils/
import { ensureAuthenticated } from '../middleware/authMiddleware.js';

dotenv.config();

const router = Router();

// Route to initiate Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth Callback Route
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.LOGIN_REDIRECT || '/aphians/login' }),
  async (req, res) => {
    log.info('--- [/auth/google/callback] Handler Entered ---');

    // Detailed logging of req.user
    if (req.user) {
      log.info('[/auth/google/callback] req.user details:', { user: JSON.parse(JSON.stringify(req.user)) });
    } else {
      log.error('[/auth/google/callback] req.user is undefined or null upon entering route handler!');
      // If req.user is not even defined, passport.authenticate likely had an issue or deserialization failed.
      // The failureRedirect in passport.authenticate should ideally handle this,
      // but an explicit check can be useful for debugging.
      return res.redirect(process.env.LOGIN_REDIRECT || '/aphians/login');
    }

    // Robust check for req.user.id
    if (typeof req.user.id === 'undefined') {
      log.error('[/auth/google/callback] req.user.id is UNDEFINED!', { user: JSON.parse(JSON.stringify(req.user)) });
      // This is a critical issue if req.user exists but req.user.id does not.
      return res.redirect(process.env.LOGIN_REDIRECT || '/aphians/login');
    }

    const userId = req.user.id;
    log.info(`[/auth/google/callback] Extracted userId: ${userId} (Type: ${typeof userId})`);

    // Set response timeout for the entire callback handler logic
    const overallTimeout = setTimeout(() => {
      log.error('[/auth/google/callback] Overall response timeout reached (10 seconds)');
      if (!res.headersSent) {
        res.status(504).json({ error: 'Gateway Timeout - Callback processing too long' });
      }
    }, 10000); // 10 seconds overall timeout

    try {
      log.debug('[/auth/google/callback] Checking profile for user:', { userId });

      // Test database connection (optional, but good for sanity check)
      await db.query('SELECT 1');
      log.debug('[/auth/google/callback] Database connection verified (SELECT 1)');

      // Log profiles table schema (optional, for debugging schema issues)
      const [schema] = await db.query('SHOW COLUMNS FROM profiles');
      log.debug('[/auth/google/callback] Profiles table schema:', { schema });

      // Prepare SQL query for profile check
      const profileQuerySql = 'SELECT user_id FROM profiles WHERE user_id = ?';
      const profileQueryParams = [userId];
      log.info('[/auth/google/callback] Executing profile query:', { sql: profileQuerySql, params: profileQueryParams });

      // Query profile with timeout
      const [rows] = await Promise.race([
        db.query(profileQuerySql, profileQueryParams),
        new Promise((_, reject) => setTimeout(() => {
          log.error('[/auth/google/callback] Database query for profile TIMEOUT (10 seconds)');
          reject(new Error('Database query for profile timeout'));
        }, 10000)) // 3 seconds timeout for this specific query
      ]);

      log.info('[/auth/google/callback] Profile query result:', { rows }); // Log the actual rows content

      // Save session explicitly (Passport usually handles this with req.login, but explicit save can be useful)
      // Ensure req.session.save is awaited if you need to guarantee it completes before redirect.
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            log.error('[/auth/google/callback] Session save failed:', { message: err.message, stack: err.stack });
            // Decide if this is a fatal error for the redirect.
            // Usually, the session would have been saved by passport.serializeUser already.
            // This explicit save is more about ensuring any modifications in *this handler* are saved.
            reject(err); // If save must succeed before redirect.
          } else {
            log.info('[/auth/google/callback] Session explicitly saved successfully');
            resolve();
          }
        });
      });

      const communityRedirect = process.env.COMMUNITY_REDIRECT || '/aphians/community';
      const profileRedirect = process.env.PROFILE_REDIRECT || '/aphians/profile';

      if (rows && rows.length > 0) {
        log.info(`[/auth/google/callback] Profile found. Redirecting to community: ${communityRedirect}`);
        res.redirect(communityRedirect);
      } else {
        log.info(`[/auth/google/callback] Profile NOT found. Redirecting to profile setup: ${profileRedirect}`);
        res.redirect(profileRedirect);
      }

      clearTimeout(overallTimeout); // Clear the overall timeout since we're done.

    } catch (err) {
      clearTimeout(overallTimeout); // Clear timeout on error too.
      log.error('[/auth/google/callback] Error during callback processing:', {
        message: err.message || 'Unknown error',
        stack: err.stack || 'No stack trace',
        userId: req.user ? req.user.id : 'N/A', // Log userId if available
        user: req.user ? JSON.parse(JSON.stringify(req.user)) : 'req.user was undefined/null'
      });
      if (!res.headersSent) {
        res.redirect(process.env.LOGIN_REDIRECT || '/aphians/login');
      }
    }
  }
);

// GET current authenticated user's status/data
router.get('/current', ensureAuthenticated, (req, res) => {
  log.info('[/auth/current] Request for current user status', { userId: req.user?.id });
  if (req.user) {
      res.json({
          isAuthenticated: true,
          user: {
              id: req.user.id,
              displayName: req.user.displayName,
              email: req.user.email
          }
      });
  } else {
      log.info('[/auth/current] User not authenticated (req.user is null)');
      res.status(401).json({ isAuthenticated: false, message: 'Not authenticated' });
  }
});

// Logout Route
router.get('/logout', (req, res, next) => { // Added next for passport v0.6.0 logout
  log.info('User logging out');
  req.logout((err) => {
    if (err) {
      log.error('Logout failed:', { message: err.message, stack: err.stack });
      return next(err); // Pass error to error handler
    }
    // Session is typically destroyed or cleared by req.logout()
    // For express-session, you might want to explicitly destroy it if req.logout doesn't.
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        log.error('Failed to destroy session during logout:', { message: destroyErr.message, stack: destroyErr.stack });
        // Still proceed with redirect or error handling
      }
      log.info('Session destroyed. Redirecting after logout.');
      res.redirect(process.env.LOGOUT_REDIRECT || '/aphians');
    });
  });
});

export default router;