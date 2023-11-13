const { hashPassword } = require("../../functions/bcrypt.functions");
const { verifyAuth, signToken } = require("../../functions/jwt.functions");
const isOnList = require("../../functions/role.contains");
const { checkRole } = require("../../middlewares/check.role");

const CustomerResolver = {
  Query: {
    getAllCustomer: async (_, { skip, take }, ctx) => {
      const customers = await ctx.db.orm.customer.findMany({
        include: {
          auth: true,
        },
        skip: skip ? skip : 0,
        take, 
      });

      return customers;
    },
    getUniqueCustomer: async (_, { id }, ctx) => {
      const user = await verifyAuth(user);

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

      ctx.error.notFound(findById, 'customer does not exists');
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

      const customer = await ctx.db.orm.customer.create({
        data: {
          ...input,
          auth: {
            create: {
              ...obj,
            }
          }
        }
      });

      return signToken(customer);
    },
    editCustomer: async (_, { id, input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'ADMIN');

      const customer = await ctx.db.orm.customer.findUnique({
        where: {
          id,
        },
      });
      ctx.error.notFound(customer, 'customer does not exists');

      if(user.role === 'CUSTOMER' && user.cid !== id) 
        throw new Error('unauthorized');

      const obj = {
        email: input.email,
        password: input.password,
      }

      delete input.email;
      delete input.password;
      
      const { email, password } = obj;
      
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
          id 
        },
        data: {
          deletedAt: new Date().toISOString(),
          auth: {
            deletedAt: new Date().toISOString(),
          }
        },
        include: {
          auth: true,
        }
      });
      return id;
    },
  },
  Customer: {
    auth: (parent) => ({
      id: parent.auth?.id,
      email: parent.auth?.email,
      password: parent.auth?.password,
      createdAt: parent.auth?.createdAt,
      updatedAt: parent.auth?.updatedAt,
      deletedAt: parent.auth?.deletedAt,
    }),
  }
}

module.exports = CustomerResolver;