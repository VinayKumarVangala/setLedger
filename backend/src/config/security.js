const crypto = require('crypto');

// Security configuration
const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex'),
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d'
  },
  
  // Encryption
  encryption: {
    kmsKey: process.env.KMS_KEY || crypto.randomBytes(32).toString('hex'),
    algorithm: 'aes-256-cbc'
  },
  
  // Password hashing
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  
  // Security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }
};

// Validate security configuration
const validateSecurityConfig = () => {
  const warnings = [];
  
  if (!process.env.JWT_SECRET) {
    warnings.push('JWT_SECRET not set - using generated key (not persistent)');
  }
  
  if (!process.env.JWT_REFRESH_SECRET) {
    warnings.push('JWT_REFRESH_SECRET not set - using generated key (not persistent)');
  }
  
  if (!process.env.KMS_KEY) {
    warnings.push('KMS_KEY not set - using generated key (not persistent)');
  }
  
  if (process.env.NODE_ENV === 'production' && warnings.length > 0) {
    console.error('🚨 SECURITY WARNING: Missing environment variables in production:');
    warnings.forEach(warning => console.error(`   - ${warning}`));
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Security warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
};

module.exports = {
  securityConfig,
  validateSecurityConfig
};