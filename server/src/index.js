const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./auth/passport');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');

const app = express();

app.use(cors());
app.use(express.json());
app.use(session({ secret: 'your-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.listen(5000, () => console.log('Server running on port 5000'));