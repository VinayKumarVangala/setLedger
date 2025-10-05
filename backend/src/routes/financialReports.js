const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const financialReportService = require('../services/financialReportService');

// Generate Profit & Loss report
router.post('/profit-loss/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant', 'Analyst']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { startDate, endDate } = req.body;

    const report = await financialReportService.generateProfitLoss(
      orgId, 
      memberId, 
      new Date(startDate), 
      new Date(endDate)
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating P&L report:', error);
    res.status(500).json({ success: false, message: 'Report generation failed' });
  }
});

// Generate Balance Sheet report
router.post('/balance-sheet/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant', 'Analyst']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { asOfDate } = req.body;

    const report = await financialReportService.generateBalanceSheet(
      orgId, 
      memberId, 
      new Date(asOfDate)
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating balance sheet:', error);
    res.status(500).json({ success: false, message: 'Report generation failed' });
  }
});

// Generate Cash Flow report
router.post('/cash-flow/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant', 'Analyst']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { startDate, endDate } = req.body;

    const report = await financialReportService.generateCashFlow(
      orgId, 
      memberId, 
      new Date(startDate), 
      new Date(endDate)
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating cash flow report:', error);
    res.status(500).json({ success: false, message: 'Report generation failed' });
  }
});

// Export report to PDF
router.post('/export/pdf', auth, async (req, res) => {
  try {
    const { reportData, reportType } = req.body;

    const pdfDoc = await financialReportService.exportToPDF(reportData, reportType);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType.replace(/\s+/g, '_')}_Report.pdf"`);
    
    pdfDoc.pipe(res);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ success: false, message: 'PDF export failed' });
  }
});

// Export report to Excel
router.post('/export/excel', auth, async (req, res) => {
  try {
    const { reportData, reportType } = req.body;

    const workbook = await financialReportService.exportToExcel(reportData, reportType);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType.replace(/\s+/g, '_')}_Report.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ success: false, message: 'Excel export failed' });
  }
});

// Export report to CSV
router.post('/export/csv', auth, async (req, res) => {
  try {
    const { reportData, reportType } = req.body;

    let csvContent = `${reportType} Report\n`;
    csvContent += `Period: ${reportData.period?.startDate || reportData.asOfDate}\n\n`;

    if (reportType === 'Profit & Loss') {
      csvContent += 'Revenue\n';
      csvContent += `Sales,${reportData.revenue.sales}\n`;
      csvContent += `Total Revenue,${reportData.revenue.total}\n\n`;
      csvContent += 'Expenses\n';
      csvContent += `Operating Expenses,${reportData.expenses.operating}\n`;
      csvContent += `Total Expenses,${reportData.expenses.total}\n\n`;
      csvContent += `Net Profit,${reportData.netProfit}\n`;
    } else if (reportType === 'Balance Sheet') {
      csvContent += 'Assets\n';
      csvContent += `Current Assets,${reportData.assets.current}\n`;
      csvContent += `Total Assets,${reportData.assets.total}\n\n`;
      csvContent += 'Liabilities\n';
      csvContent += `Total Liabilities,${reportData.liabilities.total}\n\n`;
      csvContent += 'Equity\n';
      csvContent += `Total Equity,${reportData.equity.total}\n`;
    } else if (reportType === 'Cash Flow') {
      csvContent += 'Operating Activities\n';
      csvContent += `Cash Receipts,${reportData.operating.receipts}\n`;
      csvContent += `Cash Payments,${reportData.operating.payments}\n`;
      csvContent += `Net Operating Cash Flow,${reportData.operating.net}\n\n`;
      csvContent += `Net Cash Flow,${reportData.netCashFlow}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType.replace(/\s+/g, '_')}_Report.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ success: false, message: 'CSV export failed' });
  }
});

module.exports = router;