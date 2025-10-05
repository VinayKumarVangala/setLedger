import apiClient from './apiClient';

class CloudSyncService {
  async syncToCloud(orgId, memberId) {
    try {
      const response = await apiClient.post(`/cloud-sync/sync/${orgId}/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      throw error;
    }
  }

  async restoreFromCloud(orgId, memberId) {
    try {
      const response = await apiClient.post(`/cloud-sync/restore/${orgId}/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error restoring from cloud:', error);
      throw error;
    }
  }

  async getSyncStatus(orgId, memberId) {
    try {
      const response = await apiClient.get(`/cloud-sync/status/${orgId}/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }

  async getBackupInfo(orgId) {
    try {
      const response = await apiClient.get(`/cloud-sync/backup-info/${orgId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting backup info:', error);
      throw error;
    }
  }

  async deleteBackup(orgId) {
    try {
      const response = await apiClient.delete(`/cloud-sync/backup/${orgId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  }

  // Auto-sync functionality
  async enableAutoSync(orgId, memberId, interval = 'daily') {
    try {
      const response = await apiClient.post(`/cloud-sync/auto-sync/${orgId}/${memberId}`, {
        enabled: true,
        interval
      });
      return response.data;
    } catch (error) {
      console.error('Error enabling auto-sync:', error);
      throw error;
    }
  }

  async disableAutoSync(orgId, memberId) {
    try {
      const response = await apiClient.post(`/cloud-sync/auto-sync/${orgId}/${memberId}`, {
        enabled: false
      });
      return response.data;
    } catch (error) {
      console.error('Error disabling auto-sync:', error);
      throw error;
    }
  }

  // Sync specific data types
  async syncProducts(orgId, memberId) {
    try {
      const response = await apiClient.post(`/cloud-sync/sync-products/${orgId}/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error syncing products:', error);
      throw error;
    }
  }

  async syncInvoices(orgId, memberId) {
    try {
      const response = await apiClient.post(`/cloud-sync/sync-invoices/${orgId}/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error syncing invoices:', error);
      throw error;
    }
  }
}

export default new CloudSyncService();