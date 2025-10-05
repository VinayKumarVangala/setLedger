const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const JournalEntry = require('../models/JournalEntry');

const getDashboardData = async (req, res) => {
  try {
    const { userId } = req.user;
    const orgId = userId.split('_')[0];
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Revenue this month
    const revenue = await Invoice.aggregate([
      { $match: { orgId, createdAt: { $gte: monthStart }, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    // Low stock alerts
    const lowStockProducts = await Product.find({
      orgId,
      quantity: { $lte: 10 }
    }).limit(5);
    
    // Recent transactions
    const recentTransactions = await JournalEntry.find({ orgId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('invoiceId', 'invoiceNumber');
    
    // Quick stats
    const totalProducts = await Product.countDocuments({ orgId });
    const pendingInvoices = await Invoice.countDocuments({ orgId, status: 'pending' });
    
    res.json({
      revenue: revenue[0]?.total || 0,
      alerts: lowStockProducts.map(p => ({
        type: 'low_stock',
        message: `${p.name} is running low (${p.quantity} left)`,
        product: p.name,
        quantity: p.quantity
      })),
      recommendations: [
        totalProducts < 5 && 'Add more products to your inventory',
        pendingInvoices > 0 && `You have ${pendingInvoices} pending invoices`,
        lowStockProducts.length > 0 && 'Consider restocking low inventory items'
      ].filter(Boolean),
      stats: {
        totalProducts,
        pendingInvoices,
        lowStockCount: lowStockProducts.length
      },
      recentTransactions: recentTransactions.map(t => ({
        id: t._id,
        description: t.description,
        amount: t.debitAmount || t.creditAmount,
        type: t.debitAmount ? 'debit' : 'credit',
        date: t.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardData };