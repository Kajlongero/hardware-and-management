const chargeContain = require("../../functions/charge.contains");
const isOnList = require("../../functions/role.contains");
const { verifyAuth } = require("../../functions/jwt.functions");
const { checkRole } = require("../../middlewares/check.role");

const LogsResolver = {
  Query: {
    getAllLogs: async (_, {}, ctx) => {
      const user = verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'ADMIN');

      if(user.role === 'EMPLOYEE' && !chargeContain(user.ec, 'ADMINISTRATIVE'))
        throw new Error('unauthorized');

      const logs = await ctx.db.orm.logs.findMany({});

      return logs;
    },
    getUniqueLog: async (_, { id }, ctx) => {
      const user = verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER', 'ADMIN');

      if(user.role === 'EMPLOYEE' && !chargeContain(user.ec, 'ADMINISTRATIVE'))
        throw new Error('unauthorized');

      const log = await ctx.db.orm.logs.findUnique({
        where: {
          id,
        }
      });

      return log;
    },
    getLogsByType: async (_, { type }, ctx) => {
      const user = verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'ADMIN');

      if(user.role === 'EMPLOYEE' && !chargeContain(user.ec, 'ADMINISTRATIVE'))
        throw new Error('unauthorized');

      const logs = await ctx.db.orm.logs.findMany({
        where: {
          type: type,
        }
      });

      return logs;
    }
  },
}

module.exports = LogsResolver;