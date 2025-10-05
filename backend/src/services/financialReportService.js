const Invoice = require('../models/Invoice');
const { Transaction, ChartOfAccounts } = require('../models/accounting');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

class FinancialReportService {
  async generateProfitLoss(orgId, memberId, startDate, endDate) {
    const userId = `${orgId}_${memberId}`;
    
    const [revenue, expenses] = await Promise.all([
      this.getRevenue(userId, startDate, endDate),
      this.getExpenses(userId, startDate, endDate)
    ]);

    const grossProfit = revenue.total - revenue.cogs;
    const netProfit = grossProfit - expenses.operating - expenses.nonOperating;

    return {
      period: { startDate, endDate },
      revenue: {
        sales: revenue.sales,
        otherIncome: revenue.other,
        total: revenue.total
      },
      costOfGoodsSold: revenue.cogs,
      grossProfit,
      expenses: {
        operating: expenses.operating,
        nonOperating: expenses.nonOperating,
        total: expenses.operating + expenses.nonOperating,
        breakdown: expenses.breakdown
      },
      netProfit,
      margins: {
        gross: revenue.total > 0 ? (grossProfit / revenue.total) * 100 : 0,
        net: revenue.total > 0 ? (netProfit / revenue.total) * 100 : 0
      }
    };
  }

  async generateBalanceSheet(orgId, memberId, asOfDate) {
    const userId = `${orgId}_${memberId}`;
    
    const [assets, liabilities, equity] = await Promise.all([
      this.getAssets(userId, asOfDate),
      this.getLiabilities(userId, asOfDate),
      this.getEquity(userId, asOfDate)
    ]);

    const totalAssets = assets.current + assets.nonCurrent;
    const totalLiabilities = liabilities.current + liabilities.nonCurrent;
    const totalEquity = equity.capital + equity.retainedEarnings;

    return {
      asOfDate,
      assets: {
        current: assets.current,
        nonCurrent: assets.nonCurrent,
        total: totalAssets,
        breakdown: assets.breakdown
      },
      liabilities: {
        current: liabilities.current,
        nonCurrent: liabilities.nonCurrent,
        total: totalLiabilities,
        breakdown: liabilities.breakdown
      },
      equity: {
        capital: equity.capital,
        retainedEarnings: equity.retainedEarnings,
        total: totalEquity,
        breakdown: equity.breakdown
      },
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    };
  }

  async generateCashFlow(orgId, memberId, startDate, endDate) {
    const userId = `${orgId}_${memberId}`;
    
    const [operating, investing, financing] = await Promise.all([
      this.getOperatingCashFlow(userId, startDate, endDate),
      this.getInvestingCashFlow(userId, startDate, endDate),
      this.getFinancingCashFlow(userId, startDate, endDate)
    ]);

    const netCashFlow = operating.net + investing.net + financing.net;

    return {
      period: { startDate, endDate },
      operating: {
        receipts: operating.receipts,
        payments: operating.payments,
        net: operating.net,
        breakdown: operating.breakdown
      },
      investing: {
        receipts: investing.receipts,
        payments: investing.payments,
        net: investing.net,
        breakdown: investing.breakdown
      },
      financing: {
        receipts: financing.receipts,
        payments: financing.payments,
        net: financing.net,
        breakdown: financing.breakdown
      },
      netCashFlow,
      openingBalance: await this.getOpeningCashBalance(userId, startDate),
      closingBalance: await this.getClosingCashBalance(userId, endDate)
    };
  }

  async getRevenue(userId, startDate, endDate) {
    const invoices = await Invoice.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    });

    const sales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const cogs = invoices.reduce((sum, inv) => {
      return sum + (inv.items || []).reduce((itemSum, item) => {
        return itemSum + (item.quantity * (item.costPrice || 0));
      }, 0);
    }, 0);

    return { sales, other: 0, total: sales, cogs };
  }

  async getExpenses(userId, startDate, endDate) {
    const transactions = await Transaction.find({
      userId,
      type: 'debit',
      date: { $gte: startDate, $lte: endDate }
    });

    const breakdown = {};
    let operating = 0;
    let nonOperating = 0;

    transactions.forEach(txn => {
      const category = txn.category || 'Other';
      breakdown[category] = (breakdown[category] || 0) + txn.amount;
      
      if (['salary', 'rent', 'utilities', 'marketing'].includes(category.toLowerCase())) {
        operating += txn.amount;
      } else {
        nonOperating += txn.amount;
      }
    });

    return { operating, nonOperating, breakdown };
  }

  async getAssets(userId, asOfDate) {
    // Simplified asset calculation
    const cash = await this.getCashBalance(userId, asOfDate);
    const receivables = await this.getAccountsReceivable(userId, asOfDate);
    const inventory = await this.getInventoryValue(userId, asOfDate);
    
    return {
      current: cash + receivables + inventory,
      nonCurrent: 0,
      breakdown: { cash, receivables, inventory }
    };
  }

  async getLiabilities(userId, asOfDate) {
    const payables = await this.getAccountsPayable(userId, asOfDate);
    
    return {
      current: payables,
      nonCurrent: 0,
      breakdown: { payables }
    };
  }

  async getEquity(userId, asOfDate) {
    return {
      capital: 100000, // Default capital
      retainedEarnings: 0,
      breakdown: { capital: 100000, retainedEarnings: 0 }
    };
  }

  async getOperatingCashFlow(userId, startDate, endDate) {
    const receipts = await this.getCashReceipts(userId, startDate, endDate);
    const payments = await this.getCashPayments(userId, startDate, endDate);
    
    return {
      receipts,
      payments,
      net: receipts - payments,
      breakdown: { customerReceipts: receipts, supplierPayments: payments }
    };
  }

  async getInvestingCashFlow(userId, startDate, endDate) {
    return { receipts: 0, payments: 0, net: 0, breakdown: {} };
  }

  async getFinancingCashFlow(userId, startDate, endDate) {
    return { receipts: 0, payments: 0, net: 0, breakdown: {} };
  }

  async getCashBalance(userId, asOfDate) {
    const transactions = await Transaction.find({
      userId,
      date: { $lte: asOfDate },
      account: /cash|bank/i
    });

    return transactions.reduce((balance, txn) => {
      return balance + (txn.type === 'credit' ? txn.amount : -txn.amount);
    }, 0);
  }

  async getAccountsReceivable(userId, asOfDate) {
    const invoices = await Invoice.find({
      userId,
      createdAt: { $lte: asOfDate },
      'payment.status': { $in: ['pending', 'partial'] }
    });

    return invoices.reduce((sum, inv) => {
      return sum + (inv.total - (inv.payment?.paidAmount || 0));
    }, 0);
  }

  async getInventoryValue(userId, asOfDate) {
    // Simplified inventory calculation
    return 50000; // Mock value
  }

  async getAccountsPayable(userId, asOfDate) {
    // Simplified payables calculation
    return 25000; // Mock value
  }

  async getCashReceipts(userId, startDate, endDate) {
    const invoices = await Invoice.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate },
      'payment.status': 'paid'
    });

    return invoices.reduce((sum, inv) => sum + (inv.payment?.paidAmount || 0), 0);
  }

  async getCashPayments(userId, startDate, endDate) {
    const transactions = await Transaction.find({
      userId,
      type: 'debit',
      date: { $gte: startDate, $lte: endDate },
      account: /cash|bank/i
    });

    return transactions.reduce((sum, txn) => sum + txn.amount, 0);
  }

  async getOpeningCashBalance(userId, startDate) {
    const prevDay = new Date(startDate);
    prevDay.setDate(prevDay.getDate() - 1);
    return this.getCashBalance(userId, prevDay);
  }

  async getClosingCashBalance(userId, endDate) {
    return this.getCashBalance(userId, endDate);
  }

  async exportToPDF(reportData, reportType) {
    const doc = new PDFDocument();
    
    doc.fontSize(20).text(`${reportType} Report`, 50, 50);
    doc.fontSize(12).text(`Period: ${reportData.period?.startDate || reportData.asOfDate}`, 50, 80);
    
    let y = 120;
    
    if (reportType === 'Profit & Loss') {
      y = this.addPLToPDF(doc, reportData, y);
    } else if (reportType === 'Balance Sheet') {
      y = this.addBalanceSheetToPDF(doc, reportData, y);
    } else if (reportType === 'Cash Flow') {
      y = this.addCashFlowToPDF(doc, reportData, y);
    }
    
    doc.end();
    return doc;
  }

  addPLToPDF(doc, data, y) {
    doc.fontSize(14).text('Revenue', 50, y);
    doc.fontSize(12).text(`Sales: ₹${data.revenue.sales.toLocaleString()}`, 70, y + 20);
    doc.text(`Total Revenue: ₹${data.revenue.total.toLocaleString()}`, 70, y + 40);
    
    y += 80;
    doc.fontSize(14).text('Expenses', 50, y);
    doc.fontSize(12).text(`Operating: ₹${data.expenses.operating.toLocaleString()}`, 70, y + 20);
    doc.text(`Total Expenses: ₹${data.expenses.total.toLocaleString()}`, 70, y + 40);
    
    y += 80;
    doc.fontSize(14).text(`Net Profit: ₹${data.netProfit.toLocaleString()}`, 50, y);
    
    return y + 40;
  }

  addBalanceSheetToPDF(doc, data, y) {
    doc.fontSize(14).text('Assets', 50, y);
    doc.fontSize(12).text(`Current Assets: ₹${data.assets.current.toLocaleString()}`, 70, y + 20);
    doc.text(`Total Assets: ₹${data.assets.total.toLocaleString()}`, 70, y + 40);
    
    y += 80;
    doc.fontSize(14).text('Liabilities & Equity', 50, y);
    doc.fontSize(12).text(`Total Liabilities: ₹${data.liabilities.total.toLocaleString()}`, 70, y + 20);
    doc.text(`Total Equity: ₹${data.equity.total.toLocaleString()}`, 70, y + 40);
    
    return y + 80;
  }

  addCashFlowToPDF(doc, data, y) {
    doc.fontSize(14).text('Operating Activities', 50, y);
    doc.fontSize(12).text(`Net Operating Cash Flow: ₹${data.operating.net.toLocaleString()}`, 70, y + 20);
    
    y += 60;
    doc.fontSize(14).text(`Net Cash Flow: ₹${data.netCashFlow.toLocaleString()}`, 50, y);
    
    return y + 40;
  }

  async exportToExcel(reportData, reportType) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportType);
    
    worksheet.addRow([`${reportType} Report`]);
    worksheet.addRow([`Period: ${reportData.period?.startDate || reportData.asOfDate}`]);
    worksheet.addRow([]);
    
    if (reportType === 'Profit & Loss') {
      this.addPLToExcel(worksheet, reportData);
    } else if (reportType === 'Balance Sheet') {
      this.addBalanceSheetToExcel(worksheet, reportData);
    } else if (reportType === 'Cash Flow') {
      this.addCashFlowToExcel(worksheet, reportData);
    }
    
    return workbook;
  }

  addPLToExcel(worksheet, data) {
    worksheet.addRow(['Revenue']);
    worksheet.addRow(['Sales', data.revenue.sales]);
    worksheet.addRow(['Total Revenue', data.revenue.total]);
    worksheet.addRow([]);
    worksheet.addRow(['Expenses']);
    worksheet.addRow(['Operating Expenses', data.expenses.operating]);
    worksheet.addRow(['Total Expenses', data.expenses.total]);
    worksheet.addRow([]);
    worksheet.addRow(['Net Profit', data.netProfit]);
  }

  addBalanceSheetToExcel(worksheet, data) {
    worksheet.addRow(['Assets']);
    worksheet.addRow(['Current Assets', data.assets.current]);
    worksheet.addRow(['Total Assets', data.assets.total]);
    worksheet.addRow([]);
    worksheet.addRow(['Liabilities']);
    worksheet.addRow(['Total Liabilities', data.liabilities.total]);
    worksheet.addRow([]);
    worksheet.addRow(['Equity']);
    worksheet.addRow(['Total Equity', data.equity.total]);
  }

  addCashFlowToExcel(worksheet, data) {
    worksheet.addRow(['Operating Activities']);
    worksheet.addRow(['Cash Receipts', data.operating.receipts]);
    worksheet.addRow(['Cash Payments', data.operating.payments]);
    worksheet.addRow(['Net Operating Cash Flow', data.operating.net]);
    worksheet.addRow([]);
    worksheet.addRow(['Net Cash Flow', data.netCashFlow]);
  }
}

module.exports = new FinancialReportService();