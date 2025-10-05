// Local backup service for frontend data
class LocalBackupService {
  constructor() {
    this.storageKey = 'setledger_backup';
    this.maxBackups = 5;
  }

  // Create local backup
  async createLocalBackup(data) {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: data,
        size: JSON.stringify(data).length
      };

      const backups = this.getLocalBackups();
      backups.unshift(backup);

      // Keep only max backups
      if (backups.length > this.maxBackups) {
        backups.splice(this.maxBackups);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(backups));
      
      return backup;
    } catch (error) {
      console.error('Local backup creation failed:', error);
      throw error;
    }
  }

  // Get all local backups
  getLocalBackups() {
    try {
      const backups = localStorage.getItem(this.storageKey);
      return backups ? JSON.parse(backups) : [];
    } catch (error) {
      console.error('Error getting local backups:', error);
      return [];
    }
  }

  // Restore from local backup
  restoreFromLocal(backupIndex = 0) {
    try {
      const backups = this.getLocalBackups();
      if (backups.length === 0 || !backups[backupIndex]) {
        throw new Error('No backup found');
      }

      return backups[backupIndex].data;
    } catch (error) {
      console.error('Local restore failed:', error);
      throw error;
    }
  }

  // Clear all local backups
  clearLocalBackups() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing local backups:', error);
    }
  }

  // Get backup size in MB
  getBackupSize() {
    try {
      const backups = localStorage.getItem(this.storageKey);
      return backups ? (backups.length / 1024 / 1024).toFixed(2) : 0;
    } catch (error) {
      return 0;
    }
  }

  // Auto backup on data changes
  async autoBackup(data) {
    try {
      // Only backup if significant changes (throttle)
      const lastBackup = this.getLocalBackups()[0];
      if (lastBackup) {
        const timeDiff = Date.now() - new Date(lastBackup.timestamp).getTime();
        if (timeDiff < 300000) return; // 5 minutes throttle
      }

      await this.createLocalBackup(data);
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  }
}

export const localBackupService = new LocalBackupService();
export default localBackupService;