const stockService = require('../services/stockService');
const notificationService = require('../services/notificationService');
const { asyncHandler } = require('../middleware/errorHandler');

// Get stock movements
exports.getStockMovements = asyncHandler(async (req, res) => {
  try {
    const { orgID } = req.user;
    const { productID, limit = 50 } = req.query;

    const movements = await stockService.getStockMovements(orgID, productID, parseInt(limit));

    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    throw error;
  }
});

// Manual stock adjustment
exports.adjustStock = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { productID } = req.params;
    const { quantity, reason } = req.body;

    if (!quantity || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and reason are required'
      });
    }

    const result = await stockService.adjustStock(orgID, productID, quantity, reason, req.user.userID);

    // Send notification for significant adjustments
    if (Math.abs(quantity) >= 10) {
      const product = await require('../models').Product.findOne({ productID, orgID });
      if (product) {
        await notificationService.sendStockUpdateNotification({
          orgID,
          productName: product.name,
          sku: product.sku,
          newStock: result.newStock,
          action: quantity > 0 ? 'increased' : 'decreased'
        });
      }
    }

    res.json({
      success: true,
      data: result,
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adjusting stock',
      error: error.message
    });
  }
};

// Add stock (restock)
exports.addStock = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { productID } = req.params;
    const { quantity, unitPrice, reference } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const result = await stockService.addStock(orgID, productID, quantity, unitPrice, req.user.userID, reference);

    res.json({
      success: true,
      data: result,
      message: 'Stock added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding stock',
      error: error.message
    });
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const { orgID } = req.user;

    const lowStockProducts = await stockService.getLowStockProducts(orgID);

    res.json({
      success: true,
      data: lowStockProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      error: error.message
    });
  }
};

// Register FCM token
exports.registerFCMToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const success = await notificationService.registerFCMToken(req.user.userID, token);

    res.json({
      success,
      message: success ? 'FCM token registered' : 'Failed to register FCM token'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering FCM token',
      error: error.message
    });
  }
};

// Trigger low stock check
exports.checkLowStock = async (req, res) => {
  try {
    const { orgID } = req.user;

    const alertCount = await stockService.checkLowStockAlerts(orgID);

    res.json({
      success: true,
      data: { alertsSent: alertCount },
      message: `Checked low stock for ${alertCount} products`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking low stock',
      error: error.message
    });
  }
};