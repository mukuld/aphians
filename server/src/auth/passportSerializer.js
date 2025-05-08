import db from '../config/db.js';
import log from '../utils/logger.js';

export const serializeUser = (user, done) => {
  if (!user?.id) {
    log.error('❌ No user ID for serialization:', user);
    return done(new Error('No user ID'));
  }
  log.debug('✅ serializeUser:', { userId: user.id });
  done(null, user.id);
};

export const deserializeUser = async (id, done) => {
  try {
    log.debug('deserializeUser: Querying user', { userId: id });
    const [rows] = await Promise.race([
      db.query('SELECT * FROM users WHERE id = ?', [id]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 3000))
    ]);
    if (rows.length === 0) {
      log.error('❌ deserializeUser: User not found', { userId: id });
      return done(new Error('User not found'));
    }
    log.info('✅ Deserialized user:', rows[0]);
    done(null, rows[0]);
  } catch (err) {
    log.error('❌ Deserialize error:', err.message, err.stack);
    done(err);
  }
};