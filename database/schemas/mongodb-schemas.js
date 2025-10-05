// MongoDB Schemas for setLedger - Multi-tenant Architecture
const mongoose = require('mongoose');

// Base schema with common fields for all collections
const baseSchema = {
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true }, // orgID_memberID format
  updatedBy: { type: String, required: true }
};

// 1. Organization Schema
const organizationSchema = new mongoose.Schema({
  orgID: { type: String, unique: true, required: true }, // auto-generated
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  gstin: { type: String, sparse: true, unique: true },
  businessType: { type: String, enum: ['retail', 'wholesale', 'service', 'manufacturing'] },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    expiresAt: Date,
    features: [String]
  },
  settings: {
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' }
  },
  ...baseSchema
});

// 2. User Schema
const userSchema = new mongoose.Schema({
  userID: { type: String, unique: true, required: true }, // orgID_memberID
  orgID: { type: String, required: true, index: true },
  memberID: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true },
  phone: String,
  password: { type: String, required: true }, // bcrypt hashed
  role: { 
    type: String, 
    enum: ['admin', 'accountant', 'analyst', 'staff'], 
    required: true 
  },
  permissions: [{
    module: { type: String, enum: ['billing', 'inventory', 'gst', 'analytics', 'users'] },
    actions: [{ type: String, enum: ['read', 'write', 'delete', 'admin'] }]
  }],
  auth: {
    totpSecret: String,
    totpEnabled: { type: Boolean, default: false },
    backupCodes: [String],
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: Date
  },
  profile: {
    avatar: String,
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      language: { type: String, default: 'en' },
      notifications: { type: Boolean, default: true }
    }
  },
  fcmToken: {
    type: String,
    select: false
  },
  notificationPreferences: {
    taxReminders: { type: Boolean, default: true },
    stockAlerts: { type: Boolean, default: true },
    systemUpdates: { type: Boolean, default: true }
  },
  invitation: {
    token: String,
    invitedBy: String,
    invitedAt: Date,
    acceptedAt: Date,
    expiresAt: Date,
    status: { type: String, enum: ['pending', 'accepted', 'cancelled', 'expired'], default: 'pending' }
  },
  ...baseSchema
});

// 3. Product Schema
const productSchema = new mongoose.Schema({
  productID: { type: String, unique: true, required: true },
  orgID: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  pricing: {
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    mrp: Number,
    margin: Number // calculated field
  },
  tax: {
    gstRate: { type: Number, required: true },
    hsnCode: String,
    taxCategory: { type: String, enum: ['goods', 'services'] }
  },
  inventory: {
    currentStock: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    maxStock: Number,
    unit: { type: String, default: 'pcs' },
    location: String
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  qrCode: String, // generated QR code data
  images: [String],
  status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' },
  ...baseSchema
});

// 4. Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceID: { type: String, unique: true, required: true },
  orgID: { type: String, required: true, index: true },
  invoiceNumber: { type: String, required: true },
  customer: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: String,
    gstin: String
  },
  items: [{
    productID: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true }
  }],
  totals: {
    subtotal: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true }
  },
  payment: {
    method: { type: String, enum: ['cash', 'card', 'upi', 'bank', 'credit'] },
    status: { type: String, enum: ['pending', 'paid', 'partial', 'overdue'], default: 'pending' },
    paidAmount: { type: Number, default: 0 },
    dueDate: Date,
    terms: String
  },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'cancelled'], default: 'draft' },
  notes: String,
  ...baseSchema
});

// 5. Stock Schema (Inventory Movements)
const stockSchema = new mongoose.Schema({
  stockID: { type: String, unique: true, required: true },
  orgID: { type: String, required: true, index: true },
  productID: { type: String, required: true, index: true },
  transactionType: { 
    type: String, 
    enum: ['purchase', 'sale', 'adjustment', 'return', 'transfer'], 
    required: true 
  },
  quantity: { type: Number, required: true },
  unitPrice: Number,
  totalValue: Number,
  reference: {
    type: { type: String, enum: ['invoice', 'purchase', 'adjustment'] },
    id: String // invoiceID, purchaseID, etc.
  },
  balanceAfter: { type: Number, required: true },
  reason: String,
  location: String,
  ...baseSchema
});

// 6. Transaction Schema (Financial)
const transactionSchema = new mongoose.Schema({
  transactionID: { type: String, unique: true, required: true },
  orgID: { type: String, required: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { 
    type: String, 
    enum: ['sales', 'purchase', 'salary', 'rent', 'utilities', 'tax', 'other'],
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  reference: {
    type: { type: String, enum: ['invoice', 'bill', 'receipt'] },
    id: String,
    number: String
  },
  account: {
    name: String,
    type: { type: String, enum: ['cash', 'bank', 'card'] }
  },
  tax: {
    applicable: { type: Boolean, default: false },
    rate: Number,
    amount: Number
  },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
  date: { type: Date, required: true },
  ...baseSchema
});

// 7. GST Report Schema
const gstReportSchema = new mongoose.Schema({
  reportID: { type: String, unique: true, required: true },
  orgID: { type: String, required: true, index: true },
  reportType: { 
    type: String, 
    enum: ['GSTR1', 'GSTR3B', 'GSTR9'], 
    required: true 
  },
  period: {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    quarter: Number // for quarterly returns
  },
  data: {
    totalSales: Number,
    totalPurchases: Number,
    taxCollected: Number,
    taxPaid: Number,
    netTax: Number,
    transactions: [{
      invoiceID: String,
      customerGSTIN: String,
      amount: Number,
      taxRate: Number,
      taxAmount: Number,
      placeOfSupply: String
    }]
  },
  filing: {
    status: { type: String, enum: ['draft', 'filed', 'acknowledged'], default: 'draft' },
    filedDate: Date,
    acknowledgmentNumber: String,
    filedBy: String // userID
  },
  ...baseSchema
});

// 8. AI Analytics Schema
const aiAnalyticsSchema = new mongoose.Schema({
  analyticsID: { type: String, unique: true, required: true },
  orgID: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['stock_prediction', 'sales_forecast', 'price_optimization', 'anomaly_detection'],
    required: true 
  },
  input: {
    productID: String,
    timeframe: String,
    parameters: mongoose.Schema.Types.Mixed
  },
  prediction: {
    model: String,
    confidence: Number,
    results: mongoose.Schema.Types.Mixed,
    recommendations: [String]
  },
  performance: {
    accuracy: Number,
    executionTime: Number,
    dataPoints: Number
  },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  expiresAt: { type: Date, default: () => new Date(+new Date() + 30*24*60*60*1000) }, // 30 days
  ...baseSchema
});

// Indexes for performance optimization
organizationSchema.index({ orgID: 1 });
userSchema.index({ orgID: 1, email: 1 });
userSchema.index({ userID: 1 });
productSchema.index({ orgID: 1, sku: 1 });
invoiceSchema.index({ orgID: 1, invoiceNumber: 1 });
invoiceSchema.index({ orgID: 1, 'customer.gstin': 1 });
stockSchema.index({ orgID: 1, productID: 1, createdAt: -1 });
transactionSchema.index({ orgID: 1, date: -1 });
gstReportSchema.index({ orgID: 1, reportType: 1, 'period.month': 1, 'period.year': 1 });
aiAnalyticsSchema.index({ orgID: 1, type: 1, createdAt: -1 });
aiAnalyticsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware for updating timestamps and version
const updateTimestamp = function(next) {
  this.updatedAt = new Date();
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
};

[organizationSchema, userSchema, productSchema, invoiceSchema, 
 stockSchema, transactionSchema, gstReportSchema, aiAnalyticsSchema]
.forEach(schema => {
  schema.pre('save', updateTimestamp);
  schema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: new Date(), $inc: { version: 1 } });
  });
});

// Export models
module.exports = {
  Organization: mongoose.model('Organization', organizationSchema),
  User: mongoose.model('User', userSchema),
  Product: mongoose.model('Product', productSchema),
  Invoice: mongoose.model('Invoice', invoiceSchema),
  Stock: mongoose.model('Stock', stockSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
  GSTReport: mongoose.model('GSTReport', gstReportSchema),
  AIAnalytics: mongoose.model('AIAnalytics', aiAnalyticsSchema),
  ...require('./accounting')
};