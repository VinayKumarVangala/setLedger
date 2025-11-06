const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { StockLedgerService } = require('./stock-ledger');
const prisma = new PrismaClient();

class InvoiceService {
  static async createInvoice(orgId, invoiceData, userId) {
    const { TaxEngine } = require('./tax-engine');
    const transactionId = uuidv4();
    
    return await prisma.$transaction(async (tx) => {
      // Calculate taxes
      const taxCalc = await TaxEngine.calculateInvoiceTax(
        orgId,
        invoiceData.lines,
        invoiceData.customerState
      );
      
      // Create invoice with tax details
      const invoice = await tx.invoice.create({
        data: {
          displayId: `INV${Date.now().toString().slice(-6)}`,
          customerName: invoiceData.customerName,
          customerMobile: invoiceData.customerMobile,
          subtotal: taxCalc.totalBaseAmount,
          taxAmount: taxCalc.totalTaxAmount,
          discount: invoiceData.discount || 0,
          total: taxCalc.grandTotal - (invoiceData.discount || 0),
          status: 'draft',
          organizationId: orgId,
          metadata: JSON.stringify({
            createdBy: userId,
            transactionId,
            inputMethod: invoiceData.inputMethod || 'manual',
            taxBreakup: {
              cgst: taxCalc.totalCGST,
              sgst: taxCalc.totalSGST,
              igst: taxCalc.totalIGST,
              isInterState: taxCalc.isInterState
            }
          })
        }
      });
      
      // Process invoice lines with tax details
      for (let i = 0; i < invoiceData.lines.length; i++) {
        const line = invoiceData.lines[i];
        const lineCalc = taxCalc.lineCalculations[i];
        
        // Create invoice line with tax breakdown
        await tx.invoiceLine.create({
          data: {
            quantity: line.quantity,
            price: line.price,
            total: lineCalc.totalAmount,
            baseAmount: lineCalc.baseAmount,
            taxAmount: lineCalc.totalTax,
            cgst: lineCalc.cgst,
            sgst: lineCalc.sgst,
            igst: lineCalc.igst,
            gstRate: lineCalc.gstRate,
            hsnCode: lineCalc.hsnCode,
            invoiceId: invoice.id,
            productId: line.productId
          }
        });
        
        // Record stock movement
        await StockLedgerService.recordStockMove(
          orgId,
          line.productId,
          'out',
          line.quantity,
          invoice.displayId,
          `Sale - Invoice ${invoice.displayId}`,
          userId
        );
      }
      
      // Create transaction record
      await tx.transaction.create({
        data: {
          id: transactionId,
          displayId: `TXN${Date.now().toString().slice(-6)}`,
          operation: 'invoice_create',
          status: 'completed',
          metadata: JSON.stringify({
            invoiceId: invoice.id,
            lineCount: invoiceData.lines.length,
            total: invoice.total,
            taxDetails: taxCalc
          }),
          organizationId: orgId
        }
      });
      
      return { ...invoice, taxCalculation: taxCalc };
    });
  }
  
  static async createFromQRScan(orgId, qrData, userId) {
    // Validate QR token
    const qrTokenService = require('./qr');
    const decoded = qrTokenService.validateToken(qrData.token);
    
    if (!decoded.valid || decoded.orgUUID !== orgId) {
      throw new Error('Invalid QR code');
    }
    
    // Get product details
    const product = await prisma.product.findFirst({
      where: { id: decoded.id, organizationId: orgId }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Create invoice from QR scan
    const invoiceData = {
      customerName: qrData.customerName || 'Walk-in Customer',
      customerMobile: qrData.customerMobile,
      lines: [{
        productId: product.id,
        quantity: qrData.quantity || 1,
        price: product.price,
        total: product.price * (qrData.quantity || 1)
      }],
      subtotal: product.price * (qrData.quantity || 1),
      taxAmount: 0,
      discount: 0,
      total: product.price * (qrData.quantity || 1),
      inputMethod: 'qr_scan'
    };
    
    return await this.createInvoice(orgId, invoiceData, userId);
  }
  
  static async getInvoices(orgId, filters = {}) {
    const where = { organizationId: orgId };
    
    if (filters.status) where.status = filters.status;
    if (filters.customerName) where.customerName = { contains: filters.customerName };
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
    
    return await prisma.invoice.findMany({
      where,
      include: {
        lines: {
          include: {
            product: {
              select: { name: true, sku: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50
    });
  }
  
  static async updateInvoiceStatus(orgId, invoiceId, status, userId) {
    const transactionId = uuidv4();
    
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.update({
        where: { id: invoiceId, organizationId: orgId },
        data: {
          status,
          updatedAt: new Date(),
          metadata: JSON.stringify({
            statusUpdatedBy: userId,
            statusUpdatedAt: new Date().toISOString()
          })
        }
      });
      
      // Create audit log
      await tx.auditLog.create({
        data: {
          entityType: 'INVOICE',
          entityId: invoiceId,
          action: 'STATUS_UPDATE',
          changes: JSON.stringify({
            previousStatus: 'draft',
            newStatus: status,
            transactionId
          }),
          userId,
          organizationId: orgId,
          timestamp: new Date()
        }
      });
      
      return invoice;
    });
  }
}

module.exports = { InvoiceService };