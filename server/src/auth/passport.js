import passport from 'passport';
import { deserializeUser, serializeUser } from './passportSerializer.js';
import googleStrategy from './strategies/googleStrategy.js';

passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

// Applying Google OAuth strategy
googleStrategy(passport);

export default passport;