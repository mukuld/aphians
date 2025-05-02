const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./auth/passport');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const port = 5000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(session({ secret: 'your-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.json({ message: 'Aphians Server Running' });
  });

app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// app.listen(5000, () => console.log('Server running on port 5000'));
app.listen(port, '0.0.0.0', () => {
    console.log(`Aphians Server running on port ${port}`);
  }).on('error', (err) => {
    console.error('Server startup error:', err);
  });