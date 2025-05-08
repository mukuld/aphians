function ensureAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
      console.log(`${req.method} ${req.originalUrl}: User not authenticated`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }
  
  export { ensureAuthenticated };