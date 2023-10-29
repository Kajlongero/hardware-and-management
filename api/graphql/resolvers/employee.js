const { hashPassword } = require("../../functions/bcrypt.functions");
const { verifyAuth, signToken } = require("../../functions/jwt.functions");
const isOnList = require("../../functions/role.contains");
const { checkRole } = require("../../middlewares/check.role");

const employeeResolver = {
  Query: {
    getAllEmployee: async (_, { skip, take }, ctx) => {
      const user = verifyAuth(ctx);
      checkRole(user, 'OWNER', 'ADMIN');

      const employee = await ctx.db.orm.employee.findMany({
        include: {
          auth: true,
        },
        skip: skip ? skip : 0,
        take, 
      });

      return employee;
    },
    getUniqueEmployee: async (_, { id }, ctx) => {
      const user = verifyAuth(ctx);
      checkRole(user, 'OWNER', 'ADMIN');

      const findById = await ctx.db.orm.employee.findUnique({
        where: {
          id,
        },
        include: {
          auth: true,
        },
      });

      ctx.error.notFound(findById, 'employee does not exists');
      return findById;
    }
  },
  Mutation: {
    createEmployee: async (_, { input }, ctx) => {
      try {
        const { email, password } = input;
        const user = await verifyAuth(ctx);
        checkRole(user, 'OWNER');
        
        const hash = await hashPassword(password);
        const obj = { email, password: hash };

        delete input.email;
        delete input.password;

        const employee = await ctx.db.orm.employee.create({
          data: {
            ...input,
            auth: {
              create: {
                ...obj,
              }
            }
          },
          include: {
            auth: true,
          }
        }); 

        return signToken(employee);
      }catch(e){
        throw new Error(e.message);
      }
    },
    editEmployee: async (_, { id, input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'OWNER', 'ADMIN');
      
      const employee = await ctx.db.orm.employee.findUnique({
        where: {
          authId: id,
        },
      });
      ctx.error.notFound(employee, 'employee does not exists');

      if(isOnList(user.role, 'OWNER', 'ADMIN')) throw new Error('unauthorized');
      if(user.sub !== employee.employeeId) throw new Error('unauthorized');

      const obj = { email: input.email, password: input.password };
      
      const updatedEmployee = await ctx.db.orm.employee.update({
        where: {
          id,
        },
        data: {
          ...input,
          auth: (email || password) ? { ...obj } : undefined
        }
      });

      return updatedEmployee;
    },
    deleteEmployee: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'OWNER', 'ADMIN');

      const employee = await ctx.db.orm.employee.findUnique({ where: { id } });
      ctx.error.notFound(employee, 'employee does not exists');

      if(isOnList(user.role, 'ADMIN', 'OWNER')) 
        throw new Error('unauthorized');

      await ctx.db.orm.auth.delete({ where: { id: employee.authId } });
      await ctx.db.orm.employee.delete({ where: { id } });

      return id;
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