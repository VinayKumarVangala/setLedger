const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

class ConflictResolutionService {
  static async detectConflicts(orgId, localData, serverData) {
    const conflicts = [];
    
    for (const localItem of localData) {
      const serverItem = serverData.find(s => s.id === localItem.id);
      
      if (serverItem && serverItem.updatedAt > localItem.updatedAt) {
        // Check for stock oversell conflicts
        if (localItem.stock !== serverItem.stock) {
          const conflict = {
            id: uuidv4(),
            type: 'STOCK_CONFLICT',
            entityType: 'PRODUCT',
            entityId: localItem.id,
            localData: localItem,
            serverData: serverItem,
            severity: this.calculateSeverity(localItem, serverItem),
            status: 'pending',
            createdAt: new Date()
          };
          
          conflicts.push(conflict);
          
          // Store conflict in database
          await prisma.conflict.create({
            data: {
              ...conflict,
              organizationId: orgId,
              localData: JSON.stringify(localItem),
              serverData: JSON.stringify(serverItem)
            }
          });
        }
      }
    }
    
    return conflicts;
  }
  
  static calculateSeverity(localData, serverData) {
    const stockDiff = Math.abs(localData.stock - serverData.stock);
    
    if (stockDiff > 100) return 'CRITICAL';
    if (stockDiff > 50) return 'HIGH';
    if (stockDiff > 10) return 'MEDIUM';
    return 'LOW';
  }
  
  static async resolveConflict(conflictId, resolution, userId) {
    const conflict = await prisma.conflict.findUnique({
      where: { id: conflictId }
    });
    
    if (!conflict) {
      throw new Error('Conflict not found');
    }
    
    const transactionId = uuidv4();
    
    return await prisma.$transaction(async (tx) => {
      let resolvedData;
      
      switch (resolution.action) {
        case 'USE_SERVER':
          resolvedData = JSON.parse(conflict.serverData);
          break;
        case 'USE_LOCAL':
          resolvedData = JSON.parse(conflict.localData);
          break;
        case 'MANUAL_MERGE':
          resolvedData = resolution.mergedData;
          break;
        default:
          throw new Error('Invalid resolution action');
      }
      
      // Update the actual entity
      if (conflict.entityType === 'PRODUCT') {
        await tx.product.update({
          where: { id: conflict.entityId },
          data: {
            ...resolvedData,
            updatedAt: new Date()
          }
        });
      }
      
      // Mark conflict as resolved
      await tx.conflict.update({
        where: { id: conflictId },
        data: {
          status: 'resolved',
          resolution: JSON.stringify(resolution),
          resolvedBy: userId,
          resolvedAt: new Date()
        }
      });
      
      // Create audit log
      await tx.auditLog.create({
        data: {
          id: uuidv4(),
          entityType: conflict.entityType,
          entityId: conflict.entityId,
          action: 'CONFLICT_RESOLVED',
          changes: JSON.stringify({
            conflictId,
            resolution: resolution.action,
            before: JSON.parse(conflict.localData),
            after: resolvedData
          }),
          userId,
          organizationId: conflict.organizationId,
          timestamp: new Date()
        }
      });
      
      return { conflict, resolvedData };
    });
  }
  
  static async getConflicts(orgId, filters = {}) {
    const where = { organizationId: orgId };
    
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;
    if (filters.entityType) where.entityType = filters.entityType;
    
    return await prisma.conflict.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }
  
  static async autoResolveConflicts(orgId) {
    const conflicts = await this.getConflicts(orgId, { status: 'pending' });
    const autoResolved = [];
    
    for (const conflict of conflicts) {
      const localData = JSON.parse(conflict.localData);
      const serverData = JSON.parse(conflict.serverData);
      
      // Auto-resolve low severity conflicts using server data
      if (conflict.severity === 'LOW') {
        await this.resolveConflict(conflict.id, {
          action: 'USE_SERVER',
          reason: 'Auto-resolved: Low severity conflict'
        }, 'system');
        
        autoResolved.push(conflict.id);
      }
    }
    
    return autoResolved;
  }
}

module.exports = { ConflictResolutionService };