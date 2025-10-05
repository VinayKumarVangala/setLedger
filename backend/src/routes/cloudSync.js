const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const firestoreService = require('../services/firestoreService');

// Manual sync to Firestore
router.post('/sync/:orgId/:memberId', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    
    const result = await firestoreService.syncToFirestore(orgId, memberId);
    
    res.json({
      success: true,
      message: 'Data synced to cloud successfully',
      data: result
    });
  } catch (error) {
    console.error('Cloud sync error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Cloud sync failed',
      error: error.message 
    });
  }
});

// Manual restore from Firestore
router.post('/restore/:orgId/:memberId', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    
    const result = await firestoreService.restoreFromFirestore(orgId, memberId);
    
    res.json({
      success: true,
      message: 'Data restored from cloud successfully',
      data: result
    });
  } catch (error) {
    console.error('Cloud restore error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Cloud restore failed',
      error: error.message 
    });
  }
});

// Get backup information
router.get('/backup-info/:orgId', auth, async (req, res) => {
  try {
    const { orgId } = req.params;
    
    const backupInfo = await firestoreService.getBackupInfo(orgId);
    
    res.json({
      success: true,
      data: backupInfo
    });
  } catch (error) {
    console.error('Error getting backup info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get backup information' 
    });
  }
});

// Delete cloud backup
router.delete('/backup/:orgId', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const { orgId } = req.params;
    
    await firestoreService.deleteBackup(orgId);
    
    res.json({
      success: true,
      message: 'Cloud backup deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete backup' 
    });
  }
});

// Get sync status
router.get('/status/:orgId/:memberId', auth, async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    
    const backupInfo = await firestoreService.getBackupInfo(orgId);
    
    res.json({
      success: true,
      data: {
        cloudBackupExists: backupInfo.exists,
        lastSync: backupInfo.lastSync,
        syncedBy: backupInfo.syncedBy,
        recordCount: backupInfo.recordCount,
        isUpToDate: backupInfo.lastSync && 
          (new Date() - new Date(backupInfo.lastSync)) < 24 * 60 * 60 * 1000 // 24 hours
      }
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get sync status' 
    });
  }
});

module.exports = router;