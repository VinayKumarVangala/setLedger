const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class OptimisticLockingService {
  static async updateWithVersionCheck(table, id, data, expectedVersion) {
    const transactionId = `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return await prisma.$transaction(async (tx) => {
      // Get current record with version
      const current = await tx[table].findUnique({
        where: { id }
      });
      
      if (!current) {
        throw new Error('Record not found');
      }
      
      // Check version for optimistic concurrency
      if (expectedVersion && current.version !== expectedVersion) {
        throw new Error(`Concurrent modification detected. Expected version ${expectedVersion}, found ${current.version}`);
      }
      
      // Update with incremented version
      const updated = await tx[table].update({
        where: { id },
        data: {
          ...data,
          version: { increment: 1 },
          updatedAt: new Date()
        }
      });
      
      // Log the update
      await tx.auditLog.create({
        data: {
          entityType: table.toUpperCase(),
          entityId: id,
          action: 'UPDATE_WITH_LOCK',
          changes: JSON.stringify({
            transactionId,
            previousVersion: current.version,
            newVersion: updated.version,
            changes: data
          }),
          userId: data.updatedBy || 'system',
          organizationId: current.organizationId,
          timestamp: new Date()
        }
      });
      
      return updated;
    });
  }
  
  static async acquireRowLock(table, id, lockDuration = 30000) {
    const lockId = `${table}_${id}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + lockDuration);
    
    try {
      await prisma.rowLock.create({
        data: {
          id: lockId,
          tableName: table,
          recordId: id,
          expiresAt,
          createdAt: new Date()
        }
      });
      
      return lockId;
    } catch (error) {
      // Check if lock already exists
      const existingLock = await prisma.rowLock.findFirst({
        where: {
          tableName: table,
          recordId: id,
          expiresAt: { gt: new Date() }
        }
      });
      
      if (existingLock) {
        throw new Error(`Record is locked until ${existingLock.expiresAt.toISOString()}`);
      }
      
      throw error;
    }
  }
  
  static async releaseRowLock(lockId) {
    return await prisma.rowLock.delete({
      where: { id: lockId }
    });
  }
  
  static async cleanupExpiredLocks() {
    const deleted = await prisma.rowLock.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });
    
    return deleted.count;
  }
  
  static async updateStockWithLock(productId, stockChange, operation, userId) {
    const { StockLedgerService } = require('./stock-ledger');
    const lockId = await this.acquireRowLock('product', productId);
    
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      let moveType, quantity, description;
      
      switch (operation) {
        case 'ADD':
          moveType = 'in';
          quantity = stockChange;
          description = `Stock addition via API`;
          break;
        case 'SUBTRACT':
          moveType = 'out';
          quantity = stockChange;
          description = `Stock reduction via API`;
          break;
        case 'SET':
          moveType = 'adjustment';
          quantity = stockChange;
          description = `Stock adjustment via API`;
          break;
        default:
          throw new Error('Invalid stock operation');
      }
      
      // Use stock ledger service for immutable tracking
      const result = await StockLedgerService.recordStockMove(
        product.organizationId,
        productId,
        moveType,
        quantity,
        lockId,
        description,
        userId
      );
      
      return result;
    } finally {
      await this.releaseRowLock(lockId);
    }
  }
}

module.exports = { OptimisticLockingService };