const jwt = require('jsonwebtoken');
const config = require('../config');
const isOnList = require('./role.contains');

const decodeToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
}

const tokenSigned = (opts) => jwt.sign(opts, config.JWT_SECRET, { expiresIn: '7d' });

const signToken = (data) => {
  const { id, role } = data.auth;
  const opts = { 
    sub: id,
    role: role,
    cid: isOnList(role, 'CUSTOMER') ? data.id : null,
    eid: isOnList(role, 'EMPLOYEE') ? data.id : null,
    aid: isOnList(role, 'ADMIN', 'OWNER') ? data.id : null,
    ec: data.charge ? data.charge : null,
  };
  return tokenSigned(opts);
};

const verifyAuth = async (ctx) => {
  const { user } = await ctx.authenticate('jwt', { session: false });
  if(!user) throw new Error('unauthorized');

  return user;
}

module.exports = { decodeToken, signToken, verifyAuth };