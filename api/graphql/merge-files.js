const { loadFiles } = require('@graphql-tools/load-files');
const { mergeResolvers } = require('@graphql-tools/merge');
const { resolvers, typeDefs } = require('graphql-scalars');
const CustomerResolver = require('./resolvers/customer');
const AuthResolver = require('./resolvers/auth');
const EmployeeResolver = require('./resolvers/employee');
const ProductResolver = require('./resolvers/product');
const OrderResolver = require('./resolvers/order');

const schemaFiles = async (path) => {
  const filesLoaded = await loadFiles(path, {
    ignoredExtensions: ['js', 'jsx', 'ts', 'tsx'],
  });

  return [...filesLoaded, typeDefs];  
}

const resolverFiles = async () => {
  const rslvrs = mergeResolvers([
    resolvers,
    AuthResolver,
    CustomerResolver,
    EmployeeResolver,
    ProductResolver,
    OrderResolver,
  ]);
  return rslvrs;
}

module.exports = { schemaFiles, resolverFiles };