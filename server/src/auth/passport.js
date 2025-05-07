const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
// const AppleStrategy = require('passport-apple');
// const YahooOauthTokenStrategy = require('passport-yahoo-oauth-token');
const db = require('../config/db');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user);
  if (!user?.id) {
    console.error('No user ID for serialization:', user);
    return done(new Error('No user ID'));
  }
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log('Deserializing user ID:', id);
  db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Deserialize error:', err);
      return done(err);
    }
    console.log('Deserialized user:', results[0]);
    done(null, results && results.length > 0 ? results[0] : null);
  });
});

const callbackURL = 'https://www.dharwadkar.com/aphians/auth/google/callback';
console.log('Passport GoogleStrategy callbackURL is going to be:', callbackURL);

// Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: callbackURL
}, (accessToken, refreshToken, profile, done) => {
  console.log('GoogleStrategy callback invoked with profile:', profile);
  try {
    if (!profile?.id || !profile?.emails || !profile.emails[0]?.value) {
      console.error('Invalid Google profile data:', profile);
      return done(new Error('Invalid Google profile data'));
    }

    db.query('SELECT * FROM users WHERE google_id = ?', [profile.id], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return done(err);
      }
      if (results.length > 0) {
        console.log('User found:', results[0]);
        return done(null, results[0]);
      }
      db.query('INSERT INTO users (google_id, email, name) VALUES (?, ?, ?)', 
        [profile.id, profile.emails[0].value, profile.displayName || 'Unknown'], 
        (err, result) => {
          if (err) {
            console.error('Database insert error:', err);
            return done(err);
          }
          const newUser = { id: result.insertId, google_id: profile.id, email: profile.emails[0].value, name: profile.displayName };
          console.log('User inserted:', newUser);
          done(null, newUser);
        });
    });
  } catch (err) {
    console.error('GoogleStrategy callback error:', err);
    done(err);
  }
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