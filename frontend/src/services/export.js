import { api } from './api';

export const exportService = {
  async exportInvoices(format, filters = {}) {
    try {
      const response = await api.get(`/export/invoices/${format}`, {
        params: filters,
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extensions = { pdf: 'pdf', excel: 'xlsx', csv: 'csv' };
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `invoices-${timestamp}.${extensions[format]}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Failed to export ${format.toUpperCase()}`);
    }
  },
  
  async getDashboardData() {
    try {
      const response = await api.get('/dashboard/data');
      return response.data.data;
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      throw error;
    }
  },
  
  // Generate export with custom filters
  async exportWithFilters(format, filters) {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    return await this.exportInvoices(format, Object.fromEntries(queryParams));
  }
};