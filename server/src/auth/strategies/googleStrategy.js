import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import db from '../../config/db.js';
import log from '../../utils/logger.js';

const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'https://www.dharwadkar.com/aphians/auth/google/callback';

const googleStrategy = (passport) => {
  log.info(`✅ Passport: GoogleStrategy callbackURL → ${GOOGLE_CALLBACK_URL}`);

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    log.info(`🔁 GoogleStrategy: Received profile → ${JSON.stringify(profile)}`);

    try {
      if (!profile?.id || !profile?.emails?.[0]?.value) {
        log.error('❌ Invalid Google profile data:', profile);
        return done(new Error('Invalid Google profile data'));
      }

      // Query with timeout
      const [rows] = await Promise.race([
        db.query('SELECT * FROM users WHERE google_id = ?', [profile.id]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 3000))
      ]);
      log.debug('GoogleStrategy: Query result:', { rows });

      if (rows.length > 0) {
        log.info('✅ Existing user found:', rows[0]);
        return done(null, rows[0]);
      }

      const email = profile.emails[0].value;
      const name = profile.displayName || 'Unknown';

      const [result] = await Promise.race([
        db.query('INSERT INTO users (google_id, email, name) VALUES (?, ?, ?)', [profile.id, email, name]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database insert timeout')), 3000))
      ]);
      const newUser = {
        id: result.insertId,
        google_id: profile.id,
        email,
        name
      };
      log.info('✅ New user created:', newUser);
      done(null, newUser);
    } catch (err) {
      log.error('❌ GoogleStrategy error:', { message: err.message, stack: err.stack });
      done(err);
    }
  }));
};

export default googleStrategy;