const { hashPassword } = require("../../functions/bcrypt.functions");
const { verifyAuth, signToken } = require("../../functions/jwt.functions");
const isOnList = require("../../functions/role.contains");
const { checkRole } = require("../../middlewares/check.role");

const employeeResolver = {
  Query: {
    getAllEmployee: async (_, { skip, take }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'OWNER', 'ADMIN');

      if(user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');

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
      const user = await verifyAuth(ctx);
      checkRole(user, 'OWNER', 'ADMIN');

      const findById = await ctx.db.orm.employee.findUnique({
        where: {
          id,
        },
        include: {
          auth: true,
        },
      });

      if(!findById)
        ctx.error.notFound(findById, 'employee does not exists');
      
      return {
        ...findById,
        auth: {
          ...findById.auth,
          role: findById.auth.role,
        }
      };
    }
  },
  Mutation: {
    createEmployee: async (_, { input }, ctx) => {
      try {
        const user = await verifyAuth(ctx);
        checkRole(user, 'OWNER');

        const { email, password } = input;
        
        const hash = await hashPassword(password);
        const obj = { email, password: hash, role: 'EMPLOYEE' };

        const checkDisponibility = await ctx.db.orm.auth.findUnique({
          where: {
            email,
          }
        });
  
        if(checkDisponibility)
          throw new Error('cannot use this email, please use another email');

        delete input.email;
        delete input.password;

        const employee = await ctx.db.orm.employee.create({
          data: {
            ...input,
            auth: {
              create: {
                email: obj.email,
                password: obj.password,
                role: obj.role,
              }
            }
          },
          include: {
            auth: true,
          }
        }); 
        
        return {
          token: signToken(employee),
        }

      }catch(e){
        throw new Error(e.message);
      }
    },
    editEmployee: async (_, { id, input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'OWNER', 'ADMIN');

      if(user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');

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

      if(user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');

      const employee = await ctx.db.orm.employee.findUnique({ where: { id } });
      ctx.error.notFound(employee, 'employee does not exists');

      if(isOnList(user.role, 'ADMIN', 'OWNER')) 
        throw new Error('unauthorized');

      const employeeDeleted = await ctx.db.orm.employee.update({
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
        },
      })

      return id;
    },
  },
}

module.exports = employeeResolver;