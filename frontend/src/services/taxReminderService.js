import apiClient from './apiClient';

class TaxReminderService {
  async getPendingFilings(orgId, memberId) {
    try {
      const response = await apiClient.get(`/tax-reminders/pending/${orgId}/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending filings:', error);
      throw error;
    }
  }

  async updateFCMToken(fcmToken) {
    try {
      const response = await apiClient.post('/tax-reminders/fcm-token', { fcmToken });
      return response.data;
    } catch (error) {
      console.error('Error updating FCM token:', error);
      throw error;
    }
  }

  async getTaxCalendar(year) {
    try {
      const response = await apiClient.get(`/tax-reminders/calendar/${year || ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tax calendar:', error);
      throw error;
    }
  }

  async checkDeadlines() {
    try {
      const response = await apiClient.post('/tax-reminders/check-deadlines');
      return response.data;
    } catch (error) {
      console.error('Error checking deadlines:', error);
      throw error;
    }
  }

  // Initialize Firebase messaging for push notifications
  async initializeNotifications() {
    try {
      if ('serviceWorker' in navigator && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Import Firebase messaging dynamically
          const { getMessaging, getToken } = await import('firebase/messaging');
          const { initializeApp } = await import('firebase/app');
          
          const firebaseConfig = {
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
            storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.REACT_APP_FIREBASE_APP_ID
          };
          
          const app = initializeApp(firebaseConfig);
          const messaging = getMessaging(app);
          
          const token = await getToken(messaging, {
            vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
          });
          
          if (token) {
            await this.updateFCMToken(token);
            return token;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }
}

export default new TaxReminderService();