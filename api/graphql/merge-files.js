const { loadFiles } = require('@graphql-tools/load-files');
const { mergeResolvers } = require('@graphql-tools/merge');
const CustomerResolver = require('./resolvers/customer');

const schemaFiles = async (path) => {
  const filesLoaded = await loadFiles(path, {
    ignoredExtensions: ['js', 'jsx', 'ts', 'tsx'],
  });

  return filesLoaded;  
}

const resolverFiles = async () => {
  const resolvers = mergeResolvers([
    CustomerResolver,
  ]);
  return resolvers;
}

module.exports = { schemaFiles, resolverFiles };