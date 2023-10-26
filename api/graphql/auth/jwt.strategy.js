const { ExtractJwt, Strategy } = require('passport-jwt');
const config = require('../../config');

const JwtStrategy = new Strategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.JWT_SECRET,
}, (payload, done) => done(null, payload));

module.exports = JwtStrategy;