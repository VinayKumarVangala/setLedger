import { api } from './api';
import { dbService } from './db';

export const stockReservationService = {
  async reserveStock(productId, quantity, holdMinutes = 30, reference = null) {
    try {
      const response = await api.post('/stock/reserve', {
        productId,
        quantity,
        holdMinutes,
        reference
      });
      
      // Store reservation locally
      await dbService.addReservation(response.data.data);
      
      return response.data.data;
    } catch (error) {
      // Store in outbox for retry
      await dbService.addToOutbox({
        type: 'STOCK_RESERVATION',
        data: { productId, quantity, holdMinutes, reference },
        timestamp: Date.now()
      });
      
      throw error;
    }
  },
  
  async confirmSale(reservationId, actualQuantity = null) {
    try {
      const response = await api.post(`/stock/confirm-sale/${reservationId}`, {
        actualQuantity
      });
      
      // Update local reservation status
      await dbService.updateReservation(reservationId, { status: 'fulfilled' });
      
      return response.data.data;
    } catch (error) {
      await dbService.addToOutbox({
        type: 'SALE_CONFIRMATION',
        data: { reservationId, actualQuantity },
        timestamp: Date.now()
      });
      
      throw error;
    }
  },
  
  async releaseReservation(reservationId) {
    try {
      const response = await api.delete(`/stock/reservation/${reservationId}`);
      
      // Update local reservation status
      await dbService.updateReservation(reservationId, { status: 'cancelled' });
      
      return response.data.data;
    } catch (error) {
      await dbService.addToOutbox({
        type: 'RELEASE_RESERVATION',
        data: { reservationId },
        timestamp: Date.now()
      });
      
      throw error;
    }
  },
  
  async getAvailableStock(productId) {
    try {
      const response = await api.get(`/stock/available/${productId}`);
      return response.data.data.availableStock;
    } catch (error) {
      // Fallback to local calculation
      const product = await dbService.getProduct(productId);
      const reservations = await dbService.getActiveReservations(productId);
      const reservedQuantity = reservations.reduce((sum, r) => sum + r.quantity, 0);
      
      return Math.max(0, (product?.stock || 0) - reservedQuantity);
    }
  },
  
  async getReservations(filters = {}) {
    try {
      const response = await api.get('/stock/reservations', { params: filters });
      return response.data.data;
    } catch (error) {
      // Fallback to local data
      return await dbService.getReservations(filters);
    }
  },
  
  async cleanupExpiredReservations() {
    const now = new Date();
    const expired = await dbService.getExpiredReservations(now);
    
    for (const reservation of expired) {
      await dbService.updateReservation(reservation.id, { status: 'expired' });
    }
    
    return expired.length;
  }
};