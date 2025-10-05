const express = require('express');
const ProductController = require('../controllers/product');
const { verifyToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/roles');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Product CRUD routes
router.get('/', requirePermission('inventory', 'read'), ProductController.getProducts);
router.get('/categories', requirePermission('inventory', 'read'), ProductController.getCategories);
router.get('/:productId', requirePermission('inventory', 'read'), ProductController.getProduct);
router.post('/', requirePermission('inventory', 'write'), ProductController.createProduct);
router.put('/:productId', requirePermission('inventory', 'write'), ProductController.updateProduct);
router.delete('/:productId', requirePermission('inventory', 'delete'), ProductController.deleteProduct);

// QR code routes
router.get('/:productId/qr', requirePermission('inventory', 'read'), ProductController.generateQR);
router.post('/bulk-qr', requirePermission('inventory', 'read'), ProductController.bulkQRExport);

module.exports = router;