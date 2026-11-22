const express = require('express');
const {
  AUTH_MODE,
  getAuthMode,
  handleNTLMAuth,
  handleLocalLogin,
  handleMe,
  handleLogout,
} = require('../controllers/auth');

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const router = express.Router();

const intEnv = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isNaN(value) ? fallback : value;
};

// Brute-force protection of the local login: LOGIN_RATE_LIMIT_MAX failed attempts
// (default 10) per IP *and* username within LOGIN_RATE_LIMIT_WINDOW_MIN minutes (default 15).
// Keyed on IP + username so that users behind one proxy / NAT do not lock each other out;
// successful logins are not counted.
const loginLimiter = rateLimit({
  windowMs: intEnv('LOGIN_RATE_LIMIT_WINDOW_MIN', 15) * 60 * 1000,
  limit: intEnv('LOGIN_RATE_LIMIT_MAX', 10),
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip || '')}|${String(req.body?.username || '').trim().toLowerCase()}`,
  handler: (req, res, next, options) =>
    res.status(options.statusCode).json({
      error: 'too_many_attempts',
      message: 'יותר מדי ניסיונות התחברות. נסו שוב מאוחר יותר.',
    }),
});

router.get('/mode', getAuthMode);
router.get('/me', handleMe);
router.post('/logout', handleLogout);

if (AUTH_MODE === 'local') {
  router.post('/login', loginLimiter, handleLocalLogin);
} else {
  const { ntlmAuth } = require("../middlewares/autth-ntlm");
  router.get('/ntlm', ntlmAuth, handleNTLMAuth);
}

module.exports = router;
