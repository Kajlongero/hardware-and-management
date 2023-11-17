const chargeContain = require("../../functions/charge.contains");
const { verifyAuth } = require("../../functions/jwt.functions");
const isOnList = require("../../functions/role.contains");
const { checkRole } = require("../../middlewares/check.role");

const ClaimsResolver = {
  Query: {
    getAllClaims: async (_, {}, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'OWNER', 'ADMIN');

      if(!chargeContain(user.ec, 'ADMINISTRATIVE')) 
        throw new Error('unauthorized');

      const claims = await ctx.db.orm.claim.findMany({});
      return claims;
    },
    getUniqueClaim: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user,  'CUSTOMER', 'EMPLOYEE', 'OWNER');
      
      const claim = await ctx.db.orm.claim.findUnique({
        where: {
          id,
        }
      });
      if(!claim || claim.deletedAt !== null) ctx.error.notFound('order not found');

      if(user.role === 'CUSTOMER' && user.cid !== id)
        throw new Error('unauthorized');

      if(user.role !== 'CUSTOMER' && !chargeContain(user.ec, 'ADMINISTRATIVE'))
        throw new Error('unauthorized');

      return claim;
    },
    getClaimsByStatus: async (_, { status }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER', 'ADMIN');

      if(!chargeContain(user.ec, 'ADMINISTRATIVE')) 
        throw new Error('unauthorized');

      const claims = await ctx.db.orm.claim.findMany({
        where: {
          status,
        }
      });

      return claims;
    },
    getClaimsByType: async (_, { type }, ctx) => {
      const { user: user, ec } = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER', 'ADMIN');

      if(!chargeContain(ec, 'ADMINISTRATIVE')) 
        throw new Error('unauthorized');

      const claims = await ctx.db.orm.claim.findMany({
        where: {
          type,
        }
      });

      return claims;
    },
    getClaimsByCustomer: async (_, { id }, ctx) => {
      const { user: user, role, ec, cid } = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER')
      
      if(role === 'CUSTOMER' && cid !== id)
        throw new Error('unauthorized');

      if(role !== 'CUSTOMER' && !isOnList(ec, 'ADMINISTRATIVE'))
        throw new Error('unauthorized');

      const claims = await ctx.db.orm.claim.findMany({
        where: {
          customerId: id,
        }
      });

      return claims;
    },
  },
  Mutation: {
    createClaim: async (_, { input }, ctx) => {
      const {user: user, cid } = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER');

      const { type, status, content, subject, orderId, products } = input;

      const order = await ctx.db.orm.order.findUnique({
        where: {
          id: orderId,  
        }
      });

      if(!order) 
        ctx.error.notFound('order does not exists');

      const claim = await ctx.db.orm.claim.create({
        data: {
          type,
          status,
          content,
          subject,
          customerId: cid,
          products: {
            connect: [...products]
          }
        }
      });

      return claim;
    },
    returnMoney: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER');

      if(user.ec !== 'ADMINISTRATIVE') 
        throw new Error('unauthorized');

      const ticket = await ctx.db.orm.ticket.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          products: {
            select: {
              id: true,
              quantity: true,
            }
          },
          order: {
            id: true,
            customer: {
              id: true,
            }
          }
        }
      });

      const { products, order: { id: orderId, customer: customerId } } = ticket;

      const returnedMoney = await ctx.db.orm.$transaction(async (tx) => {

          


      });

      return returnedMoney;
    },
    changeProducts: async (_, { id }, ctx) => {

    },
    editClaim: async (_, { id, input }, ctx) => {
      const { user: user, cid, role } = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER');

      const claim = await ctx.db.orm.claim.findUnique({
        where: {
          id,
        }
      });
      if(!claim || claim.deletedAt !== null) ctx.error.notFound('order not found');

      if(role === 'CUSTOMER' && claim.customerId !== cid)
        throw new Error('unauthorized');
    
      if(role === 'CUSTOMER' && status && !isOnList(status, 'PENDING', 'CANCELLED', 'DELETED'))
        throw new Error('unauthorized');

      const { status } = input;
      
      const edited = await ctx.db.orm.claim.update({
        where: {
          id,
        },
        data: {
          ...input,
        },
        include: {
          products: true,
          customer: true,
        }
      });
      
      return edited;
    },
    deleteClaim: async (_, { id }, ctx) => {  
      const { user: user, cid, role } = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER');

      const claim = await ctx.db.orm.claim.findUnique({
        where: {
          id,
        }
      });
      if(!claim || claim.deletedAt !== null) ctx.error.notFound('order not found');
      
      if(role === 'CUSTOMER' && claim.customerId !== cid)
        throw new Error('unauthorized');
  
      await ctx.db.orm.claim.update({
        where: {
          id,
        },
        data: {
          deletedAt: new Date().toISOString(),
        }
      });

      return id;
    },
  },
}

module.exports = ClaimsResolver;