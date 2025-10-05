const express = require('express');
const rateLimit = require('express-rate-limit');
const envConfig = require('../config/env');
const AuthController = require('../controllers/auth');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envConfig.security.authRateLimitMax,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many attempts, try again later' }
  },
  standardHeaders: true,
  legacyHeaders: false
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: envConfig.security.otpRateLimitMax,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many OTP requests' }
  }
});

// Public routes
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/email-otp/send', otpLimiter, AuthController.sendEmailOTP);
router.post('/email-otp/verify', authLimiter, AuthController.verifyEmailOTP);

// Protected routes (require authentication)
router.post('/totp/setup', verifyToken, AuthController.setupTOTP);
router.post('/totp/verify', verifyToken, AuthController.verifyTOTP);

module.exports = router;