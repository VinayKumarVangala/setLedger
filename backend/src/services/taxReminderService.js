const admin = require('firebase-admin');
const GSTReport = require('../models/GSTReport');
const User = require('../models/User');

class TaxReminderService {
  constructor() {
    this.taxDeadlines = {
      GSTR1: { day: 11, description: 'GSTR-1 Filing' },
      GSTR3B: { day: 20, description: 'GSTR-3B Filing' },
      GSTR2A: { day: 15, description: 'GSTR-2A Review' },
      TDS: { day: 7, description: 'TDS Return Filing' }
    };
  }

  async checkUpcomingDeadlines() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    for (const [reportType, deadline] of Object.entries(this.taxDeadlines)) {
      const daysUntilDeadline = deadline.day - currentDay;
      
      // Send reminders 7, 3, and 1 day before deadline
      if ([7, 3, 1].includes(daysUntilDeadline)) {
        await this.sendDeadlineReminders(reportType, deadline, daysUntilDeadline, currentMonth, currentYear);
      }
      
      // Send overdue notifications
      if (daysUntilDeadline < 0) {
        await this.sendOverdueNotifications(reportType, deadline, Math.abs(daysUntilDeadline), currentMonth, currentYear);
      }
    }
  }

  async sendDeadlineReminders(reportType, deadline, daysLeft, month, year) {
    try {
      // Get all users who haven't filed this report
      const users = await User.find({ role: { $in: ['Admin', 'Accountant'] } });
      
      for (const user of users) {
        const existingReport = await GSTReport.findOne({
          userId: user._id,
          reportType,
          'period.month': month,
          'period.year': year,
          status: 'filed'
        });

        if (!existingReport && user.fcmToken) {
          await this.sendNotification(user.fcmToken, {
            title: `${deadline.description} Reminder`,
            body: `${deadline.description} is due in ${daysLeft} day(s). File by ${deadline.day}th of this month.`,
            data: {
              type: 'tax_reminder',
              reportType,
              daysLeft: daysLeft.toString(),
              deadline: deadline.day.toString()
            }
          });
        }
      }
    } catch (error) {
      console.error('Error sending deadline reminders:', error);
    }
  }

  async sendOverdueNotifications(reportType, deadline, daysOverdue, month, year) {
    try {
      const users = await User.find({ role: { $in: ['Admin', 'Accountant'] } });
      
      for (const user of users) {
        const existingReport = await GSTReport.findOne({
          userId: user._id,
          reportType,
          'period.month': month,
          'period.year': year,
          status: 'filed'
        });

        if (!existingReport && user.fcmToken) {
          await this.sendNotification(user.fcmToken, {
            title: `${deadline.description} Overdue`,
            body: `${deadline.description} is ${daysOverdue} day(s) overdue. Please file immediately to avoid penalties.`,
            data: {
              type: 'tax_overdue',
              reportType,
              daysOverdue: daysOverdue.toString(),
              priority: 'high'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error sending overdue notifications:', error);
    }
  }

  async sendNotification(fcmToken, payload) {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_notification',
            color: '#3B82F6'
          }
        },
        webpush: {
          notification: {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png'
          }
        }
      };

      await admin.messaging().send(message);
    } catch (error) {
      console.error('Error sending FCM notification:', error);
    }
  }

  async getPendingFilings(orgId, memberId) {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const userId = `${orgId}_${memberId}`;

    const pendingFilings = [];

    for (const [reportType, deadline] of Object.entries(this.taxDeadlines)) {
      const existingReport = await GSTReport.findOne({
        userId,
        reportType,
        'period.month': currentMonth,
        'period.year': currentYear,
        status: 'filed'
      });

      if (!existingReport) {
        const daysUntilDeadline = deadline.day - today.getDate();
        const status = daysUntilDeadline < 0 ? 'overdue' : daysUntilDeadline <= 3 ? 'urgent' : 'pending';
        
        pendingFilings.push({
          reportType,
          description: deadline.description,
          deadline: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${deadline.day.toString().padStart(2, '0')}`,
          daysLeft: daysUntilDeadline,
          status,
          priority: status === 'overdue' ? 'high' : status === 'urgent' ? 'medium' : 'low'
        });
      }
    }

    return pendingFilings.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async updateFCMToken(userId, fcmToken) {
    try {
      await User.findByIdAndUpdate(userId, { fcmToken });
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  }
}

module.exports = new TaxReminderService();