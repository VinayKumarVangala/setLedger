# 🚀 Start setLedger Locally (Fixed Issues)

## ✅ Issues Fixed
- ✅ `concurrently` dependency installed
- ✅ Python command fixed (`python3` instead of `python`)
- ✅ Basic `.env` files created for immediate testing
- ✅ Local MongoDB configuration ready

## 🏃‍♂️ Start Application Now

### 1. Install Dependencies (if not done)
```bash
cd /home/vinaykumar-vangala/PROJECTS/setLedger
npm install
```

### 2. Start Backend & Frontend
```bash
npm run dev
```

### 3. Start AI Service (Optional)
```bash
# In a new terminal
npm run ai-service
```

## 🌐 Access Points
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000/api/v1/health
- **AI Service**: http://localhost:5001 (if running)

## 📋 First Steps
1. **Open Browser**: Go to http://localhost:3000
2. **Create Organization**: Click "Create New Organization"
3. **Add Admin User**: Fill in your details
4. **Start Using**: Add products, create invoices, try POS

## 🔧 Local Configuration

### MongoDB Options
**Option 1: Local MongoDB**
```bash
# Install MongoDB locally
sudo apt install mongodb-server  # Ubuntu
brew install mongodb/brew/mongodb-community  # macOS

# Start MongoDB
sudo systemctl start mongodb  # Ubuntu
brew services start mongodb/brew/mongodb-community  # macOS
```

**Option 2: MongoDB Atlas (Recommended)**
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create cluster
3. Get connection string
4. Update `backend/.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/setledger
```

### Environment Files Created
- ✅ `backend/.env` - Basic backend configuration
- ✅ `frontend/.env` - Frontend API URLs
- ✅ `ai-service/.env` - AI service configuration

## 🎯 Test Core Features

### Without External Services
- ✅ Product Management
- ✅ Basic Invoicing
- ✅ POS System
- ✅ Inventory Tracking
- ✅ User Management

### With MongoDB Atlas
- ✅ Data Persistence
- ✅ Multi-user Support
- ✅ Full Analytics

### With Firebase (Optional)
- ✅ Cloud Backup
- ✅ Push Notifications
- ✅ Enhanced Authentication

## 🆘 Still Having Issues?

### Check Ports
```bash
# Verify nothing is running on required ports
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :5001  # AI Service
```

### Check Node/Python Versions
```bash
node --version    # Should be 18+
python3 --version # Should be 3.9+
npm --version     # Should be 8+
```

### Manual Start (Alternative)
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm start

# Terminal 3: AI Service (Optional)
cd ai-service
python3 app.py
```

## 🎉 Success!
If you can access http://localhost:3000 and see the setLedger interface, you're ready to go!

**Next**: Follow the [UserManual.md](./UserManual.md) for detailed usage instructions.