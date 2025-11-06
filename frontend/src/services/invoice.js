import { api } from './api';
import { dbService } from './db';

export const invoiceService = {
  async createInvoice(invoiceData) {
    try {
      const response = await api.post('/invoices', invoiceData);
      
      // Store locally for offline access
      await dbService.createInvoice({
        ...response.data.data,
        orgId: response.data.data.organizationId
      });
      
      return response.data.data;
    } catch (error) {
      // Store in outbox for retry
      await dbService.addToOutbox('invoices', 'create', {
        ...invoiceData,
        timestamp: Date.now()
      });
      
      throw error;
    }
  },
  
  async createFromQRScan(qrData) {
    try {
      const response = await api.post('/invoices/qr-scan', qrData);
      
      // Store locally
      await dbService.createInvoice({
        ...response.data.data,
        orgId: response.data.data.organizationId
      });
      
      return response.data.data;
    } catch (error) {
      // Store in outbox for retry
      await dbService.addToOutbox('invoices', 'create', {
        ...qrData,
        inputMethod: 'qr_scan',
        timestamp: Date.now()
      });
      
      throw error;
    }
  },
  
  async getInvoices(filters = {}) {
    try {
      const response = await api.get('/invoices', { params: filters });
      return response.data.data;
    } catch (error) {
      // Fallback to local data
      const orgId = localStorage.getItem('orgId');
      return await dbService.getInvoices(orgId);
    }
  },
  
  async updateInvoiceStatus(invoiceId, status) {
    try {
      const response = await api.put(`/invoices/${invoiceId}/status`, { status });
      
      // Update local data
      await dbService.updateInvoice(invoiceId, { status });
      
      return response.data.data;
    } catch (error) {
      // Store in outbox for retry
      await dbService.addToOutbox('invoices', 'update', {
        id: invoiceId,
        status,
        timestamp: Date.now()
      });
      
      throw error;
    }
  },
  
  async validateQRCode(token) {
    try {
      const response = await api.post('/qr/validate', { token });
      return response.data;
    } catch (error) {
      throw new Error('Invalid QR code');
    }
  }
};