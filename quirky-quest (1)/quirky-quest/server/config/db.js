const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB(uri) {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      // Mongoose 8 no longer needs useNewUrlParser/useUnifiedTopology,
      // kept here as documentation of intent for future driver upgrades.
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    // Fail fast — the app is not useful without a DB connection.
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB runtime error: ${err.message}`);
  });

  return mongoose.connection;
}

module.exports = connectDB;
