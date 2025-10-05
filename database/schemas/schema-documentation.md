# 🗄️ setLedger Database Schema Documentation

## 📋 Schema Overview

Multi-tenant MongoDB database design with proper relational linking via `orgID_memberID` format and comprehensive versioning system.

---

## 🏗️ Schema Architecture

### **Multi-Tenant Design Principles**
- **Organization Isolation**: All data segregated by `orgID`
- **User Identification**: `userID = orgID_memberID` format
- **Relational Linking**: Consistent foreign key relationships
- **Versioning**: Automatic version control with timestamps
- **Soft Deletes**: `isActive` flag for data retention

---

## 📊 Core Schemas

### 1. **Organization Schema**
```javascript
{
  orgID: "ORG001",                    // Auto-generated unique ID
  name: "ABC Corporation",
  email: "admin@abc.com",
  phone: "+91-9876543210",
  address: {
    street: "123 Business Street",
    city: "Mumbai",
    state: "Maharashtra", 
    country: "India",
    pincode: "400001"
  },
  gstin: "27ABCDE1234F1Z5",
  businessType: "retail",
  subscription: {
    plan: "premium",
    expiresAt: "2024-12-31T23:59:59Z",
    features: ["ai_analytics", "advanced_reports"]
  },
  settings: {
    currency: "INR",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY"
  }
}
```

### 2. **User Schema**
```javascript
{
  userID: "ORG001_USR001",           // orgID_memberID format
  orgID: "ORG001",
  memberID: "USR001",
  name: "John Doe",
  email: "john@abc.com",
  password: "$2b$12$hashedPassword",  // bcrypt hashed
  role: "admin",
  permissions: [
    {
      module: "billing",
      actions: ["read", "write", "delete"]
    }
  ],
  auth: {
    totpSecret: "JBSWY3DPEHPK3PXP",
    totpEnabled: true,
    backupCodes: ["12345678", "87654321"],
    lastLogin: "2024-01-15T10:30:00Z",
    loginAttempts: 0,
    lockedUntil: null
  },
  profile: {
    avatar: "https://example.com/avatar.jpg",
    preferences: {
      theme: "dark",
      language: "en",
      notifications: true
    }
  }
}
```

### 3. **Product Schema**
```javascript
{
  productID: "ORG001_PRD001",
  orgID: "ORG001",
  name: "Wireless Mouse",
  sku: "WM-001",
  category: "electronics",
  description: "Ergonomic wireless mouse with USB receiver",
  pricing: {
    costPrice: 15.00,
    sellingPrice: 25.99,
    mrp: 30.00,
    margin: 42.3                     // Auto-calculated
  },
  tax: {
    gstRate: 18,
    hsnCode: "84716020",
    taxCategory: "goods"
  },
  inventory: {
    currentStock: 150,
    minStock: 20,
    maxStock: 500,
    unit: "pcs",
    location: "Warehouse-A"
  },
  supplier: {
    name: "Tech Supplies Inc",
    contact: "+91-9876543210",
    email: "supplier@techsupplies.com"
  },
  qrCode: "data:image/png;base64,iVBOR...",
  images: ["https://example.com/mouse1.jpg"],
  status: "active"
}
```

### 4. **Invoice Schema**
```javascript
{
  invoiceID: "ORG001_INV001",
  orgID: "ORG001",
  invoiceNumber: "INV-2024-001",
  customer: {
    name: "XYZ Client Ltd",
    email: "client@xyz.com",
    phone: "+91-9876543210",
    address: "456 Client Street, Delhi",
    gstin: "07ABCDE1234F1Z5"
  },
  items: [
    {
      productID: "ORG001_PRD001",
      productName: "Wireless Mouse",
      quantity: 2,
      unitPrice: 25.99,
      discount: 0,
      taxRate: 18,
      taxAmount: 9.36,
      totalAmount: 61.34
    }
  ],
  totals: {
    subtotal: 51.98,
    totalTax: 9.36,
    totalDiscount: 0,
    grandTotal: 61.34
  },
  payment: {
    method: "upi",
    status: "paid",
    paidAmount: 61.34,
    dueDate: "2024-02-15T00:00:00Z",
    terms: "Net 30 days"
  },
  status: "paid",
  notes: "Thank you for your business"
}
```

### 5. **Stock Schema** (Inventory Movements)
```javascript
{
  stockID: "ORG001_STK001",
  orgID: "ORG001",
  productID: "ORG001_PRD001",
  transactionType: "sale",
  quantity: -2,                      // Negative for outgoing
  unitPrice: 25.99,
  totalValue: 51.98,
  reference: {
    type: "invoice",
    id: "ORG001_INV001"
  },
  balanceAfter: 148,                 // Stock after transaction
  reason: "Sale to customer",
  location: "Warehouse-A"
}
```

### 6. **Transaction Schema** (Financial)
```javascript
{
  transactionID: "ORG001_TXN001",
  orgID: "ORG001",
  type: "income",
  category: "sales",
  amount: 61.34,
  description: "Payment received for Invoice INV-2024-001",
  reference: {
    type: "invoice",
    id: "ORG001_INV001",
    number: "INV-2024-001"
  },
  account: {
    name: "Business Current Account",
    type: "bank"
  },
  tax: {
    applicable: true,
    rate: 18,
    amount: 9.36
  },
  status: "completed",
  date: "2024-01-15T10:30:00Z"
}
```

### 7. **GST Report Schema**
```javascript
{
  reportID: "ORG001_GST001",
  orgID: "ORG001",
  reportType: "GSTR1",
  period: {
    month: 1,
    year: 2024,
    quarter: null
  },
  data: {
    totalSales: 125000.00,
    totalPurchases: 75000.00,
    taxCollected: 22500.00,
    taxPaid: 13500.00,
    netTax: 9000.00,
    transactions: [
      {
        invoiceID: "ORG001_INV001",
        customerGSTIN: "07ABCDE1234F1Z5",
        amount: 61.34,
        taxRate: 18,
        taxAmount: 9.36,
        placeOfSupply: "Delhi"
      }
    ]
  },
  filing: {
    status: "filed",
    filedDate: "2024-02-10T15:30:00Z",
    acknowledgmentNumber: "ACK123456789",
    filedBy: "ORG001_USR001"
  }
}
```

### 8. **AI Analytics Schema**
```javascript
{
  analyticsID: "ORG001_AI001",
  orgID: "ORG001",
  type: "stock_prediction",
  input: {
    productID: "ORG001_PRD001",
    timeframe: "30_days",
    parameters: {
      seasonality: true,
      marketTrends: true,
      historicalData: "6_months"
    }
  },
  prediction: {
    model: "ARIMA_v2.1",
    confidence: 0.87,
    results: {
      predictedDemand: 45,
      reorderDate: "2024-02-01T00:00:00Z",
      suggestedQuantity: 100,
      riskLevel: "low"
    },
    recommendations: [
      "Reorder 100 units by February 1st",
      "Consider bulk discount from supplier",
      "Monitor competitor pricing"
    ]
  },
  performance: {
    accuracy: 0.89,
    executionTime: 1.2,              // seconds
    dataPoints: 180
  },
  status: "completed",
  expiresAt: "2024-02-15T00:00:00Z"  // Auto-delete after 30 days
}
```

---

## 🔗 Relational Linking

### **Primary Relationships**
```
Organization (1) ←→ (N) Users
Organization (1) ←→ (N) Products  
Organization (1) ←→ (N) Invoices
Product (1) ←→ (N) Stock Movements
Invoice (1) ←→ (N) Transactions
Organization (1) ←→ (N) GST Reports
Organization (1) ←→ (N) AI Analytics
```

### **Foreign Key Patterns**
- **orgID**: Links all data to organization
- **userID**: `orgID_memberID` format for user identification
- **productID**: `orgID_PRD###` format
- **invoiceID**: `orgID_INV###` format
- **Reference Fields**: Link related documents across collections

---

## 📈 Versioning & Audit Trail

### **Base Fields (All Schemas)**
```javascript
{
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T11:45:00Z",
  version: 3,                        // Auto-incremented on updates
  isActive: true,                    // Soft delete flag
  createdBy: "ORG001_USR001",       // User who created
  updatedBy: "ORG001_USR002"        // User who last updated
}
```

### **Automatic Versioning**
- **Pre-save Middleware**: Auto-updates timestamps and version
- **Change Tracking**: Version increments on modifications
- **Audit Trail**: Track who created/modified records
- **Soft Deletes**: Maintain data integrity with `isActive` flag

---

## 🚀 Performance Optimization

### **Database Indexes**
```javascript
// Organization
{ orgID: 1 }

// User  
{ orgID: 1, email: 1 }
{ userID: 1 }

// Product
{ orgID: 1, sku: 1 }
{ orgID: 1, category: 1 }

// Invoice
{ orgID: 1, invoiceNumber: 1 }
{ orgID: 1, 'customer.gstin': 1 }
{ orgID: 1, status: 1, createdAt: -1 }

// Stock
{ orgID: 1, productID: 1, createdAt: -1 }

// Transaction
{ orgID: 1, date: -1 }
{ orgID: 1, type: 1, category: 1 }

// GST Report
{ orgID: 1, reportType: 1, 'period.month': 1, 'period.year': 1 }

// AI Analytics
{ orgID: 1, type: 1, createdAt: -1 }
{ expiresAt: 1 } // TTL index for auto-cleanup
```

### **Query Optimization**
- **Compound Indexes**: Multi-field queries
- **TTL Indexes**: Auto-expire AI analytics data
- **Sparse Indexes**: Optional fields like GSTIN
- **Text Indexes**: Full-text search on product names/descriptions

---

## 🔒 Data Security

### **Multi-Tenant Isolation**
- All queries filtered by `orgID`
- No cross-organization data access
- Encrypted sensitive fields (passwords, TOTP secrets)

### **Data Validation**
- Schema-level validation rules
- Enum constraints for status fields
- Required field enforcement
- Custom validators for business rules

---

## 📊 Sample Queries

### **Get User with Organization**
```javascript
db.users.aggregate([
  { $match: { userID: "ORG001_USR001" } },
  { $lookup: {
      from: "organizations",
      localField: "orgID", 
      foreignField: "orgID",
      as: "organization"
  }}
])
```

### **Get Product Stock History**
```javascript
db.stocks.find({
  orgID: "ORG001",
  productID: "ORG001_PRD001"
}).sort({ createdAt: -1 }).limit(10)
```

### **Monthly Sales Report**
```javascript
db.invoices.aggregate([
  { $match: { 
      orgID: "ORG001",
      status: "paid",
      createdAt: { 
        $gte: new Date("2024-01-01"),
        $lt: new Date("2024-02-01")
      }
  }},
  { $group: {
      _id: null,
      totalSales: { $sum: "$totals.grandTotal" },
      totalTax: { $sum: "$totals.totalTax" },
      invoiceCount: { $sum: 1 }
  }}
])
```

This schema design ensures **scalability**, **data integrity**, and **performance** while maintaining clear organizational boundaries and comprehensive audit trails.