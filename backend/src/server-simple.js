const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple in-memory storage for testing
let users = [];
let organizations = [];
let orgCounter = 1000; // Starting org ID
let userCounters = {}; // Track user count per org

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

// Basic auth endpoints
app.post('/api/v1/auth/register', (req, res) => {
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

  // Create organization with sequential ID
  const orgId = `ORG${orgCounter++}`;
  const organization = {
    id: orgId,
    name: orgName || `${name}'s Organization`,
    createdAt: new Date().toISOString(),
    memberCount: 1
  };
  organizations.push(organization);

  // Initialize user counter for this org
  userCounters[orgId] = 1;

  // Create user with orgID-serialNumber format
  const userId = `${orgId}-${userCounters[orgId]++}`;
  const user = {
    id: userId,
    name,
    email,
    orgId,
    role: 'admin',
    createdAt: new Date().toISOString()
  };
  users.push(user);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId
      },
      organization,
      token: 'demo-jwt-token-' + Date.now()
    }
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    });
  }

  const organization = organizations.find(o => o.id === user.orgId);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId
      },
      organization,
      token: 'demo-jwt-token-' + Date.now()
    }
  });
});

// 2FA endpoints
app.post('/api/v1/auth/setup-2fa', (req, res) => {
  const userId = req.headers['x-user-id'] || users[0]?.id;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    });
  }

  // Generate TOTP secret (in real app, use speakeasy)
  const secret = 'DEMO_SECRET_' + Date.now();
  const qrCodeUrl = `otpauth://totp/setLedger:${user.email}?secret=${secret}&issuer=setLedger`;
  
  res.json({
    success: true,
    data: {
      secret,
      qrCodeUrl,
      manualEntryKey: secret
    }
  });
});

app.post('/api/v1/auth/verify-2fa', (req, res) => {
  const { token } = req.body;
  const userId = req.headers['x-user-id'] || users[0]?.id;
  
  // In real app, verify TOTP token with speakeasy
  const isValid = token === '123456'; // Demo validation
  
  if (isValid) {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].twoFactorEnabled = true;
    }
    
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
});

// User profile endpoints
app.get('/api/v1/user/profile', (req, res) => {
  // In real app, get user from JWT token
  const userId = req.headers['x-user-id'] || users[0]?.id;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    });
  }

  const organization = organizations.find(o => o.id === user.orgId);
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        createdAt: user.createdAt
      },
      organization
    }
  });
});

app.put('/api/v1/user/profile', (req, res) => {
  const userId = req.headers['x-user-id'] || users[0]?.id;
  const { name, email } = req.body;
  
  const userIndex = users.findIndex(u => u.id === userId);
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
      user: users[userIndex]
    }
  });
});

// Dashboard data endpoint
app.get('/api/v1/dashboard/data', (req, res) => {
  res.json({
    success: true,
    data: {
      revenue: 125000,
      alerts: [
        { type: 'low_stock', message: 'Sample Product is running low (5 left)', product: 'Sample Product', quantity: 5 }
      ],
      recommendations: [
        'Add more products to your inventory',
        'Consider setting up automated backups'
      ],
      stats: {
        totalProducts: 10,
        pendingInvoices: 3,
        lowStockCount: 1
      },
      recentTransactions: [
        {
          id: '1',
          description: 'Sample Sale',
          amount: 1500,
          type: 'credit',
          date: new Date().toISOString()
        }
      ]
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
});

module.exports = app;