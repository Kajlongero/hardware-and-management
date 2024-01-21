const { verifyAuth } = require('../../functions/jwt.functions');
const { checkRole } = require("../../middlewares/check.role");

const TicketResolver = {
  Query: {
    getAllTicket: async (_, { step, take }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'OWNER');

      const tickets = await ctx.db.orm.ticket.findMany({
        step: step || 0,
        take: take || 30,
        select: {
          id: true,
          amount: true,
          payment: true,
          createdAt: true,
          products: {
            select: {
              id: true,
              quantity: true,
              product: {
                select: {
                  name: true,
                }
              }
            }
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dni: true,
              auth: {
                select: {
                  email: true,
                }
              }
            }
          }
        },
      });

      return tickets;
    },
    getUniqueTicket: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER');

      const ticket = await ctx.db.orm.ticket.findUnique({
        where: {
          id,
        },  
        select: {
          id: true,
          amount: true,
          payment: true,
          createdAt: true,
          products: {
            select: {
              id: true,
              quantity: true,
              product: {
                select: {
                  name: true,
                }
              }
            }
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dni: true,
              auth: {
                select: {
                  email: true,
                }
              }
            }
          }
        },
      });

      if(user.role === 'CUSTOMER' && user.cid !== ticket.customer.id)
        throw new Error('unauthorized');

      if(user.role === 'EMPLOYEE' && user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');

      return ticket;
    },
    getTicketsByCustomer: async (_, { customerId }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER');

      if(user.role === 'CUSTOMER' && user.cid !== ticket.customer.id)
        throw new Error('unauthorized');

      if(user.role === 'EMPLOYEE' && user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');

      const tickets = await ctx.db.orm.ticket.findMany({
        where: {
          customerId,
        },  
        select: {
          id: true,
          amount: true,
          payment: true,
          createdAt: true,
          products: {
            select: {
              id: true,
              quantity: true,
              product: {
                select: {
                  name: true,
                }
              }
            }
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dni: true,
              auth: {
                select: {
                  email: true,
                }
              }
            }
          }
        },
      });
      
      return tickets;
    }
  },
  Mutation: {
    completeOrder: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      if (user.role === "EMPLOYEE" && user.ec !== "ADMINISTRATIVE")
        throw new Error("unauthorized");

      const orderProcessed = await ctx.db.orm.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: {
            id,
          },
          include: {
            products: true,
            customer: true,
          },
          select: {
            customer: {
              select: {
                id: true,
                deletedAt: true,
              }
            },
            products: {
              select: {
                productId: true,
                productQuantity: true,
              }
            }
          }
        });

        if (order.customer.deletedAt !== null)
          throw new Error("Cannot complete because, customer was deleted");

        const productOrder = [...order.products];

        const ticket = await tx.ticket.create({
          data: {
            employeeId: user.eid,
            customerId: order.customerId,
            amount: order.total,
            orderId: order.id,
            payment: order.payment,
          },
        });

        const toMove = productOrder.map((p) => ({
          quantity: p.productQuantity,
          productId: p.productId,
          customerId: order.customer.id,
          employeeId: user.eid,
          ticket: ticket.id,
        }));

        const createdAndUpdated = await Promise.all([
          tx.products_selled.createMany({
            data: toMove,
          }),
          tx.order.update({
            where: {
              id,
            },
            data: {
              employeeId: user.eid,
              status: "COMPLETED",
              processInfo: "Order processed successfully",
            },
            include: {
              products: true,
            }
          })
        ]);

        return createdAndUpdated[1];
      });
      return orderProcessed;
    },
    editTicket: async (_, { input }, ctx) => {

    },
    deleteTicket: async (_, { id }, ctx) => {

    }
  }
}