# 📋 setLedger Current Workflow Documentation

> **Comprehensive guide to all features, facilities, and implementation workflows in setLedger**

---

## 🏗️ **System Architecture Overview**

### **Multi-Tenant Organization Structure**
- **Organization ID Format**: `ORG1000`, `ORG1001`, `ORG1002`...
- **User ID Format**: `ORG1000-1`, `ORG1000-2`, `ORG1000-3`...
- **Data Isolation**: Complete separation between organizations
- **Role Hierarchy**: Admin → Accountant → Analyst → Staff

### **Technology Stack**
```
Frontend: React + Tailwind CSS + Framer Motion
Backend: Node.js + Express + MongoDB
AI Service: Flask + TensorFlow (Optional)
Authentication: JWT + bcrypt + TOTP
Storage: LocalStorage + Firebase Firestore
```

---

## 🔐 **1. AUTHENTICATION & AUTHORIZATION SYSTEM**

### **1.1 User Registration Workflow**

#### **Process Flow:**
```
Welcome Page → Registration Form → Organization Creation → Admin Account Setup → Dashboard Access
```

#### **Implementation Details:**
- **Organization Creation**: Auto-generates unique `orgID` starting from ORG1000
- **Admin User**: First user gets Admin role with full permissions
- **Password Security**: Minimum 6 characters with validation
- **User ID Generation**: Sequential numbering within organization

#### **Data Structure:**
```javascript
Organization: {
  id: "ORG1000",
  name: "Company Name",
  createdAt: "2024-01-15T10:30:00Z",
  memberCount: 1
}

User: {
  id: "ORG1000-1",
  name: "John Doe",
  email: "john@company.com",
  orgId: "ORG1000",
  role: "admin",
  createdAt: "2024-01-15T10:30:00Z"
}
```

### **1.2 Login System**

#### **Authentication Flow:**
```
Email/Password → Validation → JWT Token Generation → Dashboard Redirect
```

#### **Security Features:**
- **JWT Tokens**: Secure session management
- **Password Hashing**: bcrypt encryption
- **Session Persistence**: localStorage with token refresh
- **Role-based Routing**: Access control per user role

### **1.3 Two-Factor Authentication (2FA)**

#### **TOTP Implementation:**
```
Settings → Security → Enable 2FA → QR Code Generation → Authenticator App Setup → Token Verification
```

#### **Technical Workflow:**
1. **Secret Generation**: Unique TOTP secret per user
2. **QR Code Creation**: `otpauth://totp/setLedger:user@email.com?secret=SECRET&issuer=setLedger`
3. **Token Verification**: 6-digit TOTP validation
4. **Backup Codes**: Recovery codes for lost devices

---

## 📦 **2. PRODUCT MANAGEMENT SYSTEM**

### **2.1 Product Creation Workflow**

#### **Process Flow:**
```
Dashboard → Add Product → Product Form → Perishable Check → QR Generation → Database Storage → UI Update
```

#### **Form Fields & Validation:**
- **Required Fields**: Name, SKU, Price, Stock Quantity
- **SKU Explanation**: "Stock Keeping Unit - Unique identifier for inventory tracking"
- **Perishable Toggle**: Conditional MFD/Expiry date fields
- **Price Format**: Currency validation with ₹ symbol
- **Stock Management**: Integer validation for quantities

#### **Perishable Goods Logic:**
```javascript
if (product.isPerishable) {
  requiredFields.push('mfdDate', 'expiryDate');
  displayFields.push('⚠️ Perishable', 'MFD: date', 'Exp: date');
}
```

### **2.2 QR Code Generation System**

#### **QR Data Structure:**
```javascript
qrData = JSON.stringify({
  id: product.id,
  name: "Product Name",
  price: 299.99,
  sku: "ABC123",
  isPerishable: true,
  mfdDate: "2024-01-15",
  expiryDate: "2024-12-15"
});
```

#### **QR Code Features:**
- **Complete Product Data**: All details embedded in QR
- **Billing Integration**: Direct scanning for invoice creation
- **POS Compatibility**: Instant product addition to cart
- **Visual Representation**: SKU display with QR placeholder

### **2.3 Inventory Display System**

#### **Product Card Layout:**
- **Product Information**: Name, SKU, Price, Stock
- **Perishable Indicators**: Warning icon and dates
- **QR Code Preview**: Visual representation with SKU
- **Action Buttons**: Edit, Delete, View Details (Future)

---

## 🧾 **3. INVOICING SYSTEM**

### **3.1 Invoice Creation Workflow**

#### **Dual Input System:**
```
Customer Details → Payment Method → Item Addition (QR Scan OR Manual Entry) → Auto-calculation → Invoice Generation
```

#### **Customer Information:**
- **Name**: Required field for invoice header
- **Mobile Number**: For SMS notifications and customer records
- **Payment Method**: Cash, Online Payment, Card Payment

### **3.2 QR Scanning Integration**

#### **QR Scan Process:**
```
Scan QR Button → QR Data Input → JSON Parsing → Product Validation → Add to Invoice Items
```

#### **Error Handling:**
```javascript
try {
  const productData = JSON.parse(scannedQRData);
  addItemToInvoice(productData);
} catch (error) {
  alert('Invalid QR code format');
}
```

### **3.3 Manual Item Entry**

#### **Manual Entry Fields:**
- **Item Name**: Product description
- **Price**: Unit price validation
- **Quantity**: Integer input with default value 1
- **Add Button**: Adds item to invoice list

### **3.4 Invoice Calculation Engine**

#### **Auto-calculation Logic:**
```javascript
const calculateInvoice = (items) => {
  const subtotal = items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + tax;
  return { subtotal, tax, total };
};
```

### **3.5 Invoice Management**

#### **Invoice Table Features:**
- **Invoice ID**: Auto-generated with INV- prefix
- **Customer Details**: Name and mobile display
- **Amount**: Total payable amount
- **Payment Method**: Visual badges for payment type
- **Status Tracking**: Pending/Paid status management
- **Actions**: View, Download, Edit options

---

## 🏪 **4. POINT OF SALE (POS) SYSTEM**

### **4.1 POS Interface Layout**

#### **Two-Panel Design:**
```
Left Panel: Product Grid (2/3 width)
Right Panel: Shopping Cart (1/3 width)
```

#### **Product Display:**
- **Product Cards**: Name, Price, Stock quantity
- **Add to Cart**: One-click addition with stock validation
- **Real-time Updates**: Instant cart reflection

### **4.2 Cart Management System**

#### **Cart Operations:**
```javascript
// Add Item
const addToCart = (product) => {
  const existingItem = cart.find(item => item.id === product.id);
  if (existingItem) {
    updateQuantity(product.id, existingItem.quantity + 1);
  } else {
    setCart([...cart, { ...product, quantity: 1 }]);
  }
};

// Remove Item
const removeFromCart = (productId) => {
  const item = cart.find(item => item.id === productId);
  if (item.quantity === 1) {
    setCart(cart.filter(item => item.id !== productId));
  } else {
    updateQuantity(productId, item.quantity - 1);
  }
};
```

### **4.3 Transaction Processing**

#### **Sale Processing Flow:**
```
Cart Review → Total Calculation → Payment Method → Process Sale → Stock Update → Receipt Generation → Cart Reset
```

#### **Transaction Record:**
```javascript
const transaction = {
  id: Date.now(),
  items: cartItems,
  total: calculatedTotal,
  timestamp: new Date().toISOString(),
  paymentMethod: selectedMethod,
  cashier: currentUser.id
};
```

---

## 📊 **5. REPORTS & ANALYTICS SYSTEM**

### **5.1 Financial Dashboard**

#### **Summary Cards:**
- **Total Revenue**: Aggregated sales data with currency formatting
- **Total Expenses**: Calculated operational costs
- **Net Profit**: Revenue minus expenses calculation
- **Total Products**: Current inventory count

### **5.2 Sales Analytics**

#### **Monthly Sales Chart:**
```javascript
const salesData = [
  { month: 'Jan', amount: 15000 },
  { month: 'Feb', amount: 18000 },
  { month: 'Mar', amount: 22000 },
  // ... more months
];
```

#### **Visual Representation:**
- **Bar Chart**: Monthly sales comparison
- **Height Calculation**: Proportional to sales amount
- **Interactive Display**: Hover effects and data labels

### **5.3 Report Export System**

#### **Export Options:**
- **Sales Report**: Transaction history with filtering
- **Financial Report**: P&L statements and cash flow
- **Inventory Report**: Stock analysis and movement

#### **Export Formats:**
- **PDF**: Professional formatted reports
- **Excel**: Spreadsheet format for analysis
- **CSV**: Raw data for external processing

---

## 🧾 **6. GST COMPLIANCE SYSTEM**

### **6.1 GST Dashboard**

#### **Compliance Overview:**
- **Total GST Collected**: Aggregated tax amounts
- **Pending Returns**: Outstanding filing requirements
- **Filed This Month**: Completed submissions count

### **6.2 GST Report Generation**

#### **Report Types:**
```javascript
const gstReports = {
  'GSTR-1': 'Outward Supplies',
  'GSTR-3B': 'Monthly Return',
  'GSTR-9': 'Annual Return'
};
```

#### **Generation Process:**
```
GSTIN Input → Report Type Selection → Period Selection → Data Aggregation → Report Generation → Download/File
```

### **6.3 Tax Calculation Engine**

#### **GST Calculation Logic:**
```javascript
const calculateGST = (amount, rate = 0.18) => {
  const gstAmount = amount * rate;
  return {
    baseAmount: amount,
    gstAmount: gstAmount,
    totalAmount: amount + gstAmount
  };
};
```

### **6.4 Compliance Tracking**

#### **Report Status Management:**
- **Generated**: Report created but not filed
- **Pending**: Awaiting submission
- **Filed**: Successfully submitted to government portal

---

## ⚙️ **7. SETTINGS & CONFIGURATION SYSTEM**

### **7.1 Settings Navigation**

#### **Tab-based Interface:**
```
Security | Team Management | Backup & Sync | Notifications
```

#### **Sidebar Navigation:**
- **Icon-based Menu**: Visual indicators for each section
- **Active State**: Highlighted current selection
- **Responsive Design**: Collapsible on mobile devices

### **7.2 Security Settings**

#### **Two-Factor Authentication:**
```
2FA Setup → QR Code Generation → Authenticator App → Token Verification → Enable 2FA
```

#### **Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

### **7.3 Team Management**

#### **Role-based Access Control:**
```javascript
const rolePermissions = {
  'Admin': ['*'], // All permissions
  'Accountant': ['invoices', 'reports', 'gst', 'products'],
  'Analyst': ['reports', 'analytics', 'dashboard'],
  'Staff': ['pos', 'products', 'dashboard']
};
```

#### **Team Member Management:**
- **Member List**: Name, email, role, status display
- **Invite System**: Email-based invitation workflow
- **Role Assignment**: Permission-based access control
- **Status Tracking**: Active/Inactive member management

### **7.4 Backup & Sync System**

#### **Dual Backup Strategy:**
```
Local Storage (Immediate) + Cloud Storage (Scheduled)
```

#### **Backup Configuration:**
- **Auto Backup Toggle**: Enable/disable automatic backups
- **Frequency Selection**: Hourly, Daily, Weekly options
- **Manual Actions**: Backup Now, Restore options

#### **Backup Data Structure:**
```javascript
const backupData = {
  products: [...],
  invoices: [...],
  transactions: [...],
  settings: {...},
  timestamp: "2024-01-15T10:30:00Z",
  version: "1.0.0"
};
```

### **7.5 Notification System**

#### **Notification Types:**
- **Email Notifications**: Important updates via email
- **Low Stock Alerts**: Inventory threshold warnings
- **GST Filing Reminders**: Tax deadline notifications
- **Payment Due Notifications**: Outstanding payment alerts

#### **Notification Configuration:**
```javascript
const notificationSettings = {
  emailEnabled: true,
  lowStockThreshold: 10,
  gstReminderDays: 7,
  paymentReminderDays: 3
};
```

---

## 🤖 **8. AI FINANCIAL ASSISTANT**

### **8.1 AI Chat Interface**

#### **Chat Window Components:**
- **Header**: AI Assistant branding with close button
- **Message Area**: Scrollable conversation history
- **Quick Actions**: Pre-defined query buttons
- **Input Field**: Text input with send button

### **8.2 AI Response System**

#### **Query Processing:**
```javascript
const generateAIResponse = (query) => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('revenue')) return revenueAnalysis();
  if (lowerQuery.includes('products')) return topProductsReport();
  if (lowerQuery.includes('predict')) return salesForecast();
  if (lowerQuery.includes('gst')) return gstReminders();
  if (lowerQuery.includes('stock')) return stockAlerts();
  
  return contextualResponse(query);
};
```

### **8.3 Business Intelligence Features**

#### **Quick Action Queries:**
- **"Show last month's revenue"**: Revenue analysis with trends
- **"Top selling products"**: Product performance ranking
- **"Predict next month's sales"**: AI-based forecasting
- **"GST filing reminders"**: Compliance deadline alerts
- **"Low stock alerts"**: Inventory management warnings

#### **AI Response Categories:**
- **Financial Analysis**: Revenue, expenses, profit insights
- **Product Intelligence**: Sales performance, inventory optimization
- **Predictive Analytics**: Sales forecasting, demand prediction
- **Compliance Assistance**: GST reminders, deadline management
- **Operational Insights**: Stock management, reorder suggestions

---

## 🔄 **9. DATA FLOW & SYNCHRONIZATION**

### **9.1 State Management Architecture**

#### **React Context Structure:**
```javascript
const AppContext = {
  user: { id, name, role, orgId },
  products: [...],
  invoices: [...],
  transactions: [...],
  settings: {...}
};
```

### **9.2 Cross-Module Data Flow**

#### **Integration Points:**
```
Products → Invoices (QR scanning)
Products → POS (inventory display)
Invoices → Reports (revenue calculation)
POS → Reports (transaction data)
All Modules → GST (tax calculations)
Settings → All Modules (configuration)
```

### **9.3 Real-time Updates**

#### **State Synchronization:**
- **React Context**: Immediate UI updates
- **LocalStorage**: Persistent local data
- **Cloud Sync**: Scheduled backup uploads
- **Conflict Resolution**: Timestamp-based merging

---

## 🎨 **10. USER INTERFACE & EXPERIENCE**

### **10.1 Design System**

#### **Color Scheme:**
- **Primary**: Blue gradient (#3b82f6 to #1d4ed8)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Error**: Red (#ef4444)
- **Neutral**: Gray scale (#f9fafb to #111827)

#### **Typography:**
- **Headers**: Bold, large font sizes
- **Body Text**: Regular weight, readable sizes
- **Labels**: Medium weight, smaller sizes
- **Monospace**: Code, IDs, technical data

### **10.2 Responsive Design**

#### **Breakpoints:**
- **Mobile**: < 768px (single column layouts)
- **Tablet**: 768px - 1024px (adapted grids)
- **Desktop**: > 1024px (full feature layouts)

#### **Adaptive Components:**
- **Navigation**: Collapsible sidebar on mobile
- **Tables**: Horizontal scroll on small screens
- **Forms**: Stacked fields on mobile
- **Cards**: Responsive grid layouts

### **10.3 Accessibility Features**

#### **WCAG Compliance:**
- **Keyboard Navigation**: Tab order and focus management
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: High contrast ratios
- **Focus Indicators**: Visible focus states

#### **Tooltip System:**
- **Hover Descriptions**: Contextual help for all clickables
- **Keyboard Shortcuts**: Alt text for power users
- **Error Messages**: Clear validation feedback
- **Loading States**: Progress indicators

---

## 🔒 **11. SECURITY IMPLEMENTATION**

### **11.1 Authentication Security**

#### **Password Security:**
- **Hashing**: bcrypt with salt rounds
- **Validation**: Minimum complexity requirements
- **Session Management**: JWT with expiration
- **Token Refresh**: Automatic renewal system

### **11.2 Data Protection**

#### **Encryption:**
- **In Transit**: HTTPS/TLS encryption
- **At Rest**: Database field encryption
- **Local Storage**: Encrypted sensitive data
- **Backup Encryption**: Secure cloud storage

### **11.3 Access Control**

#### **Role-based Permissions:**
```javascript
const moduleAccess = {
  'dashboard': ['Admin', 'Accountant', 'Analyst', 'Staff'],
  'products': ['Admin', 'Accountant', 'Staff'],
  'invoices': ['Admin', 'Accountant'],
  'reports': ['Admin', 'Accountant', 'Analyst'],
  'gst': ['Admin', 'Accountant'],
  'settings': ['Admin']
};
```

---

## 📱 **12. OFFLINE CAPABILITY**

### **12.1 Progressive Web App (PWA)**

#### **Service Worker Implementation:**
- **Caching Strategy**: Cache-first for static assets
- **Offline Storage**: IndexedDB for transaction data
- **Sync Queue**: Background sync when online
- **Update Notifications**: New version alerts

### **12.2 Offline Data Management**

#### **Local Storage Strategy:**
```javascript
const offlineStorage = {
  products: localStorage.getItem('products'),
  invoices: localStorage.getItem('invoices'),
  transactions: localStorage.getItem('transactions'),
  settings: localStorage.getItem('settings')
};
```

#### **Sync Mechanism:**
- **Online Detection**: Network status monitoring
- **Queue Management**: Pending operations storage
- **Conflict Resolution**: Merge strategies for data conflicts
- **Error Handling**: Retry mechanisms for failed syncs

---

## 🚀 **13. PERFORMANCE OPTIMIZATION**

### **13.1 Frontend Optimization**

#### **React Performance:**
- **Component Memoization**: React.memo for expensive components
- **State Optimization**: Minimal re-renders
- **Lazy Loading**: Code splitting for routes
- **Bundle Optimization**: Tree shaking and minification

### **13.2 Data Optimization**

#### **Efficient Data Structures:**
- **Normalized State**: Flat data structures
- **Indexed Access**: Fast lookups by ID
- **Pagination**: Large dataset handling
- **Caching**: Computed values storage

---

## 📈 **14. SCALABILITY FEATURES**

### **14.1 Multi-tenant Architecture**

#### **Organization Isolation:**
- **Data Separation**: Complete org-level isolation
- **Resource Allocation**: Per-organization limits
- **Billing Integration**: Usage-based pricing (future)
- **Custom Branding**: Organization-specific themes (future)

### **14.2 Modular Design**

#### **Plugin Architecture:**
- **Module Independence**: Loosely coupled components
- **Feature Flags**: Conditional feature enabling
- **API Extensibility**: Third-party integrations
- **Custom Modules**: Organization-specific features

---

## 🎯 **CURRENT FEATURE SUMMARY**

### **✅ Fully Implemented Features:**
1. **Multi-tenant Organization System** with unique IDs
2. **Complete Authentication** with 2FA support
3. **Product Management** with QR codes and perishable tracking
4. **Professional Invoicing** with dual input methods
5. **Point of Sale System** with real-time cart management
6. **Financial Reports** with visual analytics
7. **GST Compliance** with automated report generation
8. **AI Financial Assistant** with business insights
9. **Comprehensive Settings** with security and team management
10. **Responsive UI/UX** with accessibility features
11. **Offline Capability** with data synchronization
12. **Role-based Access Control** with permission management

### **🔄 Integration Points:**
- All modules share common authentication
- Cross-module data flow for seamless operations
- Unified state management across components
- Real-time synchronization between online/offline modes

### **🎨 User Experience:**
- One-click access to all major functions
- Intuitive navigation with tooltips
- Professional design with modern animations
- Mobile-responsive interface
- Keyboard shortcuts for power users

---

**This workflow documentation represents the complete current state of setLedger's features and implementation as of the latest development cycle.**