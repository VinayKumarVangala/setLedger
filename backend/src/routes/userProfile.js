const express = require('express');
const { getUserProfile, updateUserProfile, getOrgTheme } = require('../controllers/userProfileController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);
router.get('/org/:orgId/theme', auth, getOrgTheme);

module.exports = router;