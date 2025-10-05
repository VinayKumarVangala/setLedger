const express = require('express');
const UserController = require('../controllers/user');
const { verifyToken } = require('../middleware/auth');
const { adminOnly, accountantOrHigher } = require('../middleware/roles');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// User profile routes
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.get('/permissions', UserController.getUserPermissions);

// Team management routes (Admin/Accountant access)
router.get('/team', accountantOrHigher, UserController.getTeamMembers);

// Admin only routes
router.post('/team', adminOnly, UserController.createTeamMember);
router.put('/team/:targetUserID', adminOnly, UserController.updateTeamMember);

module.exports = router;