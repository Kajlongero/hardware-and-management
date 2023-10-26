const bcrypt = require('bcrypt')
const { signToken, verifyAuth } = require("../../functions/jwt.functions");
const randomHash = require("../../functions/random.hash");

const AuthResolver = {
  Query: {
    getCustomerByToken: async (_, {}, ctx) => {
      const user = await verifyAuth(ctx);
      const customer = await ctx.db.orm.customer.findUnique({
        where: {
          id: user.sub, 
        },
        include: {  
          auth: true
        }
      });

      return customer;
    },
    getEmployeeByToken: async () => {
      const user = await verifyAuth(ctx);
      const employee = await ctx.db.orm.employee.findUnique({
        where: {
          id: user.id,
        },
        include: {
          auth: true,
        }
      });

      return employee;
    }
  }, 
  Mutation: {
    customerLogin: async (_, { input }, ctx) => {
      const { user } = await ctx.authenticate('local-graphql-customer', input);
      
      return signToken(user);
    },
    employeeLogin: async (_, { input }, ctx) => {
      const { user } = await ctx.authenticate('local-graphql-employee', input);

      return signToken(user);
    },
    customerPasswordRecovery: async (_, { email }, ctx) => {
      const user = await ctx.db.orm.customer.findUnique({
        where: {
          email
        }
      });

      if(!user) throw new Error('user does not exists');

      const newPassword = randomHash(email);
      const hashedPassword = await bcrypt.hash(newPassword);
      
      await ctx.db.orm.auth.update({
        where: {
          email,
        },
        data: {
          password: hashedPassword,
        }
      })

      return hashedPassword;
    },
    employeePasswordRecovery: async (_, { email }, ctx) => {
      const user = await ctx.db.orm.employee.findUnique({
        where: {
          email
        }
      });

      if(!user) throw new Error('user does not exists');

      const newPassword = randomHash(email);
      const hashedPassword = await bcrypt.hash(newPassword);
      
      await ctx.db.orm.auth.update({
        where: {
          email,
        },
        data: {
          password: hashedPassword,
        }
      })

      return hashedPassword;

    }

  },
}

module.exports = AuthResolver;