const accountingService = require('../services/accountingService');
const { Account, JournalEntry, Ledger } = require('../models/accounting');
const csv = require('csv-parser');
const multer = require('multer');
const { Readable } = require('stream');

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Get chart of accounts
exports.getAccounts = async (req, res) => {
  try {
    const { orgID } = req.user;
    const accounts = await Account.find({ orgID, isActive: true }).sort({ code: 1 });
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching accounts',
      error: error.message
    });
  }
};

// Create account
exports.createAccount = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { code, name, type, subType } = req.body;
    
    const account = await accountingService.getOrCreateAccount(orgID, code, name, type, subType);
    
    res.status(201).json({
      success: true,
      data: account,
      message: 'Account created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: error.message
    });
  }
};

// Get journal entries
exports.getJournalEntries = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    
    const filter = { orgID };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const entries = await JournalEntry.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await JournalEntry.countDocuments(filter);
    
    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching journal entries',
      error: error.message
    });
  }
};

// Create manual journal entry
exports.createJournalEntry = async (req, res) => {
  try {
    const { orgID } = req.user;
    const entryData = req.body;
    
    const journalEntry = await accountingService.createJournalEntry(orgID, entryData, req.user.userID);
    
    res.status(201).json({
      success: true,
      data: journalEntry,
      message: 'Journal entry created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating journal entry',
      error: error.message
    });
  }
};

// Get general ledger
exports.getLedger = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { accountID, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const filter = { orgID };
    if (accountID) filter.accountID = accountID;
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const ledgerEntries = await Ledger.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Ledger.countDocuments(filter);
    
    res.json({
      success: true,
      data: ledgerEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ledger',
      error: error.message
    });
  }
};

// Get trial balance
exports.getTrialBalance = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { date } = req.query;
    
    const trialBalance = await accountingService.getTrialBalance(orgID, date ? new Date(date) : new Date());
    
    const totalDebits = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredits = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);
    
    res.json({
      success: true,
      data: {
        accounts: trialBalance,
        totals: {
          debits: totalDebits,
          credits: totalCredits,
          balanced: Math.abs(totalDebits - totalCredits) < 0.01
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating trial balance',
      error: error.message
    });
  }
};

// Import transactions from CSV
exports.importCSV = [
  upload.single('csvFile'),
  async (req, res) => {
    try {
      const { orgID } = req.user;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CSV file is required'
        });
      }
      
      const csvData = [];
      const stream = Readable.from(req.file.buffer);
      
      stream
        .pipe(csv())
        .on('data', (row) => csvData.push(row))
        .on('end', async () => {
          try {
            const results = await accountingService.importTransactions(orgID, csvData, req.user.userID);
            
            res.json({
              success: true,
              data: results,
              message: `Imported ${results.success} transactions with ${results.errors.length} errors`
            });
          } catch (error) {
            res.status(500).json({
              success: false,
              message: 'Error processing CSV',
              error: error.message
            });
          }
        });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error importing CSV',
        error: error.message
      });
    }
  }
];