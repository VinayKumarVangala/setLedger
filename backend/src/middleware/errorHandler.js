const logger = require('../utils/logger');
const logService = require('../services/logService');
const crashlyticsService = require('../services/crashlyticsService');

// Centralized error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userID,
    orgId: req.user?.orgID
  });
  
  // Log to our service
  logService.error(err.message, err, {
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.userID,
    orgId: req.user?.orgID,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Record crash if it's a serious error
  if ((error.statusCode || 500) >= 500) {
    crashlyticsService.recordError(err, {
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.userID,
      orgId: req.user?.orgID
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.name || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error'
    }
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userID
    });
    
    // Log to our service
    logService.info(`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration,
      ip: req.ip,
      userId: req.user?.userID
    });
    
    // Record breadcrumb
    crashlyticsService.recordBreadcrumb(
      `${req.method} ${req.originalUrl}`,
      'request',
      'info'
    );
  });
  
  next();
};

module.exports = { errorHandler, asyncHandler, requestLogger };