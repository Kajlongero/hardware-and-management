const { verifyAuth } = require("../../functions/jwt.functions");
const { checkRole } = require("../../middlewares/check.role");
const randomHash = require("../../functions/random.hash");
const chargeContain = require("../../functions/charge.contains");

const ProductResolver = {
  Query: {
    getAllProducts: async (_, { take, step }, ctx) => {
      const products = await ctx.db.orm.product.findMany({
        take: take ?? 30,
        step,
      });

      return products;
    },
    getProductById: async (_, { id }, ctx) => {
      const product = await ctx.db.orm.product.findUnique({
        where: {
          id,
        }
      });
    
      ctx.error.notFound(product, 'product not found');
      return product;
    }
  },
  Mutation: {
    createProduct: async (_, { input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER');

      if(user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');

      const productWithHash = {
        ...input,
        sku: randomHash(input.name),
      };

      const product = await ctx.db.orm.product.create({
        data: {
          ...productWithHash,
        }
      });

      return product;
    },
    editProduct: async (_, { id, input }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER');

      if(user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');

      const product = await ctx.db.orm.product.findUnique({
        where: {
          id
        },
      });
      ctx.error.notFound(product, 'product not found');

      const productUpdated = await ctx.db.orm.product.update({
        where: {
          id,
        },
        data: {
          ...input,
        }
      });

      return productUpdated;
    },
    deleteProduct: async (_, { id }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER');

      if(user.ec !== 'ADMINISTRATIVE')
        throw new Error('unauthorized');

      await ctx.db.orm.product.delete({
        where: {
          id,
        }
      });

      return id;
    },
  }
};

module.exports = ProductResolver;