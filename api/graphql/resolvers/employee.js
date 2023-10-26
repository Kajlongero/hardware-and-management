const { hashPassword } = require("../../functions/bcrypt.functions");
const { verifyAuth, signToken } = require("../../functions/jwt.functions");
const { checkRole } = require("../../middlewares/check.role");

const employeeResolver = {
  Query: {
    getAllEmployee: async (_, { skip, take }, ctx) => {
      const employee = await ctx.db.orm.employee.findMany({
        include: {
          auth: true,
        },
        skip: skip ? skip : 0,
        take, 
      });
      
      console.log(ctx.isAuthenticated);

      return employee;
    },
    getUniqueEmployee: async (_, { id }, ctx) => {
      const findById = await ctx.db.orm.employee.findUnique({
        where: {
          id,
        },
        include: {
          auth: true,
        },
      });

      if(!findById) throw new Error('employee does not exist');
      return findById;
    }
  },
  Mutation: {
    createEmployee: async (_, { input }, ctx) => {
      const { email, password } = input;

      const user = await verifyAuth(ctx);
      checkRole(user, 'OWNER');
      
      const hash = await hashPassword(password);
      const obj = { email, password: hash };

      const employee = await ctx.db.orm.employee.create({
        data: {
          ...input,
          auth: {
            create: {
              ...obj,
            }
          }
        }
      });

      return signToken(employee);


    },
    editEmployee: async (_, { id, input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'OWNER', 'ADMIN');

      const { email, password } = input.auth;
      
      const employee = await ctx.db.orm.employee.findUnique({
        where: id,
      });

      if((user.sub !== employee.id) || (user.role !== ('ADMIN' || 'OWNER'))) 
        throw new Error('unauthorized');
      
      const updatedEmployee = await ctx.db.orm.employee.update({
        where: {
          id,
        },
        ...input,
        auth: (email || password) ? {
          update: {

          }
        } : undefined,
      });

      return updatedEmployee;
    },
    deleteEmployee: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'OWNER', 'ADMIN');

      const employee = await ctx.db.orm.employee.findUnique({ where: { id } });

      if((user.sub !== employee.id) || (user.role !== 'ADMIN')) throw new Error('unauthorized');

      await ctx.db.orm.auth.delete({ where: { id: employee.authId } });
      await ctx.db.orm.employee.delete({ where: { id } });

      return employee.id;
    },
  },
  Employee: {
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

module.exports = employeeResolver;