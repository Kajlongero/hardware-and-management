const checkRole = (user, ...allowedRoles) => {
  const { role } = user.auth;

  if(!allowedRoles.includes(role)) throw new Error('unauthorized');
};

module.exports = { checkRole };