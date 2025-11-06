import { api } from './api';
import { dbService } from './db';

export const stockLedgerService = {
  async recordStockMove(productId, moveType, quantity, reference, description) {
    try {
      const response = await api.post('/stock/move', {
        productId,
        moveType,
        quantity,
        reference,
        description
      });
      
      // Store locally for offline access
      await dbService.createStockMove({
        ...response.data.data.stockMove,
        orgId: response.data.data.stockMove.organizationId
      });
      
      return response.data.data;
    } catch (error) {
      // Store in outbox for retry
      await dbService.addToOutbox('stockMoves', 'create', {
        productId,
        moveType,
        quantity,
        reference,
        description,
        timestamp: Date.now()
      });
      
      throw error;
    }
  },
  
  async getStockLedger(productId = null, filters = {}) {
    try {
      const response = await api.get('/stock/ledger', {
        params: { productId, ...filters }
      });
      return response.data.data;
    } catch (error) {
      // Fallback to local data
      const orgId = localStorage.getItem('orgId');
      return await dbService.getStockMoves(orgId);
    }
  },
  
  async reconcileStock(productId) {
    try {
      const response = await api.get(`/stock/reconcile/${productId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to reconcile stock:', error);
      throw error;
    }
  },
  
  async getStockSummary(asOfDate = null) {
    try {
      const response = await api.get('/stock/summary', {
        params: asOfDate ? { asOfDate } : {}
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to get stock summary:', error);
      throw error;
    }
  },
  
  async adjustStock(productId, newStock, reason) {
    try {
      const response = await api.post('/stock/adjust', {
        productId,
        newStock,
        reason
      });
      
      return response.data.data;
    } catch (error) {
      // Store in outbox for retry
      await dbService.addToOutbox('stockMoves', 'create', {
        productId,
        moveType: 'adjustment',
        quantity: newStock,
        description: `Stock adjustment: ${reason}`,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
};