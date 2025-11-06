const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const prisma = require('./db/prisma');
const financialService = require('./services/financial');
const qrTokenService = require('./services/qr');
const { QRPDFGenerator } = require('./services/qr-pdf');
const { QRMetadataSync } = require('./services/qr-metadata-sync');
const { StockReservationService } = require('./services/stock-reservation');
const { ReservationCleanupJob } = require('./jobs/cleanup-reservations');
const ViewRefreshJob = require('./jobs/refresh-views');
const ReminderJob = require('./services/reminderJob');
const UpdateCreditLimitsJob = require('./jobs/updateCreditLimits');
const { ConflictResolutionService } = require('./services/conflict-resolution');
const { OptimisticLockingService } = require('./services/optimistic-locking');
const { StockLedgerService } = require('./services/stock-ledger');
const { InvoiceService } = require('./services/invoice-service');
const { TaxEngine } = require('./services/tax-engine');
const { ExportService } = require('./services/export-service');
const { POSService } = require('./services/pos-service');
const FinancialSummaryService = require('./services/financial-summary');

const app = express();
const PORT = process.env.PORT || 5000;

// Security configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const KMS_KEY = process.env.KMS_KEY || 'your-kms-encryption-key';
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(cookieParser());

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many attempts' } }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// XSS protection middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/<script[^>]*>.*?<\/script>/gi, '')
                           .replace(/<[^>]*>/g, '')
                           .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

app.use(sanitizeInput);

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const csrfToken = req.headers['x-csrf-token'];
    if (!csrfToken || csrfToken.length < 32) {
      return res.status(403).json({
        success: false,
        error: { code: 'CSRF_TOKEN_MISSING', message: 'CSRF token required' }
      });
    }
  }
  next();
};

// Idempotency middleware
const idempotencyMiddleware = (req, res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    const idempotencyKey = req.headers['x-idempotency-key'];
    
    if (idempotencyKey) {
      const existingResponse = idempotencyStore.get(idempotencyKey);
      if (existingResponse) {
        return res.status(existingResponse.status).json(existingResponse.data);
      }
      
      // Store original res.json to capture response
      const originalJson = res.json;
      res.json = function(data) {
        idempotencyStore.set(idempotencyKey, {
          status: res.statusCode,
          data,
          timestamp: Date.now()
        });
        
        // Clean up old entries (older than 24 hours)
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        for (const [key, value] of idempotencyStore.entries()) {
          if (value.timestamp < oneDayAgo) {
            idempotencyStore.delete(key);
          }
        }
        
        return originalJson.call(this, data);
      };
    }
  }
  next();
};

app.use('/api/v1/auth', csrfProtection);
app.use('/api/v1', idempotencyMiddleware);

// Thread-safe atomic counters
class AtomicCounter {
  constructor(start = 1000) {
    this.value = start;
    this.lock = false;
  }
  
  async getNext() {
    while (this.lock) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    this.lock = true;
    const result = this.value++;
    this.lock = false;
    return result;
  }
}

// Simple in-memory storage for testing
let users = [];
let organizations = [];
const orgCounter = new AtomicCounter(1000);
const userCounters = new Map();

// In-memory refresh token store (use Redis in production)
const refreshTokenStore = new Map();

// Idempotency key store (use Redis in production)
const idempotencyStore = new Map();

// Role-based permissions
const rolePermissions = {
  'admin': ['*'],
  'accountant': ['products', 'invoices', 'reports', 'gst'],
  'analyst': ['reports', 'analytics', 'dashboard'],
  'staff': ['pos', 'products', 'dashboard']
};

// Encryption utilities for TOTP
const encryptTOTP = (secret) => {
  const cipher = crypto.createCipher('aes-256-cbc', KMS_KEY);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decryptTOTP = (encryptedSecret) => {
  const decipher = crypto.createDecipher('aes-256-cbc', KMS_KEY);
  let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Token generation utilities
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

// Generate token pair (access + refresh)
const generateTokenPair = (user) => {
  const payload = {
    userId: user.displayId,
    orgId: user.orgDisplayId,
    role: user.role,
    permissions: rolePermissions[user.role] || []
  };
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user.displayId });
  
  // Store refresh token
  refreshTokenStore.set(user.displayId, refreshToken);
  
  return { accessToken, refreshToken };
};

// Middleware to verify JWT access token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: { code: 'NO_TOKEN', message: 'Access denied. No token provided.' }
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Access token expired. Please refresh.' }
      });
    }
    res.status(400).json({ 
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token.' }
    });
  }
};

// Middleware to verify refresh token
const verifyRefreshToken = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ 
      success: false,
      error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token not provided.' }
    });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Validate against stored token
    if (refreshTokenStore.get(decoded.userId) !== refreshToken) {
      return res.status(401).json({ 
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token.' }
      });
    }
    
    req.refreshUser = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token.' }
    });
  }
};

// Thread-safe ID Generation System
const generateOrgDisplayId = async () => {
  const sequence = await orgCounter.getNext();
  return `ORG${sequence}`;
};

const generateUserDisplayId = async (orgDisplayId) => {
  if (!userCounters.has(orgDisplayId)) {
    userCounters.set(orgDisplayId, new AtomicCounter(1));
  }
  const sequence = await userCounters.get(orgDisplayId).getNext();
  return `${orgDisplayId}-${sequence}`;
};

const generateProductDisplayId = () => {
  return `PRD${Date.now().toString().slice(-6)}`;
};

const generateInvoiceDisplayId = () => {
  return `INV${Date.now().toString().slice(-6)}`;
};

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// CSRF token endpoint
app.get('/api/v1/csrf-token', (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.json({ success: true, data: { csrfToken } });
});

// Basic auth endpoints
app.post('/api/v1/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, orgName } = req.body;
    
    // Basic validation
    if (!name || !email || !password || !orgName) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'All fields are required' }
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long' }
      });
    }
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'User already exists' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization with UUID and display ID
    const orgUUID = uuidv4();
    const orgDisplayId = await generateOrgDisplayId();
    const organization = {
      uuid: orgUUID,
      displayId: orgDisplayId,
      name: orgName || `${name}'s Organization`,
      createdAt: new Date().toISOString(),
      memberCount: 1
    };
    organizations.push(organization);

    // Create user with UUID and display ID
    const userUUID = uuidv4();
    const userDisplayId = await generateUserDisplayId(orgDisplayId);
    const user = {
      uuid: userUUID,
      displayId: userDisplayId,
      name,
      email,
      password: hashedPassword,
      orgUUID,
      orgDisplayId,
      role: 'admin',
      twoFactorEnabled: false,
      createdAt: new Date().toISOString()
    };
    users.push(user);

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair(user);
    
    // Set HttpOnly secure cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: {
          uuid: user.uuid,
          displayId: user.displayId,
          name: user.name,
          email: user.email,
          role: user.role,
          orgUUID: user.orgUUID,
          orgDisplayId: user.orgDisplayId
        },
        organization: {
          uuid: organization.uuid,
          displayId: organization.displayId,
          name: organization.name,
          memberCount: organization.memberCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'REGISTRATION_ERROR', message: 'Error during registration' }
    });
  }
});

app.post('/api/v1/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Verify password with bcrypt
    if (user.password) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        });
      }
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return res.status(400).json({
          success: false,
          error: { code: 'MFA_REQUIRED', message: '2FA token required' }
        });
      }
      
      // Decrypt and verify TOTP
      if (user.twoFactorSecret) {
        const decryptedSecret = decryptTOTP(user.twoFactorSecret);
        const verified = speakeasy.totp.verify({
          secret: decryptedSecret,
          encoding: 'base32',
          token: twoFactorToken,
          window: 2
        });
        
        if (!verified) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_MFA', message: 'Invalid 2FA token' }
          });
        }
      }
    }

    const organization = organizations.find(o => o.uuid === user.orgUUID);
    
    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair(user);
    
    // Set HttpOnly secure cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          uuid: user.uuid,
          displayId: user.displayId,
          name: user.name,
          email: user.email,
          role: user.role,
          orgUUID: user.orgUUID,
          orgDisplayId: user.orgDisplayId
        },
        organization: {
          uuid: organization.uuid,
          displayId: organization.displayId,
          name: organization.name,
          memberCount: organization.memberCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Server error during login' }
    });
  }
});

// 2FA endpoints with encryption
app.post('/api/v1/auth/setup-2fa', verifyToken, (req, res) => {
  try {
    const user = users.find(u => u.displayId === req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `setLedger:${user.email}`,
      issuer: 'setLedger'
    });
    
    // Encrypt and store secret
    user.twoFactorSecret = encryptTOTP(secret.base32);
    
    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url,
        manualEntryKey: secret.base32
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SETUP_2FA_ERROR', message: 'Error setting up 2FA' }
    });
  }
});

app.post('/api/v1/auth/verify-2fa', verifyToken, (req, res) => {
  try {
    const { token } = req.body;
    const user = users.find(u => u.displayId === req.user.userId);
    
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        error: { code: '2FA_NOT_SETUP', message: '2FA not set up' }
      });
    }
    
    // Decrypt TOTP secret
    const decryptedSecret = decryptTOTP(user.twoFactorSecret);
    
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });
    
    if (verified) {
      user.twoFactorEnabled = true;
      res.json({
        success: true,
        data: { message: '2FA enabled successfully' }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid 2FA token' }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'VERIFY_2FA_ERROR', message: 'Error verifying 2FA' }
    });
  }
});

// Token refresh endpoint
app.post('/api/v1/auth/refresh', verifyRefreshToken, (req, res) => {
  try {
    const user = users.find(u => u.displayId === req.refreshUser.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }
    
    // Generate new token pair (rotate refresh token)
    const { accessToken, refreshToken } = generateTokenPair(user);
    
    // Set new HttpOnly secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'REFRESH_ERROR', message: 'Error refreshing token' }
    });
  }
});

// Logout endpoint
app.post('/api/v1/auth/logout', verifyToken, (req, res) => {
  try {
    // Remove refresh token from store
    refreshTokenStore.delete(req.user.userId);
    
    // Clear cookie
    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_ERROR', message: 'Error during logout' }
    });
  }
});

// User profile endpoints
app.get('/api/v1/user/profile', verifyToken, (req, res) => {
  const user = users.find(u => u.displayId === req.user.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    });
  }

  const organization = organizations.find(o => o.uuid === user.orgUUID);
  
  res.json({
    success: true,
    data: {
      user: {
        uuid: user.uuid,
        displayId: user.displayId,
        name: user.name,
        email: user.email,
        role: user.role,
        orgUUID: user.orgUUID,
        orgDisplayId: user.orgDisplayId,
        createdAt: user.createdAt
      },
      organization: {
        uuid: organization.uuid,
        displayId: organization.displayId,
        name: organization.name,
        memberCount: organization.memberCount
      }
    }
  });
});

app.put('/api/v1/user/profile', verifyToken, (req, res) => {
  const { name, email } = req.body;
  
  const userIndex = users.findIndex(u => u.displayId === req.user.userId);
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    });
  }

  // Update user
  users[userIndex] = { ...users[userIndex], name, email };
  
  res.json({
    success: true,
    data: {
      user: {
        uuid: users[userIndex].uuid,
        displayId: users[userIndex].displayId,
        name: users[userIndex].name,
        email: users[userIndex].email,
        role: users[userIndex].role,
        orgUUID: users[userIndex].orgUUID,
        orgDisplayId: users[userIndex].orgDisplayId
      }
    }
  });
});

// Controllers
const InvoiceController = require('./controllers/invoiceController');
const CreditController = require('./controllers/creditController');
const AICreditService = require('./services/aiCreditService');
const FallbackService = require('./services/fallbackService');

// Financial API endpoints
app.post('/api/v1/invoices', verifyToken, InvoiceController.createInvoice);
app.post('/api/invoice/create', verifyToken, InvoiceController.createInvoice);
app.put('/api/v1/invoices/:invoiceId/payment', verifyToken, InvoiceController.updatePaymentStatus);

// Credit management endpoints
app.put('/api/credit/updatePayment/:creditId', verifyToken, CreditController.updatePayment);
app.get('/api/credit/:creditId', verifyToken, CreditController.getCreditDetails);
app.get('/api/credit', verifyToken, CreditController.getCredits);

// AI credit risk endpoint
app.post('/ai/credit-risk', verifyToken, async (req, res) => {
  try {
    const { customerId } = req.body;
    
    // Get customer credit metrics
    const metrics = await AICreditService.getCustomerCreditMetrics(
      req.user.orgId, 
      customerId
    );
    
    // Get AI prediction
    const prediction = await AICreditService.predictCreditRisk(metrics);
    
    res.json({ success: true, data: { ...prediction, metrics } });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { code: 'AI_PREDICTION_ERROR', message: error.message } 
    });
  }
});

// Customer profile endpoints
app.get('/api/customer/:customerId/profile', verifyToken, async (req, res) => {
  try {
    const CustomerProfile = require('./models/customerProfile');
    const profile = await CustomerProfile.findOne({ 
      orgId: req.user.orgId, 
      customerId: req.params.customerId 
    });
    
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { code: 'PROFILE_FETCH_ERROR', message: error.message } 
    });
  }
});

app.get('/api/system/logs', verifyToken, async (req, res) => {
  try {
    const SystemLog = require('./models/systemLog');
    const logs = await SystemLog.find({ orgId: req.user.orgId })
      .sort({ timestamp: -1 })
      .limit(100);
    
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { code: 'LOGS_FETCH_ERROR', message: error.message } 
    });
  }
});

// Customer behavior analysis endpoint
// Dataset management endpoint
app.get('/api/datasets/metadata', verifyToken, async (req, res) => {
  try {
    const metadata = FallbackService.getDatasetMetadata();
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: { code: 'METADATA_NOT_FOUND', message: 'Dataset metadata not available' }
      });
    }
    
    res.json({ success: true, data: metadata });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { code: 'METADATA_ERROR', message: error.message } 
    });
  }
});

// API failure simulation endpoints for testing
app.post('/api/test/simulate-outage', verifyToken, (req, res) => {
  FallbackService.enableTestMode();
  res.json({ 
    success: true, 
    data: { message: 'API failure simulation enabled', mode: 'outage' } 
  });
});

app.post('/api/test/restore-service', verifyToken, (req, res) => {
  FallbackService.disableTestMode();
  res.json({ 
    success: true, 
    data: { message: 'API failure simulation disabled', mode: 'normal' } 
  });
});

// Test endpoint to verify fallback behavior
app.get('/api/test/fallback-demo', verifyToken, async (req, res) => {
  try {
    // Simulate GST API call with fallback
    const gstData = await FallbackService.getData(
      async () => {
        // Simulate external GST API call
        throw new Error('GST API unavailable');
      },
      'gst-rates.json'
    );
    
    // Simulate financial analytics API call with fallback
    const analyticsData = await FallbackService.getData(
      async () => {
        // Simulate external analytics API call
        throw new Error('Analytics service down');
      },
      'analytics-data.json'
    );
    
    res.json({
      success: true,
      data: {
        gst: { ...gstData, recordCount: Array.isArray(gstData.data) ? gstData.data.length : Object.keys(gstData.data).length },
        analytics: { ...analyticsData, recordCount: Array.isArray(analyticsData.data) ? analyticsData.data.length : Object.keys(analyticsData.data).length },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FALLBACK_TEST_ERROR', message: error.message }
    });
  }
});

// Credit summary endpoint
app.get('/api/credit/summary', verifyToken, async (req, res) => {
  try {
    const CreditLedger = require('./models/creditLedger');
    const AICreditService = require('./services/aiCreditService');
    
    const [totalReceivables, overdueAmounts, upcomingPayments, riskScores] = await Promise.all([
      CreditLedger.aggregate([
        { $match: { orgId: req.user.orgId, status: { $in: ['pending', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$balanceAmount' }, count: { $sum: 1 } } }
      ]),
      CreditLedger.aggregate([
        { $match: { orgId: req.user.orgId, status: 'overdue' } },
        { $group: { _id: null, total: { $sum: '$balanceAmount' }, count: { $sum: 1 } } }
      ]),
      CreditLedger.aggregate([
        { $match: { orgId: req.user.orgId, dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, total: { $sum: '$balanceAmount' }, count: { $sum: 1 } } }
      ]),
      CreditLedger.find({ orgId: req.user.orgId }).distinct('customerId')
    ]);
    
    // Calculate average risk score
    let avgRiskScore = 50;
    if (riskScores.length > 0) {
      const scores = await Promise.all(
        riskScores.slice(0, 10).map(async (customerId) => {
          const metrics = await AICreditService.getCustomerCreditMetrics(req.user.orgId, customerId);
          const prediction = await AICreditService.predictCreditRisk(metrics);
          return prediction.creditRiskScore || 50;
        })
      );
      avgRiskScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    
    res.json({
      success: true,
      data: {
        totalReceivables: {
          amount: totalReceivables[0]?.total || 0,
          count: totalReceivables[0]?.count || 0
        },
        overdueAmounts: {
          amount: overdueAmounts[0]?.total || 0,
          count: overdueAmounts[0]?.count || 0
        },
        upcomingPayments: {
          amount: upcomingPayments[0]?.total || 0,
          count: upcomingPayments[0]?.count || 0
        },
        averageRiskScore: avgRiskScore,
        totalCustomers: riskScores.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { code: 'CREDIT_SUMMARY_ERROR', message: error.message } 
    });
  }
});

// Reminder logs endpoint
app.get('/api/reminders/logs', verifyToken, async (req, res) => {
  try {
    const ReminderLog = require('./models/reminderLog');
    const { limit = 50, status, mode } = req.query;
    
    const filter = { orgId: req.user.orgId };
    if (status) filter.status = status;
    if (mode) filter.mode = mode;
    
    const logs = await ReminderLog.find(filter)
      .sort({ reminderDate: -1 })
      .limit(parseInt(limit));
    
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { code: 'REMINDER_LOGS_ERROR', message: error.message } 
    });
  }
});

app.post('/api/customer/analyzeBehavior', verifyToken, async (req, res) => {
  try {
    const CreditInsights = require('./utils/creditInsights');
    const CustomerProfile = require('./models/customerProfile');
    const { customerId } = req.body;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CUSTOMER_ID', message: 'Customer ID is required' }
      });
    }
    
    // Analyze customer behavior
    const analysis = await CreditInsights.analyzeCustomerBehavior(req.user.orgId, customerId);
    
    // Update customer profile
    await CustomerProfile.findOneAndUpdate(
      { orgId: req.user.orgId, customerId },
      {
        behaviorCategory: analysis.category,
        behaviorScore: analysis.score,
        lastBehaviorAnalysis: new Date()
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { code: 'BEHAVIOR_ANALYSIS_ERROR', message: error.message } 
    });
  }
});

app.post('/api/v1/invoices/qr-scan', verifyToken, async (req, res) => {
  try {
    const invoice = await InvoiceService.createFromQRScan(
      req.user.orgId,
      req.body,
      req.user.userId
    );
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: { code: 'QR_INVOICE_ERROR', message: error.message } });
  }
});

app.get('/api/v1/invoices', verifyToken, InvoiceController.getInvoices);

app.put('/api/v1/invoices/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await InvoiceService.updateInvoiceStatus(
      req.user.orgId,
      req.params.id,
      status,
      req.user.userId
    );
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'STATUS_UPDATE_ERROR', message: error.message } });
  }
});

app.post('/api/v1/products', verifyToken, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { isPerishable, mfdDate, expiryDate } = req.body;
    
    // Validate perishable product dates
    if (isPerishable) {
      if (!mfdDate || !expiryDate) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Manufacturing and expiry dates are required for perishable products' }
        });
      }
      
      const mfd = new Date(mfdDate);
      const expiry = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (mfd > today) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Manufacturing date cannot be in the future' }
        });
      }
      
      if (expiry <= mfd) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Expiry date must be after manufacturing date' }
        });
      }
      
      if (expiry <= today) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Product is already expired' }
        });
      }
    }
    
    // Check for existing product with same displayId (conflict detection)
    const existingProduct = await prisma.product.findFirst({
      where: {
        displayId: req.body.displayId,
        organizationId: orgId
      }
    });
    
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Product already exists' },
        serverData: existingProduct
      });
    }
    
    const product = await financialService.createProduct(orgId, req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'PRODUCT_CREATE_ERROR', message: error.message } });
  }
});

app.put('/api/v1/products/:id/stock', verifyToken, async (req, res) => {
  try {
    const { quantity, operation, expectedVersion } = req.body;
    
    const product = await OptimisticLockingService.updateStockWithLock(
      req.params.id,
      quantity,
      operation,
      req.user.userId
    );
    
    res.json({ success: true, data: product });
  } catch (error) {
    if (error.message.includes('Concurrent modification') || error.message.includes('locked')) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONCURRENCY_ERROR', message: error.message }
      });
    }
    
    res.status(500).json({ success: false, error: { code: 'STOCK_UPDATE_ERROR', message: error.message } });
  }
});

app.post('/api/v1/payments', verifyToken, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const payment = await financialService.createPayment(orgId, req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'PAYMENT_CREATE_ERROR', message: error.message } });
  }
});

app.get('/api/v1/ledger', verifyToken, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const entries = await financialService.getLedgerEntries(orgId, req.query);
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'LEDGER_FETCH_ERROR', message: error.message } });
  }
});

app.get('/api/v1/reports/financial', verifyToken, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { startDate, endDate } = req.query;
    const summary = await financialService.getFinancialSummary(
      orgId, 
      new Date(startDate), 
      new Date(endDate)
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'REPORT_ERROR', message: error.message } });
  }
});

// Transaction monitoring endpoints
app.get('/api/v1/transactions', verifyToken, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const transactions = await financialService.getTransactions(orgId, req.query);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'TRANSACTION_FETCH_ERROR', message: error.message } });
  }
});

app.get('/api/v1/transactions/failed', verifyToken, async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const failedTransactions = await financialService.getFailedTransactions(orgId);
    res.json({ success: true, data: failedTransactions });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FAILED_TRANSACTION_FETCH_ERROR', message: error.message } });
  }
});

app.post('/api/v1/transactions/:id/rollback', verifyToken, async (req, res) => {
  try {
    await financialService.rollbackTransaction(req.params.id);
    res.json({ success: true, data: { message: 'Transaction rolled back successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'ROLLBACK_ERROR', message: error.message } });
  }
});

// QR code endpoints
app.post('/api/v1/qr/validate', verifyToken, async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = qrTokenService.validateToken(token);
    
    // Verify organization access
    if (decoded.orgUUID !== req.user.orgId) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Invalid organization' }
      });
    }
    
    // Fetch actual data based on type
    let data;
    if (decoded.type === 'product') {
      data = await prisma.product.findFirst({
        where: { id: decoded.id, organizationId: decoded.orgUUID }
      });
    } else if (decoded.type === 'invoice') {
      data = await prisma.invoice.findFirst({
        where: { id: decoded.id, organizationId: decoded.orgUUID },
        include: { lines: { include: { product: true } } }
      });
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' }
      });
    }
    
    res.json({
      success: true,
      data: {
        type: decoded.type,
        resource: data,
        tokenInfo: {
          timestamp: decoded.timestamp,
          age: Date.now() - decoded.timestamp
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_QR', message: error.message }
    });
  }
});

app.post('/api/v1/qr/generate', verifyToken, async (req, res) => {
  try {
    const { type, id } = req.body;
    const orgUUID = req.user.orgId;
    
    // Verify resource exists and belongs to organization
    let resource;
    if (type === 'product') {
      resource = await prisma.product.findFirst({
        where: { id, organizationId: orgUUID }
      });
    } else if (type === 'invoice') {
      resource = await prisma.invoice.findFirst({
        where: { id, organizationId: orgUUID }
      });
    }
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' }
      });
    }
    
    const token = qrTokenService.generateToken(id, orgUUID, type);
    
    res.json({
      success: true,
      data: {
        token,
        qrData: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QR_GENERATION_ERROR', message: error.message }
    });
  }
});

// QR PDF generation endpoints
app.post('/api/v1/qr/pdf/single', verifyToken, async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await prisma.product.findFirst({
      where: { id: productId, organizationId: req.user.orgId }
    });
    
    if (!product) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    }
    
    const pdfBuffer = await QRPDFGenerator.generateQRLabel({
      ...product,
      orgUUID: req.user.orgId
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${product.sku}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'PDF_ERROR', message: error.message } });
  }
});

app.post('/api/v1/qr/pdf/bulk', verifyToken, async (req, res) => {
  try {
    const { productIds } = req.body;
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, organizationId: req.user.orgId }
    });
    
    const productsWithOrg = products.map(p => ({ ...p, orgUUID: req.user.orgId }));
    const pdfBuffer = await QRPDFGenerator.generateBulkQRLabels(productsWithOrg);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="qr-labels-bulk.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'BULK_PDF_ERROR', message: error.message } });
  }
});

// Stock reservation endpoints
app.post('/api/v1/stock/reserve', verifyToken, async (req, res) => {
  try {
    const { productId, quantity, holdMinutes = 30, reference } = req.body;
    const holdUntil = new Date(Date.now() + holdMinutes * 60 * 1000);
    
    const reservation = await StockReservationService.reserveStock(
      req.user.orgId,
      productId,
      quantity,
      holdUntil,
      reference
    );
    
    res.status(201).json({ success: true, data: reservation });
  } catch (error) {
    res.status(400).json({ success: false, error: { code: 'RESERVATION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/stock/confirm-sale/:reservationId', verifyToken, async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { actualQuantity } = req.body;
    
    const result = await StockReservationService.confirmSale(
      req.user.orgId,
      reservationId,
      actualQuantity
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: { code: 'SALE_CONFIRMATION_ERROR', message: error.message } });
  }
});

app.delete('/api/v1/stock/reservation/:reservationId', verifyToken, async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    const result = await StockReservationService.releaseReservation(
      req.user.orgId,
      reservationId
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: { code: 'RELEASE_ERROR', message: error.message } });
  }
});

app.get('/api/v1/stock/available/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const availableStock = await StockReservationService.getAvailableStock(
      req.user.orgId,
      productId
    );
    
    res.json({ success: true, data: { availableStock } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'STOCK_CHECK_ERROR', message: error.message } });
  }
});

app.get('/api/v1/stock/reservations', verifyToken, async (req, res) => {
  try {
    const reservations = await StockReservationService.getReservations(
      req.user.orgId,
      req.query
    );
    
    res.json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'RESERVATIONS_FETCH_ERROR', message: error.message } });
  }
});

// Conflict resolution endpoints
app.get('/api/v1/conflicts', verifyToken, async (req, res) => {
  try {
    const conflicts = await ConflictResolutionService.getConflicts(
      req.user.orgId,
      req.query
    );
    
    res.json({ success: true, data: conflicts });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'CONFLICTS_FETCH_ERROR', message: error.message } });
  }
});

app.post('/api/v1/conflicts/:id/resolve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const resolution = req.body;
    
    const result = await ConflictResolutionService.resolveConflict(
      id,
      resolution,
      req.user.userId
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: { code: 'CONFLICT_RESOLUTION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/conflicts/auto-resolve', verifyToken, async (req, res) => {
  try {
    const resolved = await ConflictResolutionService.autoResolveConflicts(req.user.orgId);
    res.json({ success: true, data: { resolvedCount: resolved.length, resolvedIds: resolved } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'AUTO_RESOLVE_ERROR', message: error.message } });
  }
});

// POS endpoints
app.post('/api/v1/pos/sale', verifyToken, async (req, res) => {
  try {
    const result = await POSService.processSale(
      req.user.orgId,
      req.body,
      req.user.userId
    );
    
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'POS_SALE_ERROR', message: error.message } });
  }
});

app.get('/api/v1/pos/sales', verifyToken, async (req, res) => {
  try {
    const sales = await POSService.getOfflineSales(req.user.orgId);
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'POS_SALES_ERROR', message: error.message } });
  }
});

// Tax calculation endpoints
app.post('/api/v1/tax/calculate', verifyToken, async (req, res) => {
  try {
    const { invoiceLines, customerState } = req.body;
    
    const taxCalculation = await TaxEngine.calculateInvoiceTax(
      req.user.orgId,
      invoiceLines,
      customerState
    );
    
    res.json({ success: true, data: taxCalculation });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'TAX_CALCULATION_ERROR', message: error.message } });
  }
});

app.get('/api/v1/tax/rates', verifyToken, async (req, res) => {
  try {
    const rates = await TaxEngine.getTaxRates();
    res.json({ success: true, data: rates });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'TAX_RATES_ERROR', message: error.message } });
  }
});

app.post('/api/v1/tax/validate-gst', verifyToken, async (req, res) => {
  try {
    const { gstNumber } = req.body;
    const isValid = TaxEngine.validateGSTNumber(gstNumber);
    
    res.json({ success: true, data: { valid: isValid } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'GST_VALIDATION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/tax/exemptions', verifyToken, async (req, res) => {
  try {
    const exemption = await TaxEngine.applyTaxExemptions(
      req.user.orgId,
      req.body
    );
    
    res.json({ success: true, data: exemption });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'EXEMPTION_ERROR', message: error.message } });
  }
});

// Stock ledger endpoints
app.post('/api/v1/stock/move', verifyToken, async (req, res) => {
  try {
    const { productId, moveType, quantity, reference, description } = req.body;
    
    const result = await StockLedgerService.recordStockMove(
      req.user.orgId,
      productId,
      moveType,
      quantity,
      reference,
      description,
      req.user.userId
    );
    
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: { code: 'STOCK_MOVE_ERROR', message: error.message } });
  }
});

app.get('/api/v1/stock/ledger', verifyToken, async (req, res) => {
  try {
    const { productId, ...filters } = req.query;
    
    const ledger = await StockLedgerService.getStockLedger(
      req.user.orgId,
      productId,
      filters
    );
    
    res.json({ success: true, data: ledger });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'LEDGER_FETCH_ERROR', message: error.message } });
  }
});

app.get('/api/v1/stock/reconcile/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const reconciliation = await StockLedgerService.reconcileStock(
      req.user.orgId,
      productId
    );
    
    res.json({ success: true, data: reconciliation });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'RECONCILIATION_ERROR', message: error.message } });
  }
});

app.get('/api/v1/stock/summary', verifyToken, async (req, res) => {
  try {
    const { asOfDate } = req.query;
    
    const summary = await StockLedgerService.getStockSummary(
      req.user.orgId,
      asOfDate ? new Date(asOfDate) : undefined
    );
    
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SUMMARY_ERROR', message: error.message } });
  }
});

app.post('/api/v1/stock/adjust', verifyToken, async (req, res) => {
  try {
    const { productId, newStock, reason } = req.body;
    
    const result = await StockLedgerService.createStockAdjustment(
      req.user.orgId,
      productId,
      newStock,
      reason,
      req.user.userId
    );
    
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: { code: 'ADJUSTMENT_ERROR', message: error.message } });
  }
});

// Optimistic locking endpoints
app.put('/api/v1/products/:id/with-version', verifyToken, async (req, res) => {
  try {
    const { expectedVersion, ...data } = req.body;
    
    const updated = await OptimisticLockingService.updateWithVersionCheck(
      'product',
      req.params.id,
      { ...data, updatedBy: req.user.userId },
      expectedVersion
    );
    
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.message.includes('Concurrent modification')) {
      return res.status(409).json({
        success: false,
        error: { code: 'VERSION_CONFLICT', message: error.message }
      });
    }
    
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: error.message } });
  }
});

// QR metadata sync endpoints
app.put('/api/v1/qr/metadata/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await QRMetadataSync.updateQRMetadata(
      productId,
      req.user.orgId,
      req.body,
      req.user.userId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'METADATA_UPDATE_ERROR', message: error.message } });
  }
});

app.get('/api/v1/qr/metadata/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const metadata = await QRMetadataSync.getQRMetadata(productId, req.user.orgId);
    res.json({ success: true, data: metadata });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'METADATA_FETCH_ERROR', message: error.message } });
  }
});

app.get('/api/v1/qr/sync-history', verifyToken, async (req, res) => {
  try {
    const history = await QRMetadataSync.getSyncHistory(req.user.orgId);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SYNC_HISTORY_ERROR', message: error.message } });
  }
});

// Dashboard data endpoint
app.get('/api/v1/dashboard/data', verifyToken, async (req, res) => {
  try {
    const dashboardData = await ExportService.getDashboardData(req.user.orgId);
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'DASHBOARD_ERROR', message: error.message } });
  }
});

// Financial summary endpoint
app.get('/api/v1/financial/summary', verifyToken, async (req, res) => {
  try {
    const { period = 'current_month' } = req.query;
    const summary = await FinancialSummaryService.getFinancialSummary(
      req.user.orgId,
      period
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'FINANCIAL_SUMMARY_ERROR', message: error.message } });
  }
});

// KPI data endpoint
app.get('/api/v1/financial/kpis', verifyToken, async (req, res) => {
  try {
    const { timeframe = 'monthly', limit = 12 } = req.query;
    const kpis = await FinancialSummaryService.getKPIData(
      req.user.orgId,
      timeframe,
      parseInt(limit)
    );
    res.json({ success: true, data: kpis });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'KPI_DATA_ERROR', message: error.message } });
  }
});

// Refresh views endpoint
app.post('/api/v1/financial/refresh-views', verifyToken, async (req, res) => {
  try {
    await FinancialSummaryService.refreshViews();
    res.json({ success: true, data: { message: 'Views refreshed successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'REFRESH_ERROR', message: error.message } });
  }
});

// Export endpoints
app.get('/api/v1/export/invoices/pdf', verifyToken, async (req, res) => {
  try {
    const pdfBuffer = await ExportService.exportInvoicesPDF(req.user.orgId, req.query);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices-report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'PDF_EXPORT_ERROR', message: error.message } });
  }
});

app.get('/api/v1/export/invoices/excel', verifyToken, async (req, res) => {
  try {
    const excelBuffer = await ExportService.exportInvoicesExcel(req.user.orgId, req.query);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices-report.xlsx"');
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'EXCEL_EXPORT_ERROR', message: error.message } });
  }
});

app.get('/api/v1/export/invoices/csv', verifyToken, async (req, res) => {
  try {
    const csvData = await ExportService.exportInvoicesCSV(req.user.orgId, req.query);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices-report.csv"');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'CSV_EXPORT_ERROR', message: error.message } });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'RESOURCE_NOT_FOUND', message: 'Endpoint not found' }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 setLedger API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  
  // Start background jobs
  ReservationCleanupJob.startScheduler();
  ViewRefreshJob.startScheduler();
  ReminderJob.startScheduler();
  UpdateCreditLimitsJob.startScheduler();
});

module.exports = app;