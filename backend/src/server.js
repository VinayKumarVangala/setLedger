const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const envConfig = require('./config/env');
const Database = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, requestLogger } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const organizationRoutes = require('./routes/organization');
const productRoutes = require('./routes/product');
const invoiceRoutes = require('./routes/invoice');
const stockRoutes = require('./routes/stock');
const accountingRoutes = require('./routes/accounting');
const backupRoutes = require('./routes/backup');
const analyticsRoutes = require('./routes/analytics');
const aiAssistantRoutes = require('./routes/aiAssistant');
const gstRoutes = require('./routes/gst');
const taxReminderRoutes = require('./routes/taxReminders');
const financialReportRoutes = require('./routes/financialReports');
const cloudSyncRoutes = require('./routes/cloudSync');
const syncRoutes = require('./routes/sync');
const adminRoutes = require('./routes/admin');
const userProfileRoutes = require('./routes/userProfile');
const dashboardRoutes = require('./routes/dashboard');
const securityRoutes = require('./routes/security');
const stockMonitor = require('./jobs/stockMonitor');
const backupJob = require('./jobs/backupJob');
const taxReminderJob = require('./jobs/taxReminderJob');
const autoSyncJob = require('./jobs/autoSyncJob');

const app = express();
const PORT = envConfig.server.port;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: envConfig.security.corsOrigin,
  credentials: true
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: envConfig.security.rateLimitWindow,
  max: envConfig.security.rateLimitMax,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
  }
});
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/accounting', accountingRoutes);
app.use('/api/v1/backup', backupRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ai-assistant', aiAssistantRoutes);
app.use('/api/v1/gst', gstRoutes);
app.use('/api/v1/tax-reminders', taxReminderRoutes);
app.use('/api/v1/financial-reports', financialReportRoutes);
app.use('/api/v1/cloud-sync', cloudSyncRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/user-profile', userProfileRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/security', securityRoutes);

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'RESOURCE_NOT_FOUND', message: 'Endpoint not found' }
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await Database.connect();
    
    app.listen(PORT, () => {
      console.log(`🚀 setLedger API server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`);
      
      // Start background jobs
      stockMonitor.start();
      backupJob.start();
      taxReminderJob.start();
      autoSyncJob.start();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await Database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await Database.disconnect();
  process.exit(0);
});

startServer();

module.exports = app;