const CreditLedger = require('../models/creditLedger');
const mongoose = require('mongoose');

class CreditController {
  static async updatePayment(req, res) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const { creditId } = req.params;
        const { paymentAmount, paymentMethod = 'cash', reference = '', notes = '' } = req.body;

        if (!paymentAmount || paymentAmount <= 0) {
          throw new Error('Payment amount must be greater than 0');
        }

        const credit = await CreditLedger.findOne({ 
          _id: creditId, 
          orgId: req.user.orgId 
        }).session(session);

        if (!credit) {
          throw new Error('Credit record not found');
        }

        if (credit.status === 'paid') {
          throw new Error('Credit already fully paid');
        }

        const payment = parseFloat(paymentAmount);
        if (payment > credit.balanceAmount) {
          throw new Error('Payment amount exceeds balance amount');
        }

        // Update amounts
        credit.paidAmount += payment;
        credit.balanceAmount -= payment;
        
        // Update status
        credit.status = credit.balanceAmount <= 0 ? 'paid' : 'partial';
        
        // Add payment to history
        credit.paymentHistory.push({
          amount: payment,
          paymentDate: new Date(),
          paymentMethod,
          reference,
          notes
        });

        await credit.save({ session });
      });

      const updatedCredit = await CreditLedger.findById(req.params.creditId);
      res.json({ success: true, data: updatedCredit });

    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: { code: 'PAYMENT_UPDATE_ERROR', message: error.message } 
      });
    } finally {
      await session.endSession();
    }
  }

  static async getCreditDetails(req, res) {
    try {
      const { creditId } = req.params;
      const credit = await CreditLedger.findOne({ 
        _id: creditId, 
        orgId: req.user.orgId 
      });

      if (!credit) {
        return res.status(404).json({ 
          success: false, 
          error: { code: 'NOT_FOUND', message: 'Credit record not found' } 
        });
      }

      res.json({ success: true, data: credit });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: { code: 'FETCH_ERROR', message: error.message } 
      });
    }
  }

  static async getCredits(req, res) {
    try {
      const { status, customerId } = req.query;
      const filter = { orgId: req.user.orgId };
      
      if (status) filter.status = status;
      if (customerId) filter.customerId = customerId;

      const credits = await CreditLedger.find(filter).sort({ createdAt: -1 });
      res.json({ success: true, data: credits });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: { code: 'FETCH_ERROR', message: error.message } 
      });
    }
  }
}

module.exports = CreditController;