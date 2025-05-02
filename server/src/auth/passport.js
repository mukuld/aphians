const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AppleStrategy = require('passport-apple');
// const YahooOauthTokenStrategy = require('passport-yahoo-oauth-token');
const db = require('../config/db');
require('dotenv').config();

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
  db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
    done(err, results[0]);
  });
});

// Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  db.query('SELECT * FROM users WHERE google_id = ?', [profile.id], (err, results) => {
    if (results.length > 0) {
      return done(null, results[0]);
    }
    db.query('INSERT INTO users (google_id, email, name) VALUES (?, ?, ?)', 
      [profile.id, profile.emails[0].value, profile.displayName], 
      (err, result) => {
        done(null, { id: result.insertId, email: profile.emails[0].value });
      });
  });
}));

// Facebook OAuth
// passport.use(new FacebookStrategy({
//   clientID: process.env.FACEBOOK_APP_ID,
//   clientSecret: process.env.FACEBOOK_APP_SECRET,
//   callbackURL: '/auth/facebook/callback',
//   profileFields: ['id', 'emails', 'name']
// }, (accessToken, refreshToken, profile, done) => {
//   db.query('SELECT * FROM users WHERE facebook_id = ?', [profile.id], (err, results) => {
//     if (results.length > 0) {
//       return done(null, results[0]);
//     }
//     db.query('INSERT INTO users (facebook_id, email, name) VALUES (?, ?, ?)', 
//       [profile.id, profile.emails[0].value, `${profile.name.givenName} ${profile.name.familyName}`], 
//       (err, result) => {
//         done(null, { id: result.insertId, email: profile.emails[0].value });
//       });
//   });
// }));

// Apple OAuth
// passport.use(new AppleStrategy({
//   clientID: process.env.APPLE_CLIENT_ID,
//   teamID: process.env.APPLE_TEAM_ID,
//   keyID: process.env.APPLE_KEY_ID,
//   privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
//   callbackURL: '/auth/apple/callback'
// }, (accessToken, refreshToken, idToken, profile, done) => {
//   db.query('SELECT * FROM users WHERE apple_id = ?', [profile.id], (err, results) => {
//     if (results.length > 0) {
//       return done(null, results[0]);
//     }
//     db.query('INSERT INTO users (apple_id, email, name) VALUES (?, ?, ?)', 
//       [profile.id, profile.email, profile.email.split('@')[0]], 
//       (err, result) => {
//         done(null, { id: result.insertId, email: profile.email });
//       });
//   });
// }));
/*
// Yahoo OAuth 2.0 with passport-yahoo-oauth-token
passport.use(new YahooOauthTokenStrategy({
  clientID: process.env.YAHOO_CLIENT_ID,
  clientSecret: process.env.YAHOO_CLIENT_SECRET
}, (accessToken, refreshToken, profile, done) => {
  db.query('SELECT * FROM users WHERE yahoo_id = ?', [profile.id], (err, results) => {
    if (results.length > 0) {
      return done(null, results[0]);
    }
    db.query('INSERT INTO users (yahoo_id, email, name) VALUES (?, ?, ?)', 
      [profile.id, profile.emails[0].value, profile.displayName], 
      (err, result) => {
        done(null, { id: result.insertId, email: profile.emails[0].value });
      });
  });
}));
*/
module.exports = passport;