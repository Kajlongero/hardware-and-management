const { randomUUID } = require('node:crypto');
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
        where: {
          available: true,
          deletedAt: null,
        }
      });

      return products;
    },
    getUniqueProduct: async (_, { id }, ctx) => {
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
    stablishCoverImage: async (_, { id, isRemoving, image }, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER');

      if(user.role === 'EMPLOYEE' && user.ec !== 'ADMINISTRATIVE')  
        throw new Error('unauthorized');

      const product = await ctx.db.orm.product.findUnique({
        where: {
          id,
        }
      });
      if(!product) throw new Error('this product does not exists');
      if(product.deletedAt) throw new Error('this product was deleted')

      const productUpdated = await ctx.db.orm.product.update({
        where: {
          id,
        },
        data: {
          coverImage: isRemoving ? null : image,
        }
      });

      return productUpdated;
    },
    uploadProductImages: async (_, { id, images }, ctx) => {
      console.log(images);
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER');

      if(user.role === 'EMPLOYEE' && user.ec !== 'ADMINISTRATIVE')  
        throw new Error('unauthorized');

      const product = await ctx.db.orm.product.findUnique({
        where: {
          id,
        },
        select: {
          name: true,
          deletedAt: true,
        }
      });
      if(!product) throw new Error('this product does not exists');
      
      if(product.deletedAt) throw new Error('this product was deleted');

      const sortedImages = [...images.sort((a, b) => a.order < b.order)];
      const removedOrder = sortedImages.map(img => img.image);

      const productUpdated = await ctx.db.orm.product.update({
        where: {
          id,
        },
        data: {
          images: [...removedOrder]
        }
      });

      return productUpdated;
    },
    removeProductImages: async (_, {id, imagesToDelete}, ctx) => {
      const user = await verifyAuth(ctx);
      checkRole(user, 'EMPLOYEE', 'OWNER');

      if(user.role === 'EMPLOYEE' && user.ec !== 'ADMINISTRATIVE')  
        throw new Error('unauthorized');

      const product = await ctx.db.orm.product.findUnique({
        where: {
          id,
        },
        select: {
          images: true,
          deletedAt: true,
        }
      });
      if(!product) throw new Error('this product does not exists');
      if(product.deletedAt) throw new Error('this product was deleted');

      const imgArr = imagesToDelete.map((img) => img.href);

      const imgToDel = new Set(imgArr);
      const newArray = product.images.filter(img => !imgToDel.has(img));

      const updated = await ctx.db.orm.product.update({
        where: {
          id,
        },
        data: {
          images: [...newArray],
        }
      });

      return updated;
    }
  }
};

module.exports = ProductResolver;