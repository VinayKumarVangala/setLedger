const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ExportService {
  static async exportInvoicesPDF(orgId, filters = {}) {
    const invoices = await this.getInvoicesForExport(orgId, filters);
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Header
      doc.fontSize(18).text('Invoice Report', { align: 'center' });
      doc.moveDown();
      
      // Table headers
      const startY = doc.y;
      doc.fontSize(10)
         .text('Invoice #', 50, startY)
         .text('Customer', 120, startY)
         .text('Amount', 220, startY)
         .text('Status', 280, startY)
         .text('Payment', 340, startY)
         .text('Due Date', 420, startY)
         .text('Created', 480, startY);
      
      doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();
      
      let currentY = startY + 25;
      
      // Data rows
      invoices.forEach(invoice => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        
        doc.text(invoice.displayId, 50, currentY)
           .text(invoice.customerName || 'N/A', 120, currentY)
           .text(`₹${invoice.total}`, 220, currentY)
           .text(invoice.status, 280, currentY)
           .text(invoice.paymentMethod, 340, currentY)
           .text(invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A', 420, currentY)
           .text(new Date(invoice.createdAt).toLocaleDateString(), 480, currentY);
        
        currentY += 20;
      });
      
      doc.end();
    });
  }
  
  static async exportInvoicesExcel(orgId, filters = {}) {
    const invoices = await this.getInvoicesForExport(orgId, filters);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoices');
    
    // Headers
    worksheet.columns = [
      { header: 'Invoice #', key: 'displayId', width: 15 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Mobile', key: 'customerMobile', width: 15 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Tax Amount', key: 'taxAmount', width: 12 },
      { header: 'Discount', key: 'discount', width: 12 },
      { header: 'Total Amount', key: 'total', width: 15 },
      { header: 'Paid Amount', key: 'paidAmount', width: 12 },
      { header: 'Balance', key: 'balance', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 12 },
      { header: 'Created Date', key: 'createdAt', width: 15 }
    ];
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    
    // Add data
    invoices.forEach(invoice => {
      worksheet.addRow({
        displayId: invoice.displayId,
        customerName: invoice.customerName || 'N/A',
        customerMobile: invoice.customerMobile || 'N/A',
        subtotal: parseFloat(invoice.subtotal),
        taxAmount: parseFloat(invoice.taxAmount),
        discount: parseFloat(invoice.discount),
        total: parseFloat(invoice.total),
        paidAmount: parseFloat(invoice.paidAmount),
        balance: parseFloat(invoice.total) - parseFloat(invoice.paidAmount),
        status: invoice.status,
        paymentMethod: invoice.paymentMethod,
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A',
        createdAt: new Date(invoice.createdAt).toLocaleDateString()
      });
    });
    
    return await workbook.xlsx.writeBuffer();
  }
  
  static async exportInvoicesCSV(orgId, filters = {}) {
    const invoices = await this.getInvoicesForExport(orgId, filters);
    
    const headers = [
      'Invoice #', 'Customer Name', 'Mobile', 'Subtotal', 'Tax Amount', 
      'Discount', 'Total Amount', 'Paid Amount', 'Balance', 'Status', 
      'Payment Method', 'Due Date', 'Created Date'
    ];
    
    const csvRows = [headers.join(',')];
    
    invoices.forEach(invoice => {
      const row = [
        invoice.displayId,
        `"${invoice.customerName || 'N/A'}"`,
        invoice.customerMobile || 'N/A',
        invoice.subtotal,
        invoice.taxAmount,
        invoice.discount,
        invoice.total,
        invoice.paidAmount,
        parseFloat(invoice.total) - parseFloat(invoice.paidAmount),
        invoice.status,
        invoice.paymentMethod,
        invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A',
        new Date(invoice.createdAt).toLocaleDateString()
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
  
  static async getInvoicesForExport(orgId, filters = {}) {
    const where = { organizationId: orgId };
    
    if (filters.status) where.status = filters.status;
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
    
    return await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 1000
    });
  }
  
  static async getDashboardData(orgId) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get invoice statistics
    const invoiceStats = await prisma.invoice.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _count: { status: true },
      _sum: { total: true }
    });
    
    // Get payment method breakdown
    const paymentStats = await prisma.invoice.groupBy({
      by: ['paymentMethod'],
      where: { 
        organizationId: orgId,
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      },
      _count: { paymentMethod: true },
      _sum: { total: true }
    });
    
    // Get overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        dueDate: { lt: today },
        status: { not: 'paid' }
      },
      select: {
        displayId: true,
        customerName: true,
        total: true,
        dueDate: true,
        status: true
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });
    
    // Get recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: { organizationId: orgId },
      select: {
        displayId: true,
        customerName: true,
        total: true,
        status: true,
        paymentMethod: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    return {
      invoiceStats,
      paymentStats,
      overdueInvoices,
      recentInvoices,
      summary: {
        totalInvoices: invoiceStats.reduce((sum, stat) => sum + stat._count.status, 0),
        totalAmount: invoiceStats.reduce((sum, stat) => sum + (stat._sum.total || 0), 0),
        overdueCount: overdueInvoices.length
      }
    };
  }
}

module.exports = { ExportService };