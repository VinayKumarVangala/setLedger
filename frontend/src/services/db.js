import Dexie from 'dexie';

class SetLedgerDB extends Dexie {
  constructor() {
    super('SetLedgerDB');
    
    this.version(1).stores({
      // Core data tables
      products: '++id, displayId, orgId, name, sku, price, stock, metadata, createdAt',
      invoices: '++id, displayId, orgId, customerName, total, status, metadata, createdAt',
      invoiceLines: '++id, invoiceId, productId, quantity, price, total',
      stockMoves: '++id, displayId, orgId, productId, moveType, quantity, reference, createdAt',
      reservations: '++id, displayId, orgId, productId, quantity, status, reference, expiresAt, createdAt',
      journalEntries: '++id, displayId, orgId, accountName, accountType, debit, credit, reference, createdAt',
      
      // Outbox tables for offline sync
      outboxProducts: '++id, operationId, operation, data, status, createdAt, syncedAt, retryCount',
      outboxInvoices: '++id, operationId, operation, data, status, createdAt, syncedAt, retryCount',
      outboxStockMoves: '++id, operationId, operation, data, status, createdAt, syncedAt, retryCount',
      outboxReservations: '++id, operationId, operation, data, status, createdAt, syncedAt, retryCount',
      outboxJournalEntries: '++id, operationId, operation, data, status, createdAt, syncedAt, retryCount',
      
      // Conflict resolution
      conflicts: '++id, type, entityType, entityId, severity, status, createdAt, resolvedAt',
      
      // Sync metadata
      syncStatus: '++id, table, lastSync, status'
    });
  }
}

const db = new SetLedgerDB();

// Outbox service for offline operations
class OutboxService {
  async addToOutbox(table, operation, data) {
    const { v4: uuidv4 } = await import('uuid');
    const operationId = uuidv4();
    const outboxTable = `outbox${table.charAt(0).toUpperCase() + table.slice(1)}`;
    
    return await db[outboxTable].add({
      operationId,
      operation, // 'create', 'update', 'delete'
      data,
      status: 'pending',
      createdAt: new Date(),
      syncedAt: null,
      retryCount: 0
    });
  }

  async getPendingItems(table = null) {
    const outboxTables = table 
      ? [`outbox${table.charAt(0).toUpperCase() + table.slice(1)}`]
      : ['outboxProducts', 'outboxInvoices', 'outboxStockMoves', 'outboxReservations', 'outboxJournalEntries'];
    
    const pendingItems = [];
    for (const tableName of outboxTables) {
      const items = await db[tableName].where('status').equals('pending').toArray();
      pendingItems.push(...items.map(item => ({ ...item, table: tableName })));
    }
    
    return pendingItems.sort((a, b) => a.createdAt - b.createdAt);
  }

  async markAsSynced(table, id) {
    const outboxTable = `outbox${table.charAt(0).toUpperCase() + table.slice(1)}`;
    return await db[outboxTable].update(id, {
      status: 'synced',
      syncedAt: new Date()
    });
  }

  async clearSynced() {
    const outboxTables = ['outboxProducts', 'outboxInvoices', 'outboxStockMoves', 'outboxReservations', 'outboxJournalEntries'];
    
    for (const tableName of outboxTables) {
      await db[tableName].where('status').equals('synced').delete();
    }
  }
}

// Offline-first data service
class OfflineDataService {
  constructor() {
    this.outbox = new OutboxService();
  }

  // Products
  async createProduct(data) {
    const product = { ...data, createdAt: new Date() };
    const id = await db.products.add(product);
    await this.outbox.addToOutbox('products', 'create', { ...product, id });
    return { ...product, id };
  }

  async getProducts(orgId) {
    return await db.products.where('orgId').equals(orgId).toArray();
  }

  async updateProduct(id, data) {
    await db.products.update(id, { ...data, updatedAt: new Date() });
    await this.outbox.addToOutbox('products', 'update', { id, ...data });
  }

  // Invoices
  async createInvoice(data) {
    const invoice = { ...data, createdAt: new Date() };
    const invoiceId = await db.invoices.add(invoice);
    
    // Add invoice lines
    if (data.lines) {
      for (const line of data.lines) {
        await db.invoiceLines.add({ ...line, invoiceId });
      }
    }
    
    await this.outbox.addToOutbox('invoices', 'create', { ...invoice, id: invoiceId, lines: data.lines });
    return { ...invoice, id: invoiceId };
  }

  async getInvoices(orgId) {
    const invoices = await db.invoices.where('orgId').equals(orgId).toArray();
    
    // Attach lines to each invoice
    for (const invoice of invoices) {
      invoice.lines = await db.invoiceLines.where('invoiceId').equals(invoice.id).toArray();
    }
    
    return invoices;
  }

  // Stock moves
  async createStockMove(data) {
    const stockMove = { ...data, createdAt: new Date() };
    const id = await db.stockMoves.add(stockMove);
    await this.outbox.addToOutbox('stockMoves', 'create', { ...stockMove, id });
    return { ...stockMove, id };
  }

  async getStockMoves(orgId) {
    return await db.stockMoves.where('orgId').equals(orgId).reverse().toArray();
  }

  // Reservations
  async createReservation(data) {
    const reservation = { ...data, createdAt: new Date() };
    const id = await db.reservations.add(reservation);
    await this.outbox.addToOutbox('reservations', 'create', { ...reservation, id });
    return { ...reservation, id };
  }

  async getReservations(orgId, filters = {}) {
    let query = db.reservations.where('orgId').equals(orgId);
    
    if (filters.status) {
      query = query.and(r => r.status === filters.status);
    }
    if (filters.productId) {
      query = query.and(r => r.productId === filters.productId);
    }
    
    return await query.toArray();
  }
  
  async updateReservation(id, updates) {
    await db.reservations.update(id, { ...updates, updatedAt: new Date() });
    await this.outbox.addToOutbox('reservations', 'update', { id, ...updates });
  }
  
  async getActiveReservations(productId) {
    const now = new Date();
    return await db.reservations
      .where('productId').equals(productId)
      .and(r => r.status === 'active' && new Date(r.expiresAt) > now)
      .toArray();
  }
  
  async getExpiredReservations(now) {
    return await db.reservations
      .where('status').equals('active')
      .and(r => new Date(r.expiresAt) <= now)
      .toArray();
  }
  
  async getProduct(productId) {
    return await db.products.get(productId);
  }
  
  // Conflict management
  async addConflict(conflict) {
    return await db.conflicts.add({
      ...conflict,
      id: conflict.id || `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      status: 'pending'
    });
  }
  
  async getConflicts(filters = {}) {
    let query = db.conflicts.orderBy('createdAt').reverse();
    
    if (filters.status) {
      query = query.filter(c => c.status === filters.status);
    }
    if (filters.severity) {
      query = query.filter(c => c.severity === filters.severity);
    }
    
    return await query.toArray();
  }
  
  async resolveConflict(conflictId, resolution) {
    return await db.conflicts.update(conflictId, {
      status: 'resolved',
      resolution: JSON.stringify(resolution),
      resolvedAt: new Date()
    });
  }
  
  // Invoice lines
  async createInvoiceLine(line) {
    return await db.invoiceLines.add({
      ...line,
      createdAt: new Date()
    });
  }
  
  // Outbox management
  async addToOutbox(type, operation, data) {
    return await this.outbox.addToOutbox(type, operation, data);
  }
  
  async getPendingOutboxItems(type = null) {
    return await this.outbox.getPendingItems(type);
  }
  
  async markOutboxItemSynced(id) {
    const outboxTables = ['outboxProducts', 'outboxInvoices', 'outboxStockMoves', 'outboxReservations', 'outboxJournalEntries'];
    
    for (const tableName of outboxTables) {
      try {
        await db[tableName].update(id, {
          status: 'synced',
          syncedAt: new Date()
        });
        return true;
      } catch (error) {
        // Continue to next table
      }
    }
    return false;
  }

  // Journal entries
  async createJournalEntry(data) {
    const entry = { ...data, createdAt: new Date() };
    const id = await db.journalEntries.add(entry);
    await this.outbox.addToOutbox('journalEntries', 'create', { ...entry, id });
    return { ...entry, id };
  }

  async getJournalEntries(orgId) {
    return await db.journalEntries.where('orgId').equals(orgId).reverse().toArray();
  }

  // Sync operations
  async syncWithServer(apiCall) {
    const pendingItems = await this.outbox.getPendingItems();
    
    for (const item of pendingItems) {
      try {
        const response = await apiCall(item);
        if (response.success) {
          await this.outbox.markAsSynced(item.table.replace('outbox', '').toLowerCase(), item.id);
        }
      } catch (error) {
        console.error('Sync failed for item:', item, error);
      }
    }
    
    // Clean up synced items
    await this.outbox.clearSynced();
  }

  async getSyncStatus() {
    const pendingCount = (await this.outbox.getPendingItems()).length;
    return {
      hasPendingItems: pendingCount > 0,
      pendingCount,
      lastSync: await this.getLastSyncTime()
    };
  }

  async getLastSyncTime() {
    const syncRecord = await db.syncStatus.orderBy('lastSync').reverse().first();
    return syncRecord?.lastSync || null;
  }

  async updateSyncStatus(table) {
    await db.syncStatus.put({
      table,
      lastSync: new Date(),
      status: 'completed'
    });
  }
}

export { db, OfflineDataService, OutboxService };
export default new OfflineDataService();