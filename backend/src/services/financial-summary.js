const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class FinancialSummaryService {
  // Get KPI data from materialized views
  static async getKPIData(orgUUID, timeframe = 'monthly', limit = 12) {
    const viewName = timeframe === 'quarterly' ? 'quarterly_financial_kpis' : 'monthly_financial_kpis';
    const timeColumn = timeframe === 'quarterly' ? 'quarter' : 'month';
    
    const [kpis, expenses] = await Promise.all([
      prisma.$queryRaw`
        SELECT ${timeColumn}, revenue, tax_collected, cgst, sgst, igst, invoice_count, paid_count
        FROM ${viewName}
        WHERE organization_id = ${orgUUID}
        ORDER BY ${timeColumn} DESC
        LIMIT ${limit}
      `,
      prisma.$queryRaw`
        SELECT month, total_expenses, expense_count
        FROM monthly_expenses
        WHERE organization_id = ${orgUUID}
        ORDER BY month DESC
        LIMIT ${limit}
      `
    ]);

    return kpis.map(kpi => {
      const expense = expenses.find(e => e.month.getTime() === kpi[timeColumn].getTime()) || { total_expenses: 0 };
      return {
        period: kpi[timeColumn],
        revenue: Number(kpi.revenue) || 0,
        expenses: Number(expense.total_expenses) || 0,
        netProfit: (Number(kpi.revenue) || 0) - (Number(expense.total_expenses) || 0) - (Number(kpi.tax_collected) || 0),
        taxCollected: Number(kpi.tax_collected) || 0,
        cgst: Number(kpi.cgst) || 0,
        sgst: Number(kpi.sgst) || 0,
        igst: Number(kpi.igst) || 0,
        invoiceCount: Number(kpi.invoice_count) || 0,
        paidCount: Number(kpi.paid_count) || 0
      };
    }).reverse();
  }

  // Get pre-aggregated financial summary
  static async getFinancialSummary(orgUUID, period = 'current_month') {
    const dateRange = this.getDateRange(period);
    
    const [revenue, expenses, taxes] = await Promise.all([
      this.getRevenue(orgUUID, dateRange),
      this.getExpenses(orgUUID, dateRange),
      this.getTaxSummary(orgUUID, dateRange)
    ]);

    const netProfit = revenue.total - expenses.total - taxes.totalTax;

    return {
      netProfit,
      revenue: revenue.total,
      expenses: expenses.total,
      taxSummary: taxes,
      period,
      dateRange
    };
  }

  static async getRevenue(orgUUID, { startDate, endDate }) {
    const result = await prisma.invoice.aggregate({
      where: {
        orgUUID,
        status: 'paid',
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { totalAmount: true, taxAmount: true },
      _count: true
    });

    return {
      total: result._sum.totalAmount || 0,
      taxAmount: result._sum.taxAmount || 0,
      invoiceCount: result._count
    };
  }

  static async getExpenses(orgUUID, { startDate, endDate }) {
    const result = await prisma.journalEntry.aggregate({
      where: {
        orgUUID,
        type: 'expense',
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true },
      _count: true
    });

    return {
      total: result._sum.amount || 0,
      entryCount: result._count
    };
  }

  static async getTaxSummary(orgUUID, { startDate, endDate }) {
    const gstData = await prisma.invoice.aggregate({
      where: {
        orgUUID,
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: {
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
        cessAmount: true
      }
    });

    const totalTax = (gstData._sum.cgstAmount || 0) + 
                    (gstData._sum.sgstAmount || 0) + 
                    (gstData._sum.igstAmount || 0) + 
                    (gstData._sum.cessAmount || 0);

    return {
      totalTax,
      cgst: gstData._sum.cgstAmount || 0,
      sgst: gstData._sum.sgstAmount || 0,
      igst: gstData._sum.igstAmount || 0,
      cess: gstData._sum.cessAmount || 0
    };
  }

  // Refresh materialized views
  static async refreshViews() {
    await prisma.$executeRaw`SELECT refresh_financial_views()`;
  }

  static getDateRange(period) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  }
}

module.exports = FinancialSummaryService;