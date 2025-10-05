const cron = require('node-cron');
const firestoreService = require('../services/firestoreService');
const { Organization } = require('../models');
const logger = require('../utils/logger');

class AutoSyncJob {
  start() {
    // Run daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Starting auto-sync job');
        await this.syncAllOrganizations();
        logger.info('Auto-sync job completed');
      } catch (error) {
        logger.error('Auto-sync job failed:', error);
      }
    });

    logger.info('Auto-sync job scheduled - runs daily at 2:00 AM');
  }

  async syncAllOrganizations() {
    try {
      const organizations = await Organization.find({ 
        isActive: true,
        'subscription.plan': { $ne: 'free' } // Only sync paid plans
      });

      for (const org of organizations) {
        try {
          // Get admin user for the organization
          const adminUser = await User.findOne({ 
            orgID: org.orgID, 
            role: 'admin' 
          });

          if (adminUser) {
            await firestoreService.syncToFirestore(org.orgID, adminUser.memberID);
            logger.info(`Auto-sync completed for organization: ${org.orgID}`);
          }
        } catch (error) {
          logger.error(`Auto-sync failed for organization ${org.orgID}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in auto-sync job:', error);
      throw error;
    }
  }

  async runNow() {
    try {
      logger.info('Running auto-sync job manually');
      await this.syncAllOrganizations();
      logger.info('Manual auto-sync job completed');
    } catch (error) {
      logger.error('Manual auto-sync job failed:', error);
      throw error;
    }
  }
}

module.exports = new AutoSyncJob();