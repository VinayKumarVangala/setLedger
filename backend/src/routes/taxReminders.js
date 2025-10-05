const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const taxReminderService = require('../services/taxReminderService');

// Get pending filings for organization
router.get('/pending/:orgId/:memberId', auth, async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const pendingFilings = await taxReminderService.getPendingFilings(orgId, memberId);
    
    res.json({
      success: true,
      data: pendingFilings
    });
  } catch (error) {
    console.error('Error fetching pending filings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update FCM token for notifications
router.post('/fcm-token', auth, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;
    
    await taxReminderService.updateFCMToken(userId, fcmToken);
    
    res.json({
      success: true,
      message: 'FCM token updated successfully'
    });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Manually trigger reminder check (Admin only)
router.post('/check-deadlines', auth, checkRole(['Admin']), async (req, res) => {
  try {
    await taxReminderService.checkUpcomingDeadlines();
    
    res.json({
      success: true,
      message: 'Deadline check completed'
    });
  } catch (error) {
    console.error('Error checking deadlines:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get tax calendar for current year
router.get('/calendar/:year?', auth, async (req, res) => {
  try {
    const year = parseInt(req.params.year) || new Date().getFullYear();
    
    const calendar = [];
    const deadlines = {
      GSTR1: { day: 11, description: 'GSTR-1 Filing' },
      GSTR3B: { day: 20, description: 'GSTR-3B Filing' },
      GSTR2A: { day: 15, description: 'GSTR-2A Review' },
      TDS: { day: 7, description: 'TDS Return Filing' }
    };

    for (let month = 1; month <= 12; month++) {
      for (const [reportType, deadline] of Object.entries(deadlines)) {
        calendar.push({
          date: `${year}-${month.toString().padStart(2, '0')}-${deadline.day.toString().padStart(2, '0')}`,
          reportType,
          description: deadline.description,
          month,
          year
        });
      }
    }
    
    res.json({
      success: true,
      data: calendar.sort((a, b) => new Date(a.date) - new Date(b.date))
    });
  } catch (error) {
    console.error('Error fetching tax calendar:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;