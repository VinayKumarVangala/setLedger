const { InvoiceService } = require('../services/invoice-service');
const CreditLedger = require('../models/creditLedger');
const { v4: uuidv4 } = require('uuid');

class InvoiceController {
  static async createInvoice(req, res) {
    try {
      const { paymentMode, dueDate, ...invoiceData } = req.body;
      
      // Validate dueDate for credit invoices
      if (paymentMode === 'Credit') {
        if (!dueDate) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Due date is required for credit invoices' }
          });
        }
        
        const dueDateObj = new Date(dueDate);
        if (dueDateObj <= new Date()) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Due date must be in the future' }
          });
        }
      }

      // Create invoice with credit fields
      const invoice = await InvoiceService.createInvoice(
        req.user.orgId,
        {
          ...invoiceData,
          paymentMethod: paymentMode || 'cash',
          dueDate: paymentMode === 'Credit' ? new Date(dueDate) : null,
          isCredit: paymentMode === 'Credit',
          paymentStatus: paymentMode === 'Credit' ? 'pending' : 'paid'
        },
        req.user.userId
      );

      // Create credit ledger entry if payment mode is Credit
      if (paymentMode === 'Credit') {
        const creditId = uuidv4();
        
        const creditEntry = new CreditLedger({
          invoiceId: invoice.id,
          customerId: invoice.customerMobile || 'WALK_IN',
          orgId: req.user.orgId,
          totalAmount: parseFloat(invoice.total),
          paidAmount: 0,
          balanceAmount: parseFloat(invoice.total),
          dueDate: new Date(dueDate),
          status: 'pending',
          paymentHistory: []
        });

        await creditEntry.save();
        
        // Update invoice with creditId
        await InvoiceService.updateInvoice(invoice.id, { creditId: creditEntry._id.toString() });
      }

      res.status(201).json({ success: true, data: invoice });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: { code: 'INVOICE_CREATE_ERROR', message: error.message } 
      });
    }
  }

  static async getInvoices(req, res) {
    try {
      const invoices = await InvoiceService.getInvoices(req.user.orgId, req.query);
      res.json({ success: true, data: invoices });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: { code: 'INVOICE_FETCH_ERROR', message: error.message } 
      });
    }
  }

  static async updatePaymentStatus(req, res) {
    try {
      const { invoiceId } = req.params;
      const { paymentAmount, paymentMethod, reference } = req.body;

      const invoice = await InvoiceService.getInvoiceById(invoiceId);
      
      if (invoice.isCredit && invoice.creditId) {
        const creditEntry = await CreditLedger.findById(invoice.creditId);
        
        if (creditEntry) {
          const newPaidAmount = creditEntry.paidAmount + parseFloat(paymentAmount);
          const newBalanceAmount = creditEntry.totalAmount - newPaidAmount;
          
          // Update credit ledger
          creditEntry.paidAmount = newPaidAmount;
          creditEntry.balanceAmount = newBalanceAmount;
          creditEntry.status = newBalanceAmount <= 0 ? 'paid' : 'partial';
          creditEntry.paymentHistory.push({
            amount: parseFloat(paymentAmount),
            paymentDate: new Date(),
            paymentMethod: paymentMethod || 'cash',
            reference: reference || '',
            notes: `Payment received for invoice ${invoice.displayId}`
          });
          
          await creditEntry.save();
          
          // Update invoice payment status
          const invoiceStatus = newBalanceAmount <= 0 ? 'paid' : 'partial';
          await InvoiceService.updateInvoice(invoiceId, { 
            paymentStatus: invoiceStatus,
            paidAmount: newPaidAmount
          });
        }
      }

      res.json({ success: true, data: { message: 'Payment updated successfully' } });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: { code: 'PAYMENT_UPDATE_ERROR', message: error.message } 
      });
    }
  }
}

module.exports = InvoiceController;