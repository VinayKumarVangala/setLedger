const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');
const { 
  Organization, User, Product, Invoice, Stock, 
  Transaction, Account, JournalEntry, Ledger 
} = require('../models');

class BackupService {
  constructor() {
    this.backupPath = path.join(__dirname, '../../backups');
    this.ensureBackupDir();
  }

  async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupPath, { recursive: true });
    } catch (error) {
      console.error('Error creating backup directory:', error);
    }
  }

  // Create full backup for organization
  async createBackup(orgID) {
    try {
      const timestamp = new Date().toISOString();
      const backupData = {
        orgID,
        timestamp,
        version: '1.0',
        data: {}
      };

      // Backup all collections
      const collections = [
        { name: 'organizations', model: Organization, filter: { orgID } },
        { name: 'users', model: User, filter: { orgID } },
        { name: 'products', model: Product, filter: { orgID } },
        { name: 'invoices', model: Invoice, filter: { orgID } },
        { name: 'stock', model: Stock, filter: { orgID } },
        { name: 'transactions', model: Transaction, filter: { orgID } },
        { name: 'accounts', model: Account, filter: { orgID } },
        { name: 'journalEntries', model: JournalEntry, filter: { orgID } },
        { name: 'ledger', model: Ledger, filter: { orgID } }
      ];

      for (const collection of collections) {
        const data = await collection.model.find(collection.filter).lean();
        backupData.data[collection.name] = data;
      }

      // Save to Firebase Firestore
      await this.saveToFirestore(backupData);
      
      // Save to LocalStorage (file system)
      await this.saveToLocalStorage(backupData);

      console.log(`Backup completed for org: ${orgID}`);
      return backupData;
    } catch (error) {
      console.error(`Backup failed for org ${orgID}:`, error);
      throw error;
    }
  }

  // Save backup to Firebase Firestore
  async saveToFirestore(backupData) {
    try {
      const db = admin.firestore();
      const backupRef = db.collection('backups').doc(`${backupData.orgID}_${Date.now()}`);
      
      // Split large data into chunks if needed
      const chunks = this.chunkData(backupData, 1000000); // 1MB chunks
      
      for (let i = 0; i < chunks.length; i++) {
        await backupRef.collection('chunks').doc(`chunk_${i}`).set(chunks[i]);
      }
      
      // Save metadata
      await backupRef.set({
        orgID: backupData.orgID,
        timestamp: backupData.timestamp,
        version: backupData.version,
        chunks: chunks.length,
        size: JSON.stringify(backupData).length
      });
      
      console.log(`Firestore backup saved for org: ${backupData.orgID}`);
    } catch (error) {
      console.error('Firestore backup failed:', error);
      throw error;
    }
  }

  // Save backup to local file system
  async saveToLocalStorage(backupData) {
    try {
      const filename = `backup_${backupData.orgID}_${Date.now()}.json`;
      const filepath = path.join(this.backupPath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));
      
      // Keep only last 10 backups per org
      await this.cleanupOldBackups(backupData.orgID);
      
      console.log(`Local backup saved: ${filename}`);
    } catch (error) {
      console.error('Local backup failed:', error);
      throw error;
    }
  }

  // Restore data from backup
  async restoreFromBackup(orgID, source = 'firestore', backupId = null) {
    try {
      let backupData;
      
      if (source === 'firestore') {
        backupData = await this.getFromFirestore(orgID, backupId);
      } else {
        backupData = await this.getFromLocalStorage(orgID, backupId);
      }
      
      if (!backupData) {
        throw new Error('Backup not found');
      }
      
      // Clear existing data
      await this.clearOrgData(orgID);
      
      // Restore data
      const collections = [
        { name: 'organizations', model: Organization },
        { name: 'users', model: User },
        { name: 'products', model: Product },
        { name: 'invoices', model: Invoice },
        { name: 'stock', model: Stock },
        { name: 'transactions', model: Transaction },
        { name: 'accounts', model: Account },
        { name: 'journalEntries', model: JournalEntry },
        { name: 'ledger', model: Ledger }
      ];
      
      for (const collection of collections) {
        const data = backupData.data[collection.name];
        if (data && data.length > 0) {
          await collection.model.insertMany(data);
        }
      }
      
      console.log(`Data restored for org: ${orgID} from ${source}`);
      return { success: true, recordsRestored: this.countRecords(backupData.data) };
    } catch (error) {
      console.error(`Restore failed for org ${orgID}:`, error);
      throw error;
    }
  }

  // Get backup from Firestore
  async getFromFirestore(orgID, backupId = null) {
    try {
      const db = admin.firestore();
      let backupRef;
      
      if (backupId) {
        backupRef = db.collection('backups').doc(backupId);
      } else {
        // Get latest backup
        const query = await db.collection('backups')
          .where('orgID', '==', orgID)
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();
        
        if (query.empty) return null;
        backupRef = query.docs[0].ref;
      }
      
      const backupDoc = await backupRef.get();
      if (!backupDoc.exists) return null;
      
      const metadata = backupDoc.data();
      const chunks = [];
      
      // Get all chunks
      const chunksQuery = await backupRef.collection('chunks').orderBy('__name__').get();
      chunksQuery.forEach(doc => chunks.push(doc.data()));
      
      // Reconstruct data
      return this.reconstructFromChunks(chunks, metadata);
    } catch (error) {
      console.error('Error getting Firestore backup:', error);
      return null;
    }
  }

  // Get backup from local storage
  async getFromLocalStorage(orgID, backupId = null) {
    try {
      const files = await fs.readdir(this.backupPath);
      const orgBackups = files
        .filter(file => file.startsWith(`backup_${orgID}_`) && file.endsWith('.json'))
        .sort()
        .reverse();
      
      if (orgBackups.length === 0) return null;
      
      const filename = backupId ? `${backupId}.json` : orgBackups[0];
      const filepath = path.join(this.backupPath, filename);
      
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting local backup:', error);
      return null;
    }
  }

  // List available backups
  async listBackups(orgID) {
    const backups = { firestore: [], local: [] };
    
    try {
      // Firestore backups
      const db = admin.firestore();
      const query = await db.collection('backups')
        .where('orgID', '==', orgID)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
      
      query.forEach(doc => {
        backups.firestore.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Local backups
      const files = await fs.readdir(this.backupPath);
      const orgBackups = files
        .filter(file => file.startsWith(`backup_${orgID}_`) && file.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, 10);
      
      for (const file of orgBackups) {
        const filepath = path.join(this.backupPath, file);
        const stats = await fs.stat(filepath);
        backups.local.push({
          id: file.replace('.json', ''),
          filename: file,
          size: stats.size,
          timestamp: stats.mtime.toISOString()
        });
      }
    } catch (error) {
      console.error('Error listing backups:', error);
    }
    
    return backups;
  }

  // Utility methods
  chunkData(data, maxSize) {
    const jsonStr = JSON.stringify(data);
    const chunks = [];
    
    for (let i = 0; i < jsonStr.length; i += maxSize) {
      chunks.push({ data: jsonStr.slice(i, i + maxSize) });
    }
    
    return chunks;
  }

  reconstructFromChunks(chunks, metadata) {
    const jsonStr = chunks.map(chunk => chunk.data).join('');
    return JSON.parse(jsonStr);
  }

  async clearOrgData(orgID) {
    const models = [User, Product, Invoice, Stock, Transaction, Account, JournalEntry, Ledger];
    
    for (const model of models) {
      await model.deleteMany({ orgID });
    }
  }

  countRecords(data) {
    return Object.values(data).reduce((total, collection) => total + (collection?.length || 0), 0);
  }

  async cleanupOldBackups(orgID) {
    try {
      const files = await fs.readdir(this.backupPath);
      const orgBackups = files
        .filter(file => file.startsWith(`backup_${orgID}_`) && file.endsWith('.json'))
        .sort()
        .reverse();
      
      // Keep only last 10 backups
      for (let i = 10; i < orgBackups.length; i++) {
        await fs.unlink(path.join(this.backupPath, orgBackups[i]));
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }
}

module.exports = new BackupService();