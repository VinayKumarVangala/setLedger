const { Account, JournalEntry, Ledger } = require('../models/accounting');

class AccountingService {
  // Create journal entry for sale
  async createSaleEntry(orgID, invoiceData, userID) {
    const entries = [];
    
    // Accounts Receivable (Debit) or Cash (Debit)
    const receivableAccount = await this.getOrCreateAccount(orgID, '1200', 'Accounts Receivable', 'asset');
    entries.push({
      accountID: receivableAccount.accountID,
      accountName: receivableAccount.name,
      debit: invoiceData.totals.grandTotal,
      credit: 0,
      description: `Sale to ${invoiceData.customer.name}`
    });
    
    // Sales Revenue (Credit)
    const salesAccount = await this.getOrCreateAccount(orgID, '4000', 'Sales Revenue', 'revenue');
    entries.push({
      accountID: salesAccount.accountID,
      accountName: salesAccount.name,
      debit: 0,
      credit: invoiceData.totals.subtotal,
      description: 'Sales revenue'
    });
    
    // Tax Payable (Credit)
    if (invoiceData.totals.totalTax > 0) {
      const taxAccount = await this.getOrCreateAccount(orgID, '2300', 'Tax Payable', 'liability');
      entries.push({
        accountID: taxAccount.accountID,
        accountName: taxAccount.name,
        debit: 0,
        credit: invoiceData.totals.totalTax,
        description: 'Tax collected'
      });
    }
    
    return await this.createJournalEntry(orgID, {
      description: `Sale - Invoice ${invoiceData.invoiceNumber}`,
      reference: { type: 'invoice', id: invoiceData.invoiceID, number: invoiceData.invoiceNumber },
      entries
    }, userID);
  }
  
  // Create journal entry for purchase
  async createPurchaseEntry(orgID, purchaseData, userID) {
    const entries = [];
    
    // Inventory/Purchases (Debit)
    const inventoryAccount = await this.getOrCreateAccount(orgID, '1300', 'Inventory', 'asset');
    entries.push({
      accountID: inventoryAccount.accountID,
      accountName: inventoryAccount.name,
      debit: purchaseData.amount,
      credit: 0,
      description: 'Inventory purchase'
    });
    
    // Accounts Payable (Credit)
    const payableAccount = await this.getOrCreateAccount(orgID, '2100', 'Accounts Payable', 'liability');
    entries.push({
      accountID: payableAccount.accountID,
      accountName: payableAccount.name,
      debit: 0,
      credit: purchaseData.amount,
      description: `Purchase from ${purchaseData.supplier}`
    });
    
    return await this.createJournalEntry(orgID, {
      description: `Purchase - ${purchaseData.description}`,
      reference: { type: 'purchase', id: purchaseData.id },
      entries
    }, userID);
  }
  
  // Create journal entry
  async createJournalEntry(orgID, entryData, userID) {
    const entryCount = await JournalEntry.countDocuments({ orgID });
    const entryNumber = `JE-${Date.now()}-${entryCount + 1}`;
    
    const totalDebit = entryData.entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entryData.entries.reduce((sum, entry) => sum + entry.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Journal entry is not balanced');
    }
    
    const journalEntry = new JournalEntry({
      entryID: `${orgID}_JE_${Date.now()}`,
      orgID,
      entryNumber,
      date: entryData.date || new Date(),
      description: entryData.description,
      reference: entryData.reference,
      entries: entryData.entries,
      totalDebit,
      totalCredit,
      createdBy: userID
    });
    
    await journalEntry.save();
    
    // Post to ledger
    await this.postToLedger(journalEntry);
    
    return journalEntry;
  }
  
  // Post journal entry to general ledger
  async postToLedger(journalEntry) {
    for (const entry of journalEntry.entries) {
      const account = await Account.findOne({ accountID: entry.accountID });
      if (!account) continue;
      
      // Calculate new balance
      const lastLedger = await Ledger.findOne({ 
        orgID: journalEntry.orgID, 
        accountID: entry.accountID 
      }).sort({ date: -1, createdAt: -1 });
      
      const previousBalance = lastLedger ? lastLedger.balance : 0;
      let newBalance = previousBalance;
      
      // Apply debit/credit based on account type
      if (['asset', 'expense'].includes(account.type)) {
        newBalance += entry.debit - entry.credit;
      } else {
        newBalance += entry.credit - entry.debit;
      }
      
      // Create ledger entry
      const ledgerEntry = new Ledger({
        ledgerID: `${journalEntry.orgID}_LED_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        orgID: journalEntry.orgID,
        accountID: entry.accountID,
        entryID: journalEntry.entryID,
        date: journalEntry.date,
        description: entry.description || journalEntry.description,
        debit: entry.debit,
        credit: entry.credit,
        balance: newBalance,
        reference: journalEntry.reference
      });
      
      await ledgerEntry.save();
      
      // Update account balance
      await Account.findOneAndUpdate(
        { accountID: entry.accountID },
        { balance: newBalance, updatedAt: new Date() }
      );
    }
  }
  
  // Get or create account
  async getOrCreateAccount(orgID, code, name, type, subType = null) {
    let account = await Account.findOne({ orgID, code });
    
    if (!account) {
      account = new Account({
        accountID: `${orgID}_ACC_${code}`,
        orgID,
        code,
        name,
        type,
        subType
      });
      await account.save();
    }
    
    return account;
  }
  
  // Import transactions from CSV
  async importTransactions(orgID, csvData, userID) {
    const results = { success: 0, errors: [] };
    
    for (let i = 0; i < csvData.length; i++) {
      try {
        const row = csvData[i];
        const entries = [];
        
        // Parse debit account
        if (row.debitAccount && row.debitAmount) {
          const debitAcc = await this.getOrCreateAccount(orgID, row.debitAccountCode, row.debitAccount, row.debitAccountType || 'asset');
          entries.push({
            accountID: debitAcc.accountID,
            accountName: debitAcc.name,
            debit: parseFloat(row.debitAmount),
            credit: 0,
            description: row.description
          });
        }
        
        // Parse credit account
        if (row.creditAccount && row.creditAmount) {
          const creditAcc = await this.getOrCreateAccount(orgID, row.creditAccountCode, row.creditAccount, row.creditAccountType || 'liability');
          entries.push({
            accountID: creditAcc.accountID,
            accountName: creditAcc.name,
            debit: 0,
            credit: parseFloat(row.creditAmount),
            description: row.description
          });
        }
        
        await this.createJournalEntry(orgID, {
          date: new Date(row.date),
          description: row.description,
          reference: { type: 'import', id: `import_${i}` },
          entries
        }, userID);
        
        results.success++;
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
    
    return results;
  }
  
  // Get trial balance
  async getTrialBalance(orgID, date = new Date()) {
    const accounts = await Account.find({ orgID, isActive: true });
    const trialBalance = [];
    
    for (const account of accounts) {
      const ledgerEntry = await Ledger.findOne({
        orgID,
        accountID: account.accountID,
        date: { $lte: date }
      }).sort({ date: -1, createdAt: -1 });
      
      const balance = ledgerEntry ? ledgerEntry.balance : 0;
      
      if (balance !== 0) {
        trialBalance.push({
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          balance,
          debit: balance > 0 && ['asset', 'expense'].includes(account.type) ? balance : 0,
          credit: balance > 0 && ['liability', 'equity', 'revenue'].includes(account.type) ? balance : 0
        });
      }
    }
    
    return trialBalance;
  }
}

module.exports = new AccountingService();