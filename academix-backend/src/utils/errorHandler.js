const jwt = require('jsonwebtoken');
const logger = require('./logger');

// extra.status: HTTP status to answer (default 500), for handlers whose catch-all answered 4xx.
// Every other key of extra is only logged.
const catchError = (error, req, res, extra = {}) => {
  const { status = 500, ...context } = extra;
  // The caller's name when given: guessing it from the stack often gives "async" or a Sequelize frame.
  let functionName = context.function || 'לא ידוע';
  if (!context.function && error.stack) {
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
    status,
    ...context
  });

  // In production the client never sees the internal error message (SQL, file paths, stack
  // details): `error` stays a string the frontend can display, with a reference to find the
  // full error in the logs. Development keeps the real message.
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(status).json({
    success: false,
    message: 'שגיאה בשרת',
    error: isProduction ? `שגיאה בשרת (אסמכתא: ${errorId})` : error.message,
    errorId,
  });
};

module.exports = { catchError };