const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// All routes require authentication
router.use(authenticate);

// Get stock movements
router.get('/movements', requireRole(['inventory']), stockController.getStockMovements);

// Get low stock products
router.get('/low-stock', requireRole(['inventory']), stockController.getLowStockProducts);

// Manual stock adjustment
router.post('/adjust/:productID', requireRole(['inventory']), stockController.adjustStock);

// Add stock (restock)
router.post('/add/:productID', requireRole(['inventory']), stockController.addStock);

// Register FCM token
router.post('/fcm-token', stockController.registerFCMToken);

// Check low stock (manual trigger)
router.post('/check-low-stock', requireRole(['inventory']), stockController.checkLowStock);

module.exports = router;