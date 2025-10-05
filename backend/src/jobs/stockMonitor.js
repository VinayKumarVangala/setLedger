const cron = require('node-cron');
const { Organization } = require('../models');
const stockService = require('../services/stockService');

class StockMonitor {
  constructor() {
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    
    console.log('Starting stock monitoring job...');
    
    // Run every hour
    cron.schedule('0 * * * *', async () => {
      await this.checkAllOrganizations();
    });
    
    this.isRunning = true;
  }

  async checkAllOrganizations() {
    try {
      const organizations = await Organization.find({ isActive: true });
      
      for (const org of organizations) {
        try {
          const alertCount = await stockService.checkLowStockAlerts(org.orgID);
          if (alertCount > 0) {
            console.log(`Sent ${alertCount} low stock alerts for org: ${org.name}`);
          }
        } catch (error) {
          console.error(`Error checking stock for org ${org.orgID}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in stock monitoring job:', error);
    }
  }
}

module.exports = new StockMonitor();