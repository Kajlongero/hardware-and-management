const { PrismaClient } = require('@prisma/client');
const orm = new PrismaClient();
const bcrypt = require('bcrypt');

const setSeconds = (data, quantity = 5) => {
  const { loginAttempts, timeToLoginAgain } = data;
  const totalAttempts = loginAttempts + 1;

  if(totalAttempts %quantity !== 0) 
    return timeToLoginAgain;

  const division = parseInt(totalAttempts / quantity);
  
  let actual = new Date();
  actual.setMinutes(actual.getMinutes() + (30 * division));
  
  return actual;
}

const setTime = (data, quantity = 3) => {
  const { attempts, time } = data;

  if(attempts %quantity !== 0)
    return time;

  const division = parseInt(attempts / quantity);
  
  let actual = new Date();
  actual.setMinutes(actual.getMinutes() + (30 * division));
    
  return actual;
}

const comparePasswords = async (password, hashed, user) => {
  const { auth } = user; 
  const compare = await bcrypt.compare(password, hashed);

  if(!compare){
    const time = setSeconds(auth);

    await orm.auth.update({
      where: {
        id: auth.id,
      },
      data: {
        loginAttempts: {
          increment: 1,
        },
        timeToLoginAgain: time,
      },
    })

    throw new Error('invalid credentials');
  }

  await orm.auth.update({
    where: {
      id: auth.id,
    },
    data: {
      loginAttempts: 0,
      timeToLoginAgain: null,
    }
  })

  return true;
}

const hashPassword = async (password) => {
  const hash = await bcrypt.hash(password, 10);

  return hash;
}

module.exports = { comparePasswords, setSeconds, setTime, hashPassword };