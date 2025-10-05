import axios from 'axios';
import envConfig from '../config/env';
import { errorHandler } from './errorHandler';

// Create axios instance
const api = axios.create({
  baseURL: envConfig.api.baseUrl,
  timeout: envConfig.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(envConfig.auth.jwtStorageKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => {
    // Update fallback data on successful responses
    if (response.data?.success && response.data?.data) {
      const endpoint = response.config.url.split('/').pop();
      errorHandler.updateFallbackData(endpoint, response.data.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem(envConfig.auth.refreshTokenKey);
      if (refreshToken) {
        try {
          const response = await axios.post(`${envConfig.api.baseUrl}/auth/refresh`, {
            refreshToken
          });
          
          const { accessToken } = response.data.data.tokens;
          localStorage.setItem(envConfig.auth.jwtStorageKey, accessToken);
          
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem(envConfig.auth.jwtStorageKey);
          localStorage.removeItem(envConfig.auth.refreshTokenKey);
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  setupTOTP: () => api.post('/auth/totp/setup'),
  verifyTOTP: (totpCode) => api.post('/auth/totp/verify', { totpCode }),
  sendEmailOTP: (email) => api.post('/auth/email-otp/send', { email }),
  verifyEmailOTP: (email, otp) => api.post('/auth/email-otp/verify', { email, otp })
};

// User service
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getPermissions: () => api.get('/users/permissions'),
  getTeamMembers: (params) => api.get('/users/team', { params }),
  createTeamMember: (data) => api.post('/users/team', data),
  updateTeamMember: (userID, data) => api.put(`/users/team/${userID}`, data)
};

// Organization service
export const organizationService = {
  getOrganization: () => api.get('/organization'),
  updateOrganization: (data) => api.put('/organization', data),
  inviteMember: (data) => api.post('/organization/invite', data),
  getPendingInvitations: () => api.get('/organization/invitations'),
  cancelInvitation: (invitationId) => api.delete(`/organization/invitations/${invitationId}`),
  acceptInvitation: (data) => api.post('/organization/accept-invitation', data)
};

// Enhanced product service with error handling
export const productService = {
  getProducts: async (params) => {
    try {
      const response = await api.get('/products', { params });
      return response;
    } catch (error) {
      return errorHandler.handleApiError(error, 'products');
    }
  },
  getProduct: async (productId) => {
    try {
      return await api.get(`/products/${productId}`);
    } catch (error) {
      return errorHandler.handleApiError(error);
    }
  },
  createProduct: async (data) => {
    try {
      const response = await api.post('/products', data);
      errorHandler.showSuccess('Product created successfully');
      return response;
    } catch (error) {
      return errorHandler.handleApiError(error);
    }
  },
  updateProduct: async (productId, data) => {
    try {
      const response = await api.put(`/products/${productId}`, data);
      errorHandler.showSuccess('Product updated successfully');
      return response;
    } catch (error) {
      return errorHandler.handleApiError(error);
    }
  },
  deleteProduct: async (productId) => {
    try {
      const response = await api.delete(`/products/${productId}`);
      errorHandler.showSuccess('Product deleted successfully');
      return response;
    } catch (error) {
      return errorHandler.handleApiError(error);
    }
  },
  generateQR: (productId, params) => api.get(`/products/${productId}/qr`, { params }),
  bulkQRExport: (data) => api.post('/products/bulk-qr', data),
  getCategories: () => api.get('/products/categories')
};

// Enhanced invoice service with error handling
export const invoiceService = {
  getInvoices: async (params) => {
    try {
      return await api.get('/invoices', { params });
    } catch (error) {
      return errorHandler.handleApiError(error, 'invoices');
    }
  },
  getInvoice: async (invoiceId) => {
    try {
      return await api.get(`/invoices/${invoiceId}`);
    } catch (error) {
      return errorHandler.handleApiError(error);
    }
  },
  createInvoice: async (data) => {
    try {
      const response = await api.post('/invoices', data);
      errorHandler.showSuccess('Invoice created successfully');
      return response;
    } catch (error) {
      return errorHandler.handleApiError(error);
    }
  },
  updateInvoice: (invoiceId, data) => api.put(`/invoices/${invoiceId}`, data),
  generatePDF: (invoiceId) => api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' }),
  updatePayment: (invoiceId, data) => api.patch(`/invoices/${invoiceId}/payment`, data)
};

// Stock service
export const stockService = {
  getMovements: (params) => api.get('/stock/movements', { params }),
  adjustStock: (productId, data) => api.post(`/stock/adjust/${productId}`, data),
  addStock: (productId, data) => api.post(`/stock/add/${productId}`, data),
  getLowStock: () => api.get('/stock/low-stock'),
  registerFCMToken: (token) => api.post('/stock/fcm-token', { token }),
  checkLowStock: () => api.post('/stock/check-low-stock')
};

// Accounting service
export const accountingService = {
  getAccounts: () => api.get('/accounting/accounts'),
  createAccount: (data) => api.post('/accounting/accounts', data),
  getJournalEntries: (params) => api.get('/accounting/journal-entries', { params }),
  createJournalEntry: (data) => api.post('/accounting/journal-entries', data),
  getLedger: (params) => api.get('/accounting/ledger', { params }),
  getTrialBalance: (params) => api.get('/accounting/trial-balance', { params }),
  importCSV: (formData) => api.post('/accounting/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Backup service
export const backupService = {
  createBackup: () => api.post('/backup/create'),
  listBackups: () => api.get('/backup/list'),
  restoreBackup: (data) => api.post('/backup/restore', data),
  getStatus: () => api.get('/backup/status'),
  triggerBackup: () => api.post('/backup/trigger')
};

// AI service (imported separately)
export { aiService } from './aiService';

export default api;