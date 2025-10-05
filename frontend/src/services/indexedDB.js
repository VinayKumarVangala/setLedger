import Dexie from 'dexie';

class POSDatabase extends Dexie {
  constructor() {
    super('POSDatabase');
    
    this.version(1).stores({
      products: '++id, productID, name, sku, price, stock, lastSync',
      sales: '++id, saleID, items, total, customer, timestamp, synced',
      customers: '++id, customerID, name, phone, email, lastSync',
      syncQueue: '++id, type, data, timestamp, retries'
    });
  }
}

const db = new POSDatabase();

export const indexedDBService = {
  // Products
  async saveProducts(products) {
    await db.products.clear();
    await db.products.bulkAdd(products.map(p => ({
      productID: p.productID,
      name: p.name,
      sku: p.sku,
      price: p.pricing.sellingPrice,
      stock: p.inventory.currentStock,
      taxRate: p.tax.gstRate,
      lastSync: new Date()
    })));
  },

  async getProducts() {
    return await db.products.toArray();
  },

  async getProductBySKU(sku) {
    return await db.products.where('sku').equals(sku).first();
  },

  // Sales
  async saveSale(sale) {
    const saleData = {
      saleID: `OFFLINE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      items: sale.items,
      total: sale.total,
      customer: sale.customer,
      timestamp: new Date(),
      synced: false
    };
    
    await db.sales.add(saleData);
    
    // Add to sync queue
    await this.addToSyncQueue('sale', saleData);
    
    return saleData;
  },

  async getSales() {
    return await db.sales.orderBy('timestamp').reverse().toArray();
  },

  async getUnsyncedSales() {
    return await db.sales.where('synced').equals(false).toArray();
  },

  async markSaleSynced(saleID) {
    await db.sales.where('saleID').equals(saleID).modify({ synced: true });
  },

  // Sync Queue
  async addToSyncQueue(type, data) {
    await db.syncQueue.add({
      type,
      data,
      timestamp: new Date(),
      retries: 0
    });
  },

  async getSyncQueue() {
    return await db.syncQueue.orderBy('timestamp').toArray();
  },

  async removeSyncItem(id) {
    await db.syncQueue.delete(id);
  },

  async incrementRetries(id) {
    await db.syncQueue.where('id').equals(id).modify(item => {
      item.retries += 1;
    });
  },

  // Customers
  async saveCustomers(customers) {
    await db.customers.clear();
    await db.customers.bulkAdd(customers.map(c => ({
      customerID: c.customerID,
      name: c.name,
      phone: c.phone,
      email: c.email,
      lastSync: new Date()
    })));
  },

  async getCustomers() {
    return await db.customers.toArray();
  },

  // Utility
  async clearAll() {
    await db.products.clear();
    await db.sales.clear();
    await db.customers.clear();
    await db.syncQueue.clear();
  }
};

export default db;