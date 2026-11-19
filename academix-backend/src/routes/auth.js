const express = require('express');
const {
  AUTH_MODE,
  getAuthMode,
  handleNTLMAuth,
  handleLocalLogin,
  handleMe,
  handleLogout,
} = require('../controllers/auth');

const router = express.Router();

router.get('/mode', getAuthMode);
router.get('/me', handleMe);
router.post('/logout', handleLogout);

if (AUTH_MODE === 'local') {
  router.post('/login', handleLocalLogin);
} else {
  const { ntlmAuth } = require("../middlewares/autth-ntlm");
  router.get('/ntlm', ntlmAuth, handleNTLMAuth);
}

module.exports = router;
