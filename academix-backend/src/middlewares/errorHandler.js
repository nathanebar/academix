const logger = require('../utils/logger');

const globalErrorHandler = (err, req, res, next) => {
  const errorId = logger.error(err.message, {
    stack: err.stack,
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    originalError: err.toString()
  });
  
  if (res.headersSent) return next(err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'שגיאה התרחשה בשרת'
      : err.message,
    errorId,
  });
};

const notFoundHandler = (req, res) => {
  logger.warn(`נמצאה קריאה לנתיב שלא קיים`, {
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: 'הנתיב המבוקש לא נמצא'
  });
};

module.exports = { globalErrorHandler, notFoundHandler };