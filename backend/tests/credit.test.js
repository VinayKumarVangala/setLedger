const mongoose = require('mongoose');
const CreditController = require('../src/controllers/creditController');
const CreditLedger = require('../src/models/creditLedger');
const ReminderJob = require('../src/services/reminderJob');
const ReminderLog = require('../src/models/reminderLog');

// Mock MongoDB
jest.mock('mongoose');
jest.mock('../src/models/creditLedger');
jest.mock('../src/models/reminderLog');
jest.mock('nodemailer');

describe('Credit Management Tests', () => {
  let mockSession;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = {
      withTransaction: jest.fn(),
      endSession: jest.fn()
    };
    mongoose.startSession.mockResolvedValue(mockSession);
  });

  describe('createCreditEntry', () => {
    test('should create credit entry successfully', async () => {
      const mockCredit = {
        _id: 'credit123',
        invoiceId: 'INV001',
        customerId: 'CUST001',
        orgId: 'ORG1000',
        totalAmount: 10000,
        balanceAmount: 10000,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      CreditLedger.mockImplementation(() => mockCredit);

      const creditData = {
        invoiceId: 'INV001',
        customerId: 'CUST001',
        totalAmount: 10000,
        dueDate: new Date('2024-02-15')
      };

      const result = await createCreditEntry('ORG1000', creditData);
      
      expect(result).toBeDefined();
      expect(mockCredit.save).toHaveBeenCalled();
    });

    test('should handle creation errors', async () => {
      CreditLedger.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(createCreditEntry('ORG1000', {})).rejects.toThrow('Database error');
    });
  });

  describe('updatePayment', () => {
    test('should update partial payment successfully', async () => {
      const mockCredit = {
        _id: 'credit123',
        totalAmount: 10000,
        paidAmount: 0,
        balanceAmount: 10000,
        status: 'pending',
        paymentHistory: [],
        save: jest.fn().mockResolvedValue(true)
      };

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      CreditLedger.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCredit)
      });

      const req = {
        params: { creditId: 'credit123' },
        body: { paymentAmount: 5000, paymentMethod: 'cash' },
        user: { orgId: 'ORG1000' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await CreditController.updatePayment(req, res);

      expect(mockCredit.paidAmount).toBe(5000);
      expect(mockCredit.balanceAmount).toBe(5000);
      expect(mockCredit.status).toBe('partial');
      expect(mockCredit.paymentHistory).toHaveLength(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockCredit });
    });

    test('should mark as paid when full payment', async () => {
      const mockCredit = {
        _id: 'credit123',
        totalAmount: 10000,
        paidAmount: 0,
        balanceAmount: 10000,
        status: 'pending',
        paymentHistory: [],
        save: jest.fn().mockResolvedValue(true)
      };

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      CreditLedger.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCredit)
      });

      const req = {
        params: { creditId: 'credit123' },
        body: { paymentAmount: 10000, paymentMethod: 'upi' },
        user: { orgId: 'ORG1000' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await CreditController.updatePayment(req, res);

      expect(mockCredit.paidAmount).toBe(10000);
      expect(mockCredit.balanceAmount).toBe(0);
      expect(mockCredit.status).toBe('paid');
    });

    test('should reject overpayment', async () => {
      const mockCredit = {
        balanceAmount: 5000,
        status: 'partial'
      };

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      CreditLedger.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCredit)
      });

      const req = {
        params: { creditId: 'credit123' },
        body: { paymentAmount: 6000 },
        user: { orgId: 'ORG1000' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await CreditController.updatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'PAYMENT_UPDATE_ERROR', message: 'Payment amount exceeds balance amount' }
      });
    });

    test('should handle payment on already paid credit', async () => {
      const mockCredit = {
        status: 'paid'
      };

      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      CreditLedger.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCredit)
      });

      const req = {
        params: { creditId: 'credit123' },
        body: { paymentAmount: 1000 },
        user: { orgId: 'ORG1000' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await CreditController.updatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('reminderJob', () => {
    test('should identify and update overdue credits', async () => {
      const pastDate = new Date('2024-01-01');
      const mockOverdueCredits = [
        {
          _id: 'credit1',
          orgId: 'ORG1000',
          customerId: 'CUST001',
          invoiceId: 'INV001',
          dueDate: pastDate,
          balanceAmount: 5000,
          status: 'pending',
          save: jest.fn().mockResolvedValue(true)
        }
      ];

      CreditLedger.find.mockResolvedValue(mockOverdueCredits);
      ReminderLog.create = jest.fn().mockResolvedValue(true);

      // Mock nodemailer
      const mockTransporter = {
        sendMail: jest.fn().mockResolvedValue(true)
      };
      require('nodemailer').createTransporter = jest.fn().mockReturnValue(mockTransporter);

      await ReminderJob.checkOverdueCredits();

      expect(mockOverdueCredits[0].status).toBe('overdue');
      expect(mockOverdueCredits[0].save).toHaveBeenCalled();
      expect(ReminderLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'ORG1000',
          customerId: 'CUST001',
          invoiceId: 'INV001',
          mode: 'Email',
          status: 'Sent'
        })
      );
    });

    test('should handle email sending failures', async () => {
      const mockOverdueCredits = [
        {
          _id: 'credit1',
          orgId: 'ORG1000',
          customerId: 'CUST001',
          invoiceId: 'INV001',
          dueDate: new Date('2024-01-01'),
          balanceAmount: 5000,
          status: 'pending',
          save: jest.fn().mockResolvedValue(true)
        }
      ];

      CreditLedger.find.mockResolvedValue(mockOverdueCredits);
      ReminderLog.create = jest.fn().mockResolvedValue(true);

      // Mock failed email
      const mockTransporter = {
        sendMail: jest.fn().mockRejectedValue(new Error('Email failed'))
      };
      require('nodemailer').createTransporter = jest.fn().mockReturnValue(mockTransporter);

      await ReminderJob.checkOverdueCredits();

      expect(ReminderLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'Email',
          status: 'Failed',
          details: expect.objectContaining({
            errorMessage: 'Email failed'
          })
        })
      );
    });

    test('should skip already overdue credits', async () => {
      const mockCredits = [
        {
          _id: 'credit1',
          status: 'overdue',
          save: jest.fn()
        }
      ];

      CreditLedger.find.mockResolvedValue(mockCredits);

      await ReminderJob.checkOverdueCredits();

      expect(mockCredits[0].save).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero payment amount', async () => {
      const req = {
        params: { creditId: 'credit123' },
        body: { paymentAmount: 0 },
        user: { orgId: 'ORG1000' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await CreditController.updatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle missing credit record', async () => {
      mockSession.withTransaction.mockImplementation(async (callback) => {
        return await callback();
      });

      CreditLedger.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(null)
      });

      const req = {
        params: { creditId: 'nonexistent' },
        body: { paymentAmount: 1000 },
        user: { orgId: 'ORG1000' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await CreditController.updatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle database transaction failures', async () => {
      mockSession.withTransaction.mockRejectedValue(new Error('Transaction failed'));

      const req = {
        params: { creditId: 'credit123' },
        body: { paymentAmount: 1000 },
        user: { orgId: 'ORG1000' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await CreditController.updatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });
});

// Helper function for credit creation (would be in actual service)
async function createCreditEntry(orgId, creditData) {
  const credit = new CreditLedger({
    ...creditData,
    orgId,
    paidAmount: 0,
    balanceAmount: creditData.totalAmount,
    status: 'pending',
    paymentHistory: []
  });
  
  await credit.save();
  return credit;
}