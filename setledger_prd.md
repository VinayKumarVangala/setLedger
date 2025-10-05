# 📘 Product Requirement Document (PRD)
## Product Name: **setLedger**

---

## 🏁 1. Vision Statement
**setLedger** aims to become an all-in-one intelligent financial management suite for firms and businesses of all scales. It automates billing, GST filing, inventory tracking, AI-driven stock and pricing management, QR-based product scanning, and financial dashboards — all accessible from a single, modular platform. Inspired by Odoo, **setLedger** enhances accessibility, scalability, and user-friendliness while being free for everyone.

---

## 💡 2. Core Objectives
- Simplify financial and inventory management for businesses.
- Leverage AI for smart financial decision-making and stock predictions.
- Provide modular yet integrated services.
- Ensure secure, reliable, and cost-efficient operations.
- Offer a user-friendly interface optimized for speed and clarity.

---

## 🧩 3. Application Structure & Modular Approach

Each module acts as a **sub-app**, accessible via buttons from the **Home/Landing Page** after login. All modules share common authentication, authorization, and data management layers.

### Core Modules:
1. **User & Team Management**
2. **Billing & QR Code System**
3. **Inventory & Stock Management (AI-driven)**
4. **GST & Tax Compliance**
5. **Financial Dashboard & Reports**
6. **AI Financial Assistant**
7. **Data Backup & Recovery System**

---

## 🔐 4. Authentication & Authorization
### Features:
- Username + Password login.
- **2FA using TOTP** (Google/Microsoft Authenticator).
- **Alternative Login** via **Email OTP**.
- Organization-based userID system:
  - `userID = orgID_memberID`
- Encrypted credentials and role-based access control (Admin, Accountant, Analyst, Staff).

### Tech Stack:
- **Frontend:** React + Firebase Auth (for email OTP) + Authenticator SDK
- **Backend:** Node.js (Express) with JWT + bcrypt + Speakeasy (TOTP)
- **Security:** Helmet.js, rate limiting, CSRF protection
- **Sensitive Info:** `.env` file (not exposed in client)

---

## 🧾 5. Billing & QR Code Management
### Features:
- Create, edit, and print bills with automatic tax calculation.
- Generate **custom QR codes** for each product (using free API or `qrcode` library).
- Scan QR to auto-fill product details during billing.
- Support for multiple payment modes and invoices.

### Improvements:
- Offline billing with local backup sync.
- Dynamic tax fields and discount handling.

### Tech Stack:
- **Frontend:** React + Tailwind CSS + React-Barcode-Scanner + React-PDF
- **Backend:** Express + MongoDB Atlas
- **QR Code:** `qrcode` npm package
- **PDF/Invoice Generator:** `pdfkit` or `jsPDF`

---

## 📦 6. Inventory & AI Stock Management
### Features:
- Manage product details (name, SKU, price, quantity, supplier, etc.).
- AI predicts stock-out dates and suggests reorders.
- Auto-update stock on billing.
- Low-stock alerts via email or dashboard notifications.

### AI Integration:
- Predict demand using regression models.
- Dynamic pricing using ML-based competitor analysis.

### Tech Stack:
- **Frontend:** React Charts (Recharts / Chart.js)
- **Backend:** Express + MongoDB + Python (Flask API for ML model)
- **AI Model:** Scikit-learn or TensorFlow Lite

---

## 💰 7. GST & Tax Compliance
### Features:
- Generate GST reports (GSTR-1, GSTR-3B).
- Validate GSTIN using free government API.
- Auto-apply tax slabs based on product category.

### Tech Stack:
- **Frontend:** React Forms
- **Backend:** Node.js + GST API Integration + MongoDB

### Enhancements:
- AI-based GST anomaly detection.
- Auto reminders for tax deadlines.

---

## 📊 8. Financial Dashboard & Analytics
### Features:
- Revenue, expenses, profit/loss visualizations.
- Filter reports by date, product, or branch.
- Forecast future profits using AI.
- Export reports (PDF, Excel, CSV).

### Tech Stack:
- **Frontend:** React + Recharts + TailwindCSS
- **Backend:** Express + MongoDB Aggregations
- **AI Engine:** Prophet / ARIMA for forecasting

---

## 🤖 9. AI Financial Assistant
### Features:
- Chat-based assistant for queries like:
  - “Show last month’s top-selling products.”
  - “Predict next month’s revenue.”
- Natural Language Understanding (NLU) using lightweight AI models.
- Context-aware recommendations for pricing and expense reduction.

### Tech Stack:
- **Frontend:** Chat UI using React
- **Backend:** Flask or FastAPI AI microservice
- **AI Models:** Gemini API / OpenAI Free-tier models + Custom trained data

---

## ☁️ 10. Data Backup & Reliability
### Features:
- **Dual Backup:** LocalStorage + Firebase Cloud Firestore.
- Auto-sync when online.
- Scheduled backups for databases.
- Error fallback handling — if cloud fails, switch to local seamlessly.

### Tech Stack:
- Firebase SDK + LocalStorage API
- Express CRON Jobs for scheduled syncs

---

## 🧱 11. System Architecture
```
Frontend (React, Tailwind) ↔ Backend (Node.js/Express) ↔ MongoDB Atlas
             ↕
        AI Microservices (Flask/TensorFlow)
             ↕
 LocalStorage + Firebase (Backup)
```

### Design Style:
- Clean modular dashboard layout.
- Sidebar with module access buttons.
- Quick-glance summary cards.
- High-contrast color scheme for accessibility.

---

## 🧠 12. Error Handling & Fallbacks
- Centralized error logger using Winston.
- API retries on network failure.
- Graceful UI degradation with error toasts.
- Backup data retrieval if API fails.

---

## 🧰 13. Developer Configuration & Environment Setup
### Files:
```
.env
│  MONGO_URI=
│  FIREBASE_KEY=
│  JWT_SECRET=
│  AI_API_KEY=
│  TOTP_SECRET=
│  EMAIL_API_KEY=
```
### Setup Steps:
1. Clone repo from GitHub.
2. Install dependencies (`npm install`).
3. Setup `.env` file.
4. Connect Firebase & MongoDB Atlas.
5. Run dev server (`npm run dev`).

---

## 👥 14. Target Users & Psychology
### Target Audience:
- Small to mid-sized businesses.
- Retailers managing inventory.
- Accountants and tax professionals.
- Startups and freelancers.

### Design Psychology:
- Minimal clicks to perform key actions.
- Dashboard-first layout.
- Consistent iconography and branding.
- Dark/light mode for better usability.

---

## 🚀 15. Tech Stack Summary
| Layer | Technologies |
|--------|---------------|
| Frontend | React, Tailwind CSS, Chart.js, Firebase Auth |
| Backend | Node.js, Express, MongoDB Atlas, JWT, Flask (AI) |
| AI/ML | Scikit-learn, TensorFlow, Gemini API (Free tier) |
| Storage | MongoDB, Firebase Firestore, LocalStorage |
| Security | bcrypt, JWT, Speakeasy (TOTP), Helmet.js |
| Tools | GitHub Pages (Hosting), Vite, Winston (Logs) |

---

## 🏁 16. Future Enhancements
- Integrate voice-based AI query system.
- Multi-language regional support.
- Integrate with WhatsApp and Email for billing updates.
- Add blockchain layer for audit transparency.

---

## ✅ 17. Conclusion
**setLedger** is a modular, AI-powered, and secure financial management system designed to empower every business. Built with cost-efficiency, accessibility, and reliability in mind, it’s engineered to scale intelligently, ensuring both free-tier usability and enterprise-grade performance.

