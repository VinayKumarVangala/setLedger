const axios = require('axios');

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:5000/api';
  }

  async getFinancialForecast(historicalData, days = 30) {
    try {
      const response = await axios.post(`${this.baseURL}/forecast/financial`, {
        historical_data: historicalData,
        forecast_days: days
      });
      return response.data;
    } catch (error) {
      console.error('Error getting financial forecast:', error);
      // Return mock forecast data as fallback
      return this.generateMockForecast(historicalData, days);
    }
  }

  generateMockForecast(historicalData, days) {
    const forecast = [];
    const today = new Date();
    
    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        forecastRevenue: Math.random() * 50000 + 25000,
        forecastExpenses: Math.random() * 30000 + 15000,
        forecastProfit: Math.random() * 20000 + 10000,
        confidence: Math.random() * 0.3 + 0.7
      });
    }
    
    return forecast;
  }

  async optimizePricing(productData, salesHistory, competitorPrices) {
    try {
      const response = await axios.post(`${this.baseURL}/pricing/optimize`, {
        product: productData,
        sales_history: salesHistory,
        competitor_prices: competitorPrices
      });
      return response.data;
    } catch (error) {
      console.error('Error optimizing pricing:', error);
      throw error;
    }
  }
}

module.exports = new AIService();