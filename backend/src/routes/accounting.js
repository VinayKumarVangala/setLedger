const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accounting');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// All routes require authentication
router.use(authenticate);

// Chart of Accounts
router.get('/accounts', requireRole(['analytics']), accountingController.getAccounts);
router.post('/accounts', requireRole(['analytics']), accountingController.createAccount);

// Journal Entries
router.get('/journal-entries', requireRole(['analytics']), accountingController.getJournalEntries);
router.post('/journal-entries', requireRole(['analytics']), accountingController.createJournalEntry);

// General Ledger
router.get('/ledger', requireRole(['analytics']), accountingController.getLedger);

// Trial Balance
router.get('/trial-balance', requireRole(['analytics']), accountingController.getTrialBalance);

// CSV Import
router.post('/import-csv', requireRole(['analytics']), accountingController.importCSV);

module.exports = router;