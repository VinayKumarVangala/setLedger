const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const logService = require('../services/logService');
const crashlyticsService = require('../services/crashlyticsService');

// Get system logs
router.get('/logs', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const {
      level = 'all',
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      search
    } = req.query;

    const result = await logService.getLogs({
      level,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset),
      search
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logService.error('Failed to get logs', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve logs' });
  }
});

// Get log statistics
router.get('/logs/stats', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const stats = await logService.getLogStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logService.error('Failed to get log stats', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve log statistics' });
  }
});

// Clear logs
router.delete('/logs', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const { level = 'all' } = req.query;
    
    const success = await logService.clearLogs(level);
    
    if (success) {
      logService.info('Logs cleared by admin', { level, adminId: req.user.id });
      res.json({ success: true, message: 'Logs cleared successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to clear logs' });
    }
  } catch (error) {
    logService.error('Failed to clear logs', error);
    res.status(500).json({ success: false, message: 'Failed to clear logs' });
  }
});

// Get crash reports
router.get('/crashes', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    const crashes = await crashlyticsService.getCrashReports({
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        crashes,
        total: crashes.length
      }
    });
  } catch (error) {
    logService.error('Failed to get crash reports', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve crash reports' });
  }
});

// Get system health
router.get('/health', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      environment: process.env.NODE_ENV,
      crashlytics: crashlyticsService.getStats()
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logService.error('Failed to get system health', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve system health' });
  }
});

// Test error logging
router.post('/test-error', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const { message = 'Test error', level = 'error' } = req.body;
    
    if (level === 'crash') {
      crashlyticsService.recordCustomError(message, { 
        source: 'admin-test',
        adminId: req.user.id 
      });
    } else {
      logService.log(level, message, { 
        source: 'admin-test',
        adminId: req.user.id 
      });
    }

    res.json({
      success: true,
      message: `Test ${level} logged successfully`
    });
  } catch (error) {
    logService.error('Failed to log test error', error);
    res.status(500).json({ success: false, message: 'Failed to log test error' });
  }
});

module.exports = router;