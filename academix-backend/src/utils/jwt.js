const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ quiet: true });
const SECRET = process.env.JWT_SECRET;

exports.createJWT = (user) => {
  const tokenUser = {
    name: user.name,
    username: user.username
  };
  return jwt.sign(tokenUser, SECRET, { expiresIn: '2h' });
};

exports.verifyJWT = (token) => {
  return jwt.verify(token, SECRET);
};