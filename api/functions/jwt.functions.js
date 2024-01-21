const jwt = require('jsonwebtoken');
const config = require('../config');
const isOnList = require('./role.contains');
const objectErrorMessage = require('./object.error.message');

const decodeToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
}

const verifyAndDecode = (token) => {
  try{
    const tkn = token.split('Bearer ');
    const decoded = jwt.verify(tkn[1], config.JWT_SECRET);
    return decoded;
  }catch(e) {
    if(e.name === 'TokenExpiredError'){
      return objectErrorMessage({
        message: 'Token expired',
        status: 403,
      })
    }else{
      return objectErrorMessage({
        message: 'Error validating the Token',
        status: 403,
      })
    }
  }
}

const signToken = (data) => {
  const { id, role } = data.auth;
  const opts = { 
    sub: id,
    role: role,
    cid: isOnList(role, 'CUSTOMER') ? data.id : null,
    eid: isOnList(role, 'EMPLOYEE', 'OWNER') ? data.id : null,
    aid: isOnList(role, 'ADMIN', 'OWNER') ? data.id : null,
    ec: data.charge ? data.charge : null,
  };
  console.log(opts);
  return tokenSigned(opts);
};

const tokenSigned = (opts) => jwt.sign(opts, config.JWT_SECRET, { expiresIn: '7d' });

const verifyAuth = async (ctx) => {
  const { user } = await ctx.authenticate('jwt', { session: false });
  if(!user) throw new Error('unauthorized');
  
  return user;
}

const signRecoveryToken = (data) => {
  return jwt.sign({
    sub: data.sub,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 15),
    aud: data.aud,
    jti: data.authId,
  }, config.JWT_SECRET)
}

const signChangePasswordToken = (data) => {
  return jwt.sign({
    sub: data.sub,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 15),
    aud: data.aud,
    rtkid: data.rtkid, 
    jti: data.code,
  }, config.JWT_SECRET)
}

module.exports = { 
  decodeToken, 
  verifyAndDecode, 
  signToken, 
  verifyAuth, 
  signRecoveryToken, 
  signChangePasswordToken 
};