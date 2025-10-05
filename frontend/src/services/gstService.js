import apiClient from './apiClient';

class GSTService {
  async validateGSTIN(gstin) {
    try {
      const response = await apiClient.post('/gst/validate-gstin', { gstin });
      return response.data;
    } catch (error) {
      console.error('Error validating GSTIN:', error);
      throw error;
    }
  }

  async generateGSTR1(orgId, memberId, month, year) {
    try {
      const response = await apiClient.post(`/gst/gstr1/${orgId}/${memberId}`, {
        month,
        year
      });
      return response.data;
    } catch (error) {
      console.error('Error generating GSTR-1:', error);
      throw error;
    }
  }

  async generateGSTR3B(orgId, memberId, month, year) {
    try {
      const response = await apiClient.post(`/gst/gstr3b/${orgId}/${memberId}`, {
        month,
        year
      });
      return response.data;
    } catch (error) {
      console.error('Error generating GSTR-3B:', error);
      throw error;
    }
  }

  async getReports(orgId, memberId, filters = {}) {
    try {
      const response = await apiClient.get(`/gst/reports/${orgId}/${memberId}`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching GST reports:', error);
      throw error;
    }
  }

  async downloadReport(reportId, format = 'pdf') {
    try {
      const endpoint = format === 'json' ? 'download-json' : 'download';
      const response = await apiClient.get(`/gst/${endpoint}/${reportId}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `gst_report.${format}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  async fileReport(reportId, filingData) {
    try {
      const response = await apiClient.post(`/gst/file/${reportId}`, filingData);
      return response.data;
    } catch (error) {
      console.error('Error filing report:', error);
      throw error;
    }
  }
}

export default new GSTService();