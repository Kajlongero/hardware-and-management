const jwt = require('jsonwebtoken');
const config = require('../config');

const decodeToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
}

const signToken = (data) => {
  const opts = {
    sub: data.id,
    role: data.auth.role,
    iat: new Date(),
  };

  const token = jwt.sign(opts, config.JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS512'
  });

  return token;
}

module.exports = { decodeToken, signToken };