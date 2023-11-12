const { PrismaClient } = require('@prisma/client');
const orm = new PrismaClient();
const bcrypt = require('bcrypt');

const setSeconds = ({ loginAttempts, secondsToLoginAgain }) => {
  const totalAttempts = loginAttempts + 1;

  if(totalAttempts %5 !== 0) 
    return secondsToLoginAgain;

  const division = parseInt(totalAttempts / 5);
  const timeToSum = new Date().getDate() + (1800 * division); 

  return timeToSum;
}

const comparePasswords = async (password, hashed, { auth: user }) => {
  const compare = await bcrypt.compare(password, hashed);

  if(!compare){
    await orm.auth.update({
      where: {
        email: user.email
      },
      data: {
        loginAttempts: user.loginAttempts + 1,
        secondsToLoginAgain: setSeconds(user.auth), 
      }
    });

    throw new Error('invalid credentials');
  }

  return true;
}

const hashPassword = async (password) => {
  const hash = await bcrypt.hash(password, 10);

  return hash;
}

module.exports = { comparePasswords, hashPassword };