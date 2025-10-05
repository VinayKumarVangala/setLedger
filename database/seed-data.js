// Sample seed data for setLedger MongoDB collections
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');

// Generate sample data for testing
const generateSeedData = async () => {
  
  // 1. Sample Organizations
  const organizations = [
    {
      orgID: "ORG001",
      name: "TechCorp Solutions",
      email: "admin@techcorp.com",
      phone: "+91-9876543210",
      address: {
        street: "123 Tech Park",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        pincode: "560001"
      },
      gstin: "29ABCDE1234F1Z5",
      businessType: "service",
      subscription: {
        plan: "premium",
        expiresAt: new Date("2024-12-31"),
        features: ["ai_analytics", "advanced_reports", "multi_user"]
      },
      settings: {
        currency: "INR",
        timezone: "Asia/Kolkata",
        dateFormat: "DD/MM/YYYY"
      },
      createdBy: "SYSTEM",
      updatedBy: "SYSTEM"
    },
    {
      orgID: "ORG002", 
      name: "Retail Plus",
      email: "owner@retailplus.com",
      phone: "+91-8765432109",
      address: {
        street: "456 Market Street",
        city: "Mumbai",
        state: "Maharashtra", 
        country: "India",
        pincode: "400001"
      },
      gstin: "27FGHIJ5678K2L9",
      businessType: "retail",
      subscription: {
        plan: "basic",
        expiresAt: new Date("2024-06-30"),
        features: ["basic_billing", "inventory"]
      },
      createdBy: "SYSTEM",
      updatedBy: "SYSTEM"
    }
  ];

  // 2. Sample Users
  const hashedPassword = await bcrypt.hash("SecurePass123!", 12);
  const totpSecret = speakeasy.generateSecret({name: 'setLedger'}).base32;
  
  const users = [
    {
      userID: "ORG001_USR001",
      orgID: "ORG001",
      memberID: "USR001",
      name: "John Doe",
      email: "john@techcorp.com",
      phone: "+91-9876543210",
      password: hashedPassword,
      role: "admin",
      permissions: [
        { module: "billing", actions: ["read", "write", "delete", "admin"] },
        { module: "inventory", actions: ["read", "write", "delete"] },
        { module: "gst", actions: ["read", "write"] },
        { module: "analytics", actions: ["read", "write"] },
        { module: "users", actions: ["read", "write", "delete", "admin"] }
      ],
      auth: {
        totpSecret: totpSecret,
        totpEnabled: true,
        backupCodes: ["12345678", "87654321", "11223344"],
        lastLogin: new Date(),
        loginAttempts: 0
      },
      profile: {
        preferences: {
          theme: "dark",
          language: "en",
          notifications: true
        }
      },
      createdBy: "ORG001_USR001",
      updatedBy: "ORG001_USR001"
    },
    {
      userID: "ORG001_USR002",
      orgID: "ORG001", 
      memberID: "USR002",
      name: "Jane Smith",
      email: "jane@techcorp.com",
      password: hashedPassword,
      role: "accountant",
      permissions: [
        { module: "billing", actions: ["read", "write"] },
        { module: "gst", actions: ["read", "write"] },
        { module: "analytics", actions: ["read"] }
      ],
      auth: {
        totpEnabled: false,
        loginAttempts: 0
      },
      createdBy: "ORG001_USR001",
      updatedBy: "ORG001_USR001"
    },
    {
      userID: "ORG002_USR001",
      orgID: "ORG002",
      memberID: "USR001", 
      name: "Raj Patel",
      email: "raj@retailplus.com",
      password: hashedPassword,
      role: "admin",
      permissions: [
        { module: "billing", actions: ["read", "write", "delete"] },
        { module: "inventory", actions: ["read", "write"] }
      ],
      auth: {
        totpEnabled: false,
        loginAttempts: 0
      },
      createdBy: "ORG002_USR001",
      updatedBy: "ORG002_USR001"
    }
  ];

  // 3. Sample Products
  const products = [
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
        margin: 42.3
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
      status: "active",
      createdBy: "ORG001_USR001",
      updatedBy: "ORG001_USR001"
    },
    {
      productID: "ORG001_PRD002",
      orgID: "ORG001",
      name: "USB Keyboard",
      sku: "KB-001", 
      category: "electronics",
      description: "Mechanical USB keyboard with backlight",
      pricing: {
        costPrice: 45.00,
        sellingPrice: 75.99,
        mrp: 85.00,
        margin: 40.8
      },
      tax: {
        gstRate: 18,
        hsnCode: "84716020",
        taxCategory: "goods"
      },
      inventory: {
        currentStock: 75,
        minStock: 15,
        maxStock: 200,
        unit: "pcs",
        location: "Warehouse-A"
      },
      status: "active",
      createdBy: "ORG001_USR001",
      updatedBy: "ORG001_USR001"
    },
    {
      productID: "ORG002_PRD001",
      orgID: "ORG002",
      name: "Cotton T-Shirt",
      sku: "TS-001",
      category: "clothing",
      description: "100% cotton casual t-shirt",
      pricing: {
        costPrice: 8.00,
        sellingPrice: 15.99,
        mrp: 20.00,
        margin: 49.9
      },
      tax: {
        gstRate: 12,
        hsnCode: "61091000",
        taxCategory: "goods"
      },
      inventory: {
        currentStock: 200,
        minStock: 50,
        maxStock: 1000,
        unit: "pcs",
        location: "Store-Front"
      },
      status: "active",
      createdBy: "ORG002_USR001",
      updatedBy: "ORG002_USR001"
    }
  ];

  // 4. Sample Invoices
  const invoices = [
    {
      invoiceID: "ORG001_INV001",
      orgID: "ORG001",
      invoiceNumber: "INV-2024-001",
      customer: {
        name: "ABC Technologies",
        email: "purchase@abc.com",
        phone: "+91-9876543210",
        address: "789 Business District, Bangalore",
        gstin: "29KLMNO9012P3Q4"
      },
      items: [
        {
          productID: "ORG001_PRD001",
          productName: "Wireless Mouse",
          quantity: 5,
          unitPrice: 25.99,
          discount: 0,
          taxRate: 18,
          taxAmount: 23.39,
          totalAmount: 153.34
        },
        {
          productID: "ORG001_PRD002", 
          productName: "USB Keyboard",
          quantity: 2,
          unitPrice: 75.99,
          discount: 5.00,
          taxRate: 18,
          taxAmount: 24.36,
          totalAmount: 175.34
        }
      ],
      totals: {
        subtotal: 276.95,
        totalTax: 47.75,
        totalDiscount: 5.00,
        grandTotal: 319.70
      },
      payment: {
        method: "bank",
        status: "paid",
        paidAmount: 319.70,
        dueDate: new Date("2024-02-15"),
        terms: "Net 30 days"
      },
      status: "paid",
      notes: "Thank you for your business",
      createdBy: "ORG001_USR001",
      updatedBy: "ORG001_USR001"
    }
  ];

  // 5. Sample Stock Movements
  const stockMovements = [
    {
      stockID: "ORG001_STK001",
      orgID: "ORG001",
      productID: "ORG001_PRD001",
      transactionType: "purchase",
      quantity: 200,
      unitPrice: 15.00,
      totalValue: 3000.00,
      reference: {
        type: "purchase",
        id: "PUR-001"
      },
      balanceAfter: 200,
      reason: "Initial stock purchase",
      location: "Warehouse-A",
      createdBy: "ORG001_USR001",
      updatedBy: "ORG001_USR001"
    },
    {
      stockID: "ORG001_STK002",
      orgID: "ORG001",
      productID: "ORG001_PRD001",
      transactionType: "sale",
      quantity: -5,
      unitPrice: 25.99,
      totalValue: 129.95,
      reference: {
        type: "invoice",
        id: "ORG001_INV001"
      },
      balanceAfter: 195,
      reason: "Sale to ABC Technologies",
      location: "Warehouse-A",
      createdBy: "ORG001_USR001",
      updatedBy: "ORG001_USR001"
    }
  ];

  // 6. Sample Transactions
  const transactions = [
    {
      transactionID: "ORG001_TXN001",
      orgID: "ORG001",
      type: "income",
      category: "sales",
      amount: 319.70,
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
        amount: 47.75
      },
      status: "completed",
      date: new Date("2024-01-15"),
      createdBy: "ORG001_USR001",
      updatedBy: "ORG001_USR001"
    },
    {
      transactionID: "ORG001_TXN002",
      orgID: "ORG001",
      type: "expense",
      category: "purchase",
      amount: 3000.00,
      description: "Stock purchase from Tech Supplies Inc",
      account: {
        name: "Business Current Account", 
        type: "bank"
      },
      tax: {
        applicable: true,
        rate: 18,
        amount: 540.00
      },
      status: "completed",
      date: new Date("2024-01-10"),
      createdBy: "ORG001_USR001",
      updatedBy: "ORG001_USR001"
    }
  ];

  // 7. Sample GST Report
  const gstReports = [
    {
      reportID: "ORG001_GST001",
      orgID: "ORG001",
      reportType: "GSTR1",
      period: {
        month: 1,
        year: 2024
      },
      data: {
        totalSales: 319.70,
        totalPurchases: 3000.00,
        taxCollected: 47.75,
        taxPaid: 540.00,
        netTax: -492.25,
        transactions: [
          {
            invoiceID: "ORG001_INV001",
            customerGSTIN: "29KLMNO9012P3Q4",
            amount: 319.70,
            taxRate: 18,
            taxAmount: 47.75,
            placeOfSupply: "Karnataka"
          }
        ]
      },
      filing: {
        status: "draft",
        filedBy: "ORG001_USR001"
      },
      createdBy: "ORG001_USR001",
      updatedBy: "ORG001_USR001"
    }
  ];

  // 8. Sample AI Analytics
  const aiAnalytics = [
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
          reorderDate: new Date("2024-02-01"),
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
        executionTime: 1.2,
        dataPoints: 180
      },
      status: "completed",
      expiresAt: new Date(Date.now() + 30*24*60*60*1000), // 30 days from now
      createdBy: "ORG001_USR001",
      updatedBy: "ORG001_USR001"
    }
  ];

  return {
    organizations,
    users,
    products,
    invoices,
    stockMovements,
    transactions,
    gstReports,
    aiAnalytics
  };
};

module.exports = { generateSeedData };