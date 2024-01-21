const { verifyProductRepeated } = require("../../functions/verify.repeated");
const { verifyAuth } = require("../../functions/jwt.functions");
const { checkRole } = require("../../middlewares/check.role");

const OrderResolver = {
  Query: {
    getAllOrders: async (_, { step, take }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, "ADMIN", "OWNER");

      const orders = await ctx.db.orm.order.findMany({
        take: take ?? 30,
        step,
      });

      return orders;
    },
    getOrderById: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, "CUSTOMER", "EMPLOYEE", "OWNER");

      const order = await ctx.db.orm.order.findUnique({
        where: {
          id,
        },
        include: {
          customer: true,
          employee: true,
          products: true,
        },
      });
      ctx.error.notFound(order, "order does not exists");

      if (user.role === "CUSTOMER" && user.cid !== order.customerId)
        throw new Error("unauthorized");

      if (
        user.role === "EMPLOYEE" &&
        user.eid !== order.employeeId &&
        user.ec !== "ADMINISTRATIVE"
      )
        throw new Error("unauthorized");

      return order;
    },
    getOrdersByStatus: async (_, { status }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, "CUSTOMER");

      const orders = await ctx.db.orm.order.findMany({
        take: take ?? 30,
        step,
        where: {
          customerId: user.cid,
          status,
        },
      });

      return orders;
    },
  },
  Mutation: {
    cancelOrder: async (_, { id, reason }, ctx) => {
      const user = await verifyAuth(ctx);

      if (user.role === "EMPLOYEE" && user.ec !== "ADMINISTRATIVE")
        throw new Error("unauthorized");

      const orderProcessed = await ctx.db.orm.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: {
            id,
          },
          select: {
            products: {
              select: {
                productId: true,
                productQuantity: true,
              }
            }
          },
        });

        const productOrder = [...order.products];

        await Promise.all([
          ...productOrder.map((p) => {
            return tx.product.update({
              where: {
                id: p.productId,
              },
              data: {
                stock: {
                  increment: p.productQuantity,
                },
                available: true,
              },
            });
          })
        ]);

        await tx.product_Order.deleteMany({
          where: {
            orderId: order.id,
          }
        });

        const orderUpdated = await tx.order.update({
          where: {
            id,
          },
          data: {
            employeeId: user.eid,
            status: "CANCELLED",
            reasonForStatus: reason,
          },
          include: {
            products: true,
            employee: true,
          }
        });

        return orderUpdated;
      });
      return orderProcessed;
    },
    setStatus: async (_, { id, status, reasonForStatus }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, "CUSTOMER", "EMPLOYEE", "OWNER");

      const order = await ctx.db.orm.order.findUnique({
        where: {
          id,
        },
      });

      if(!order)
        throw new Error('order does not exists');

      if (
        user.role === "CUSTOMER" &&
        order.customerId === user.cid &&
        status !== "CANCELLED"
      )
        throw new Error("unauthorized");

      if (order.employeeId !== user.eid) throw new Error("unauthorized");

      const orderUpdated = await ctx.db.orm.order.update({
        where: id,
        data: {
          status,
          reasonForStatus: user.role === 'CUSTOMER' ? 'User cancelled the order' : (reasonForStatus ?? 'Cancelled'),
        },
        include: {
          products: true,
          employee: true,
        }
      });

      if(user.role === "CUSTOMER" && status === 'CANCELLED') {
        await Promise.all([
          ...productOrder.map((p) => {
            return tx.product.update({
              where: {
                id: p.productId,
              },
              data: {
                stock: {
                  increment: p.productQuantity,
                },
                available: true,
              },
            });
          })
        ]);

        await tx.product_Order.deleteMany({
          where: {
            orderId: order.id,
          }
        });
      }

      return orderUpdated;
    },
    createOrder: async (_, { input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, "CUSTOMER", "EMPLOYEE", "OWNER");

      if (user.role === "CUSTOMER" && user.cid !== input.customerId)
        throw new Error("unauthorized");

      const products = verifyProductRepeated(input.products);

      let total = 0;

      const order = await ctx.db.orm.$transaction(async (tx) => {
        const allProducts = await Promise.all([
          ...products.map((p) => {
            return tx.product.findUnique({
              where: {
                id: p.id,
                available: true,
              },
              select: {
                id: true,
                stock: true,
                price: true,
              },
            });
          }),
        ]);

        const notFound = [];
        allProducts.forEach((p, index) => {
          if (!p) notFound.push(products[index]);
          if (p) total += p.price * products[index].quantity;
        });

        if (notFound.length > 0)
          throw new Error(`Products does not exists: ${notFound.map((p) => p.id).join(", ")}`);

        const productsWithLessStock = [];

        allProducts.forEach(({ id, stock }, index) => {
          if (products[index].quantity > stock)
            productsWithLessStock.push(products[index]);
        });

        if (productsWithLessStock.length > 0)
          throw new Error(`These products does not have the stock requested: ${productsWithLessStock.map((p) => p.id).join(", ")}`);

        const orderCreated = await tx.order.create({
          data: {
            total: total,
            status: "PENDING",
            customerId: input.customerId,
            paymentMethod: input.payment,
            reasonForStatus: 'ORDER ASSIGNED',
          },
          include: {
            products: true,
          }
        });

        const productsToSubmit = [...products.map((p) => ({
          orderId: orderCreated.id,
          productId: p.id,
          productQuantity: p.quantity
        }))];

        const productsSubmited = await tx.product_Order.createMany({
          skipDuplicates: true,
          data: productsToSubmit,
        });

        const updateAll = await Promise.all([
          ...products.map((p) => {
            return tx.product.update({
              where: {
                id: p.id,
              },
              data: {
                stock: {
                  decrement: p.quantity,
                },
              },
              select: {
                id: true,
                stock: true,
              },
            });
          }),
        ]);

        updateAll.forEach(async ({ id, stock }, index) => {
          if (stock - products[index].stock <= 0)
            await tx.product.update({
              where: {
                id,
              },
              data: {
                available: stock - p.quantity <= 0 ? false : undefined,
              },
            });
        });

        const ord = await tx.order.findUnique({
          where: {
            id: orderCreated.id,
          },
          include: {
            products: true,
          }
        });

        return ord;
      });
      return order;
    },
    editOrder: async (_, { id, input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, "EMPLOYEE", "OWNER");

      const order = await ctx.db.orm.order.findUnique({
        where: {
          id,
        },
      });
      ctx.error.notFound(order, "order does not exists");

      if (
        user.role === "EMPLOYEE" &&
        order.employeeId !== user.eid &&
        user.ec !== "ADMINISTRATIVE"
      )
        throw new Error("unauthorized");

      const orderUpdated = await ctx.db.orm.order.update({
        where: {
          id,
        },
        data: {
          ...input,
        },
      });

      return orderUpdated;
    },
    deleteOrder: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, "CUSTOMER", "EMPLOYEE", "OWNER");

      const order = await ctx.db.orm.order.findUnique({
        where: {
          id,
        },
      });

      ctx.error.notFound(order, "order does not exists");

      if (user.role === "CUSTOMER" && user.cid !== order.customerId)
        throw new Error("unauthorized");

      if (
        user.role === "EMPLOYEE" &&
        order.employeeId !== user.eid &&
        user.ec !== "ADMINISTRATIVE"
      )
        throw new Error("unauthorized");

      await ctx.db.orm.order.update({
        where: {
          id,
        },
        data: {
          deleteAt: new Date().toISOString(),
        },
      });

      return id;
    },
  },
};

module.exports = OrderResolver;
