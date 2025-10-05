import apiClient from './apiClient';

class FinancialReportService {
  async generateProfitLoss(orgId, memberId, startDate, endDate) {
    try {
      const response = await apiClient.post(`/financial-reports/profit-loss/${orgId}/${memberId}`, {
        startDate,
        endDate
      });
      return response.data;
    } catch (error) {
      console.error('Error generating P&L report:', error);
      throw error;
    }
  }

  async generateBalanceSheet(orgId, memberId, asOfDate) {
    try {
      const response = await apiClient.post(`/financial-reports/balance-sheet/${orgId}/${memberId}`, {
        asOfDate
      });
      return response.data;
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      throw error;
    }
  }

  async generateCashFlow(orgId, memberId, startDate, endDate) {
    try {
      const response = await apiClient.post(`/financial-reports/cash-flow/${orgId}/${memberId}`, {
        startDate,
        endDate
      });
      return response.data;
    } catch (error) {
      console.error('Error generating cash flow report:', error);
      throw error;
    }
  }

  async exportReport(reportData, reportType, format) {
    try {
      const response = await apiClient.post(`/financial-reports/export/${format}`, {
        reportData,
        reportType
      }, {
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
        : `${reportType.replace(/\s+/g, '_')}_Report.${format}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  // Generate comparison reports
  async generateComparison(orgId, memberId, reportType, periods) {
    try {
      const response = await apiClient.post(`/financial-reports/comparison/${orgId}/${memberId}`, {
        reportType,
        periods
      });
      return response.data;
    } catch (error) {
      console.error('Error generating comparison report:', error);
      throw error;
    }
  }

  // Get financial ratios
  async getFinancialRatios(orgId, memberId, asOfDate) {
    try {
      const response = await apiClient.get(`/financial-reports/ratios/${orgId}/${memberId}`, {
        params: { asOfDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching financial ratios:', error);
      throw error;
    }
  }
}

export default new FinancialReportService();