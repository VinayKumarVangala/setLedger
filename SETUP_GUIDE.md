# 🚀 setLedger Setup Guide

## Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **Python**: 3.9 or higher
- **MongoDB**: Atlas account (free tier available)
- **Firebase**: Project with Authentication, Firestore, FCM enabled
- **Git**: For version control

### API Keys Required
- MongoDB Atlas connection string
- Firebase configuration
- Gemini API key (optional, for AI features)
- Email service credentials (optional, for notifications)

---

## 🔧 Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/setLedger.git
cd setLedger
```

### 2. Install Dependencies
```bash
# Install all dependencies at once
npm run install:all

# Or install individually:
npm install                    # Root dependencies
cd backend && npm install      # Backend dependencies
cd ../frontend && npm install  # Frontend dependencies
cd ../ai-service && pip install -r requirements.txt  # AI service
```

### 3. Environment Configuration

#### Backend Environment (.env)
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/setledger
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-32-chars-min
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-character-encryption-key

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Email Service (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# AI Services (Optional)
GEMINI_API_KEY=your-gemini-api-key

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

#### Frontend Environment (.env)
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_AI_SERVICE_URL=http://localhost:5001

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# Optional
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
```

#### AI Service Environment (.env)
```bash
cd ai-service
cp .env.example .env
```

Edit `ai-service/.env`:
```env
FLASK_ENV=development
FLASK_DEBUG=True
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/setledger
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Firebase Setup

1. **Create Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com/)
2. **Enable Authentication**: Email/Password + Phone providers
3. **Create Firestore Database**: Start in test mode
4. **Enable Cloud Messaging**: For push notifications
5. **Generate Service Account**: Download JSON and extract credentials
6. **Add Web App**: Get configuration for frontend

### 5. MongoDB Setup

1. **Create MongoDB Atlas Account**: [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create Cluster**: Free tier M0 is sufficient for development
3. **Create Database User**: With read/write permissions
4. **Whitelist IP**: Add your IP or 0.0.0.0/0 for development
5. **Get Connection String**: Replace username/password in MONGO_URI

---

## 🏃‍♂️ Running the Application

### Development Mode

#### Option 1: Run All Services
```bash
# From root directory
npm run dev          # Starts frontend + backend
npm run ai-service   # In separate terminal for AI features
```

#### Option 2: Run Services Individually
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3: AI Service (Optional)
cd ai-service
python app.py
```

### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:5001
- **API Documentation**: http://localhost:5000/api/v1/health

---

## 🔐 Security Setup

### Run Security Audit
```bash
# Full security audit
npm run security:audit

# Authentication tests only
cd backend
npm run test:security
```

### Environment Security Checklist
- [ ] JWT_SECRET is 32+ characters and unique
- [ ] ENCRYPTION_KEY is 32 characters
- [ ] MongoDB connection uses authentication
- [ ] Firebase private key is properly formatted
- [ ] CORS_ORIGIN is set to your domain (not *)
- [ ] All .env files are in .gitignore

---

## 📱 PWA Setup (Optional)

### Enable Offline Features
1. **Service Worker**: Already configured in `public/sw.js`
2. **Manifest**: PWA manifest in `public/manifest.json`
3. **Install Prompt**: Automatic on supported browsers

### Push Notifications
1. **Firebase Messaging**: Configure in Firebase Console
2. **VAPID Keys**: Generate in Firebase Console settings
3. **Service Worker**: Update `firebase-messaging-sw.js` with config

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # All tests
npm run test:security      # Security tests only
```

### Frontend Tests
```bash
cd frontend
npm test
```

### End-to-End Testing
```bash
# Start all services first
npm run dev

# Run security audit
npm run security:audit
```

---

## 🚀 Deployment

### Backend Deployment (Render/Heroku)
1. **Connect Repository**: Link GitHub repo
2. **Set Environment Variables**: Copy from .env
3. **Deploy**: Automatic on push to main branch

### Frontend Deployment (Netlify/Vercel)
1. **Build Command**: `npm run build`
2. **Publish Directory**: `build`
3. **Environment Variables**: Set REACT_APP_* variables

### AI Service Deployment
1. **Docker**: Use provided Dockerfile
2. **Environment**: Set Python environment variables
3. **Dependencies**: Ensure requirements.txt is updated

---

## 🔧 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Check connection string format
mongodb+srv://username:password@cluster.mongodb.net/database

# Verify IP whitelist in MongoDB Atlas
# Check username/password are correct
```

#### Firebase Authentication Error
```bash
# Verify Firebase config in .env
# Check service account JSON format
# Ensure Authentication is enabled in Firebase Console
```

#### Port Already in Use
```bash
# Kill process on port
lsof -ti:5000 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:5001 | xargs kill -9  # AI Service
```

#### AI Service Not Starting
```bash
# Check Python version
python --version  # Should be 3.9+

# Install dependencies
pip install -r requirements.txt

# Check Flask environment
export FLASK_ENV=development
```

### Getting Help
1. **Check Logs**: Backend logs in `backend/logs/`
2. **Browser Console**: For frontend errors
3. **Network Tab**: For API call issues
4. **Security Audit**: Run `npm run security:audit`

---

## 📚 Next Steps

After successful setup:
1. **Create Organization**: Register first admin user
2. **Invite Members**: Add team members with appropriate roles
3. **Configure Products**: Add your inventory
4. **Set Up GST**: Configure tax settings
5. **Generate First Invoice**: Test the billing system
6. **Explore AI Features**: Try stock predictions and pricing optimization

For detailed usage instructions, see [UserManual.md](./UserManual.md).