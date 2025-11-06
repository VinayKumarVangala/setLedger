const CreditLedger = require('../models/creditLedger');

class CreditInsights {
  static async analyzeCustomerBehavior(orgId, customerId) {
    const credits = await CreditLedger.find({ orgId, customerId }).sort({ createdAt: -1 });
    
    if (credits.length === 0) {
      return {
        category: 'Moderate',
        score: 50,
        metrics: {
          totalTransactions: 0,
          avgPaymentDelay: 0,
          overdueRate: 0,
          totalAmount: 0,
          paymentReliability: 0
        }
      };
    }

    const metrics = this.calculateMetrics(credits);
    const score = this.calculateBehaviorScore(metrics);
    const category = this.categorizeCustomer(score);

    return { category, score, metrics };
  }

  static calculateMetrics(credits) {
    const totalTransactions = credits.length;
    const totalAmount = credits.reduce((sum, c) => sum + c.totalAmount, 0);
    const overdueCount = credits.filter(c => c.status === 'overdue').length;
    
    // Calculate payment delays
    const paidCredits = credits.filter(c => c.paymentHistory.length > 0);
    const delays = paidCredits.map(c => {
      const lastPayment = c.paymentHistory[c.paymentHistory.length - 1];
      const delayDays = Math.max(0, 
        (new Date(lastPayment.paymentDate) - new Date(c.dueDate)) / (1000 * 60 * 60 * 24)
      );
      return delayDays;
    });
    
    const avgPaymentDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;
    const overdueRate = overdueCount / totalTransactions;
    const paymentReliability = paidCredits.length / totalTransactions;

    return {
      totalTransactions,
      avgPaymentDelay: Math.round(avgPaymentDelay),
      overdueRate: Math.round(overdueRate * 100) / 100,
      totalAmount,
      paymentReliability: Math.round(paymentReliability * 100) / 100
    };
  }

  static calculateBehaviorScore(metrics) {
    let score = 100;
    
    // Deduct for payment delays
    score -= Math.min(30, metrics.avgPaymentDelay * 2);
    
    // Deduct for overdue rate
    score -= metrics.overdueRate * 40;
    
    // Add for payment reliability
    score += (metrics.paymentReliability - 0.5) * 20;
    
    // Bonus for high transaction volume
    if (metrics.totalAmount > 500000) score += 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  static categorizeCustomer(score) {
    if (score >= 75) return 'Reliable';
    if (score >= 50) return 'Moderate';
    return 'Risky';
  }
}

module.exports = CreditInsights;