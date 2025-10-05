class EnvConfig {
  constructor() {
    this.validateRequiredEnvVars();
  }

  // API Configuration
  get api() {
    return {
      baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1',
      timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
      retryAttempts: parseInt(process.env.REACT_APP_API_RETRY_ATTEMPTS) || 3
    };
  }

  // Firebase Configuration
  get firebase() {
    return {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    };
  }

  // Authentication Configuration
  get auth() {
    return {
      jwtStorageKey: process.env.REACT_APP_JWT_STORAGE_KEY || 'setledger_token',
      refreshTokenKey: process.env.REACT_APP_REFRESH_TOKEN_KEY || 'setledger_refresh',
      sessionTimeout: parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 1440,
      autoLogoutWarning: parseInt(process.env.REACT_APP_AUTO_LOGOUT_WARNING) || 300
    };
  }

  // Application Configuration
  get app() {
    return {
      name: process.env.REACT_APP_APP_NAME || 'setLedger',
      version: process.env.REACT_APP_APP_VERSION || '1.0.0',
      companyName: process.env.REACT_APP_COMPANY_NAME || 'setLedger Solutions',
      supportEmail: process.env.REACT_APP_SUPPORT_EMAIL || 'support@setledger.com'
    };
  }

  // Feature Flags
  get features() {
    return {
      aiFeatures: this.getBooleanEnv('REACT_APP_ENABLE_AI_FEATURES', true),
      offlineMode: this.getBooleanEnv('REACT_APP_ENABLE_OFFLINE_MODE', true),
      analytics: this.getBooleanEnv('REACT_APP_ENABLE_ANALYTICS', true),
      notifications: this.getBooleanEnv('REACT_APP_ENABLE_NOTIFICATIONS', true),
      darkMode: this.getBooleanEnv('REACT_APP_ENABLE_DARK_MODE', true)
    };
  }

  // Development Configuration
  get development() {
    return {
      debugMode: this.getBooleanEnv('REACT_APP_DEBUG_MODE', false),
      mockApi: this.getBooleanEnv('REACT_APP_MOCK_API', false),
      logLevel: process.env.REACT_APP_LOG_LEVEL || 'info'
    };
  }

  // Helper method to parse boolean environment variables
  getBooleanEnv(key, defaultValue = false) {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  // Validate required environment variables
  validateRequiredEnvVars() {
    const required = ['REACT_APP_API_URL'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.warn(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  // Check environment
  get isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  get isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }
}

export default new EnvConfig();