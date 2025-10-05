const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const aiAssistantService = require('../services/aiAssistantService');
const Invoice = require('../models/Invoice');
const JournalEntry = require('../models/JournalEntry');
const Product = require('../models/Product');

// Chat with AI assistant
router.post('/chat/:orgId/:memberId', auth, async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { message } = req.body;

    // Get organization context
    const context = await getOrganizationContext(orgId, memberId);
    
    // Send to AI service
    const response = await aiAssistantService.processMessage(message, context);

    res.json({
      success: true,
      message: response.message,
      data: response.data,
      suggestions: response.suggestions
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get organization context for AI
router.get('/context/:orgId/:memberId', auth, async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const context = await getOrganizationContext(orgId, memberId);

    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    console.error('Error fetching context:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Train AI with organization data
router.post('/train/:orgId/:memberId', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    
    const context = await getOrganizationContext(orgId, memberId);
    const trainingResult = await aiAssistantService.trainWithContext(context);

    res.json({
      success: true,
      data: trainingResult
    });
  } catch (error) {
    console.error('Error training AI:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

async function getOrganizationContext(orgId, memberId) {
  const userId = `${orgId}_${memberId}`;
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const [invoices, expenses, products] = await Promise.all([
    Invoice.find({ userId, createdAt: { $gte: last30Days } }).limit(50),
    JournalEntry.find({ userId, type: 'expense', date: { $gte: last30Days } }).limit(50),
    Product.find({ userId }).limit(20)
  ]);

  // Calculate key metrics
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const profit = totalRevenue - totalExpenses;
  
  const topProducts = products
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 5);

  const expenseCategories = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  return {
    orgId,
    memberId,
    period: '30 days',
    metrics: {
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
      invoiceCount: invoices.length,
      averageOrderValue: invoices.length > 0 ? totalRevenue / invoices.length : 0
    },
    topProducts: topProducts.map(p => ({
      name: p.name,
      price: p.price,
      stock: p.stock,
      salesCount: p.salesCount || 0
    })),
    expenseCategories,
    recentInvoices: invoices.slice(-5).map(inv => ({
      date: inv.createdAt,
      total: inv.total,
      customerName: inv.customerName
    })),
    trends: {
      dailyRevenue: calculateDailyTrends(invoices),
      dailyExpenses: calculateDailyTrends(expenses, 'amount', 'date')
    }
  };
}

function calculateDailyTrends(data, valueField = 'total', dateField = 'createdAt') {
  const trends = {};
  data.forEach(item => {
    const date = new Date(item[dateField]).toISOString().split('T')[0];
    trends[date] = (trends[date] || 0) + item[valueField];
  });
  return trends;
}

module.exports = router;