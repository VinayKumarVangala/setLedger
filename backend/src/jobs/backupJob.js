const cron = require('node-cron');
const { Organization } = require('../models');
const backupService = require('../services/backupService');

class BackupJob {
  constructor() {
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    
    console.log('Starting backup job...');
    
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.performDailyBackup();
    });
    
    // Run weekly cleanup on Sundays at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      await this.performWeeklyCleanup();
    });
    
    this.isRunning = true;
  }

  async performDailyBackup() {
    try {
      console.log('Starting daily backup process...');
      
      const organizations = await Organization.find({ isActive: true });
      const results = { success: 0, failed: 0, errors: [] };
      
      for (const org of organizations) {
        try {
          await backupService.createBackup(org.orgID);
          results.success++;
          console.log(`✓ Backup completed for org: ${org.name}`);
        } catch (error) {
          results.failed++;
          results.errors.push(`${org.name}: ${error.message}`);
          console.error(`✗ Backup failed for org: ${org.name}`, error);
        }
      }
      
      console.log(`Daily backup completed: ${results.success} success, ${results.failed} failed`);
      
      if (results.errors.length > 0) {
        console.error('Backup errors:', results.errors);
      }
      
      return results;
    } catch (error) {
      console.error('Daily backup process failed:', error);
    }
  }

  async performWeeklyCleanup() {
    try {
      console.log('Starting weekly backup cleanup...');
      
      // Cleanup old Firestore backups (keep last 30 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      const admin = require('firebase-admin');
      const db = admin.firestore();
      
      const oldBackups = await db.collection('backups')
        .where('timestamp', '<', cutoffDate.toISOString())
        .get();
      
      let deletedCount = 0;
      for (const doc of oldBackups.docs) {
        // Delete chunks first
        const chunks = await doc.ref.collection('chunks').get();
        for (const chunk of chunks.docs) {
          await chunk.ref.delete();
        }
        
        // Delete main document
        await doc.ref.delete();
        deletedCount++;
      }
      
      console.log(`Weekly cleanup completed: ${deletedCount} old backups removed`);
    } catch (error) {
      console.error('Weekly cleanup failed:', error);
    }
  }

  // Manual backup trigger
  async triggerBackup(orgID) {
    try {
      return await backupService.createBackup(orgID);
    } catch (error) {
      console.error(`Manual backup failed for org ${orgID}:`, error);
      throw error;
    }
  }

  stop() {
    this.isRunning = false;
    console.log('Backup job stopped');
  }
}

module.exports = new BackupJob();