const { verifyAuth } = require("../../functions/jwt.functions");
const { checkRole } = require("../../middlewares/check.role");

const OrderResolver = {
  Query: {
    getAllOrders: async (_, { step, take }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'ADMIN', 'OWNER');

      const orders = await ctx.db.orm.order.findMany({
        take: take ?? 30,
        step,
      });

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

      if(user.role === 'CUSTOMER' && user.cid !== order.customerId) 
        throw new Error('unauthorized');

      if(user.role === 'EMPLOYEE' && user.eid !== order.employeeId && user.ec !== 'ADMINISTRATIVE') 
        throw new Error('unauthorized');

      return order;
    },
    getOrdersByStatus: async (_, { status }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER');

      const orders = await ctx.db.orm.order.findMany({
        take: take ?? 30,
        step,
        where: {
          customerId: user.cid,
          status,
        }
      });

      return orders;
    }
  },
  Mutation: {
    completeOrder: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      if(user.role === 'EMPLOYEE' && user.ec !== 'ADMINISTRATIVE')  
        throw new Error('unauthorized');

      const orderProcessed = await ctx.db.orm.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: {
            id,
          },
          include: {
            products: true,
            customer: true,
          }
        });

        if(orderProcessed.customer.deletedAt !== null) 
          throw new Error('Cannot complete because, customer was deleted');

        const productOrder = [...order.products];
        const toMove = [];

        productOrder.map(p => {
          if(toMove.some(pr => pr.productId === p.id)) 
            return null;
          
          toMove.push({
            quantity: productOrder.filter(product => product.id).length,
            productId: p.id,
            customerId: user.cid,
            employeerId: user.eid,
            orderId: order.id,
          });
        });

        await tx.products_selled.createMany({
          data: toMove,
        });

        await tx.ticket.create({
          data: {
            employeeId: user.eid,
            customerId: order.customerId,
            amount: order.total,
            orderId: order.id,
            payment: order.payment,
          }
        });
        const orderUpdated = await tx.order.update({
          where: {
            id
          },
          data: {
            employeeId: user.eid,
            status: 'COMPLETED',
            processInfo: 'Order processed successfully',
          }
        });
        
        return orderUpdated;
      });
      return orderProcessed;
    },
    cancelOrder: async (_, { id, reason }, ctx) => {
      const user = await verifyAuth(ctx);

      if(user.role === 'EMPLOYEE' && user.ec !== 'ADMINISTRATIVE')  
        throw new Error('unauthorized');

      const orderProcessed = await ctx.db.orm.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: {
            id,
          },
          include: {
            products: true,
          }
        });
        const productOrder = [...order.products];
        const filterUnique = [];

        productOrder.map((p) => {
          if(filterUnique.some(pr => pr.id === p.id))
            return null;
          filterUnique.push(p);
        });

        filterUnique.forEach(async (p) => {
          await tx.product.update({
            where: {
              id: p.id
            },
            data: {
              stock: {
                increment: p.quantity,
              },
              available: true,
            }
          })
        });

        const orderUpdated = await tx.order.update({
          where: {
            id
          },
          data: {
            employeeId: user.eid,
            status: 'CANCELLED',
            processInfo: reason,
          }
        });
        
        return orderUpdated;
      });
      return orderProcessed;
    },
    setStatus: async (_, { id, status }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER');

      const order = await ctx.db.orm.order.findUnique({
        where: {
          id,
        },
      });

      ctx.error.notFound(order, 'order does not exists');

      if(user.role === 'CUSTOMER' && order.customerId === user.cid && status !== 'CANCELLED')
        throw new Error('unauthorized');

      if(order.employeeId !== user.eid) 
        throw new Error('unauthorized');

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

      const { products } = input;

      let total = 0;

      const order = await orm.$transaction(async (tx) => { 
        products.map(async (p) => {
          const product = await tx.product.findUnique({ where: { id: p.id } });

          if(product.stock < p.quantity && !product.available)
            throw new Error(`Invalid order, product '${product.name}' stock is lower than quantity ordered`);

          total += product.price;
        });

        const orderCreated = await ctx.db.tx.order.create({
          data: {
            total,
            status: 'PENDING',
            customerId: input.customerId,
            products: {
              connect: [...products.map(p => p.id)]
            }
          }
        });

        products.map(async (p) => {
          const { stock } = await tx.product.update({ 
            where: { 
              id: p.id 
            }, 
            data: { 
              stock: { 
                decrement: p.quantity
              },
            } 
          });
          if(stock - p.quantity <= 0)
            await tx.product.update({ 
              where: { 
                id: p.id 
              }, 
              data: { 
                available: stock - p.quantity <= 0 ? false : undefined,
              } 
            });
        });

        return orderCreated;
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

      if(user.role === 'EMPLOYEE' && order.employeeId !== user.eid && user.ec !== 'ADMINISTRATIVE')  
        throw new Error('unauthorized');

      const orderUpdated = await ctx.db.orm.order.update({
        where: {
          id,
        },
        data: {
          ...input,
        }
      });

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

      if(user.role === 'CUSTOMER' && user.cid !== order.customerId)
        throw new Error('unauthorized');

      if(user.role === 'EMPLOYEE' && order.employeeId !== user.eid && user.ec !== 'ADMINISTRATIVE')  
        throw new Error('unauthorized');
    
      await ctx.db.orm.order.update({
        where: {
          id,
        },
        data: {
          deleteAt: new Date().toISOString(), 
        }
      });

      return id;
    }
  },

};

module.exports = OrderResolver;