require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connect, logger } = require('./db');
const gamesRouter = require('./routes/games');

const PORT = process.env.PORT || 4000;

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // simple request logging middleware using pino
  app.use((req, res, next) => {
    logger.info({ method: req.method, path: req.path }, 'incoming request');
    next();
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/games', gamesRouter);

  return app;
}

async function start() {
  await connect();
  const app = createApp();
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'backend listening');
  });
}

// Export for tests and programmatic use
module.exports = createApp;
module.exports.start = start;

// If run directly, start the server
if (require.main === module) {
  start().catch((err) => {
    logger.error({ err }, 'Startup failure');
    process.exit(1);
  });
}
