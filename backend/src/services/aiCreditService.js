const axios = require('axios');

class AICreditService {
  static async predictCreditRisk(customerData) {
    const FallbackService = require('./fallbackService');
    
    const apiCall = async () => {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';
      
      const response = await axios.post(`${aiServiceUrl}/predict-credit-risk`, {
        avgPaymentDelay: customerData.avgPaymentDelay || 0,
        creditLimitUsage: customerData.creditLimitUsage || 0,
        overdueRatio: customerData.overdueRatio || 0,
        transactionVolume: customerData.transactionVolume || 0
      }, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data.data;
    };

    try {
      const result = await FallbackService.getData(apiCall, 'credit-risk-model.json');
      
      if (result.source === 'fallback') {
        return {
          creditRiskScore: this.calculateFallbackScore(customerData),
          riskLevel: 'Moderate',
          fallback: true
        };
      }
      
      return result.data;
    } catch (error) {
      console.error('AI Credit Service Error:', error.message);
      return {
        creditRiskScore: 50,
        riskLevel: 'Moderate',
        fallback: true
      };
    }
  }

  static calculateFallbackScore(data) {
    // Simple fallback calculation
    const delay = data.avgPaymentDelay || 0;
    const usage = data.creditLimitUsage || 0;
    const overdue = data.overdueRatio || 0;
    
    return Math.min(100, Math.max(0, 
      (delay * 2) + (usage * 50) + (overdue * 100)
    ));
  }

  static async getCustomerCreditMetrics(orgId, customerId) {
    try {
      const CreditLedger = require('../models/creditLedger');
      
      const credits = await CreditLedger.find({ 
        orgId, 
        customerId 
      }).sort({ createdAt: -1 });

      if (credits.length === 0) {
        return {
          avgPaymentDelay: 0,
          creditLimitUsage: 0,
          overdueRatio: 0,
          transactionVolume: 0
        };
      }

      const totalCredits = credits.length;
      const overdueCount = credits.filter(c => c.status === 'overdue').length;
      const totalAmount = credits.reduce((sum, c) => sum + c.totalAmount, 0);
      
      // Calculate average payment delay
      const paidCredits = credits.filter(c => c.paymentHistory.length > 0);
      const avgDelay = paidCredits.length > 0 
        ? paidCredits.reduce((sum, c) => {
            const lastPayment = c.paymentHistory[c.paymentHistory.length - 1];
            const delay = Math.max(0, 
              (new Date(lastPayment.paymentDate) - new Date(c.dueDate)) / (1000 * 60 * 60 * 24)
            );
            return sum + delay;
          }, 0) / paidCredits.length
        : 0;

      return {
        avgPaymentDelay: Math.round(avgDelay),
        creditLimitUsage: Math.min(1, totalAmount / 100000), // Assume 1L credit limit
        overdueRatio: overdueCount / totalCredits,
        transactionVolume: totalAmount
      };
    } catch (error) {
      console.error('Error calculating credit metrics:', error);
      return {
        avgPaymentDelay: 0,
        creditLimitUsage: 0,
        overdueRatio: 0,
        transactionVolume: 0
      };
    }
  }
}

module.exports = AICreditService;