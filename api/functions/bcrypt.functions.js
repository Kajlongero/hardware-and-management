const bcrypt = require('bcrypt');

const comparePasswords = async (password, hashed) => {
  const compare = await bcrypt.compare(password, hashed);
  if(!compare) throw new Error('invalid credentials');

  return true;
}

const hashPassword = async (password) => {
  const hash = await bcrypt.hash(password, 10);

  return hash;
}

module.exports = { comparePasswords, hashPassword };