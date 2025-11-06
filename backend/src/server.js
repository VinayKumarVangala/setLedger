const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'setLedger Backend'
    }
  });
});

// Basic auth endpoints
app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password, orgName } = req.body;
  
  // Mock registration - accept any data for demo
  if (name && email && password && orgName) {
    const mockUser = {
      id: 1,
      name: name,
      email: email,
      orgId: 'ORG1000',
      displayId: 'ORG1000-1',
      orgDisplayId: 'ORG1000',
      role: 'admin'
    };
    
    res.json({
      success: true,
      data: {
        accessToken: 'mock-jwt-token-' + Date.now(),
        user: mockUser
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: { message: 'All fields are required' }
    });
  }
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication - accept any email/password for demo
  if (email && password) {
    const mockUser = {
      id: 1,
      name: 'Demo User',
      email: email,
      orgId: 'ORG1000',
      displayId: 'ORG1000-1',
      orgDisplayId: 'ORG1000',
      role: 'admin'
    };
    
    res.json({
      success: true,
      data: {
        accessToken: 'mock-jwt-token-' + Date.now(),
        user: mockUser
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: { message: 'Email and password are required' }
    });
  }
});

app.post('/api/v1/auth/refresh', (req, res) => {
  res.json({
    success: true,
    data: {
      accessToken: 'mock-jwt-token-refreshed-' + Date.now()
    }
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
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
  console.log(`🚀 setLedger Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

module.exports = app;