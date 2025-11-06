const { StockReservationService } = require('../services/stock-reservation');

class ReservationCleanupJob {
  static async run() {
    try {
      console.log('Starting reservation cleanup job...');
      
      const expiredCount = await StockReservationService.cleanupExpiredReservations();
      
      console.log(`Cleaned up ${expiredCount} expired reservations`);
      
      return { success: true, expiredCount };
    } catch (error) {
      console.error('Reservation cleanup job failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  static startScheduler() {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.run();
    }, 5 * 60 * 1000);
    
    console.log('Reservation cleanup scheduler started (5-minute intervals)');
  }
}

module.exports = { ReservationCleanupJob };