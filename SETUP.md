# 🚀 setLedger Setup Guide

## 📋 Prerequisites

- Node.js 18+ 
- Python 3.9+
- Git

## 🔧 Quick Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/setLedger.git
cd setLedger
```

### 2. Complete Setup with Virtual Environment
```bash
# Automated setup (recommended)
./setup-venv.sh

# OR Manual setup
python3 -m venv venv
source venv/bin/activate
pip install flask scikit-learn numpy pandas
npm run setup
```

### 3. Update Environment Files
Edit each `.env` file and replace placeholder values:

**Root `.env`:**
```env
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
KMS_KEY=your-generated-kms-key-here
```

**Backend `.env`:**
```env
MONGO_URI=mongodb://localhost:27017/setledger
POSTGRES_URL=postgresql://username:password@localhost:5432/setledger
PORT=5000
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_AI_SERVICE_URL=http://localhost:5001
```

**AI Service `.env`:**
```env
PORT=5001
FLASK_ENV=development
```

### 4. Start All Services
```bash
source venv/bin/activate
npm run start-all
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1/health
- **AI Service**: http://localhost:5001/health

## 🔒 Security Setup

### File Permissions
```bash
chmod 600 .env backend/.env frontend/.env ai-service/.env
```

### Verify Security
```bash
# Check for exposed secrets
git status
git diff --cached

# Run security audit
npm audit
```

## 🎯 First Steps

1. Open http://localhost:3000
2. Click "Create New Organization"
3. Fill in admin details
4. Start using the system!

## 🔧 Development Commands

**Always activate virtual environment first:**
```bash
source venv/bin/activate
```

**Then run commands:**
```bash
# Start individual services
npm run backend:dev    # Backend only
npm run frontend:dev   # Frontend only
npm run ai-service     # AI service only

# Testing
npm test               # Run tests
node test-ai-accuracy.js  # Test AI accuracy

# Build for production
npm run build
```

## 🚨 Troubleshooting

### Common Issues:

**Port already in use:**
```bash
# Kill processes on ports
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:5000 | xargs kill -9
sudo lsof -ti:5001 | xargs kill -9
```

**Missing dependencies:**
```bash
# Reinstall all dependencies
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

**Virtual environment issues:**
```bash
# Recreate entire virtual environment
rm -rf venv ai-service/venv
./setup-venv.sh

# OR recreate AI service only
cd ai-service
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install flask scikit-learn numpy pandas
```

## 📚 Next Steps

- Read [SECURITY.md](./SECURITY.md) for security guidelines
- Check [README.md](./README.md) for feature overview
- Review [ARCHITECTURE.md](./ARCHITECTURE_UPDATE.md) for technical details

---

**Need help?** Check the troubleshooting section or create an issue on GitHub.