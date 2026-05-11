import { Router } from 'express';
import passport from 'passport';
import db from '../config/db.js';
import dotenv from 'dotenv';
import log from '../utils/logger.js';
import { ensureAuthenticated } from '../middleware/authMiddleware.js';

dotenv.config();

const router = Router();

// ============================================================================
// Google Authentication Routes
// ============================================================================

// Route to initiate Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth Callback Route
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.LOGIN_REDIRECT || '/aphians/login' }),
  async (req, res) => {
    log.info('--- [/auth/google/callback] Handler Entered ---');

    if (!req.user) {
      log.error('[/auth/google/callback] req.user is undefined or null upon entering route handler!');
      return res.redirect(process.env.LOGIN_REDIRECT || '/aphians/login');
    }

    log.info('[/auth/google/callback] req.user details:', { user: JSON.parse(JSON.stringify(req.user)) });

    if (typeof req.user.id === 'undefined') {
      log.error('[/auth/google/callback] req.user.id is UNDEFINED!', { user: JSON.parse(JSON.stringify(req.user)) });
      return res.redirect(process.env.LOGIN_REDIRECT || '/aphians/login');
    }

    const userId = req.user.id;
    log.info(`[/auth/google/callback] Extracted userId: ${userId} (Type: ${typeof userId})`);

    const overallTimeout = setTimeout(() => {
      log.error('[/auth/google/callback] Overall response timeout reached (15 seconds)');
      if (!res.headersSent) {
        res.status(504).json({ error: 'Gateway Timeout - Callback processing too long' });
      }
    }, 15000); // 15 seconds overall timeout

    try {
      log.debug('[/auth/google/callback] Checking profile for user:', { userId });

      await db.query('SELECT 1');
      log.debug('[/auth/google/callback] Database connection verified (SELECT 1)');

      const [schema] = await db.query('SHOW COLUMNS FROM profiles');
      log.debug('[/auth/google/callback] Profiles table schema:', { schema });

      // FIX: MariaDB compatible syntax
      const profileQuerySql = 'SELECT user_id FROM profiles WHERE user_id = ? LOCK IN SHARE MODE';
      const profileQueryParams = [userId];
      log.info('[/auth/google/callback] Executing profile query:', { sql: profileQuerySql, params: profileQueryParams });

      let rows;
      let retries = 2;
      const startTime = Date.now();
      
      while (retries > 0) {
        let timeoutId; // FIX: Store the timer so we can clear it
        
        try {
          const connection = await db.getConnection();
          try {
            await connection.query('BEGIN');
            
            // FIX: Properly clearable timer
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => {
                reject(new Error('TIMEOUT'));
              }, 30000);
            });

            [rows] = await Promise.race([
              connection.query(profileQuerySql, profileQueryParams),
              timeoutPromise
            ]);
            
            await connection.query('COMMIT');
            const duration = (Date.now() - startTime) / 1000;
            log.info('[/auth/google/callback] Profile query completed in:', { duration: `${duration} seconds` });
            break; // Success, exit retry loop
            
          } catch (error) {
            await connection.query('ROLLBACK');
            throw error;
          } finally {
            clearTimeout(timeoutId); // FIX: Stop the phantom log
            connection.release();
          }
          
        } catch (dbError) {
          retries--;
          const duration = (Date.now() - startTime) / 1000;
          
          // FIX: Log the ACTUAL database error
          log.warn(`[/auth/google/callback] Query failed after ${duration} seconds, retries left: ${retries}. Reason: ${dbError.message}`);
          
          if (retries === 0) {
            log.warn('[/auth/google/callback] All retries exhausted, attempting to create profile.');
            const connection = await db.getConnection();
            try {
              await connection.query('BEGIN');
              // FIX: Removed missing created_at column
              await connection.query('INSERT INTO profiles (user_id) VALUES (?)', [userId]);
              await connection.query('COMMIT');
              log.info('[/auth/google/callback] Created new profile for user:', { userId });
              rows = []; 
            } catch (insertError) {
              await connection.query('ROLLBACK');
              log.error('[/auth/google/callback] Failed to create new profile:', insertError.message);
              throw insertError;
            } finally {
              connection.release();
            }
          }
        }
      }

      log.info('[/auth/google/callback] Profile query result:', { rows });

      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            log.error('[/auth/google/callback] Session save failed:', { message: err.message, stack: err.stack });
            reject(err);
          } else {
            log.info('[/auth/google/callback] Session explicitly saved successfully');
            resolve();
          }
        });
      });

      const communityRedirect = process.env.COMMUNITY_REDIRECT || '/aphians/community';
      const profileRedirect = process.env.PROFILE_REDIRECT || '/aphians/edit-profile';

      if (rows && rows.length > 0) {
        log.info(`[/auth/google/callback] Profile found. Redirecting to community: ${communityRedirect}`);
        res.redirect(communityRedirect);
      } else {
        log.info(`[/auth/google/callback] Profile NOT found. Redirecting to profile setup: ${profileRedirect}`);
        res.redirect(profileRedirect);
      }

      clearTimeout(overallTimeout);

    } catch (err) {
      clearTimeout(overallTimeout);
      log.error('[/auth/google/callback] Error during callback processing:', {
        message: err.message || 'Unknown error',
        stack: err.stack || 'No stack trace',
        userId: req.user ? req.user.id : 'N/A',
        user: req.user ? JSON.parse(JSON.stringify(req.user)) : 'req.user was undefined/null'
      });
      if (!res.headersSent) {
        res.redirect(process.env.LOGIN_REDIRECT || '/aphians/login');
      }
    }
  }
);

// ============================================================================
// Facebook Authentication Routes
// ============================================================================

// Route to initiate Facebook OAuth
router.get('/facebook', passport.authenticate('facebook'));

// Facebook OAuth Callback Route
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: process.env.LOGIN_REDIRECT || '/aphians/login' }),
  async (req, res) => {
    log.info('--- [/auth/facebook/callback] Handler Entered ---');

    if (!req.user) {
      log.error('[/auth/facebook/callback] req.user is undefined or null upon entering route handler!');
      return res.redirect(process.env.LOGIN_REDIRECT || '/aphians/login');
    }

    log.info('[/auth/facebook/callback] req.user details:', { user: JSON.parse(JSON.stringify(req.user)) });

    if (typeof req.user.id === 'undefined') {
      log.error('[/auth/facebook/callback] req.user.id is UNDEFINED!', { user: JSON.parse(JSON.stringify(req.user)) });
      return res.redirect(process.env.LOGIN_REDIRECT || '/aphians/login');
    }

    const userId = req.user.id;
    log.info(`[/auth/facebook/callback] Extracted userId: ${userId} (Type: ${typeof userId})`);

    const overallTimeout = setTimeout(() => {
      log.error('[/auth/facebook/callback] Overall response timeout reached (15 seconds)');
      if (!res.headersSent) {
        res.status(504).json({ error: 'Gateway Timeout - Callback processing too long' });
      }
    }, 15000); // 15 seconds overall timeout

    try {
      log.debug('[/auth/facebook/callback] Checking profile for user:', { userId });

      await db.query('SELECT 1');
      log.debug('[/auth/facebook/callback] Database connection verified (SELECT 1)');

      // The schema check is usually redundant if you've already verified the table structure
      // const [schema] = await db.query('SHOW COLUMNS FROM profiles');
      // log.debug('[/auth/facebook/callback] Profiles table schema:', { schema });

      // FIX: MariaDB compatible syntax
      const profileQuerySql = 'SELECT user_id FROM profiles WHERE user_id = ? LOCK IN SHARE MODE';
      const profileQueryParams = [userId];
      log.info('[/auth/facebook/callback] Executing profile query:', { sql: profileQuerySql, params: profileQueryParams });

      let rows;
      let retries = 2;
      const startTime = Date.now();
      
      while (retries > 0) {
        let timeoutId; // FIX: Store the timer so we can clear it
        
        try {
          const connection = await db.getConnection();
          try {
            await connection.query('BEGIN');
            
            // FIX: Properly clearable timer
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => {
                reject(new Error('TIMEOUT'));
              }, 30000);
            });

            [rows] = await Promise.race([
              connection.query(profileQuerySql, profileQueryParams),
              timeoutPromise
            ]);
            
            await connection.query('COMMIT');
            const duration = (Date.now() - startTime) / 1000;
            log.info('[/auth/facebook/callback] Profile query completed in:', { duration: `${duration} seconds` });
            break; // Success, exit retry loop
            
          } catch (error) {
            await connection.query('ROLLBACK');
            throw error;
          } finally {
            clearTimeout(timeoutId); // FIX: Stop the phantom log
            connection.release();
          }
          
        } catch (dbError) {
          retries--;
          const duration = (Date.now() - startTime) / 1000;
          
          // FIX: Log the ACTUAL database error
          log.warn(`[/auth/facebook/callback] Query failed after ${duration} seconds, retries left: ${retries}. Reason: ${dbError.message}`);
          
          if (retries === 0) {
            log.warn('[/auth/facebook/callback] All retries exhausted, attempting to create profile.');
            const connection = await db.getConnection();
            try {
              await connection.query('BEGIN');
              // FIX: Removed missing created_at column
              await connection.query('INSERT INTO profiles (user_id) VALUES (?)', [userId]);
              await connection.query('COMMIT');
              log.info('[/auth/facebook/callback] Created new profile for user:', { userId });
              rows = []; 
            } catch (insertError) {
              await connection.query('ROLLBACK');
              log.error('[/auth/facebook/callback] Failed to create new profile:', insertError.message);
              throw insertError;
            } finally {
              connection.release();
            }
          }
        }
      }

      log.info('[/auth/facebook/callback] Profile query result:', { rows });

      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            log.error('[/auth/facebook/callback] Session save failed:', { message: err.message, stack: err.stack });
            reject(err);
          } else {
            log.info('[/auth/facebook/callback] Session explicitly saved successfully');
            resolve();
          }
        });
      });

      const communityRedirect = process.env.COMMUNITY_REDIRECT || '/aphians/community';
      const profileRedirect = process.env.PROFILE_REDIRECT || '/aphians/edit-profile';

      if (rows && rows.length > 0) {
        log.info(`[/auth/facebook/callback] Profile found. Redirecting to community: ${communityRedirect}`);
        res.redirect(communityRedirect);
      } else {
        log.info(`[/auth/facebook/callback] Profile NOT found. Redirecting to profile setup: ${profileRedirect}`);
        res.redirect(profileRedirect);
      }

      clearTimeout(overallTimeout);

    } catch (err) {
      clearTimeout(overallTimeout);
      log.error('[/auth/facebook/callback] Error during callback processing:', {
        message: err.message || 'Unknown error',
        stack: err.stack || 'No stack trace',
        userId: req.user ? req.user.id : 'N/A',
        user: req.user ? JSON.parse(JSON.stringify(req.user)) : 'req.user was undefined/null'
      });
      if (!res.headersSent) {
        res.redirect(process.env.LOGIN_REDIRECT || '/aphians/login');
      }
    }
  }
);

// ============================================================================
// Utility / Session Routes
// ============================================================================

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
router.get('/logout', (req, res, next) => {
  log.info('User logging out');
  req.logout((err) => {
    if (err) {
      log.error('Logout failed:', { message: err.message, stack: err.stack });
      return next(err);
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        log.error('Failed to destroy session during logout:', { message: destroyErr.message, stack: destroyErr.stack });
      }
      log.info('Session destroyed. Redirecting after logout.');
      res.redirect(process.env.LOGOUT_REDIRECT || '/aphians');
    });
  });
});

export default router;
