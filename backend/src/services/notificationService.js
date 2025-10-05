const admin = require('firebase-admin');
const { User } = require('../models');

class NotificationService {
  constructor() {
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
        });
      } catch (error) {
        console.error('Firebase Admin initialization failed:', error);
      }
    }
  }

  // Send low stock alert
  async sendLowStockAlert({ orgID, productName, sku, currentStock, minStock }) {
    try {
      // Get users with inventory permissions
      const users = await User.find({
        orgID,
        'permissions.module': 'inventory',
        'auth.fcmToken': { $exists: true }
      });

      const message = {
        notification: {
          title: '⚠️ Low Stock Alert',
          body: `${productName} (${sku}) is running low: ${currentStock} left (min: ${minStock})`
        },
        data: {
          type: 'low_stock',
          productName,
          sku,
          currentStock: currentStock.toString(),
          minStock: minStock.toString(),
          orgID
        }
      };

      const tokens = users.map(user => user.auth.fcmToken).filter(Boolean);
      
      if (tokens.length > 0) {
        const response = await admin.messaging().sendMulticast({
          tokens,
          ...message
        });
        
        console.log(`Low stock alert sent to ${response.successCount} users`);
        return response;
      }
    } catch (error) {
      console.error('Failed to send low stock alert:', error);
      throw error;
    }
  }

  // Send stock update notification
  async sendStockUpdateNotification({ orgID, productName, sku, newStock, action }) {
    try {
      const users = await User.find({
        orgID,
        'permissions.module': 'inventory',
        'auth.fcmToken': { $exists: true }
      });

      const message = {
        notification: {
          title: '📦 Stock Updated',
          body: `${productName} (${sku}) stock ${action}: ${newStock} units available`
        },
        data: {
          type: 'stock_update',
          productName,
          sku,
          newStock: newStock.toString(),
          action,
          orgID
        }
      };

      const tokens = users.map(user => user.auth.fcmToken).filter(Boolean);
      
      if (tokens.length > 0) {
        const response = await admin.messaging().sendMulticast({
          tokens,
          ...message
        });
        
        return response;
      }
    } catch (error) {
      console.error('Failed to send stock update notification:', error);
    }
  }

  // Register FCM token for user
  async registerFCMToken(userID, token) {
    try {
      await User.findOneAndUpdate(
        { userID },
        { 'auth.fcmToken': token }
      );
      return true;
    } catch (error) {
      console.error('Failed to register FCM token:', error);
      return false;
    }
  }

  // Send custom notification
  async sendCustomNotification({ orgID, title, body, data = {}, userIDs = null }) {
    try {
      let users;
      if (userIDs) {
        users = await User.find({
          userID: { $in: userIDs },
          'auth.fcmToken': { $exists: true }
        });
      } else {
        users = await User.find({
          orgID,
          'auth.fcmToken': { $exists: true }
        });
      }

      const message = {
        notification: { title, body },
        data: { ...data, orgID }
      };

      const tokens = users.map(user => user.auth.fcmToken).filter(Boolean);
      
      if (tokens.length > 0) {
        const response = await admin.messaging().sendMulticast({
          tokens,
          ...message
        });
        
        return response;
      }
    } catch (error) {
      console.error('Failed to send custom notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();