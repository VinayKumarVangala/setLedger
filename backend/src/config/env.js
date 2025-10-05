require('dotenv').config();

class EnvConfig {
  constructor() {
    this.validateRequiredEnvVars();
  }

  // Database Configuration
  get database() {
    return {
      uri: process.env.MONGO_URI,
      testUri: process.env.MONGO_TEST_URI,
      name: process.env.DB_NAME || 'setledger'
    };
  }

  // JWT Configuration
  get jwt() {
    return {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    };
  }

  // TOTP Configuration
  get totp() {
    return {
      secret: process.env.TOTP_SECRET,
      issuer: process.env.TOTP_ISSUER || 'setLedger',
      window: parseInt(process.env.TOTP_WINDOW) || 2,
      step: parseInt(process.env.TOTP_STEP) || 30
    };
  }

  // Firebase Configuration
  get firebase() {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      databaseURL: process.env.FIREBASE_DATABASE_URL
    };
  }

  // AI Services Configuration
  get ai() {
    return {
      apiKey: process.env.AI_API_KEY,
      geminiKey: process.env.GEMINI_API_KEY,
      openaiKey: process.env.OPENAI_API_KEY,
      model: process.env.AI_MODEL || 'gemini-pro',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 1000
    };
  }

  // Email Configuration
  get email() {
    return {
      apiKey: process.env.EMAIL_API_KEY,
      from: process.env.EMAIL_FROM || 'noreply@setledger.com',
      service: process.env.EMAIL_SERVICE || 'sendgrid'
    };
  }

  // Server Configuration
  get server() {
    return {
      port: parseInt(process.env.PORT) || 3001,
      nodeEnv: process.env.NODE_ENV || 'development',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      backendUrl: process.env.BACKEND_URL || 'http://localhost:3001'
    };
  }

  // Security Configuration
  get security() {
    return {
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
      otpRateLimitMax: parseInt(process.env.OTP_RATE_LIMIT_MAX) || 3,
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    };
  }

  // External APIs Configuration
  get externalApis() {
    return {
      gstApiKey: process.env.GST_API_KEY,
      gstApiUrl: process.env.GST_API_URL || 'https://api.gst.gov.in',
      smsApiKey: process.env.SMS_API_KEY,
      paymentGatewayKey: process.env.PAYMENT_GATEWAY_KEY
    };
  }

  // File Storage Configuration
  get storage() {
    return {
      uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10485760, // 10MB
      uploadPath: process.env.UPLOAD_PATH || './uploads',
      staticFilesPath: process.env.STATIC_FILES_PATH || './public'
    };
  }

  // Logging Configuration
  get logging() {
    return {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || './logs/app.log'
    };
  }

  // Cache Configuration
  get cache() {
    return {
      redisUrl: process.env.REDIS_URL,
      ttl: parseInt(process.env.CACHE_TTL) || 3600
    };
  }

  // Backup Configuration
  get backup() {
    return {
      schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
      cloudStorageBucket: process.env.CLOUD_STORAGE_BUCKET
    };
  }

  // Validate required environment variables
  validateRequiredEnvVars() {
    const required = [
      'MONGO_URI',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'TOTP_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate JWT secret length
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    // Validate MongoDB URI format
    if (!process.env.MONGO_URI.startsWith('mongodb')) {
      throw new Error('MONGO_URI must be a valid MongoDB connection string');
    }
  }

  // Check if running in production
  get isProduction() {
    return this.server.nodeEnv === 'production';
  }

  // Check if running in development
  get isDevelopment() {
    return this.server.nodeEnv === 'development';
  }

  // Check if running in test
  get isTest() {
    return this.server.nodeEnv === 'test';
  }
}

module.exports = new EnvConfig();