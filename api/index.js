const os = require('os');
const execServer = require('./graphql/graph-server');

(async () => {
  const app = await execServer(__dirname);

  app.listen(3000, () => {
    console.log(`App running at: localhost:3000`);
  });
})();

