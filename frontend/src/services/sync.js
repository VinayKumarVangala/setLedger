import offlineDataService from './db';

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncWhenOnline();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async syncWhenOnline() {
    if (!this.isOnline || this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      await this.syncPendingOperations();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncPendingOperations() {
    const pendingItems = await offlineDataService.outbox.getPendingItems();
    
    // Process items sequentially with background sync fallback
    for (const item of pendingItems) {
      if (this.isOnline) {
        const success = await this.syncWithBackoff(item);
        if (!success) {
          // Queue for background sync
          await this.queueForBackgroundSync(item);
        }
      } else {
        // Queue for background sync when offline
        await this.queueForBackgroundSync(item);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async queueForBackgroundSync(item) {
    try {
      const endpoint = this.getEndpoint(item.table, item.operation, item.data);
      
      await this.queueRequest(endpoint.url, {
        method: endpoint.method,
        operationId: item.operationId,
        body: item.data
      });
      
      await this.registerBackgroundSync();
    } catch (error) {
      console.error('Failed to queue for background sync:', error);
    }
  }

  async syncItem(item) {
    const { table, operation, data, operationId } = item;
    const endpoint = this.getEndpoint(table, operation, data);
    
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAccessToken()}`,
        'X-Operation-Id': operationId,
        'X-Idempotency-Key': operationId
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const responseData = await response.json();

    if (response.ok) {
      const tableName = table.replace('outbox', '').toLowerCase();
      await offlineDataService.outbox.markAsSynced(tableName, item.id);
      await offlineDataService.updateSyncStatus(tableName);
    } else if (response.status === 409) {
      // Conflict detected
      const error = new Error('Conflict detected');
      error.status = 409;
      error.data = responseData;
      throw error;
    } else {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  getEndpoint(table, operation, data) {
    const baseUrl = '/api/v1';
    const tableMap = {
      outboxProducts: 'products',
      outboxInvoices: 'invoices',
      outboxStockMoves: 'stock-moves',
      outboxReservations: 'reservations',
      outboxJournalEntries: 'journal-entries'
    };
    
    const resource = tableMap[table];
    
    switch (operation) {
      case 'create':
        return { url: `${baseUrl}/${resource}`, method: 'POST' };
      case 'update':
        return { url: `${baseUrl}/${resource}/${data.id}`, method: 'PUT' };
      case 'delete':
        return { url: `${baseUrl}/${resource}/${data.id}`, method: 'DELETE' };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  async handleConflict(item, conflictData) {
    const { db } = await import('./db');
    
    await db.conflicts.add({
      operationId: item.operationId,
      table: item.table,
      localData: item.data,
      serverData: conflictData.serverData,
      status: 'pending',
      createdAt: new Date()
    });
    
    // Mark outbox item as conflicted
    const tableName = item.table.replace('outbox', '').toLowerCase();
    const outboxTable = `outbox${item.table.replace('outbox', '')}`;
    await db[outboxTable].update(item.id, { status: 'conflict' });
  }

  async handleSyncError(item, error) {
    const { db } = await import('./db');
    const outboxTable = `outbox${item.table.replace('outbox', '')}`;
    
    const retryCount = (item.retryCount || 0) + 1;
    const maxRetries = 3;
    
    if (retryCount >= maxRetries) {
      await db[outboxTable].update(item.id, { 
        status: 'failed', 
        retryCount 
      });
    } else {
      await db[outboxTable].update(item.id, { retryCount });
    }
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  async getSyncStatus() {
    return await offlineDataService.getSyncStatus();
  }

  // Manual sync trigger
  async forcSync() {
    if (this.isOnline) {
      await this.syncWhenOnline();
    }
  }

  async getConflicts() {
    const { db } = await import('./db');
    return await db.conflicts.where('status').equals('pending').toArray();
  }

  async resolveConflict(conflictId, resolution, resolvedData) {
    const { db } = await import('./db');
    
    await db.conflicts.update(conflictId, {
      status: 'resolved',
      resolution, // 'use_local', 'use_server', 'merge'
      resolvedData,
      resolvedAt: new Date()
    });
    
    // Update local data based on resolution
    if (resolution === 'use_server' || resolution === 'merge') {
      await this.applyResolvedData(resolvedData);
    }
  }

  async applyResolvedData(data) {
    const { db } = await import('./db');
    const { table, resolvedData } = data;
    
    if (table === 'products') {
      await db.products.put(resolvedData);
    } else if (table === 'invoices') {
      await db.invoices.put(resolvedData);
    }
  }

  // Background sync using Service Worker with Workbox
  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('setledger-background-sync');
    }
  }

  // Queue request for background sync
  async queueRequest(url, options) {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      // Add to background sync queue
      const request = new Request(url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Operation-Id': options.operationId,
          'X-Idempotency-Key': options.operationId,
          'X-Retry-Count': '0',
          ...options.headers
        },
        body: JSON.stringify(options.body)
      });

      // Use Workbox background sync
      if (registration.sync) {
        await registration.sync.register('setledger-background-sync');
      }
      
      return request;
    }
  }

  // Enhanced sync with exponential backoff
  async syncWithBackoff(item, retryCount = 0) {
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second
    
    if (retryCount >= maxRetries) {
      console.error('Max retries exceeded for:', item.operationId);
      return false;
    }

    try {
      await this.syncItem(item);
      return true;
    } catch (error) {
      if (error.status === 409) {
        await this.handleConflict(item, error.data);
        return false;
      }

      // Exponential backoff: 2^retryCount * baseDelay (max 5 minutes)
      const delay = Math.min(Math.pow(2, retryCount) * baseDelay, 300000);
      
      console.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      setTimeout(async () => {
        await this.syncWithBackoff(item, retryCount + 1);
      }, delay);
      
      return false;
    }
  }
}

export default new SyncService();