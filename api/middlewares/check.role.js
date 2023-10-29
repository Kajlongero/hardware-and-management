const checkRole = (user, ...allowedRoles) => {
  const { role } = user;

  if(!allowedRoles.some(r => r === role)) throw new Error('unauthorized');
};

module.exports = { checkRole };