const logger = require('../config/logger');
const redis = require('redis');

let redisClient;
const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  redisClient = redis.createClient({ url: REDIS_URL });
  redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  redisClient.connect().catch(err => {
      logger.error('Failed to connect to Redis, notifications will be direct:', err);
      redisClient = null;
  });
} else {
  logger.info('REDIS_URL not configured. Notifications will be processed directly.');
}

/**
 * Add a notification to the system
 * Gracefully handles Redis absence
 */
const addNotification = async (data) => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.lPush('notification_queue', JSON.stringify(data));
      logger.info('Added notification to Redis queue');
    } else {
      // Fallback: Direct processing
      await processNotification(data);
    }
  } catch (error) {
    logger.error('Error in addNotification:', error);
    await processNotification(data);
  }
};

/**
 * Process notification (Email, SMS, App Push)
 */
const processNotification = async (data) => {
  // Placeholder for notification delivery logic
  // In a real environment, this would call AWS SES, Twilio, or other providers
  logger.info('Processing notification directly:', data);
};

module.exports = {
  addNotification,
  processNotification
};
