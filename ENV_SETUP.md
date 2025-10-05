# 🔧 Environment Configuration Guide

## 📋 Overview
Complete guide for setting up environment variables for setLedger's backend and frontend applications.

---

## 🗂️ File Structure
```
setLedger/
├── .env.example              # Master template with all variables
├── backend/
│   ├── .env.example         # Backend-specific template
│   ├── .env                 # Backend environment (create from template)
│   └── src/config/env.js    # Environment configuration manager
├── frontend/
│   ├── .env.example         # Frontend-specific template
│   ├── .env                 # Frontend environment (create from template)
│   └── src/config/env.js    # Environment configuration manager
└── ENV_SETUP.md            # This guide
```

---

## 🚀 Quick Setup

### 1. Backend Environment Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

### 2. Frontend Environment Setup
```bash
cd frontend
cp .env.example .env
# Edit .env with your actual values
```

---

## 🔑 Required Environment Variables

### 🗄️ Database Configuration
```env
# MongoDB Atlas or Local MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/setledger
MONGO_TEST_URI=mongodb://localhost:27017/setledger_test
```

**Setup Instructions:**
1. Create MongoDB Atlas account
2. Create cluster and database
3. Create database user with read/write permissions
4. Whitelist IP addresses (0.0.0.0/0 for cloud deployment)
5. Copy connection string

### 🔐 JWT Configuration
```env
# Generate strong secrets (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-token-secret-different-from-jwt
```

**Generate Secrets:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### 🔒 TOTP Configuration
```env
TOTP_SECRET=your-totp-master-secret-for-generating-user-secrets
TOTP_ISSUER=setLedger
```

**Generate TOTP Secret:**
```bash
node -e "console.log(require('speakeasy').generateSecret().base32)"
```

### 🔥 Firebase Configuration
```env
# Backend (Admin SDK)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com

# Frontend (Web SDK)
REACT_APP_FIREBASE_API_KEY=your-firebase-web-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
```

**Setup Instructions:**
1. Create Firebase project
2. Enable Authentication
3. Generate service account key (for backend)
4. Get web app config (for frontend)

### 🤖 AI Services Configuration
```env
AI_API_KEY=your-primary-ai-service-key
GEMINI_API_KEY=your-google-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
```

**Setup Instructions:**
1. **Google Gemini**: Get API key from Google AI Studio
2. **OpenAI**: Get API key from OpenAI platform
3. Choose primary service with `AI_API_KEY`

### 📧 Email Service Configuration
```env
EMAIL_API_KEY=your-sendgrid-or-mailgun-api-key
EMAIL_FROM=noreply@setledger.com
EMAIL_SERVICE=sendgrid
```

**Supported Services:**
- **SendGrid**: Get API key from SendGrid dashboard
- **Mailgun**: Get API key from Mailgun dashboard
- **AWS SES**: Configure AWS credentials

---

## 🌍 Environment-Specific Configuration

### Development Environment
```env
NODE_ENV=development
REACT_APP_DEBUG_MODE=true
REACT_APP_MOCK_API=false
```

### Staging Environment
```env
NODE_ENV=staging
REACT_APP_DEBUG_MODE=false
REACT_APP_MOCK_API=false
```

### Production Environment
```env
NODE_ENV=production
REACT_APP_DEBUG_MODE=false
GENERATE_SOURCEMAP=false
```

---

## 🔧 Configuration Managers

### Backend Configuration (`backend/src/config/env.js`)
```javascript
const envConfig = require('./config/env');

// Usage examples
console.log(envConfig.database.uri);
console.log(envConfig.jwt.secret);
console.log(envConfig.firebase.projectId);
```

### Frontend Configuration (`frontend/src/config/env.js`)
```javascript
import envConfig from './config/env';

// Usage examples
console.log(envConfig.api.baseUrl);
console.log(envConfig.firebase.apiKey);
console.log(envConfig.features.aiFeatures);
```

---

## 🛡️ Security Best Practices

### Secret Management
- ✅ Use strong, unique secrets for each environment
- ✅ Rotate secrets regularly (quarterly recommended)
- ✅ Never commit `.env` files to version control
- ✅ Use different secrets for development/staging/production
- ✅ Store production secrets in secure vaults

### Environment Isolation
- ✅ Separate databases for each environment
- ✅ Different Firebase projects for staging/production
- ✅ Unique API keys per environment
- ✅ Environment-specific rate limits

### Access Control
- ✅ Limit database user permissions
- ✅ Use IP whitelisting where possible
- ✅ Enable audit logging
- ✅ Monitor for unauthorized access

---

## 🚨 Troubleshooting

### Common Issues

**MongoDB Connection Failed:**
```bash
# Check connection string format
# Verify username/password
# Check IP whitelist
# Test connection: mongosh "your-connection-string"
```

**JWT Token Invalid:**
```bash
# Verify JWT_SECRET is set and consistent
# Check token expiration settings
# Ensure secret is minimum 32 characters
```

**Firebase Authentication Error:**
```bash
# Verify project ID matches
# Check private key format (newlines)
# Ensure service account has proper permissions
```

**Environment Variables Not Loading:**
```bash
# Check .env file location
# Verify variable names (REACT_APP_ prefix for frontend)
# Restart development server after changes
```

### Debug Commands
```bash
# Backend: Check loaded configuration
node -e "console.log(require('./src/config/env').getAllConfig())"

# Frontend: Check environment variables
npm start # Check browser console for config logs
```

---

## 📝 Environment Variable Checklist

### Backend Required Variables
- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - JWT signing secret (32+ chars)
- [ ] `JWT_REFRESH_SECRET` - Refresh token secret
- [ ] `TOTP_SECRET` - TOTP master secret

### Backend Optional Variables
- [ ] `FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `AI_API_KEY` - AI service API key
- [ ] `EMAIL_API_KEY` - Email service API key
- [ ] `GST_API_KEY` - GST service API key

### Frontend Required Variables
- [ ] `REACT_APP_API_URL` - Backend API URL

### Frontend Optional Variables
- [ ] `REACT_APP_FIREBASE_API_KEY` - Firebase web API key
- [ ] `REACT_APP_ENABLE_AI_FEATURES` - AI features flag
- [ ] `PUBLIC_URL` - Deployment public URL

---

## 🔄 Environment Sync

### Development to Staging
```bash
# Copy and modify for staging
cp backend/.env backend/.env.staging
# Update staging-specific values
```

### Staging to Production
```bash
# Use secure deployment pipeline
# Never copy secrets directly
# Use environment-specific secret management
```

This guide ensures secure and consistent environment configuration across all setLedger deployments.