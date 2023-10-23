const { hashPassword } = require("../../functions/bcrypt.functions");

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
      const findById = await ctx.db.orm.customer.findUnique({
        where: {
          id,
        },
        include: {
          auth: true,
        },
      });

      if(!findById) throw new Error('customer does not exist');
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

      return customer;
    }
  },
  Customer: {
    id: (parent) => parent.id,
    firstName: (parent) => parent.firstName,
    lastName: (parent) => parent.lastName,
    address: (parent) => parent.address,
    birthDate: (parent) => parent.birthDate,
    dni: (parent) => parent.dni,
    dniType: (parent) => parent.dniType,
    createdAt: (parent) => parent.createdAt,
    updatedAt: (parent) => parent.updatedAt,
    deletedAt: (parent) => parent.deletedAt,
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