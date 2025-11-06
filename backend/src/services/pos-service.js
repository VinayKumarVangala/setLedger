const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { TaxEngine } = require('./tax-engine');
const { StockLedgerService } = require('./stock-ledger');
const prisma = new PrismaClient();

class POSService {
  static async processSale(orgId, saleData, userId) {
    const transactionId = uuidv4();
    
    return await prisma.$transaction(async (tx) => {
      // Calculate taxes
      const taxCalc = await TaxEngine.calculateInvoiceTax(
        orgId,
        saleData.lines,
        saleData.customerState
      );
      
      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          displayId: `POS${Date.now().toString().slice(-6)}`,
          customerName: saleData.customerName || 'Walk-in Customer',
          customerMobile: saleData.customerMobile,
          subtotal: taxCalc.totalBaseAmount,
          taxAmount: taxCalc.totalTaxAmount,
          discount: saleData.discount || 0,
          total: taxCalc.grandTotal - (saleData.discount || 0),
          status: 'paid',
          paymentMethod: saleData.paymentMethod || 'cash',
          paidAmount: taxCalc.grandTotal - (saleData.discount || 0),
          organizationId: orgId,
          metadata: JSON.stringify({
            createdBy: userId,
            transactionId,
            inputMethod: 'pos',
            taxBreakup: {
              cgst: taxCalc.totalCGST,
              sgst: taxCalc.totalSGST,
              igst: taxCalc.totalIGST,
              isInterState: taxCalc.isInterState
            }
          })
        }
      });
      
      // Process invoice lines and stock movements
      for (let i = 0; i < saleData.lines.length; i++) {
        const line = saleData.lines[i];
        const lineCalc = taxCalc.lineCalculations[i];
        
        // Create invoice line
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
          `POS Sale - ${invoice.displayId}`,
          userId
        );
      }
      
      // Create journal entries for accounting
      await this.createJournalEntries(tx, orgId, invoice, taxCalc, transactionId);
      
      // Create transaction record
      await tx.transaction.create({
        data: {
          id: transactionId,
          displayId: `TXN${Date.now().toString().slice(-6)}`,
          operation: 'pos_sale',
          status: 'completed',
          metadata: JSON.stringify({
            invoiceId: invoice.id,
            lineCount: saleData.lines.length,
            total: invoice.total,
            paymentMethod: saleData.paymentMethod
          }),
          organizationId: orgId
        }
      });
      
      return { invoice, taxCalculation: taxCalc };
    });
  }
  
  static async createJournalEntries(tx, orgId, invoice, taxCalc, transactionId) {
    const entries = [];
    
    // Cash/Bank Account (Debit)
    entries.push({
      displayId: `JE${Date.now().toString().slice(-6)}-1`,
      accountName: invoice.paymentMethod === 'cash' ? 'Cash' : 'Bank',
      accountType: 'asset',
      debit: parseFloat(invoice.total),
      credit: 0,
      reference: invoice.displayId,
      description: `Sale - ${invoice.displayId}`,
      transactionId,
      organizationId: orgId
    });
    
    // Sales Revenue (Credit)
    entries.push({
      displayId: `JE${Date.now().toString().slice(-6)}-2`,
      accountName: 'Sales Revenue',
      accountType: 'revenue',
      debit: 0,
      credit: taxCalc.totalBaseAmount,
      reference: invoice.displayId,
      description: `Sale Revenue - ${invoice.displayId}`,
      transactionId,
      organizationId: orgId
    });
    
    // Tax Liability (Credit)
    if (taxCalc.totalTaxAmount > 0) {
      entries.push({
        displayId: `JE${Date.now().toString().slice(-6)}-3`,
        accountName: 'GST Payable',
        accountType: 'liability',
        debit: 0,
        credit: taxCalc.totalTaxAmount,
        reference: invoice.displayId,
        description: `GST Liability - ${invoice.displayId}`,
        transactionId,
        organizationId: orgId
      });
    }
    
    // Create all journal entries
    for (const entry of entries) {
      await tx.journalEntry.create({ data: entry });
    }
  }
  
  static async getOfflineSales(orgId) {
    return await prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        metadata: {
          path: ['inputMethod'],
          equals: 'pos'
        }
      },
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
      take: 50
    });
  }
}

module.exports = { POSService };