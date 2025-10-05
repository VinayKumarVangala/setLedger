const admin = require('firebase-admin');
const logService = require('./logService');

class CrashlyticsService {
  constructor() {
    this.crashlytics = admin.crashlytics ? admin.crashlytics() : null;
    this.enabled = !!this.crashlytics;
  }

  recordError(error, context = {}) {
    try {
      // Log locally first
      logService.error('Crashlytics Error', error, context);

      if (!this.enabled) {
        console.warn('Firebase Crashlytics not initialized');
        return;
      }

      // Record to Firebase Crashlytics
      const crashReport = {
        message: error.message || 'Unknown error',
        stack: error.stack || '',
        timestamp: new Date().toISOString(),
        context: {
          ...context,
          service: 'setledger-backend',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        }
      };

      // Send to Crashlytics (simulated - actual implementation depends on Firebase SDK)
      this.sendToCrashlytics(crashReport);
    } catch (crashError) {
      logService.error('Failed to record crash', crashError);
    }
  }

  recordCustomError(message, details = {}) {
    const customError = new Error(message);
    customError.details = details;
    this.recordError(customError, { type: 'custom', ...details });
  }

  setUserContext(userId, userInfo = {}) {
    try {
      if (!this.enabled) return;

      // Set user context for crash reports
      this.userContext = {
        userId,
        ...userInfo,
        timestamp: new Date().toISOString()
      };

      logService.info('User context set for crashlytics', { userId });
    } catch (error) {
      logService.error('Failed to set user context', error);
    }
  }

  recordBreadcrumb(message, category = 'general', level = 'info') {
    try {
      const breadcrumb = {
        message,
        category,
        level,
        timestamp: new Date().toISOString()
      };

      logService.debug('Breadcrumb recorded', breadcrumb);

      if (this.enabled) {
        // Add breadcrumb to crash reports
        this.breadcrumbs = this.breadcrumbs || [];
        this.breadcrumbs.push(breadcrumb);
        
        // Keep only last 20 breadcrumbs
        if (this.breadcrumbs.length > 20) {
          this.breadcrumbs = this.breadcrumbs.slice(-20);
        }
      }
    } catch (error) {
      logService.error('Failed to record breadcrumb', error);
    }
  }

  async sendToCrashlytics(crashReport) {
    try {
      // In a real implementation, this would use Firebase Crashlytics SDK
      // For now, we'll log it as a structured error
      logService.error('CRASHLYTICS_REPORT', null, {
        crashReport,
        userContext: this.userContext,
        breadcrumbs: this.breadcrumbs || []
      });

      // Simulate API call to Firebase
      if (process.env.NODE_ENV === 'production') {
        // await this.crashlytics.recordError(crashReport);
      }
    } catch (error) {
      logService.error('Failed to send crash report', error);
    }
  }

  async getCrashReports(options = {}) {
    try {
      // Get crash reports from logs
      const { logs } = await logService.getLogs({
        ...options,
        search: 'CRASHLYTICS_REPORT'
      });

      return logs.map(log => ({
        id: log.timestamp,
        timestamp: log.timestamp,
        message: log.crashReport?.message || log.message,
        stack: log.crashReport?.stack,
        context: log.crashReport?.context || {},
        userContext: log.userContext,
        breadcrumbs: log.breadcrumbs || []
      }));
    } catch (error) {
      logService.error('Failed to get crash reports', error);
      return [];
    }
  }

  getStats() {
    return {
      enabled: this.enabled,
      userContext: this.userContext || null,
      breadcrumbCount: this.breadcrumbs?.length || 0
    };
  }
}

module.exports = new CrashlyticsService();