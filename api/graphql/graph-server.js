const path = require('path');
const cors = require('cors');
const express = require('express');
const passport = require('passport');
const { createServer } = require('http');
const { buildContext } = require('graphql-passport');
const { ApolloServer } = require('@apollo/server');
const { PrismaClient } = require('@prisma/client');
const { expressMiddleware } = require('@apollo/server/express4');
const { schemaFiles, resolverFiles } = require('./merge-files');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { GqlCustomerStrategy, GqlEmployeeStrategy } = require('./auth/local.strategy');
const apiRoutes = require('../routes');
const JwtStrategy = require('./auth/jwt.strategy');

const orm = new PrismaClient();

const startGraphServer = async (drname) => {
  const app = express();

  const typeDefs = await schemaFiles(path.join(__dirname, 'schemas'));
  const resolvers = await resolverFiles();

  passport.use('local-graphql-customer', GqlCustomerStrategy);
  passport.use('local-graphql-employee', GqlEmployeeStrategy);
  passport.use('jwt', JwtStrategy);

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(cors());

  app.use(express.static(path.join(drname, 'public', 'images')));

  app.get('/', (req, res) => {
    res.status(200).json({
      message: 'Welcome',
    })
  })

  apiRoutes(app);

  const httpServer = createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ]
  });

  await server.start();
  app.use(expressMiddleware(server, {
    context: ({ req, res }) => buildContext({ req, res, db: { orm }})
  }));

  return app;
}

module.exports = startGraphServer 