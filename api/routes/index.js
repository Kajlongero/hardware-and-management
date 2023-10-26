const { Router } = require("express");
const uploadRouter = require('./upload.router');

const router = Router();

const apiRoutes = (app) => {

  app.use('/api', router);
  router.use('/upload', uploadRouter);
}

module.exports = apiRoutes;