const mongoose = require('mongoose');
const pino = require('pino');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function connect(uri) {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.error('MONGODB_URI not set. Set it in environment or .env.local');
    throw new Error('Missing MONGODB_URI');
  }

  try {
    await mongoose.connect(mongoUri, {
      // options for modern mongoose
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    logger.info('Connected to MongoDB');
    return mongoose.connection;
  } catch (err) {
    logger.error({ err }, 'MongoDB connection error');
    throw err;
  }
}

module.exports = { connect, logger };
