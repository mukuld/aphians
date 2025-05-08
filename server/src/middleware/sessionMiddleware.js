import session from 'express-session';
import MySQLStore from 'express-mysql-session';
import log from '../utils/logger.js';

// Initialize MySQL session store
const MySQLSession = MySQLStore(session);

// Session store configuration
const sessionStore = new MySQLSession({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'aphians_db',
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutes
  expiration: 24 * 60 * 60 * 1000, // 24 hours
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data',
    },
  },
});

// Error handling for the session store
sessionStore.on('error', (err) => {
  log.error('Session store error: ' + err.message + ' | Stack: ' + err.stack);
});

// Session middleware configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (ensure you're using HTTPS)
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
    domain: process.env.DOMAIN ? `.${process.env.DOMAIN}` : undefined, // Ensure domain is set correctly
  },
  name: process.env.SESSION_COOKIE_NAME || 'session_id', // Use environment variable for cookie name
});

export { sessionMiddleware, sessionStore };
