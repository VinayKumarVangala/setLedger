const backupService = require('../services/backupService');
const backupJob = require('../jobs/backupJob');

// Create manual backup
exports.createBackup = async (req, res) => {
  try {
    const { orgID } = req.user;
    
    const backup = await backupService.createBackup(orgID);
    
    res.json({
      success: true,
      data: {
        timestamp: backup.timestamp,
        recordCount: backupService.countRecords(backup.data)
      },
      message: 'Backup created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Backup creation failed',
      error: error.message
    });
  }
};

// List available backups
exports.listBackups = async (req, res) => {
  try {
    const { orgID } = req.user;
    
    const backups = await backupService.listBackups(orgID);
    
    res.json({
      success: true,
      data: backups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
};

// Restore from backup
exports.restoreBackup = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { source = 'firestore', backupId } = req.body;
    
    if (!['firestore', 'local'].includes(source)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup source. Use "firestore" or "local"'
      });
    }
    
    const result = await backupService.restoreFromBackup(orgID, source, backupId);
    
    res.json({
      success: true,
      data: result,
      message: 'Data restored successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Restore failed',
      error: error.message
    });
  }
};

// Trigger manual backup job
exports.triggerBackupJob = async (req, res) => {
  try {
    const { orgID } = req.user;
    
    const backup = await backupJob.triggerBackup(orgID);
    
    res.json({
      success: true,
      data: {
        timestamp: backup.timestamp,
        recordCount: backupService.countRecords(backup.data)
      },
      message: 'Manual backup completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Manual backup failed',
      error: error.message
    });
  }
};

// Get backup status
exports.getBackupStatus = async (req, res) => {
  try {
    const { orgID } = req.user;
    
    const backups = await backupService.listBackups(orgID);
    const latestFirestore = backups.firestore[0];
    const latestLocal = backups.local[0];
    
    res.json({
      success: true,
      data: {
        lastFirestoreBackup: latestFirestore?.timestamp || null,
        lastLocalBackup: latestLocal?.timestamp || null,
        totalFirestoreBackups: backups.firestore.length,
        totalLocalBackups: backups.local.length,
        backupJobRunning: true // Always true if server is running
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get backup status',
      error: error.message
    });
  }
};