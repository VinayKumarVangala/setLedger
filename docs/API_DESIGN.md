# 🔌 setLedger API Design

## 📋 API Overview
RESTful API with JWT authentication, modular endpoints, and consistent response formats.

### **Base URLs**
```
Production:  https://api.setledger.com/v1
Development: http://localhost:3001/api/v1
```

### **Authentication**
```
Authorization: Bearer <jwt_token>
X-API-Key: <api_key>
X-Org-ID: <organization_id>
```

---

## 📊 Response Format

### **Success Response**
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": []
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

---

## 🔐 Authentication Endpoints

### **POST** `/auth/register`
```json
{
  "organizationName": "ABC Corp",
  "adminEmail": "admin@abc.com",
  "adminName": "John Doe",
  "password": "SecurePass123!",
  "phone": "+1234567890"
}
```

### **POST** `/auth/login`
```json
{
  "email": "user@abc.com",
  "password": "SecurePass123!",
  "totpCode": "123456"
}
```

### **POST** `/auth/2fa/setup`
```json
{
  "userId": "user_123",
  "method": "totp"
}
```

---

## 👥 User Management

### **GET** `/users/profile`
Get current user profile

### **PUT** `/users/profile`
Update user profile

### **GET** `/users/team`
Get organization team members

---

## 🧾 Billing Endpoints

### **POST** `/billing/invoices`
Create new invoice
```json
{
  "customerId": "cust_123",
  "items": [
    {
      "productId": "prod_456",
      "quantity": 2,
      "unitPrice": 100.00,
      "taxRate": 18
    }
  ]
}
```

### **GET** `/billing/invoices`
Get invoices with pagination

### **POST** `/billing/qr/generate`
Generate QR code for product

---

## 📦 Inventory Endpoints

### **GET** `/inventory/products`
Get products with filtering

### **POST** `/inventory/products`
Create new product

### **PUT** `/inventory/products/:id/stock`
Update product stock

### **GET** `/inventory/alerts`
Get low stock alerts

---

## 💰 GST & Tax Endpoints

### **POST** `/gst/calculate`
Calculate GST for transaction

### **GET** `/gst/reports/gstr1`
Generate GSTR-1 report

### **POST** `/gst/validate`
Validate GSTIN number

---

## 📊 Analytics Endpoints

### **GET** `/analytics/dashboard`
Get dashboard summary

### **GET** `/analytics/reports/revenue`
Get revenue analytics

### **GET** `/analytics/reports/inventory`
Get inventory analytics

---

## 🤖 AI Service Endpoints

### **POST** `/ai/predict/stock`
Get stock predictions

### **POST** `/ai/chat`
Chat with AI assistant

### **POST** `/ai/optimize/pricing`
Get pricing recommendations

---

## 💾 Backup & System

### **POST** `/backup/create`
Create manual backup

### **GET** `/system/health`
System health check

---

## 📝 Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `INVALID_TOKEN` | Invalid or expired token |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## 🚀 Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| General API | 1000 requests | 1 hour |
| AI Services | 100 requests | 1 hour |