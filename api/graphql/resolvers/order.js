const { verifyAuth } = require("../../functions/jwt.functions");
const { checkRole } = require("../../middlewares/check.role");
const randomHash = require("../../functions/random.hash");
const isOnList = require("../../functions/role.contains");

const OrderResolver = {
  Query: {
    getAllOrders: async (_, {}, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'ADMIN', 'OWNER');

      const orders = await ctx.db.orm.order.findMany();

      return orders;
    },
    getOrderById: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER');


      const order = await ctx.db.orm.order.findUnique({
        where: {
          id,
        },
        include: {
          customer: true,
          employee: true,
          products: true,
        }
      });
      ctx.error.notFound(order, 'order does not exists');

      if(user.cid !== order.customerId || user.eid !== order.employeeId || !isOnList(user.role, 'ADMIN', 'OWNER')) 
        throw new Error('unauthorized');
      
      return order;
    },
  },
  Mutation: {
    setStatus: async (_, { id, status }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER');

      const order = await ctx.db.orm.order.findUnique({
        where: {
          id,
        },
      });

      ctx.error.notFound(order, 'order does not exists');

      if(
        order.customerId !== user.cid && status !== 'CANCELLED' ||
        order.employeeId !== user.eid ||
        !isOnList(user.role, 'ADMIN', 'OWNER')
      ) throw new Error('unauthorized');

      const orderUpdated = await ctx.db.orm.order.update({
        where: id,
        data: {
          status,
        }
      });

      return orderUpdated;
    },
    createOrder: async (_, { input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER');

      const products = [...input.products];
      const productsId = products.map(p => ({ id: p.id }));
      let total = 0;

      products.forEach(p => total += p.price);

      const order = await ctx.db.orm.order.create({
        data: {
          total,
          status: 'PENDING',
          employeeId: input.employeeId,
          customerId: input.customerId,
          products: {
            connect: [...productsId]
          }
        }
      });

      return order;
    },
    editOrder: async (_, { id, input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER');

      const order = await ctx.db.orm.order.findUnique({
        where: {
          id,
        },
      });
      ctx.error.notFound(order, 'order does not exists');

      if(order.employeeId !== user.eid || !isOnList(user.role, 'ADMIN', 'OWNER'))  
        throw new Error('unauthorized');

      const orderUpdated = await ctx.db.orm.order.update({
        where: {
          id,
        },
        data: {
          ...input,
        }
      })

      return orderUpdated;
    },
    deleteOrder: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER');

      const order = await ctx.db.orm.order.findUnique({
        where: {
          id,
        }
      });

      ctx.error.notFound(order, 'order does not exists');

      if(order.customerId !== user.cid || order.employeeId !== user.eid || !isOnList(user.role, 'ADMIN', 'OWNER')) 
        throw new Error('unauthorized');
    
      await ctx.db.orm.order.delete({
        where: {
          id,
        }
      });

      return id;
    }
  },
  Order: {
    customer: async (parent) => {
      console.log(parent);
    },
    employee: async (parent) => {
      console.log(parent);
    },
    products: async (parent) => {
      console.log(parent);
    }
  }
};

module.exports = OrderResolver;