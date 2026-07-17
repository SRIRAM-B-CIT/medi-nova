const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const dev = process.argv.includes('--dev');
process.env.NODE_ENV = dev ? 'development' : 'production';

const express = require('express');
const next = require('next');
const connectDB = require('./backend/src/config/database');
const apiApp = require('./backend/src/app');

const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = Number(process.env.PORT || 3000);
// Webpack uses substantially fewer Linux file watchers than Turbopack in this
// repository and matches the bundler used by the production build.
const nextApp = next({ dev, hostname, port, webpack: true });
const handle = nextApp.getRequestHandler();

async function start() {
  await connectDB();
  await nextApp.prepare();

  const server = express();
  server.disable('x-powered-by');
  server.use('/api', apiApp);
  server.all('*', (req, res) => handle(req, res));

  server.listen(port, hostname, () => {
    console.log(`MediNova is ready at http://localhost:${port}`);
    console.log(`UI and API are sharing port ${port}; ML service: ${process.env.ML_SERVICE_URL || 'http://localhost:5001'}`);
  });
}

start().catch((error) => {
  console.error('Unable to start MediNova:', error);
  process.exit(1);
});
