const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole(['admin']));

// Create manual backup
router.post('/create', backupController.createBackup);

// List available backups
router.get('/list', backupController.listBackups);

// Restore from backup
router.post('/restore', backupController.restoreBackup);

// Trigger manual backup job
router.post('/trigger', backupController.triggerBackupJob);

// Get backup status
router.get('/status', backupController.getBackupStatus);

module.exports = router;