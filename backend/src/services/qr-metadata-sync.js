const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class QRMetadataSync {
  static async updateQRMetadata(productId, orgUUID, metadata, userId) {
    const operationId = `qr_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await prisma.$transaction(async (tx) => {
        // Update product metadata
        await tx.product.update({
          where: { id: productId, orgUUID },
          data: {
            ...metadata,
            updatedAt: new Date(),
            lastModifiedBy: userId
          }
        });
        
        // Log sync operation
        await tx.syncLog.create({
          data: {
            operationId,
            entityType: 'PRODUCT',
            entityId: productId,
            orgUUID,
            action: 'QR_METADATA_UPDATE',
            metadata: JSON.stringify(metadata),
            userId,
            status: 'COMPLETED',
            timestamp: new Date()
          }
        });
      });
      
      // Broadcast update to connected clients
      this.broadcastQRUpdate(orgUUID, productId, metadata);
      
      return { success: true, operationId };
    } catch (error) {
      console.error('QR metadata update failed:', error);
      throw new Error('Failed to update QR metadata');
    }
  }
  
  static async getQRMetadata(productId, orgUUID) {
    const product = await prisma.product.findFirst({
      where: { id: productId, orgUUID },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        isPerishable: true,
        mfdDate: true,
        expiryDate: true,
        updatedAt: true,
        lastModifiedBy: true
      }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  }
  
  static broadcastQRUpdate(orgUUID, productId, metadata) {
    // WebSocket broadcast to all connected clients in organization
    const message = {
      type: 'QR_METADATA_UPDATE',
      orgUUID,
      productId,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    // Send to all connected WebSocket clients for this org
    global.wsClients?.forEach(client => {
      if (client.orgUUID === orgUUID && client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  static async getSyncHistory(orgUUID, limit = 50) {
    return await prisma.syncLog.findMany({
      where: {
        orgUUID,
        action: 'QR_METADATA_UPDATE'
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        operationId: true,
        entityId: true,
        metadata: true,
        userId: true,
        timestamp: true,
        status: true
      }
    });
  }
}

module.exports = { QRMetadataSync };