import { api } from './api';
import { dbService } from './db';

export const conflictResolutionService = {
  async detectLocalConflicts(serverData) {
    const conflicts = [];
    
    try {
      // Get local data
      const localProducts = await dbService.getProducts();
      
      for (const localProduct of localProducts) {
        const serverProduct = serverData.find(p => p.id === localProduct.id);
        
        if (serverProduct) {
          // Check for version conflicts
          if (serverProduct.version > localProduct.version) {
            // Check for stock oversell
            if (localProduct.stock !== serverProduct.stock) {
              const stockDiff = Math.abs(localProduct.stock - serverProduct.stock);
              
              conflicts.push({
                type: 'STOCK_CONFLICT',
                entityType: 'PRODUCT',
                entityId: localProduct.id,
                localData: localProduct,
                serverData: serverProduct,
                severity: this.calculateSeverity(stockDiff),
                description: `Stock mismatch: Local ${localProduct.stock}, Server ${serverProduct.stock}`
              });
            }
          }
        }
      }
      
      return conflicts;
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
      return [];
    }
  },
  
  calculateSeverity(stockDiff) {
    if (stockDiff > 100) return 'CRITICAL';
    if (stockDiff > 50) return 'HIGH';
    if (stockDiff > 10) return 'MEDIUM';
    return 'LOW';
  },
  
  async getConflicts(filters = {}) {
    try {
      const response = await api.get('/conflicts', { params: filters });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch conflicts:', error);
      return [];
    }
  },
  
  async resolveConflict(conflictId, resolution) {
    try {
      const response = await api.post(`/conflicts/${conflictId}/resolve`, resolution);
      
      // Update local data based on resolution
      if (resolution.action === 'USE_SERVER' && response.data.data.resolvedData) {
        const { resolvedData } = response.data.data;
        await dbService.updateProduct(resolvedData.id, resolvedData);
      }
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },
  
  async autoResolveConflicts() {
    try {
      const response = await api.post('/conflicts/auto-resolve');
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },
  
  async syncWithConflictDetection() {
    try {
      // Get server data
      const serverResponse = await api.get('/products');
      const serverData = serverResponse.data.data;
      
      // Detect conflicts
      const conflicts = await this.detectLocalConflicts(serverData);
      
      if (conflicts.length > 0) {
        // Store conflicts locally for offline access
        for (const conflict of conflicts) {
          await dbService.addConflict(conflict);
        }
        
        // Notify user about conflicts
        window.dispatchEvent(new CustomEvent('conflicts-detected', {
          detail: { count: conflicts.length, conflicts }
        }));
        
        return { hasConflicts: true, conflicts };
      }
      
      // No conflicts, proceed with normal sync
      for (const serverItem of serverData) {
        await dbService.updateProduct(serverItem.id, serverItem);
      }
      
      return { hasConflicts: false, synced: serverData.length };
    } catch (error) {
      console.error('Sync with conflict detection failed:', error);
      throw error;
    }
  }
};