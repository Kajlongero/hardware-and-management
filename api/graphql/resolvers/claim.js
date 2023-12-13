const chargeContain = require("../../functions/charge.contains");
const isOnList = require("../../functions/role.contains");
const { verifyAuth } = require("../../functions/jwt.functions");
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
      const user = await verifyAuth(ctx);
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
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER')
      
      if(role === 'CUSTOMER' && user.cid !== id)
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
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER');

      const { type, content, subject, ticketId, products } = input;

      const ticket = await ctx.db.orm.ticket.findUnique({
        where: {
          id: ticketId,
        },
        select: {
          products: {
            select: {
              id: true,
            }
          },
          customer: {
            select: {
              id: true, 
              deletedAt: true,
            }
          }
        }
      });

      if(!ticket)
        throw new Error('ticket does not exists')

      if(!ticket.customer.id !== user.cid)
        throw new Error('customer does not match with the ticket');

      if(ticket.customer.deletedAt !== null)
        throw new Error('customer was deleted');

      // [{ productId: 'abasdhqw', quantity: 3, reason: 'DAMAGED' }]
      const { products: productsSelled } = ticket;

      const productsDoesNotMatch = [];

      products.forEach((pr) => {
        if(!productsSelled.some(product => product.id === pr.id))
          productsDoesNotMatch.push({ id: pr.id, message: 'this product is not assigned to this ticket' });
      });

      if(productsDoesNotMatch.length > 0) 
        throw new Error(JSON.stringify({
          message: "products does not match with your ticket",
          products: [
            ...productsDoesNotMatch,
          ],
        }))

      const claim = await ctx.db.orm.$transaction(async (tx) => {
        const claimCreated = await tx.claim.create({
          data: {
            type, 
            content, 
            subject, 
            ticketId,
            customerId: user.cid
          }
        });

        const createMany = products.map(async ({ productId, reason, quantity }) => ({
          reason,
          quantity,
          productId,
          customerId: user.cid,
          ticketId: ticket.id,
          claimId: claimCreated.id,
        }));

        await tx.claimed_products.createMany({
          data: [
            ...createMany
          ]
        });
        
        return claimCreated;
      })

      return claim;
    },
    rejectClaim: async (_, { id }, ctx) => {

    },
    returnMoney: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER');

      if(user.ec !== 'ADMINISTRATIVE') 
        throw new Error('unauthorized');

      const claim = await ctx.db.orm.claim.findUnique({
        where: {
          id,
        },
        select: {
          products: {
            select: {
              id: true,
              quantity: true,
              reason: true,
              product: {
                select: {
                  id: true,
                  product: {
                    select: {
                      price: true,
                    }
                  }
                }
              }
            }
          },
          ticket: {
            select: {
              id: true,
              amount: true,
            }
          },
          order: {
            select: {
              id: true,
            },
            customer: {
              select: {
                id: true,
              }
            }
          }
        }
      });
      
      const returnedMoney = await ctx.db.orm.$transaction(async (tx) => {
        let totalToReturn = 0;
        const { products: productsClaimed } = claim;  
        
        const claimUpd = await tx.claim.update({
          where: {
            id,
          },
          data: {
            status: 'COMPLETED',
            finalAction: 'RETURN_MONEY',
          }
        });
        
        const toCreate = await productsClaimed.map(async (pr) => {
          totalToReturn += (pr.product.product.price * pr.quantity); 

          await tx.products_selled.update({
            where: {
              id: pr.product.id,
            },
            data: {
              quantity: {
                decrement: pr.quantity
              }
            }
          });
          
          return {
            productId: pr.id, 
            reason: pr.reason,
            quantity: pr.quantity,
            customerId: claim.order.customer.id,
            ticketId: claim.ticket.id,
            claimId: id,
          }
        });
                
        await Promise.all([
          tx.products_returned.createMany({
            data: [...toCreate]
          }),
          tx.customer.update({
            where: { id: claim.order.customer.id },
            data: { amount: { increment: totalToReturn } }
          }),
          tx.claimed_products.updateMany({
            where: { ticketId: claim.ticket.id },
            data: { deletedAt: new Date().toISOString() }
          })
        ])

        return claimUpd;
      });

      return returnedMoney;
    },
    changeProducts: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER');

      if(user.role === 'EMPLOYEE' && user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');

        const claim = await ctx.db.orm.claim.findUnique({
          where: {
            id,
          },
          select: {
            products: {
              select: {
                id: true,
                quantity: true,
                reason: true,
                product: {
                  select: {
                    id: true,
                    quantity: true,
                    product: {
                      select: {
                        id: true,
                        price: true,
                        stock: true,
                      }
                    }
                  }
                }
              }
            },
            ticket: {
              select: {
                id: true,
                amount: true,
              }
            },
            order: {
              select: {
                id: true,
              },
              customer: {
                select: {
                  id: true,
                }
              }
            }
          }
        });

        const handleProducts = await ctx.db.orm.$transaction(async (tx) => {
          let totalPriceIfNotStock = 0;

          const { products } = claim;
          
          

        });

        /*
          [{ // products_claimed
            id,
            quantity,
            reason,
            product: [ // products_selled
              {
                id,
                quantity,
                product: { // products
                  id,
                  price,
                  stock
                }
              }
            ]
          }]
        */
    },
    editClaim: async (_, { id, input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'CUSTOMER', 'EMPLOYEE', 'OWNER');

      const claim = await ctx.db.orm.claim.findUnique({
        where: {
          id,
        }
      });
      if(!claim || claim.deletedAt !== null) ctx.error.notFound('order not found');

      if(role === 'CUSTOMER' && claim.customerId !== user.cid)
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
      const user = await verifyAuth(ctx);
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