const jwt = require('jsonwebtoken');
const config = require('../config');

const decodeToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
}

const signToken = (data) => {
  const opts = {
    sub: data.id,
    role: data.auth.role,
  };

  const token = jwt.sign(opts, config.JWT_SECRET, {
    expiresIn: '7d',
  });

  return {
    token
  };
}

const verifyAuth = async (ctx) => {
  const { user } = await ctx.authenticate('jwt', { session: false });
  if(!user) throw new Error('unauthorized');

  return user;
}

module.exports = { decodeToken, signToken, verifyAuth };