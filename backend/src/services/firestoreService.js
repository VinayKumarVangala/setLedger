const admin = require('firebase-admin');
const encryptionService = require('./encryptionService');
const { Organization, User, Product, Invoice, Transaction } = require('../models');

class FirestoreService {
  constructor() {
    this.db = admin.firestore();
    this.collections = {
      organizations: 'organizations',
      users: 'users',
      products: 'products',
      invoices: 'invoices',
      transactions: 'transactions'
    };
  }

  async syncToFirestore(orgId, memberId) {
    try {
      const userId = `${orgId}_${memberId}`;
      const syncData = await this.gatherSyncData(userId);
      
      // Encrypt sensitive data
      const encryptedData = this.encryptSyncData(syncData);
      
      // Upload to Firestore
      const batch = this.db.batch();
      const orgRef = this.db.collection(this.collections.organizations).doc(orgId);
      
      batch.set(orgRef, {
        ...encryptedData,
        lastSync: admin.firestore.FieldValue.serverTimestamp(),
        syncedBy: memberId
      }, { merge: true });
      
      await batch.commit();
      
      return {
        success: true,
        syncedAt: new Date(),
        recordCount: this.countRecords(syncData)
      };
    } catch (error) {
      console.error('Firestore sync error:', error);
      throw error;
    }
  }

  async restoreFromFirestore(orgId, memberId) {
    try {
      const orgRef = this.db.collection(this.collections.organizations).doc(orgId);
      const doc = await orgRef.get();
      
      if (!doc.exists) {
        throw new Error('No backup data found');
      }
      
      const encryptedData = doc.data();
      const decryptedData = this.decryptSyncData(encryptedData);
      
      // Restore to MongoDB
      await this.restoreToMongoDB(decryptedData, orgId, memberId);
      
      return {
        success: true,
        restoredAt: new Date(),
        recordCount: this.countRecords(decryptedData)
      };
    } catch (error) {
      console.error('Firestore restore error:', error);
      throw error;
    }
  }

  async gatherSyncData(userId) {
    const [organization, users, products, invoices, transactions] = await Promise.all([
      Organization.findOne({ orgID: userId.split('_')[0] }),
      User.find({ orgID: userId.split('_')[0] }),
      Product.find({ userId }).limit(1000),
      Invoice.find({ userId }).sort({ createdAt: -1 }).limit(500),
      Transaction.find({ userId }).sort({ date: -1 }).limit(1000)
    ]);

    return {
      organization: organization?.toObject(),
      users: users.map(u => u.toObject()),
      products: products.map(p => p.toObject()),
      invoices: invoices.map(i => i.toObject()),
      transactions: transactions.map(t => t.toObject()),
      metadata: {
        syncedAt: new Date(),
        version: '1.0.0',
        userId
      }
    };
  }

  encryptSyncData(data) {
    return {
      organization: data.organization ? encryptionService.encryptObject(data.organization) : null,
      users: data.users.map(user => encryptionService.encryptObject(user)),
      products: data.products.map(product => encryptionService.encryptObject(product)),
      invoices: data.invoices.map(invoice => encryptionService.encryptObject(invoice)),
      transactions: data.transactions.map(txn => encryptionService.encryptObject(txn)),
      metadata: data.metadata
    };
  }

  decryptSyncData(encryptedData) {
    return {
      organization: encryptedData.organization ? encryptionService.decryptObject(encryptedData.organization) : null,
      users: encryptedData.users?.map(user => encryptionService.decryptObject(user)) || [],
      products: encryptedData.products?.map(product => encryptionService.decryptObject(product)) || [],
      invoices: encryptedData.invoices?.map(invoice => encryptionService.decryptObject(invoice)) || [],
      transactions: encryptedData.transactions?.map(txn => encryptionService.decryptObject(txn)) || [],
      metadata: encryptedData.metadata
    };
  }

  async restoreToMongoDB(data, orgId, memberId) {
    const session = await Organization.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Restore organization
        if (data.organization) {
          await Organization.findOneAndUpdate(
            { orgID: orgId },
            data.organization,
            { upsert: true, session }
          );
        }

        // Restore users
        for (const user of data.users) {
          await User.findOneAndUpdate(
            { userID: user.userID },
            user,
            { upsert: true, session }
          );
        }

        // Restore products
        for (const product of data.products) {
          await Product.findOneAndUpdate(
            { productID: product.productID },
            product,
            { upsert: true, session }
          );
        }

        // Restore invoices
        for (const invoice of data.invoices) {
          await Invoice.findOneAndUpdate(
            { invoiceID: invoice.invoiceID },
            invoice,
            { upsert: true, session }
          );
        }

        // Restore transactions
        for (const transaction of data.transactions) {
          await Transaction.findOneAndUpdate(
            { transactionID: transaction.transactionID },
            transaction,
            { upsert: true, session }
          );
        }
      });
    } finally {
      await session.endSession();
    }
  }

  countRecords(data) {
    return {
      organizations: data.organization ? 1 : 0,
      users: data.users?.length || 0,
      products: data.products?.length || 0,
      invoices: data.invoices?.length || 0,
      transactions: data.transactions?.length || 0
    };
  }

  async getBackupInfo(orgId) {
    try {
      const orgRef = this.db.collection(this.collections.organizations).doc(orgId);
      const doc = await orgRef.get();
      
      if (!doc.exists) {
        return { exists: false };
      }
      
      const data = doc.data();
      return {
        exists: true,
        lastSync: data.lastSync?.toDate(),
        syncedBy: data.syncedBy,
        recordCount: this.countRecords(data)
      };
    } catch (error) {
      console.error('Error getting backup info:', error);
      return { exists: false, error: error.message };
    }
  }

  async deleteBackup(orgId) {
    try {
      const orgRef = this.db.collection(this.collections.organizations).doc(orgId);
      await orgRef.delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  }
}

module.exports = new FirestoreService();