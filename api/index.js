const os = require('os');
const execServer = require('./graphql/graph-server');

const IP = os.networkInterfaces().wlp2s0[0].address;

(async () => {
  const app = await execServer(__dirname);

  app.listen(3000, () => {
    console.log(`App running at: ${IP}:3000`);
  });
})();

