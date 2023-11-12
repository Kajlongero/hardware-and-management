const InventoryResolver = {
  Query: {
    getAllProductsSelled: async (_, {}, ctx) => {

    },
    getAllProductsReturned: async (_, {}, ctx) => {

    },
    getUniqueProductSelled: async (_, { id }, ctx) => {

    },
    getUniqueProductReturned: async (_, { id }, ctx) => {
      
    },
    productsMostSelled: async (_, { id }, ctx) => {
      
    }
  }, 
  Mutation: {
    sellProduct: async (_, { input }, ctx) => {
      
    },
    returnProduct: async (_, { input }, ctx) => {
      
    },
    editProductSell: async (_, { input, id }, ctx) => {
      
    },
    editProductReturned: async (_, { input, id }, ctx) => {
      
    },
    deleteProductSelled: async (_, { id }, ctx) => {
      
    },
    deleteProductReturned: async (_, { id }, ctx) => {
      
    },
  }
}

module.exports = InventoryResolver;