const { Product, Stock } = require('../models');
const notificationService = require('./notificationService');

class StockService {
  // Update stock after sale/billing
  async updateStockOnSale(orgID, items, userID) {
    const stockUpdates = [];
    
    for (const item of items) {
      try {
        const product = await Product.findOne({ 
          productID: item.productID, 
          orgID 
        });
        
        if (!product) continue;
        
        const newStock = product.inventory.currentStock - item.quantity;
        
        // Update product stock
        await Product.findOneAndUpdate(
          { productID: item.productID, orgID },
          { 
            'inventory.currentStock': Math.max(0, newStock),
            updatedBy: userID 
          }
        );
        
        // Record stock movement
        const stockRecord = new Stock({
          stockID: `${orgID}_STK_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          orgID,
          productID: item.productID,
          transactionType: 'sale',
          quantity: -item.quantity,
          unitPrice: item.unitPrice,
          totalValue: -(item.quantity * item.unitPrice),
          reference: { type: 'invoice', id: item.invoiceID },
          balanceAfter: Math.max(0, newStock),
          createdBy: userID,
          updatedBy: userID
        });
        
        await stockRecord.save();
        stockUpdates.push({ productID: item.productID, newStock: Math.max(0, newStock) });
        
        // Check for low stock
        if (newStock <= product.inventory.minStock && newStock > 0) {
          await this.triggerLowStockAlert(product, newStock);
        }
        
      } catch (error) {
        console.error(`Error updating stock for product ${item.productID}:`, error);
      }
    }
    
    return stockUpdates;
  }
  
  // Manual stock adjustment
  async adjustStock(orgID, productID, quantity, reason, userID) {
    try {
      const product = await Product.findOne({ productID, orgID });
      if (!product) throw new Error('Product not found');
      
      const newStock = Math.max(0, product.inventory.currentStock + quantity);
      
      await Product.findOneAndUpdate(
        { productID, orgID },
        { 
          'inventory.currentStock': newStock,
          updatedBy: userID 
        }
      );
      
      const stockRecord = new Stock({
        stockID: `${orgID}_STK_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        orgID,
        productID,
        transactionType: 'adjustment',
        quantity,
        balanceAfter: newStock,
        reason,
        createdBy: userID,
        updatedBy: userID
      });
      
      await stockRecord.save();
      
      return { productID, newStock, adjustment: quantity };
    } catch (error) {
      throw new Error(`Stock adjustment failed: ${error.message}`);
    }
  }
  
  // Add stock (purchase/restock)
  async addStock(orgID, productID, quantity, unitPrice, userID, reference = null) {
    try {
      const product = await Product.findOne({ productID, orgID });
      if (!product) throw new Error('Product not found');
      
      const newStock = product.inventory.currentStock + quantity;
      
      await Product.findOneAndUpdate(
        { productID, orgID },
        { 
          'inventory.currentStock': newStock,
          updatedBy: userID 
        }
      );
      
      const stockRecord = new Stock({
        stockID: `${orgID}_STK_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        orgID,
        productID,
        transactionType: 'purchase',
        quantity,
        unitPrice,
        totalValue: quantity * unitPrice,
        reference,
        balanceAfter: newStock,
        createdBy: userID,
        updatedBy: userID
      });
      
      await stockRecord.save();
      
      return { productID, newStock, added: quantity };
    } catch (error) {
      throw new Error(`Stock addition failed: ${error.message}`);
    }
  }
  
  // Get stock movements
  async getStockMovements(orgID, productID = null, limit = 50) {
    const filter = { orgID };
    if (productID) filter.productID = productID;
    
    return await Stock.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('productID', 'name sku');
  }
  
  // Get low stock products
  async getLowStockProducts(orgID) {
    return await Product.find({
      orgID,
      $expr: { $lte: ['$inventory.currentStock', '$inventory.minStock'] },
      'inventory.currentStock': { $gt: 0 }
    }).select('productID name sku inventory');
  }
  
  // Trigger low stock alert
  async triggerLowStockAlert(product, currentStock) {
    try {
      await notificationService.sendLowStockAlert({
        orgID: product.orgID,
        productName: product.name,
        sku: product.sku,
        currentStock,
        minStock: product.inventory.minStock
      });
    } catch (error) {
      console.error('Failed to send low stock alert:', error);
    }
  }
  
  // Check all products for low stock (scheduled job)
  async checkLowStockAlerts(orgID) {
    const lowStockProducts = await this.getLowStockProducts(orgID);
    
    for (const product of lowStockProducts) {
      await this.triggerLowStockAlert(product, product.inventory.currentStock);
    }
    
    return lowStockProducts.length;
  }
}

module.exports = new StockService();