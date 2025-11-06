const cron = require('node-cron');
const FinancialSummaryService = require('../services/financial-summary');

class ViewRefreshJob {
  static startScheduler() {
    // Refresh materialized views every hour
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('🔄 Refreshing materialized views...');
        await FinancialSummaryService.refreshViews();
        console.log('✅ Materialized views refreshed successfully');
      } catch (error) {
        console.error('❌ Error refreshing materialized views:', error);
      }
    });

    // Refresh views at midnight daily
    cron.schedule('0 0 * * *', async () => {
      try {
        console.log('🌙 Daily materialized view refresh...');
        await FinancialSummaryService.refreshViews();
        console.log('✅ Daily refresh completed');
      } catch (error) {
        console.error('❌ Error in daily refresh:', error);
      }
    });

    console.log('📅 View refresh scheduler started');
  }
}

module.exports = ViewRefreshJob;