const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// All routes require authentication
router.use(authenticate);

// Create invoice - requires billing access
router.post('/', requireRole(['billing']), invoiceController.createInvoice);

// Get invoices - requires billing read access
router.get('/', requireRole(['billing']), invoiceController.getInvoices);

// Get single invoice
router.get('/:id', requireRole(['billing']), invoiceController.getInvoice);

// Generate PDF
router.get('/:id/pdf', requireRole(['billing']), invoiceController.generatePDF);

// Update payment status
router.patch('/:id/payment', requireRole(['billing']), invoiceController.updatePayment);

module.exports = router;