const cron = require('node-cron');
const CreditLedger = require('../models/creditLedger');
const CustomerProfile = require('../models/customerProfile');
const SystemLog = require('../models/systemLog');
const AICreditService = require('../services/aiCreditService');

class UpdateCreditLimitsJob {
  static async evaluateCustomerCredits() {
    try {
      console.log('🔍 Starting credit limit evaluation...');
      
      // Get all unique customers with credit records
      const customers = await CreditLedger.distinct('customerId');
      let updatedCount = 0;

      for (const customerId of customers) {
        const orgIds = await CreditLedger.distinct('orgId', { customerId });
        
        for (const orgId of orgIds) {
          try {
            await this.evaluateCustomer(orgId, customerId);
            updatedCount++;
          } catch (error) {
            console.error(`Error evaluating customer ${customerId}:`, error);
          }
        }
      }

      console.log(`✅ Credit evaluation completed. Updated ${updatedCount} customers.`);
    } catch (error) {
      console.error('❌ Error in credit evaluation job:', error);
    }
  }

  static async evaluateCustomer(orgId, customerId) {
    // Get customer metrics and AI prediction
    const metrics = await AICreditService.getCustomerCreditMetrics(orgId, customerId);
    const prediction = await AICreditService.predictCreditRisk(metrics);

    // Get or create customer profile
    let profile = await CustomerProfile.findOne({ orgId, customerId });
    if (!profile) {
      profile = new CustomerProfile({
        orgId,
        customerId,
        creditLimit: 100000,
        currentRiskLevel: 'Moderate'
      });
    }

    const oldLimit = profile.creditLimit;
    const oldRiskLevel = profile.currentRiskLevel;
    let newLimit = oldLimit;
    let reason = 'No change';

    // Adjust credit limit based on risk level
    if (prediction.riskLevel === 'High' && oldRiskLevel !== 'High') {
      newLimit = Math.round(oldLimit * 0.8); // Reduce by 20%
      reason = 'High risk detected - reduced limit by 20%';
    } else if (prediction.riskLevel === 'Low' && oldRiskLevel !== 'Low') {
      newLimit = Math.round(oldLimit * 1.1); // Increase by 10%
      reason = 'Low risk detected - increased limit by 10%';
    }

    // Update profile if limit changed
    if (newLimit !== oldLimit) {
      profile.creditLimit = newLimit;
      profile.currentRiskLevel = prediction.riskLevel;
      profile.lastRiskAssessment = new Date();
      
      profile.creditHistory.push({
        date: new Date(),
        oldLimit,
        newLimit,
        reason,
        riskLevel: prediction.riskLevel
      });

      await profile.save();

      // Log the change
      await SystemLog.create({
        orgId,
        action: 'CREDIT_LIMIT_UPDATE',
        entityType: 'CUSTOMER',
        entityId: customerId,
        details: {
          oldLimit,
          newLimit,
          oldRiskLevel,
          newRiskLevel: prediction.riskLevel,
          reason,
          creditRiskScore: prediction.creditRiskScore,
          metrics
        },
        userId: 'SYSTEM'
      });

      console.log(`📊 Updated ${customerId}: ${oldLimit} → ${newLimit} (${prediction.riskLevel})`);
    }
  }

  static startScheduler() {
    // Run weekly on Sundays at 2 AM
    cron.schedule('0 2 * * 0', async () => {
      console.log('📈 Running weekly credit limit evaluation...');
      await this.evaluateCustomerCredits();
    });

    console.log('📅 Credit limit evaluation scheduler started');
  }
}

module.exports = UpdateCreditLimitsJob;