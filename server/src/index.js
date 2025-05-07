require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');
const passport = require('./auth/passport');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const port = process.env.PORT || 5000;

const bootId = uuidv4();
const pid = process.pid;

// Ensure log file exists
const logFile = '/var/log/aphians-server.log';
try {
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
    console.log(`Created log file: ${logFile}`);
  }
  fs.accessSync(logFile, fs.constants.W_OK);
  console.log(`Log file writable: ${logFile}`);
} catch (err) {
  console.error(`Log file error: ${err.message}`);
  process.exit(1);
}

// Custom logging function
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

// Initialize session store
const sessionStore = new MySQLStore({
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
      data: 'data'
    }
  }
});

sessionStore.on('error', (err) => {
  log('Session store error: ' + err.message + ' | Stack: ' + err.stack);
});

// Test session store
if (require.main === module) {
  log(`Boot ID: ${bootId}`);
  log('SESSION_SECRET: ' + (process.env.SESSION_SECRET ? 'Set' : 'Not set'));
  log('Runtime __dirname: ' + __dirname);
  log('Expected .env path: ' + require('path').resolve(__dirname, '../.env'));

  if (!process.env.SESSION_SECRET) {
    log('Error: SESSION_SECRET is not set in .env');
    process.exit(1);
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    log('Error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set in .env');
    process.exit(1);
  }

  log('Testing session store...');
  const testSessionId = 'test-session-' + Date.now();
  sessionStore.set(testSessionId, {
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    data: { test: 'test-data' }
  }, (err) => {
    if (err) {
      log('Session store test write error: ' + err.message + ' | Stack: ' + err.stack);
      process.exit(1);
    }
    log('Session store test write successful');
    sessionStore.get(testSessionId, (err, session) => {
      if (err) {
        log('Session store test read error: ' + err.message + ' | Stack: ' + err.stack);
        process.exit(1);
      }
      log('Session store test read: ' + JSON.stringify(session));
      sessionStore.destroy(testSessionId, (err) => {
        if (err) {
          log('Session store test destroy error: ' + err.message + ' | Stack: ' + err.stack);
        }
        log('Session store test session destroyed');
      });
    });
  });
}

const app = express();

app.set('trust proxy', 1);

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
    domain: '.dharwadkar.com'
  },
  name: 'connect.sid'
});

app.use(sessionMiddleware);

app.use((req, res, next) => {
  const rawCookie = req.headers.cookie || 'none';
  const cookieSid = req.cookies && req.cookies['connect.sid'] ? req.cookies['connect.sid'] : 'none';
  log('Session middleware: ' + JSON.stringify({
    sessionID: req.sessionID,
    rawCookie: rawCookie,
    cookieSid: cookieSid,
    session: req.session,
    cookies: req.headers.cookie,
    userAgent: req.headers['user-agent'],
    url: req.originalUrl
  }));
  if (cookieSid !== 'none' && cookieSid !== req.sessionID) {
    log('Session ID mismatch: Cookie SID: ' + cookieSid + ', Server SID: ' + req.sessionID);
  }
  if (req.session && !req.session.isPopulated) {
    log('New session, saving...');
    req.session.isPopulated = true;
    req.session.save((err) => {
      if (err) {
        log('Session save middleware error: ' + err.message + ' | Stack: ' + err.stack);
      } else {
        log('Session saved in middleware');
      }
    });
  }
  sessionStore.get(req.sessionID, (err, sessionData) => {
    if (err) {
      log('Session store get error for ' + req.sessionID + ': ' + err.message + ' | Stack: ' + err.stack);
    } else {
      log('Session store get for ' + req.sessionID + ': ' + JSON.stringify(sessionData));
    }
  });
  res.on('finish', () => {
    if (res.get('Set-Cookie')) {
      log('Set-Cookie sent for ' + req.originalUrl + ': ' + res.get('Set-Cookie'));
    }
  });
  next();
});

app.use(cors({
  origin: ['https://www.dharwadkar.com'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use('/Uploads', express.static(path.join(__dirname, '../Uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Aphians Server Running' });
});

app.get('/api/auth/status', (req, res) => {
  log('Auth status: ' + JSON.stringify({
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    session: req.session,
    sessionID: req.sessionID
  }));
  res.json({ isAuthenticated: req.isAuthenticated(), user: req.user });
});

app.get('/api/test-session', (req, res) => {
  log('Test session endpoint: ' + JSON.stringify({
    sessionID: req.sessionID,
    session: req.session
  }));
  req.session.test = 'test-value';
  req.session.save((err) => {
    if (err) {
      log('Test session save error: ' + err.message + ' | Stack: ' + err.stack);
      return res.status(500).json({ error: 'Session save failed' });
    }
    log('Test session saved');
    res.json({ message: 'Session test successful', sessionID: req.sessionID });
  });
});

app.get('/api/debug-session', (req, res) => {
  const sessionId = req.query.sid || req.sessionID;
  log('Debug session endpoint: ' + sessionId);
  sessionStore.get(sessionId, (err, sessionData) => {
    if (err) {
      log('Debug session error: ' + err.message + ' | Stack: ' + err.stack);
      return res.status(500).json({ error: 'Session retrieval failed', message: err.message });
    }
    log('Debug session data: ' + JSON.stringify(sessionData));
    res.json({ sessionId, sessionData });
  });
});

app.get('/api/force-session', (req, res) => {
  const sessionId = req.query.sid;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }
  log('Force session endpoint: ' + sessionId);
  sessionStore.get(sessionId, (err, sessionData) => {
    if (err) {
      log('Force session error: ' + err.message + ' | Stack: ' + err.stack);
      return res.status(500).json({ error: 'Session retrieval failed', message: err.message });
    }
    if (!sessionData) {
      log('Force session: No data found for ' + sessionId);
      return res.status(404).json({ error: 'Session not found' });
    }
    req.session = sessionData; // Override session
    passport.deserializeUser(sessionData.passport.user, (err, user) => {
      if (err) {
        log('Force session deserialize error: ' + err.message + ' | Stack: ' + err.stack);
        return res.status(500).json({ error: 'Deserialize failed' });
      }
      req.user = user;
      log('Force session user: ' + JSON.stringify(user));
      res.json({ sessionId, sessionData, user });
    });
  });
});

app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.use((err, req, res, next) => {
  log('Server error: ' + err.message + ' | Stack: ' + err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, '0.0.0.0', () => {
  log(`Aphians Server running on port ${port}`);
}).on('error', (err) => {
  log('Server startup error: ' + err.message + ' | Stack: ' + err.stack);
  process.exit(1);
});