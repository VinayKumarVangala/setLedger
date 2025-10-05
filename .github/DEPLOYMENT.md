# 🚀 setLedger Deployment Guide

## 📋 Overview
Automated CI/CD pipeline with GitHub Actions for deploying:
- **Backend**: Render (primary) or Heroku (alternative)
- **Frontend**: GitHub Pages
- **Database**: MongoDB Atlas

## 🔧 Required GitHub Secrets

### Backend Deployment (Render)
```
RENDER_SERVICE_ID=srv_xxxxxxxxxxxxx
RENDER_API_KEY=rnd_xxxxxxxxxxxxx
BACKEND_URL=https://your-app.onrender.com
```

### Backend Deployment (Heroku - Alternative)
```
HEROKU_API_KEY=xxxxxxxxxxxxx
HEROKU_APP_NAME=setledger-backend
HEROKU_EMAIL=your-email@example.com
```

### Frontend Deployment (GitHub Pages)
```
REACT_APP_API_URL=https://your-backend.onrender.com/api/v1
REACT_APP_FIREBASE_API_KEY=xxxxxxxxxxxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
PUBLIC_URL=https://yourusername.github.io/setLedger
CUSTOM_DOMAIN=setledger.yourdomain.com (optional)
```

### Database & Services
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/setledger
MONGO_TEST_URI=mongodb+srv://user:pass@cluster.mongodb.net/setledger_test
```

## 🏗️ Setup Instructions

### 1. Repository Setup
```bash
# Enable GitHub Pages
# Go to Settings > Pages > Source: GitHub Actions

# Enable Actions
# Go to Settings > Actions > Allow all actions
```

### 2. Render Setup (Backend)
```bash
# 1. Create Render account
# 2. Connect GitHub repository
# 3. Create Web Service:
#    - Build Command: cd backend && npm install
#    - Start Command: cd backend && npm start
#    - Environment: Node
# 4. Add environment variables in Render dashboard
# 5. Copy Service ID and API Key to GitHub Secrets
```

### 3. MongoDB Atlas Setup
```bash
# 1. Create MongoDB Atlas cluster
# 2. Create database user
# 3. Whitelist IP addresses (0.0.0.0/0 for cloud deployment)
# 4. Get connection string
# 5. Add to GitHub Secrets as MONGO_URI
```

### 4. Firebase Setup
```bash
# 1. Create Firebase project
# 2. Enable Authentication
# 3. Generate service account key
# 4. Add credentials to GitHub Secrets
```

## 🔄 Deployment Workflows

### Automatic Deployments
- **Main Branch Push**: Triggers production deployment
- **Develop Branch Push**: Triggers staging deployment (if configured)
- **Pull Request**: Runs tests and quality checks only

### Manual Deployments
```bash
# Trigger manual deployment
gh workflow run "Backend Deploy"
gh workflow run "Frontend Deploy"
```

## 📊 Monitoring & Health Checks

### Backend Health Check
```bash
curl https://your-backend.onrender.com/api/v1/health
```

### Frontend Deployment Status
```bash
# Check GitHub Pages deployment
# Go to Actions tab > Pages build and deployment
```

### Logs & Debugging
```bash
# Render logs
# Dashboard > Service > Logs

# GitHub Actions logs
# Repository > Actions > Workflow run
```

## 🛡️ Security Considerations

### Environment Variables
- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate API keys regularly
- Use different secrets for staging/production

### Database Security
- Enable MongoDB Atlas IP whitelisting
- Use strong database passwords
- Enable database encryption
- Regular backup verification

### API Security
- HTTPS enforcement in production
- CORS configuration for frontend domain
- Rate limiting enabled
- JWT secret rotation

## 🔧 Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check Node.js version compatibility
# Verify package.json scripts
# Review dependency conflicts
```

**Deployment Failures:**
```bash
# Verify environment variables
# Check service quotas/limits
# Review deployment logs
```

**Database Connection:**
```bash
# Verify connection string format
# Check IP whitelist settings
# Test connection locally first
```

### Debug Commands
```bash
# Test backend locally
cd backend && npm run dev

# Test frontend build
cd frontend && npm run build

# Run tests
npm test

# Check linting
npm run lint
```

## 📈 Performance Optimization

### Backend Optimization
- Enable compression middleware
- Implement caching strategies
- Database query optimization
- Connection pooling

### Frontend Optimization
- Code splitting and lazy loading
- Asset optimization
- CDN integration
- Service worker caching

This deployment setup ensures reliable, automated deployments with proper monitoring and security measures.