# 🔌 setLedger API Endpoints

## 🔐 Authentication Endpoints

### Organization Registration
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "organizationName": "TechCorp Solutions",
  "adminEmail": "admin@techcorp.com",
  "adminName": "John Doe",
  "password": "SecurePass123!",
  "phone": "+91-9876543210",
  "businessType": "service"
}
```

### User Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@techcorp.com",
  "password": "SecurePass123!",
  "totpCode": "123456"
}
```

### TOTP Setup
```http
POST /api/v1/auth/totp/setup
Authorization: Bearer <jwt_token>
```

### TOTP Verification
```http
POST /api/v1/auth/totp/verify
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "totpCode": "123456"
}
```

### Email OTP (Fallback)
```http
POST /api/v1/auth/email-otp/send
Content-Type: application/json

{
  "email": "admin@techcorp.com"
}
```

```http
POST /api/v1/auth/email-otp/verify
Content-Type: application/json

{
  "email": "admin@techcorp.com",
  "otp": "123456"
}
```

### Token Refresh
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

---

## 👥 User Management Endpoints

### Get User Profile
```http
GET /api/v1/users/profile
Authorization: Bearer <jwt_token>
```

### Update User Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Smith",
  "phone": "+91-9876543210",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "notifications": true
  }
}
```

### Get User Permissions
```http
GET /api/v1/users/permissions
Authorization: Bearer <jwt_token>
```

### Get Team Members (Admin/Accountant)
```http
GET /api/v1/users/team?page=1&limit=20&role=staff&search=john
Authorization: Bearer <jwt_token>
```

### Create Team Member (Admin Only)
```http
POST /api/v1/users/team
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@techcorp.com",
  "phone": "+91-9876543210",
  "role": "accountant",
  "password": "SecurePass123!"
}
```

### Update Team Member (Admin Only)
```http
PUT /api/v1/users/team/:targetUserID
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "role": "analyst",
  "isActive": true
}
```

---

## 🛡️ Role-Based Access Control

### Roles Hierarchy
1. **Admin** - Full access to all modules
2. **Accountant** - Billing, GST, limited analytics
3. **Analyst** - Analytics, reporting, read-only access
4. **Staff** - Basic inventory and billing operations

### Module Permissions

| Module | Admin | Accountant | Analyst | Staff |
|--------|-------|------------|---------|-------|
| **Billing** | Full | Read/Write | Read | Read |
| **Inventory** | Full | Read/Write | Read | Read/Write |
| **GST** | Full | Read/Write | Read | None |
| **Analytics** | Full | Read | Read/Write | None |
| **Users** | Full | Read | None | None |

### Permission Actions
- **read** - View data
- **write** - Create/Update data
- **delete** - Remove data
- **admin** - Full administrative access

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

---

## 🔑 Authentication Flow

### 1. Organization Registration
```
POST /auth/register → Creates org + admin user → Returns JWT tokens
```

### 2. User Login
```
POST /auth/login → Validates credentials → Checks TOTP (if enabled) → Returns JWT tokens
```

### 3. TOTP Setup (Optional)
```
POST /auth/totp/setup → Generates secret + QR code → User scans QR
POST /auth/totp/verify → Validates TOTP code → Enables 2FA
```

### 4. Email OTP Fallback
```
POST /auth/email-otp/send → Sends OTP to email → User enters OTP
POST /auth/email-otp/verify → Validates OTP → Returns JWT tokens
```

---

## 🚨 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTH_REQUIRED` | Authentication required | 401 |
| `INVALID_TOKEN` | Invalid or expired token | 401 |
| `INSUFFICIENT_ROLE` | User role insufficient | 403 |
| `MODULE_ACCESS_DENIED` | No access to module | 403 |
| `ACTION_NOT_PERMITTED` | Action not allowed | 403 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `RESOURCE_NOT_FOUND` | Resource not found | 404 |
| `DUPLICATE_RESOURCE` | Resource already exists | 409 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `ACCOUNT_LOCKED` | Account temporarily locked | 423 |
| `INVALID_CREDENTIALS` | Invalid login credentials | 401 |
| `INVALID_TOTP` | Invalid TOTP code | 401 |
| `INTERNAL_ERROR` | Internal server error | 500 |

---

## 🔒 Security Features

### Rate Limiting
- **Auth endpoints**: 5 requests per 15 minutes
- **OTP endpoints**: 3 requests per 5 minutes
- **General API**: 100 requests per 15 minutes

### Account Security
- **Password requirements**: 8+ chars, uppercase, lowercase, number, special char
- **Account lockout**: 5 failed attempts = 15 minute lockout
- **TOTP backup codes**: 8 recovery codes generated
- **JWT expiry**: Access token 24h, Refresh token 7d

### Multi-tenant Isolation
- All data filtered by `orgID`
- User IDs in `orgID_memberID` format
- Complete organizational data separation

This API provides secure, role-based access to all setLedger functionality with comprehensive authentication and authorization.