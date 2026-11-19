const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user; 
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};