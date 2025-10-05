const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const gstService = require('../services/gstService');
const GSTReport = require('../models/GSTReport');
const PDFDocument = require('pdfkit');

// Validate GSTIN
router.post('/validate-gstin', auth, async (req, res) => {
  try {
    const { gstin } = req.body;
    
    if (!gstin || gstin.length !== 15) {
      return res.status(400).json({ success: false, message: 'Invalid GSTIN format' });
    }

    const validation = await gstService.validateGSTIN(gstin);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('GSTIN validation error:', error);
    res.status(500).json({ success: false, message: 'Validation failed' });
  }
});

// Generate GSTR-1 report
router.post('/gstr1/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { month, year } = req.body;

    const reportData = await gstService.generateGSTR1(orgId, memberId, month, year);
    
    // Save report
    const report = await GSTReport.findOneAndUpdate(
      {
        userId: `${orgId}_${memberId}`,
        reportType: 'GSTR1',
        'period.month': month,
        'period.year': year
      },
      {
        data: reportData,
        summary: reportData.summary
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: reportData,
      reportId: report._id
    });
  } catch (error) {
    console.error('GSTR-1 generation error:', error);
    res.status(500).json({ success: false, message: 'Report generation failed' });
  }
});

// Generate GSTR-3B report
router.post('/gstr3b/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { month, year } = req.body;

    const reportData = await gstService.generateGSTR3B(orgId, memberId, month, year);
    
    // Save report
    const report = await GSTReport.findOneAndUpdate(
      {
        userId: `${orgId}_${memberId}`,
        reportType: 'GSTR3B',
        'period.month': month,
        'period.year': year
      },
      {
        data: reportData,
        summary: reportData.summary
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: reportData,
      reportId: report._id
    });
  } catch (error) {
    console.error('GSTR-3B generation error:', error);
    res.status(500).json({ success: false, message: 'Report generation failed' });
  }
});

// Get saved reports
router.get('/reports/:orgId/:memberId', auth, checkRole(['Admin', 'Accountant', 'Analyst']), async (req, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { reportType, year } = req.query;

    const query = { userId: `${orgId}_${memberId}` };
    if (reportType) query.reportType = reportType;
    if (year) query['period.year'] = parseInt(year);

    const reports = await GSTReport.find(query)
      .select('reportType period summary status createdAt')
      .sort({ 'period.year': -1, 'period.month': -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Download report as PDF
router.get('/download/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await GSTReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.reportType}_${report.period.month}_${report.period.year}.pdf"`);
    
    doc.pipe(res);
    
    // Generate PDF content
    doc.fontSize(20).text(`${report.reportType} Report`, 50, 50);
    doc.fontSize(14).text(`Period: ${report.period.month}/${report.period.year}`, 50, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 50, 100);
    
    if (report.reportType === 'GSTR1') {
      generateGSTR1PDF(doc, report.data);
    } else if (report.reportType === 'GSTR3B') {
      generateGSTR3BPDF(doc, report.data);
    }
    
    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: 'PDF generation failed' });
  }
});

// Download report as JSON
router.get('/download-json/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await GSTReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${report.reportType}_${report.period.month}_${report.period.year}.json"`);
    
    res.json(report.data);
  } catch (error) {
    console.error('JSON download error:', error);
    res.status(500).json({ success: false, message: 'Download failed' });
  }
});

function generateGSTR1PDF(doc, data) {
  let y = 140;
  
  doc.fontSize(16).text('B2B Supplies', 50, y);
  y += 30;
  
  data.b2b.forEach(entry => {
    doc.fontSize(12).text(`GSTIN: ${entry.ctin}`, 50, y);
    y += 20;
    
    entry.inv.forEach(inv => {
      doc.text(`Invoice: ${inv.inum} | Date: ${inv.idt} | Value: ₹${inv.val}`, 70, y);
      y += 15;
    });
    y += 10;
  });
  
  doc.fontSize(16).text('Summary', 50, y + 20);
  doc.fontSize(12).text(`Total Invoices: ${data.summary.totalInvoices}`, 50, y + 50);
  doc.text(`Total Taxable Value: ₹${data.summary.totalTaxableValue}`, 50, y + 70);
  doc.text(`Total Tax: ₹${data.summary.totalTax}`, 50, y + 90);
}

function generateGSTR3BPDF(doc, data) {
  let y = 140;
  
  doc.fontSize(16).text('Outward Supplies', 50, y);
  y += 30;
  
  doc.fontSize(12).text(`Taxable Value: ₹${data.outwardSupplies.taxableValue}`, 50, y);
  doc.text(`IGST: ₹${data.outwardSupplies.igst}`, 50, y + 20);
  doc.text(`CGST: ₹${data.outwardSupplies.cgst}`, 50, y + 40);
  doc.text(`SGST: ₹${data.outwardSupplies.sgst}`, 50, y + 60);
  
  y += 100;
  doc.fontSize(16).text('Input Tax Credit', 50, y);
  y += 30;
  
  doc.fontSize(12).text(`ITC Availed: ₹${data.itc.itcAvailed}`, 50, y);
  doc.text(`Net ITC: ₹${data.itc.netItc}`, 50, y + 20);
  
  y += 60;
  doc.fontSize(16).text('Tax Payable', 50, y);
  y += 30;
  
  doc.fontSize(12).text(`Net Tax Payable: ₹${data.taxPayable.netTaxPayable}`, 50, y);
}

module.exports = router;