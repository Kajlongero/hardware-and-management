const chargeContain = require("../../functions/charge.contains");
const { verifyAuth } = require("../../functions/jwt.functions");
const isOnList = require("../../functions/role.contains");
const { checkRole } = require("../../middlewares/check.role");

const ClaimsResolver = {
  Query: {
    getAllClaims: async (_, {}, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER', 'ADMIN');

      if(!chargeContain(user.ec, 'ADMINISTRATIVE')) 
        throw new Error('unauthorized');

      const claims = await ctx.db.orm.claim.findMany();
      return claims;
    },
    getUniqueClaim: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      
      const claim = await ctx.db.orm.claim.findUnique({
        where: {
          id,
        }
      });

      if(
        claim.customerId !== user.cid ||  
        !chargeContain(user.ec, 'ADMINISTRATIVE') ||
        !isOnList(user, 'OWNER', 'ADMIN')
      ) 
        throw new Error('unauthorized');

      return claim;
    },
    getClaimsByStatus: async (_, { status }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER', 'ADMIN');

      if(!chargeContain(user.ec, 'ADMINISTRATIVE')) 
        throw new Error('unauthorized');

      const claims = await ctx.db.orm.claim.findUnique({
        where: {
          status,
        }
      });

      return claims;
    },
    getClaimsByType: async (_, { type }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER', 'ADMIN');

      if(!chargeContain(user.ec, 'ADMINISTRATIVE')) 
        throw new Error('unauthorized');

      const claims = await ctx.db.orm.claim.findUnique({
        where: {
          type,
        }
      });

      return claims;
    },
    getClaimsByCustomer: async (_) => {
      const user = await verifyAuth(ctx);
      
      const claims = await ctx.db.orm.claim.findMany({
        where: {
          customerId: user.cid,
        }
      });

      if(
        !chargeContain(user.ec, 'ADMINISTRATIVE') ||
        !isOnList(user, 'OWNER', 'ADMIN')
      )
        throw new Error('unauthorized');

      return claims;
    },
  },
  Mutation: {
    createClaim: async () => {

    },
    editClaim: async () => {

    },
    deleteClaim: async () => {

    },
    editClaimType: async () => {

    },
    editClaimStatus: async () => {

    },
  },
}

module.exports = ClaimsResolver;