import apiClient from './apiClient';

class AdminService {
  async getLogs(filters = {}) {
    try {
      const response = await apiClient.get('/admin/logs', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  async getLogStats() {
    try {
      const response = await apiClient.get('/admin/logs/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching log stats:', error);
      throw error;
    }
  }

  async clearLogs(level = 'all') {
    try {
      const response = await apiClient.delete('/admin/logs', {
        params: { level }
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing logs:', error);
      throw error;
    }
  }

  async getCrashReports(filters = {}) {
    try {
      const response = await apiClient.get('/admin/crashes', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching crash reports:', error);
      throw error;
    }
  }

  async getSystemHealth() {
    try {
      const response = await apiClient.get('/admin/health');
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }

  async testError(message, level = 'error') {
    try {
      const response = await apiClient.post('/admin/test-error', {
        message,
        level
      });
      return response.data;
    } catch (error) {
      console.error('Error testing error logging:', error);
      throw error;
    }
  }

  async downloadLogs(filters = {}) {
    try {
      const response = await apiClient.get('/admin/logs/download', {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading logs:', error);
      throw error;
    }
  }
}

export default new AdminService();