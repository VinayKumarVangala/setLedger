# 🚀 One Command Start - setLedger

## ✅ Issues Fixed
- ✅ Missing JWT_REFRESH_SECRET and TOTP_SECRET added
- ✅ Missing index.html created for frontend
- ✅ Single command startup script created

## 🎯 Start Everything with One Command

```bash
cd /home/vinaykumar-vangala/PROJECTS/setLedger
npm run start-all
```

This single command will:
- 🔧 Start backend server (port 5000)
- 📱 Start frontend application (port 3000)  
- 🤖 Start AI service (port 5001) - if available

## 🌐 Access Points
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000/api/v1/health
- **AI Service**: http://localhost:5001 (optional)

## 🛑 Stop All Services
Press `Ctrl+C` in the terminal to stop all services at once.

## 📋 What's Included

### ✅ Core Features (Always Available)
- User management and authentication
- Product management with QR codes
- Professional invoice generation
- Offline-capable POS system
- Real-time inventory tracking
- Financial analytics and reports
- GST compliance and tax reports
- Backup and sync capabilities

### 🤖 AI Features (If AI Service Starts)
- Stock demand predictions
- Price optimization suggestions
- Business insights and recommendations
- Natural language query processing

## 🔧 Alternative Commands

If you prefer separate control:

```bash
# Backend only
cd backend && npm run dev

# Frontend only  
cd frontend && npm start

# AI service only
cd ai-service && python3 app.py
```

## 🎯 First Steps After Starting

1. **Open Browser**: Go to http://localhost:3000
2. **Create Organization**: Click "Create New Organization"
3. **Set Up Admin**: Fill in your details
4. **Add Products**: Start with your inventory
5. **Create Invoice**: Test the billing system
6. **Try POS**: Use the point of sale interface

## 🎉 Success Indicators

You'll know it's working when:
- ✅ No error messages in terminal
- ✅ Frontend loads at localhost:3000
- ✅ Backend health check works at localhost:5000/api/v1/health
- ✅ You can create an organization and login

**The complete setLedger suite is now ready with one command startup!**