const { GraphQLLocalStrategy } = require('graphql-passport');
const { PrismaClient } = require('@prisma/client');
const { comparePasswords } = require('../../functions/bcrypt.functions');

const orm = new PrismaClient();

const GqlCustomerStrategy = new GraphQLLocalStrategy(async (email, password, done) => {
  try{
    const findEmail = await orm.customer.findUnique({
      where: {
        auth: {
          email,
        },
      },
      include: {
        auth: true,
      }
    });

    if(!findEmail) throw new Error('invalid credentials');
    
    const actual = new Date().getDate();
    const timeToWait = new Date(findEmail.auth.secondsToLoginAgain);
    
    if(actual < findEmail.auth.secondsToLoginAgain)
      throw new Error(`You need to wait until ${timeToWait} before login again`)

    await comparePasswords(password, findEmail.auth.password, findEmail);

    delete findEmail.auth.password;
    done(null, findEmail);
  }catch(e){
    done(e, null);
  }
})

const GqlEmployeeStrategy = new GraphQLLocalStrategy(async (email, password, done) => {
  try{
    const findEmail = await orm.employee.findUnique({
      where: {
        auth: {
          email
        },
      },
      include: {
        auth: true,
      }
    });

    if(!findEmail) throw new Error('invalid credentials');
    
    const actual = new Date().getDate();
    const timeToWait = new Date(findEmail.auth.secondsToLoginAgain - actual);
    
    if(actual < findEmail.auth.secondsToLoginAgain)
      throw new Error(`You need to wait until ${timeToWait} before login again`)

    await comparePasswords(password, findEmail.auth.password, findEmail);

    delete findEmail.auth.password;
    done(null, findEmail);
  }catch(e){
    done(e, null);
  }
})

module.exports = { GqlCustomerStrategy, GqlEmployeeStrategy };