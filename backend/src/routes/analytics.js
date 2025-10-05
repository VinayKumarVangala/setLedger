const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const JournalEntry = require('../models/JournalEntry');
const aiService = require('../services/aiService');

// Get financial overview data
router.get('/financial/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant', 'Analyst']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { period = '30d' } = req.query;
    
    const days = parseInt(period.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const invoices = await Invoice.find({
      userId: `${orgId}_${memberId}`,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    const journalEntries = await JournalEntry.find({
      userId: `${orgId}_${memberId}`,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Group by date
    const dataMap = new Map();
    
    invoices.forEach(invoice => {
      const date = invoice.createdAt.toISOString().split('T')[0];
      if (!dataMap.has(date)) {
        dataMap.set(date, { date, revenue: 0, expenses: 0, profit: 0 });
      }
      const data = dataMap.get(date);
      data.revenue += invoice.total;
      data.profit += invoice.total;
    });

    journalEntries.forEach(entry => {
      const date = entry.date.toISOString().split('T')[0];
      if (!dataMap.has(date)) {
        dataMap.set(date, { date, revenue: 0, expenses: 0, profit: 0 });
      }
      const data = dataMap.get(date);
      if (entry.type === 'expense') {
        data.expenses += entry.amount;
        data.profit -= entry.amount;
      }
    });

    const financialData = Array.from(dataMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: financialData
    });
  } catch (error) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get revenue data
router.get('/revenue/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant', 'Analyst']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { period = '30d' } = req.query;
    
    const days = parseInt(period.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const invoices = await Invoice.find({
      userId: `${orgId}_${memberId}`,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    const revenueData = invoices.reduce((acc, invoice) => {
      const date = invoice.createdAt.toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        existing.revenue += invoice.total;
      } else {
        acc.push({ date, revenue: invoice.total });
      }
      
      return acc;
    }, []);

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get expense data
router.get('/expenses/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant', 'Analyst']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { period = '30d' } = req.query;
    
    const days = parseInt(period.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const expenses = await JournalEntry.find({
      userId: `${orgId}_${memberId}`,
      type: 'expense',
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const expenseData = expenses.reduce((acc, expense) => {
      const date = expense.date.toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        existing.expenses += expense.amount;
      } else {
        acc.push({ date, expenses: expense.amount });
      }
      
      return acc;
    }, []);

    res.json({
      success: true,
      data: expenseData
    });
  } catch (error) {
    console.error('Error fetching expense data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get expense categories
router.get('/expense-categories/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant', 'Analyst']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { period = '30d' } = req.query;
    
    const days = parseInt(period.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const expenses = await JournalEntry.aggregate([
      {
        $match: {
          userId: `${orgId}_${memberId}`,
          type: 'expense',
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: { amount: -1 }
      }
    ]);

    const categoryData = expenses.map(item => ({
      name: item._id || 'Other',
      amount: item.amount
    }));

    res.json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get profit data
router.get('/profit/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant', 'Analyst']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { period = '30d' } = req.query;
    
    const days = parseInt(period.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [invoices, expenses] = await Promise.all([
      Invoice.find({
        userId: `${orgId}_${memberId}`,
        createdAt: { $gte: startDate }
      }),
      JournalEntry.find({
        userId: `${orgId}_${memberId}`,
        type: 'expense',
        date: { $gte: startDate }
      })
    ]);

    const dataMap = new Map();
    
    invoices.forEach(invoice => {
      const date = invoice.createdAt.toISOString().split('T')[0];
      if (!dataMap.has(date)) {
        dataMap.set(date, { date, revenue: 0, expenses: 0, profit: 0, profitMargin: 0 });
      }
      const data = dataMap.get(date);
      data.revenue += invoice.total;
    });

    expenses.forEach(expense => {
      const date = expense.date.toISOString().split('T')[0];
      if (!dataMap.has(date)) {
        dataMap.set(date, { date, revenue: 0, expenses: 0, profit: 0, profitMargin: 0 });
      }
      const data = dataMap.get(date);
      data.expenses += expense.amount;
    });

    const profitData = Array.from(dataMap.values()).map(item => {
      item.profit = item.revenue - item.expenses;
      item.profitMargin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
      return item;
    });

    res.json({
      success: true,
      data: profitData
    });
  } catch (error) {
    console.error('Error fetching profit data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get AI forecast data
router.get('/forecast/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant', 'Analyst']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { type = 'all', days = 30 } = req.query;

    // Get historical data for AI prediction
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // 90 days of history

    const [invoices, expenses] = await Promise.all([
      Invoice.find({
        userId: `${orgId}_${memberId}`,
        createdAt: { $gte: startDate }
      }),
      JournalEntry.find({
        userId: `${orgId}_${memberId}`,
        type: 'expense',
        date: { $gte: startDate }
      })
    ]);

    // Prepare data for AI service
    const historicalData = {
      revenue: invoices.map(inv => ({ date: inv.createdAt, value: inv.total })),
      expenses: expenses.map(exp => ({ date: exp.date, value: exp.amount }))
    };

    // Get AI forecast
    const forecast = await aiService.getFinancialForecast(historicalData, parseInt(days));

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;