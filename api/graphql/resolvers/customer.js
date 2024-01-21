const { hashPassword } = require("../../functions/bcrypt.functions");
const { verifyAuth, signToken } = require("../../functions/jwt.functions");
const { checkRole } = require("../../middlewares/check.role");
const isOnList = require("../../functions/role.contains");

const CustomerResolver = {
  Query: {
    getAllCustomer: async (_, { skip, take }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER');

      if(user.role === 'EMPLOYEE' && !isOnList(user.ec, 'ADMINISTRATIVE'))
        throw new Error('unauthorized');

      const customers = await ctx.db.orm.customer.findMany({
        where: {
          deletedAt: null
        },
        include: {
          auth: true,
        },
        skip: skip ? skip : 0,
        take, 
      });

      return customers;
    },
    getUniqueCustomer: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);

      if(user.role === 'CUSTOMER' && user.customerId !== id) 
        throw new Error('unauthorized');

      if(user.role !== 'CUSTOMER' && user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');

      const findById = await ctx.db.orm.customer.findUnique({
        where: {
          id,
        },
        include: {
          auth: true,
        },
      });

      if(!findById)
        throw new Error('customer does not exists'); 
      
      if(findById.deletedAt || findById.auth.deletedAt)
        throw new Error('customer was deleted');

      return findById;
    }
  },
  Mutation: {
    createCustomer: async (_, { input }, ctx) => {
      const { email, password } = input;

      const hash = await hashPassword(password);
      const obj = { email, password: hash };

      delete input.email;
      delete input.password;

      const checkDisponibility = await ctx.db.orm.auth.findUnique({
        where: {
          email,
        }
      });

      if(checkDisponibility)
        throw new Error('cannot use this email, please use another email');

      const customer = await ctx.db.orm.customer.create({
        data: {
          ...input,
          auth: {
            create: {
              email: obj.email,
              password: obj.password,
              role: 'CUSTOMER',
            }
          }
        }
      });

      return {
        token: signToken(customer)
      };
    },

    editCustomer: async (_, { id, input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'ADMIN');

      const customer = await ctx.db.orm.customer.findUnique({
        where: {
          id,
        },
      });
      if(!customer) throw new Error('customer does not exists');

      if(user.role === 'CUSTOMER' && user.cid !== id) 
        throw new Error('unauthorized');

      const { email, password } = input;

      delete input.email;
      delete input.password;
      
      const updatedCustomer = await ctx.db.orm.customer.update({
        where: {
          id,
        },
        data: {
          ...input,
          auth: email || password ? {
            ...obj
          } : undefined,
        },
        include: {
          auth: true,
        }
      });
      return updatedCustomer;
    },
    deleteCustomer: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'OWNER', 'ADMIN');

      const customer = await ctx.db.orm.customer.findUnique({ where: { id } });
      ctx.error.notFound(customer, 'customer does not exists');

      if(user.role === 'CUSTOMER' && user.cid !== customer.id)
        throw new Error('unauthorized');

      if(user.role !== 'CUSTOMER' && !isOnList(user.role, 'OWNER', 'ADMIN') && user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');

      await ctx.db.orm.customer.update({ 
        where: { 
          authId: user.sub, 
        },
        data: {
          deletedAt: new Date().toISOString(),
          auth: {
            update: {
              deletedAt: new Date().toISOString(),
            }
          }
        },
      });

      return id;
    },
  },
  Customer: {
    auth: (parent) => ({
      id: parent.auth?.id,
      email: parent.auth?.email,
      role: parent.auth.role,
      password: parent.auth?.password,
      createdAt: parent.auth?.createdAt,
      updatedAt: parent.auth?.updatedAt,
      deletedAt: parent.auth?.deletedAt,
    }),
  }
}

module.exports = CustomerResolver;