# 🔐 setLedger Backend - Multi-tenant Authentication API

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account or local MongoDB
- Firebase project (for email OTP)

### Installation
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Environment Setup
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/setledger
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-token-secret
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

## 🔌 API Endpoints

### Authentication Routes
- `POST /api/v1/auth/register` - Organization registration
- `POST /api/v1/auth/login` - User login with TOTP support
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/totp/setup` - Setup TOTP (protected)
- `POST /api/v1/auth/totp/verify` - Verify and enable TOTP (protected)
- `POST /api/v1/auth/email-otp/send` - Send email OTP fallback
- `POST /api/v1/auth/email-otp/verify` - Verify email OTP and login

### Health Check
- `GET /api/v1/health` - Server health status

## 🏗️ Architecture Features

### Multi-tenant Design
- **Organization Isolation**: All data segregated by `orgID`
- **Dynamic User IDs**: `orgID_memberID` format (e.g., `ORG001_USR001`)
- **Role-based Permissions**: Admin, Accountant, Analyst, Staff roles

### Security Features
- **JWT Authentication**: Access + Refresh token pattern
- **Password Security**: bcrypt with salt rounds 12
- **TOTP 2FA**: Speakeasy integration with QR codes
- **Email OTP Fallback**: Firebase Auth integration
- **Rate Limiting**: Configurable limits per endpoint
- **Account Lockout**: 5 failed attempts = 15 min lockout

### Error Handling
- **Consistent Response Format**: Standardized success/error responses
- **Validation**: Joi schema validation for all inputs
- **Graceful Degradation**: Fallback mechanisms for service failures

## 📊 Sample Requests

### Organization Registration
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "TechCorp Solutions",
    "adminEmail": "admin@techcorp.com",
    "adminName": "John Doe",
    "password": "SecurePass123!",
    "phone": "+91-9876543210",
    "businessType": "service"
  }'
```

### User Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techcorp.com",
    "password": "SecurePass123!",
    "totpCode": "123456"
  }'
```

### TOTP Setup
```bash
curl -X POST http://localhost:3001/api/v1/auth/totp/setup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## 🔧 Development

### Project Structure
```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth & validation middleware
│   ├── models/          # Database model imports
│   ├── routes/          # API route definitions
│   ├── services/        # External service integrations
│   ├── utils/           # Helper utilities
│   ├── config/          # Configuration files
│   └── server.js        # Main application entry
├── package.json
└── .env.example
```

### Scripts
- `npm run dev` - Development server with nodemon
- `npm start` - Production server
- `npm test` - Run tests

## 🛡️ Security Considerations

### Password Requirements
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- bcrypt hashed with salt rounds 12

### JWT Configuration
- Access token: 24 hours expiry
- Refresh token: 7 days expiry
- Secure secret keys required

### Rate Limiting
- Auth endpoints: 5 requests per 15 minutes
- OTP endpoints: 3 requests per 5 minutes
- General API: 100 requests per 15 minutes

### Account Security
- Account lockout after 5 failed login attempts
- 15-minute lockout duration
- TOTP backup codes for recovery
- Email OTP fallback option

This backend provides a robust, secure, and scalable foundation for the setLedger multi-tenant application.