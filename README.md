# 🏦 setLedger - AI-Powered Financial Management Suite

> An all-in-one intelligent financial management platform for businesses of all scales

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-red.svg)](https://python.org/)

---

## 🎯 Vision
**setLedger** automates billing, GST filing, inventory tracking, AI-driven stock management, QR-based product scanning, and financial dashboards — all from a single, modular platform.

## ✨ Key Features
- 🤖 **AI-Powered Stock Predictions** - Smart inventory management with demand forecasting
- 📱 **QR Code Integration** - Quick product scanning for billing
- 📊 **Real-time Analytics** - Comprehensive financial dashboards
- 🔐 **Enterprise Security** - 2FA, JWT, role-based access control
- 🌐 **Offline Capability** - Local storage with cloud sync
- 📋 **GST Compliance** - Automated tax calculations and filing

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Dashboard     │ │   Billing       │ │   Inventory     │   │
│  │   Module        │ │   Module        │ │   Module        │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   GST/Tax       │ │   Analytics     │ │   AI Assistant  │   │
│  │   Module        │ │   Module        │ │   Module        │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                    React + Tailwind CSS                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                        │
│              JWT + 2FA (TOTP) + Firebase Auth                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                               │
│                  Rate Limiting + CORS                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND LAYER                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   User Service  │ │  Billing Service│ │Inventory Service│   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   GST Service   │ │Analytics Service│ │ Backup Service  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                   Node.js + Express                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI MICROSERVICE                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │Stock Prediction │ │ Price Optimizer │ │  Chat Assistant │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                    Flask + TensorFlow                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   MongoDB       │ │   Firebase      │ │  LocalStorage   │   │
│  │   (Primary)     │ │   (Backup)      │ │   (Offline)     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Core Modules

| Module | Description | Tech Stack |
|--------|-------------|------------|
| **Authentication** | 2FA, JWT, Role-based access | React + Node.js + Firebase |
| **Billing & QR** | Invoice generation, QR scanning | React + Express + MongoDB |
| **Inventory AI** | Stock prediction, reorder alerts | React + Flask + TensorFlow |
| **GST Compliance** | Tax calculations, filing | React + Node.js + Gov APIs |
| **Analytics** | Financial dashboards, reports | React + Chart.js + MongoDB |
| **AI Assistant** | Chat-based queries, insights | React + Flask + NLP Models |
| **Backup System** | Dual backup, offline sync | Node.js + Firebase + Local |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB Atlas account
- Firebase project

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/setLedger.git
cd setLedger

# Install dependencies
npm install
cd ai-service && pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Configure your API keys and database URLs

# Start development servers
npm run dev          # Frontend + Backend
npm run ai-service   # AI Microservice
```

---

## 📁 Project Structure
```
setLedger/
├── frontend/           # React application
├── backend/           # Node.js + Express API
├── ai-service/        # Flask AI microservice
├── docs/             # Documentation
├── tests/            # Test suites
└── deployment/       # Docker & deployment configs
```

---

## 🔧 Environment Variables
```env
# Database
MONGO_URI=mongodb+srv://...
FIREBASE_CONFIG=...

# Authentication
JWT_SECRET=your-secret-key
TOTP_SECRET=your-totp-secret

# AI Services
GEMINI_API_KEY=your-api-key
OPENAI_API_KEY=your-api-key

# External APIs
GST_API_KEY=your-gst-api-key
EMAIL_API_KEY=your-email-key
```

---

## 🤝 Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments
- Inspired by Odoo's modular architecture
- Built with modern web technologies
- Designed for accessibility and scalability

---

## 🚀 Ready to Use!

### Quick Start
```bash
git clone https://github.com/yourusername/setLedger.git
cd setLedger
npm run install:all
npm run dev
```

### Documentation
- 📖 **[User Manual](./UserManual.md)** - Complete usage guide
- 🚀 **[Setup Guide](./SETUP_GUIDE.md)** - Detailed installation
- ⚡ **[Quick Start](./QUICK_START.md)** - 5-minute setup
- 🏗️ **[Architecture](./ARCHITECTURE.md)** - Technical details

### Production Ready Features
✅ **16+ Major Modules** - Complete financial management suite  
✅ **AI-Powered Insights** - Stock predictions & pricing optimization  
✅ **GST Compliance** - Automated tax calculations & filing  
✅ **Offline PWA** - Works without internet connection  
✅ **Enterprise Security** - OWASP compliant with encryption  
✅ **Modern UI/UX** - Responsive, accessible, animated interface  

**Made with ❤️ for the business community**