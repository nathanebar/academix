const jwt = require('jsonwebtoken');
const logger = require('./logger');

const catchError = (error, req, res, extra = {}) => {
  let functionName = 'לא ידוע';
  if (error.stack) {
    const match = error.stack.match(/at\s+(?:exports\.)?(\w+)\s+/);
    if (match && match[1]) functionName = match[1];
  }

  let userId = null;
  let userName = null;
  let userSource = 'none';
  
  if (req.headers['x-user-id'] || req.headers['x-user-name']) {
    userId = req.headers['x-user-id'];
    userName = req.headers['x-user-name'];
    userSource = 'localStorage';
  }
  
  if (!userName && req.cookies?.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      userId = decoded.id;
      userName = decoded.name;
      userSource = 'jwt';
    } catch (e) {}
  }
  
  if (!userName && req.ntlm?.UserName) {
    userName = req.ntlm.UserName;
    userSource = 'ntlm';
  }

  const errorId = logger.error(`${functionName}`, {
    stack: error.stack,
    functionName,
    endpoint: req.originalUrl,
    method: req.method,
    userId: userId,
    userName: userName,
    userSource: userSource,
    body: req.body,
    params: req.params,
    query: req.query,
    originalError: error.message,
    ...extra
  });

  // In production the client never sees the internal error message (SQL, file paths, stack
  // details): `error` stays a string the frontend can display, with a reference to find the
  // full error in the logs. Development keeps the real message.
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    message: 'שגיאה בשרת',
    error: isProduction ? `שגיאה בשרת (אסמכתא: ${errorId})` : error.message,
    errorId,
  });
};

module.exports = { catchError };