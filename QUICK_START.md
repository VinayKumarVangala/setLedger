# ⚡ setLedger Quick Start

## 🚀 5-Minute Setup

### Prerequisites Check
```bash
node --version     # Should be 18+
python3 --version  # Should be 3.9+ (use python3, not python)
git --version      # Any recent version
```

### 1. Clone & Install (2 minutes)
```bash
git clone https://github.com/yourusername/setLedger.git
cd setLedger
npm install  # Install root dependencies first
npm run install:all
```

### 2. Environment Setup (2 minutes)
```bash
# Basic .env files are already created for local testing
# For production, edit these files with your actual credentials:
# - backend/.env (MongoDB URI, JWT secret)
# - frontend/.env (API URLs)
# - ai-service/.env (AI service config)
```

### 3. Start Application (1 minute)
```bash
# Single command to start everything
npm start

# Optional: AI features (separate terminal)
npm run ai-service
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **AI Service**: http://localhost:5001

---

## 🎯 First Steps After Setup

### 1. Create Organization (30 seconds)
1. Open http://localhost:3000
2. Click "Create New Organization"
3. Fill organization details
4. Create admin account

### 2. Add First Product (1 minute)
1. Navigate to Products
2. Click "Add Product"
3. Enter product details
4. Save (QR code auto-generated)

### 3. Create First Invoice (1 minute)
1. Go to Invoices → Create
2. Add customer details
3. Add products (scan QR or search)
4. Generate PDF invoice

### 4. Try POS System (30 seconds)
1. Navigate to POS
2. Scan product QR codes
3. Process sale
4. View in sales history

---

## 🔧 Essential Configuration

### MongoDB Setup (Free)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Add to `backend/.env` as `MONGO_URI`

### Firebase Setup (Free)
1. Create project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication & Firestore
3. Get config keys
4. Add to `frontend/.env`

### Security Checklist
- [ ] Change default JWT_SECRET
- [ ] Set strong ENCRYPTION_KEY
- [ ] Configure CORS_ORIGIN
- [ ] Enable 2FA for admin users

---

## 📊 Key Features to Try

### ✅ Core Features (Ready to Use)
- **Product Management**: Add, edit, QR generation
- **Invoicing**: Professional PDF invoices
- **POS System**: Offline-capable point of sale
- **Inventory Tracking**: Real-time stock updates
- **GST Compliance**: Auto-generated tax reports
- **Analytics**: Financial dashboards and charts

### 🤖 AI Features (Optional Setup)
- **Stock Predictions**: Demand forecasting
- **Price Optimization**: AI-suggested pricing
- **Business Insights**: Natural language queries
- **Smart Recommendations**: Inventory optimization

### 📱 Advanced Features
- **PWA**: Install as mobile app
- **Offline Mode**: Works without internet
- **Multi-user**: Role-based team access
- **Backup & Sync**: Automatic cloud backups

---

## 🆘 Quick Troubleshooting

### Missing Dependencies Error
```bash
# If concurrently not found:
npm install concurrently

# If python not found (use python3):
which python3  # Should show /usr/bin/python3
```

### Port Already in Use
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:5000 | xargs kill -9  # Backend
```

### MongoDB Connection Error
```bash
# For local testing, install MongoDB locally:
sudo apt install mongodb  # Ubuntu/Debian
brew install mongodb      # macOS

# Or use MongoDB Atlas (free cloud database)
# Update MONGO_URI in backend/.env
```

### Frontend Won't Start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Python/AI Service Issues
```bash
# Install Python dependencies:
cd ai-service
pip3 install -r requirements.txt

# Start AI service manually:
python3 app.py
```

---

## 📚 Next Steps

1. **Read Full Documentation**: [UserManual.md](./UserManual.md)
2. **Setup Production**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
3. **Security Audit**: Run `npm run security:audit`
4. **Invite Team Members**: Add users with appropriate roles
5. **Configure GST**: Set up tax compliance
6. **Explore AI Features**: Try stock predictions and insights

---

## 🎯 Success Checklist

After quick start, you should be able to:
- [ ] Access the application at localhost:3000
- [ ] Create an organization and admin user
- [ ] Add products with QR codes
- [ ] Generate professional invoices
- [ ] Use the POS system for sales
- [ ] View analytics and reports
- [ ] Access all features offline

**Total Setup Time**: ~5 minutes  
**Ready for Production**: Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

**Need Help?** Check [UserManual.md](./UserManual.md) for detailed instructions.