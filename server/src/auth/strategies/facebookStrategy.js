import { Strategy as FacebookStrategy } from 'passport-facebook';
import db from '../../config/db.js'; // Adjust path if needed
import log from '../../utils/logger.js'; // Adjust path if needed

const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL || 'https://www.dharwadkar.com/aphians/auth/facebook/callback';

const facebookStrategy = (passport) => {
  log.info(`✅ Passport: FacebookStrategy callbackURL → ${FACEBOOK_CALLBACK_URL}`);

  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'photos', 'email'], // Request specific profile fields
    enableProof: true, // Recommended for security
  }, async (accessToken, refreshToken, profile, done) => {
    log.info(`🔁 FacebookStrategy: Received profile → ${JSON.stringify(profile)}`);

    try {
      if (!profile?.id || !profile?.emails?.[0]?.value) {
        log.error('❌ Invalid Facebook profile data: Missing ID or Email', profile);
        return done(new Error('Invalid Facebook profile data'));
      }

      // Query with timeout (mirroring your Google strategy)
      const [rows] = await Promise.race([
        db.query('SELECT * FROM users WHERE facebook_id = ?', [profile.id]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 3000))
      ]);
      log.debug('FacebookStrategy: Query result:', { rows });

      if (rows.length > 0) {
        log.info('✅ Existing user found via Facebook:', rows[0]);
        return done(null, rows[0]);
      }

      const email = profile.emails[0].value;
      const name = profile.displayName || 'Unknown';

      // Insert new user with facebook_id
      const [result] = await Promise.race([
        db.query('INSERT INTO users (facebook_id, email, name) VALUES (?, ?, ?)', [profile.id, email, name]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database insert timeout')), 3000))
      ]);
      const newUser = {
        id: result.insertId,
        facebook_id: profile.id,
        email,
        name
      };
      log.info('✅ New user created from Facebook profile:', newUser);
      done(null, newUser);
    } catch (err) {
      log.error('❌ FacebookStrategy error:', { message: err.message, stack: err.stack });
      done(err);
    }
  }));
};

export default facebookStrategy;