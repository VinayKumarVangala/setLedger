const cron = require('node-cron');
const taxReminderService = require('../services/taxReminderService');
const logger = require('../utils/logger');

class TaxReminderJob {
  start() {
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      try {
        logger.info('Starting tax deadline reminder job');
        await taxReminderService.checkUpcomingDeadlines();
        logger.info('Tax deadline reminder job completed');
      } catch (error) {
        logger.error('Tax reminder job failed:', error);
      }
    });

    logger.info('Tax reminder job scheduled - runs daily at 9:00 AM');
  }

  async runNow() {
    try {
      logger.info('Running tax reminder job manually');
      await taxReminderService.checkUpcomingDeadlines();
      logger.info('Manual tax reminder job completed');
    } catch (error) {
      logger.error('Manual tax reminder job failed:', error);
      throw error;
    }
  }
}

module.exports = new TaxReminderJob();