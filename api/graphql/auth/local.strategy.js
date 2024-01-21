const { GraphQLLocalStrategy } = require('graphql-passport');
const { PrismaClient } = require('@prisma/client');
const { comparePasswords } = require('../../functions/bcrypt.functions');

const orm = new PrismaClient();

const GqlCustomerStrategy = new GraphQLLocalStrategy(async (email, password, done) => {
  try{
    const eml = await orm.auth.findUnique({
      where: {
        email, 
      },
    });
    if(!eml) throw new Error('invalid credentials');
  
    const findEmail = await orm.customer.findUnique({
      where: {
        authId: eml.id,
      },
      include: {
        auth: true,
      }
    });
    if(!findEmail) throw new Error('invalid credentials');

    if(findEmail.deletedAt || findEmail.auth.deletedAt)
      throw new Error('customer was deleted');

    const actual = new Date().toISOString();
    const timeToLoginAgain = findEmail.auth.timeToLoginAgain !== null ? new Date(`${findEmail.auth.timeToLoginAgain}`).toISOString() : null;

    if(timeToLoginAgain !== null && actual < timeToLoginAgain) {
      throw new Error(`you need to wait until ${timeToLoginAgain} to login again`);
    }
    
    await comparePasswords(password, findEmail.auth.password, findEmail);
    delete findEmail.auth.password;

    done(null, findEmail);
  }catch(e){
    done(e, null);
  }
})

const GqlEmployeeStrategy = new GraphQLLocalStrategy(async (email, password, done) => {
  try{
    const eml = await orm.auth.findUnique({
      where: {
        email,
      },
    });
    if(!eml) throw new Error('invalid credentials');
    
    const findEmail = await orm.employee.findUnique({
      where: {
        authId: eml.id,
      },
      include: {
        auth: true,
      }
    });
    if(!findEmail) throw new Error('invalid credentials');
    
    if(findEmail.deletedAt || findEmail.auth.deletedAt)
      throw new Error('customer was deleted');

    const actual = new Date().toISOString();
    const timeToLoginAgain = findEmail.auth.timeToLoginAgain !== null ? new Date(`${findEmail.auth.timeToLoginAgain}`).toISOString() : null;

    if(timeToLoginAgain !== null && actual < timeToLoginAgain) {
      throw new Error(`you need to wait until ${timeToLoginAgain} to login again`);
    }

    await comparePasswords(password, findEmail.auth.password, findEmail);
    delete findEmail.auth.password;

    done(null, findEmail);
  }catch(e){
    done(e, null);
  }
})

module.exports = { GqlCustomerStrategy, GqlEmployeeStrategy };