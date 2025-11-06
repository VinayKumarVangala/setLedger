import { dbService } from './db';
import { taxService } from './tax';
import { v4 as uuidv4 } from 'uuid';

class POSOfflineService {
  async processSaleOffline(saleData, userId, orgId) {
    const saleId = uuidv4();
    const timestamp = new Date();
    
    try {
      // Calculate taxes offline
      const taxCalc = this.calculateTaxesOffline(saleData.lines);
      
      // Create offline invoice
      const invoice = {
        id: saleId,
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
        orgId,
        createdAt: timestamp,
        metadata: {
          createdBy: userId,
          inputMethod: 'pos',
          offline: true,
          taxBreakup: taxCalc
        }
      };
      
      // Store invoice locally
      await dbService.createInvoice(invoice);
      
      // Process lines and update local stock
      for (let i = 0; i < saleData.lines.length; i++) {
        const line = saleData.lines[i];
        const lineCalc = taxCalc.lineCalculations[i];
        
        // Create invoice line
        const invoiceLine = {
          id: uuidv4(),
          invoiceId: saleId,
          productId: line.productId,
          quantity: line.quantity,
          price: line.price,
          total: lineCalc.totalAmount,
          baseAmount: lineCalc.baseAmount,
          taxAmount: lineCalc.totalTax,
          cgst: lineCalc.cgst,
          sgst: lineCalc.sgst,
          igst: lineCalc.igst,
          gstRate: lineCalc.gstRate
        };
        
        await dbService.createInvoiceLine(invoiceLine);
        
        // Update local stock
        const product = await dbService.getProduct(line.productId);
        if (product) {
          await dbService.updateProduct(line.productId, {
            stock: Math.max(0, product.stock - line.quantity)
          });
        }
        
        // Create stock move record
        await dbService.createStockMove({
          id: uuidv4(),
          displayId: `STK${Date.now().toString().slice(-6)}`,
          productId: line.productId,
          moveType: 'out',
          quantity: line.quantity,
          reference: invoice.displayId,
          description: `POS Sale - ${invoice.displayId}`,
          orgId,
          createdAt: timestamp
        });
      }
      
      // Add to sync queue
      await dbService.addToOutbox('pos', 'sale', {
        saleData: {
          ...saleData,
          saleId,
          timestamp: timestamp.toISOString()
        },
        invoice,
        lines: saleData.lines
      });
      
      return { invoice, taxCalculation: taxCalc };
    } catch (error) {
      console.error('Offline sale processing failed:', error);
      throw error;
    }
  }
  
  calculateTaxesOffline(lines) {
    let totalBaseAmount = 0;
    let totalTaxAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    const lineCalculations = [];
    
    lines.forEach(line => {
      const lineAmount = line.quantity * line.price;
      const gstRate = line.gstRate || 18;
      
      const taxCalc = taxService.calculateGSTOffline(
        lineAmount,
        gstRate,
        line.isGSTInclusive || false
      );
      
      totalBaseAmount += taxCalc.baseAmount;
      totalTaxAmount += taxCalc.totalTax;
      totalCGST += taxCalc.cgst;
      totalSGST += taxCalc.sgst;
      totalIGST += taxCalc.igst;
      
      lineCalculations.push({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.price,
        lineAmount,
        gstRate,
        ...taxCalc
      });
    });
    
    return {
      totalBaseAmount: Math.round(totalBaseAmount * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      totalCGST: Math.round(totalCGST * 100) / 100,
      totalSGST: Math.round(totalSGST * 100) / 100,
      totalIGST: Math.round(totalIGST * 100) / 100,
      grandTotal: Math.round((totalBaseAmount + totalTaxAmount) * 100) / 100,
      isInterState: false,
      lineCalculations
    };
  }
  
  async syncPendingSales() {
    const pendingSales = await dbService.getPendingOutboxItems('pos');
    const results = [];
    
    for (const sale of pendingSales) {
      try {
        const response = await fetch('/api/v1/pos/sale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(sale.data.saleData)
        });
        
        if (response.ok) {
          await dbService.markOutboxItemSynced(sale.id);
          results.push({ id: sale.id, status: 'synced' });
        } else {
          results.push({ id: sale.id, status: 'failed', error: response.statusText });
        }
      } catch (error) {
        results.push({ id: sale.id, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }
  
  async getOfflineSales() {
    return await dbService.getInvoices();
  }
  
  async getPendingSyncCount() {
    const pending = await dbService.getPendingOutboxItems('pos');
    return pending.length;
  }
}

export const posOfflineService = new POSOfflineService();