import axios from 'axios';

const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:5000';

const aiApi = axios.create({
  baseURL: `${AI_SERVICE_URL}/api/v1`,
  timeout: 30000, // 30 seconds for AI predictions
  headers: {
    'Content-Type': 'application/json'
  }
});

// AI Service API
export const aiService = {
  // Predict stock depletion for single product
  predictStockDepletion: async (orgId, productId) => {
    try {
      const response = await aiApi.post('/predict/stock-depletion', {
        org_id: orgId,
        product_id: productId
      });
      return response.data;
    } catch (error) {
      console.error('Stock depletion prediction failed:', error);
      throw error;
    }
  },

  // Predict stock depletion for multiple products
  predictBulkDepletion: async (orgId, productIds = []) => {
    try {
      const response = await aiApi.post('/predict/bulk-depletion', {
        org_id: orgId,
        product_ids: productIds
      });
      return response.data;
    } catch (error) {
      console.error('Bulk depletion prediction failed:', error);
      throw error;
    }
  },

  // Get stock trends for dashboard
  getStockTrends: async (orgId) => {
    try {
      const response = await aiApi.post('/insights/stock-trends', {
        org_id: orgId
      });
      return response.data;
    } catch (error) {
      console.error('Stock trends fetch failed:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await aiApi.get('/health');
      return response.data;
    } catch (error) {
      console.error('AI service health check failed:', error);
      throw error;
    }
  },

  // Pricing optimization
  optimizePricing: async (orgId, productId, includeCompetitors = true) => {
    try {
      const response = await aiApi.post('/pricing/optimize', {
        org_id: orgId,
        product_id: productId,
        include_competitors: includeCompetitors
      });
      return response.data;
    } catch (error) {
      console.error('Pricing optimization failed:', error);
      throw error;
    }
  },

  // Bulk pricing optimization
  bulkOptimizePricing: async (orgId, productIds = []) => {
    try {
      const response = await aiApi.post('/pricing/bulk-optimize', {
        org_id: orgId,
        product_ids: productIds
      });
      return response.data;
    } catch (error) {
      console.error('Bulk pricing optimization failed:', error);
      throw error;
    }
  },

  // Get competitor prices
  getCompetitorPrices: async (productName, productSku = null) => {
    try {
      const response = await aiApi.post('/pricing/competitor-prices', {
        product_name: productName,
        product_sku: productSku
      });
      return response.data;
    } catch (error) {
      console.error('Competitor price fetch failed:', error);
      throw error;
    }
  },

  // Calculate demand elasticity
  calculateElasticity: async (orgId, productId) => {
    try {
      const response = await aiApi.post('/pricing/elasticity', {
        org_id: orgId,
        product_id: productId
      });
      return response.data;
    } catch (error) {
      console.error('Elasticity calculation failed:', error);
      throw error;
    }
  }
};

export default aiService;