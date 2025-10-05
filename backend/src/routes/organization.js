const express = require('express');
const OrganizationController = require('../controllers/organization');
const { verifyToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roles');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Organization management
router.get('/', OrganizationController.getOrganization);
router.put('/', adminOnly, OrganizationController.updateOrganization);

// Member invitation management (Admin only)
router.post('/invite', adminOnly, OrganizationController.inviteMember);
router.get('/invitations', adminOnly, OrganizationController.getPendingInvitations);
router.delete('/invitations/:invitationId', adminOnly, OrganizationController.cancelInvitation);

// Public invitation acceptance (no auth required)
router.post('/accept-invitation', OrganizationController.acceptInvitation);

module.exports = router;