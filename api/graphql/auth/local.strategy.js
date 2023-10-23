const { GraphQLLocalStrategy } = require('graphql-passport');
const { PrismaClient } = require('@prisma/client');
const comparePasswords = require('../../functions/bcrypt.functions');

const orm = new PrismaClient();

const GqlCustomerStrategy = new GraphQLLocalStrategy(async (email, password, done) => {
  try{
    const findEmail = await orm.auth.findUnique({
      where: {
        email,
      }
    });

    if(!findEmail) throw new Error('invalid credentials');
    await comparePasswords(password, findEmail.password);

    delete findEmail.password;
    const userData = await orm.customer.findUnique({
      where: {
        authId: findEmail.id,
      }
    });
    
    const user = { ...userData, auth: findEmail };
    done(null, user);
  }catch(e){
    done(e, null);
  }
})

const GqlEmployeeStrategy = new GraphQLLocalStrategy(async (email, password, done) => {
  try{
    const findEmail = await orm.auth.findUnique({
      where: {
        email,
      }
    });
    if(!findEmail) throw new Error('invalid credentials');
    await comparePasswords(password, findEmail.password);

    delete findEmail.password;

    const userData = await orm.employee.findUnique({
      where: {
        authId: findEmail.id,
      }
    });
    
    const user = { ...userData, auth: findEmail };
    done(null, user);
  }catch(e){
    done(e, null);
  }
})

module.exports = { GqlCustomerStrategy, GqlEmployeeStrategy };