const express = require('express');
const {
  runSecurityAudit,
  runAuthenticationTest,
  getSecurityStatus,
  generateSecurityReport
} = require('../controllers/securityController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

// Security audit endpoints (admin only)
router.post('/audit', auth, roleAuth(['admin']), runSecurityAudit);
router.post('/test-auth', auth, roleAuth(['admin']), runAuthenticationTest);
router.get('/status', auth, roleAuth(['admin', 'accountant']), getSecurityStatus);
router.get('/report', auth, roleAuth(['admin']), generateSecurityReport);

module.exports = router;