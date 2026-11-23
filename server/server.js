const http = require('http');
const env = require('./config/env');
const connectDB = require('./config/db');
const createApp = require('./app');
const logger = require('./utils/logger');
const { initSocket } = require('./sockets');

async function main() {
  await connectDB(env.mongoUri);

  const app = createApp();
  const server = http.createServer(app);

  initSocket(server);

  server.listen(env.port, () => {
    logger.info(`Quirky Quest API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error(`Fatal startup error: ${err.stack || err.message}`);
  process.exit(1);
});
