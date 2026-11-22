const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ quiet: true });
const SECRET = process.env.JWT_SECRET;

// Session lifetime (token + cookies). Was a fixed 2h while the userInfo cookie lived 24h,
// so a session broke silently after 2h once authentication is enforced (#13).
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

// "12h" / "30m" / "7d" / seconds -> milliseconds (for the cookies' maxAge)
const toMs = (value) => {
  const match = /^(\d+)\s*([smhd]?)$/.exec(String(value).trim());
  if (!match) return 12 * 60 * 60 * 1000;
  const unit = { '': 1, s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
  return Number(match[1]) * unit * 1000;
};
exports.SESSION_MAX_AGE_MS = toMs(JWT_EXPIRES_IN);

exports.createJWT = (user) => {
  const tokenUser = {
    id: user.id,
    name: user.name,
    username: user.username
  };
  return jwt.sign(tokenUser, SECRET, { expiresIn: JWT_EXPIRES_IN });
};

exports.verifyJWT = (token) => {
  return jwt.verify(token, SECRET);
};
