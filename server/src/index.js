const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./auth/passport');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const port = process.env.PORT || port;
require('dotenv').config();

const app = express();

// app.use(cors());
console.log('Starting Aphians Server...');
app.use(cors({
  origin: ['https://www.dharwadkar.com', 'https://aphians.dharwadkar.com'],
  credentials: true
}));
app.use(express.json());
app.use(session({ secret: 'process.env.SESSION_SECRET', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.json({ message: 'Aphians Server Running' });
  });

app.get('/api/auth/status', (req, res) => {
    res.json({ isAuthenticated: req.isAuthenticated() });
  });

app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// app.listen(5000, () => console.log('Server running on port 5000'));
    app.listen(port, '0.0.0.0', () => {
      console.log(`Aphians Server running on port ${port}`);
    }).on('error', (err) => {
      console.error('Server startup error:', err);
    });