require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./auth/passport');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const path = require('path');
const port = process.env.PORT || 5000;

console.log('SESSION_SECRET:', process.env.SESSION_SECRET);
console.log('Runtime __dirname:', __dirname);
console.log('Expected .env path:', require('path').resolve(__dirname, '../.env'));

const app = express();

console.log('Starting Aphians Server...');
app.use(cors({
  origin: ['https://www.dharwadkar.com', 'https://aphians.dharwadkar.com'],
  credentials: true
}));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Aphians Server Running' });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ isAuthenticated: req.isAuthenticated() });
});

app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`Aphians Server running on port ${port}`);
}).on('error', (err) => {
  console.error('Server startup error:', err);
});