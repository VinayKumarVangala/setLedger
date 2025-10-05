import apiClient from './apiClient';

class AnalyticsService {
  async getFinancialData(orgId, memberId, params = {}) {
    try {
      const response = await apiClient.get(`/analytics/financial/${orgId}/${memberId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching financial data:', error);
      throw error;
    }
  }

  async getRevenueData(orgId, memberId, period = '30d') {
    try {
      const response = await apiClient.get(`/analytics/revenue/${orgId}/${memberId}`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }
  }

  async getExpenseData(orgId, memberId, period = '30d') {
    try {
      const response = await apiClient.get(`/analytics/expenses/${orgId}/${memberId}`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching expense data:', error);
      throw error;
    }
  }

  async getProfitData(orgId, memberId, period = '30d') {
    try {
      const response = await apiClient.get(`/analytics/profit/${orgId}/${memberId}`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching profit data:', error);
      throw error;
    }
  }

  async getForecastData(orgId, memberId, type = 'all', days = 30) {
    try {
      const response = await apiClient.get(`/analytics/forecast/${orgId}/${memberId}`, {
        params: { type, days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      throw error;
    }
  }

  async getExpenseCategories(orgId, memberId, period = '30d') {
    try {
      const response = await apiClient.get(`/analytics/expense-categories/${orgId}/${memberId}`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      throw error;
    }
  }

  async getProfitTargets(orgId, memberId) {
    try {
      const response = await apiClient.get(`/analytics/profit-targets/${orgId}/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching profit targets:', error);
      throw error;
    }
  }

  async setProfitTarget(orgId, memberId, targetData) {
    try {
      const response = await apiClient.post(`/analytics/profit-targets/${orgId}/${memberId}`, targetData);
      return response.data;
    } catch (error) {
      console.error('Error setting profit target:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();