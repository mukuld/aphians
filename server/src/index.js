import dotenv from 'dotenv';
import express from 'express';
import path, { resolve } from 'path';
import cors from 'cors';
import passport from './auth/passport.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import processReminders from './routes/reminders.js';
import { sessionMiddleware, sessionStore } from './middleware/sessionMiddleware.js';
import log from './utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Resolve upload directory from environment variable
const uploadDir = resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
log.debug('Resolved upload directory:', uploadDir);

// Initialize server values
const port = process.env.PORT || 5000;
const appName = process.env.APP_NAME || 'Aphians';
const domain = process.env.DOMAIN || 'dharwadkar.com';
const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'connect.sid';
const originUrl = `https://www.${domain}`;

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.env.SESSION_SECRET) {
    log.error('Error: SESSION_SECRET is not set in .env');
    process.exit(1);
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    log.error('Error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set in .env');
    process.exit(1);
  }

  // Validate email-related environment variables for reminders
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    log.error("Error: Email configuration is incomplete. EMAIL_HOST, EMAIL_PORT, EMAIL_USER and EMAIL_PASS must be set in .env");
    process.exit(1);
  }

  // Log that the reminder system is starting
  log.info("Initializing reminder system...");
}

const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(sessionMiddleware);

app.use((req, res, next) => {
  const rawCookie = req.headers.cookie || 'none';
  const cookieSid = req.cookies?.[sessionCookieName] || 'none';

  log.debug('Session Middleware', {
    sessionID: req.sessionID,
    rawCookie,
    cookieSid,
    userAgent: req.headers['user-agent'],
    url: req.originalUrl
  });

  // Set isPopulated only for new sessions
  if (req.session && !req.session.isPopulated) {
    log.info('New session detected. Marking as populated...');
    req.session.isPopulated = true;
  }

  // Log Set-Cookie header on response finish
  res.on('finish', () => {
    const setCookieHeader = res.get('Set-Cookie');
    if (setCookieHeader) {
      log.debug(`Set-Cookie sent for ${req.originalUrl}: ${setCookieHeader}`);
    }
  });

  // Timeout middleware to prevent hangs
  const timeout = setTimeout(() => {
    log.error(`Middleware timeout for ${req.originalUrl}`);
    res.status(504).json({ error: 'Gateway Timeout' });
  }, 10000);

  // Clear timeout on response
  res.on('finish', () => clearTimeout(timeout));

  log.debug('Session Middleware: Completed');
  next();
});

app.use(cors({
  origin: originUrl,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static(uploadDir));

// Routes
app.get('/', (req, res) => {
  res.json({ message: `${appName} Server Running` });
});

// Add /run-reminders endpoint (publicly accessible for testing)
app.get('/aphians/run-reminders', async (req, res) => {
  log.info('Received request to /aphians/run-reminders endpoint');
  try {
    await processReminders();
    log.info('Reminders processed successfully via /aphians/run-reminders');
    res.status(200).json({ message: 'Reminders processed successfully' });
  } catch (err) {
    log.error('Error processing reminders via /aphians/run-reminders:', { message: err.message, stack: err.stack });
    res.status(500).json({ error: 'Failed to process reminders' });
  }
});

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Error handler
app.use((err, req, res, next) => {
  log.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  log.info(`${appName} Server running on port ${port}`);
}).on('error', (err) => {
  log.error('Server startup error:', err);
  process.exit(1);
});

export default app;