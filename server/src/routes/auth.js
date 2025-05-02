const express = require('express');
const passport = require('../auth/passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['openid', 'profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/aphians' }),
  (req, res) => {
    console.log('Google auth callback, user:', req.user);
    res.redirect('https://www.dharwadkar.com/aphians/profile');
  }
);

// router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// router.get('/facebook/callback', 
//   passport.authenticate('facebook', { failureRedirect: '/' }),
//   (req, res) => res.redirect('/profile')
// );

// router.get('/apple', passport.authenticate('apple'));
// router.post('/apple/callback', 
//   passport.authenticate('apple', { failureRedirect: '/' }),
//   (req, res) => res.redirect('/profile')
// );

// router.get('/yahoo', passport.authenticate('yahoo'));
// router.get('/yahoo/callback', 
//   passport.authenticate('yahoo-oauth-token', { failureRedirect: '/' }),
//   (req, res) => res.redirect('/profile')
// );

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;