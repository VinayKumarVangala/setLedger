const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

class StockReservationService {
  static async reserveStock(orgId, productId, quantity, holdUntil, reference = null) {
    const transactionId = uuidv4();
    
    return await prisma.$transaction(async (tx) => {
      // Check available stock
      const product = await tx.product.findFirst({
        where: { id: productId, organizationId: orgId }
      });
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Calculate available stock (physical - reserved)
      const activeReservations = await tx.reservation.aggregate({
        where: {
          productId,
          status: 'active',
          expiresAt: { gt: new Date() }
        },
        _sum: { quantity: true }
      });
      
      const reservedQuantity = activeReservations._sum.quantity || 0;
      const availableStock = product.stock - reservedQuantity;
      
      if (availableStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`);
      }
      
      // Create reservation
      const reservation = await tx.reservation.create({
        data: {
          displayId: `RSV${Date.now().toString().slice(-6)}`,
          quantity,
          status: 'active',
          reference,
          expiresAt: holdUntil,
          transactionId,
          organizationId: orgId,
          productId
        }
      });
      
      // Create transaction record
      await tx.transaction.create({
        data: {
          id: transactionId,
          displayId: `TXN${Date.now().toString().slice(-6)}`,
          operation: 'stock_reservation',
          status: 'completed',
          metadata: { reservationId: reservation.id, quantity, reference },
          organizationId: orgId
        }
      });
      
      return reservation;
    });
  }
  
  static async confirmSale(orgId, reservationId, actualQuantity = null) {
    const transactionId = uuidv4();
    
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findFirst({
        where: { id: reservationId, organizationId: orgId, status: 'active' },
        include: { product: true }
      });
      
      if (!reservation) {
        throw new Error('Active reservation not found');
      }
      
      const saleQuantity = actualQuantity || reservation.quantity;
      
      // Update physical stock
      await tx.product.update({
        where: { id: reservation.productId },
        data: { stock: { decrement: saleQuantity } }
      });
      
      // Mark reservation as fulfilled
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'fulfilled' }
      });
      
      // Create stock move record
      await tx.stockMove.create({
        data: {
          displayId: `STK${Date.now().toString().slice(-6)}`,
          moveType: 'out',
          quantity: saleQuantity,
          reference: reservation.reference,
          description: `Sale confirmation - ${reservation.reference}`,
          transactionId,
          organizationId: orgId,
          productId: reservation.productId
        }
      });
      
      // Create transaction record
      await tx.transaction.create({
        data: {
          id: transactionId,
          displayId: `TXN${Date.now().toString().slice(-6)}`,
          operation: 'sale_confirmation',
          status: 'completed',
          metadata: { reservationId, saleQuantity, originalQuantity: reservation.quantity },
          organizationId: orgId
        }
      });
      
      return { reservation, saleQuantity };
    });
  }
  
  static async releaseReservation(orgId, reservationId) {
    return await prisma.reservation.update({
      where: { id: reservationId, organizationId: orgId },
      data: { status: 'cancelled' }
    });
  }
  
  static async cleanupExpiredReservations() {
    const expired = await prisma.reservation.updateMany({
      where: {
        status: 'active',
        expiresAt: { lt: new Date() }
      },
      data: { status: 'expired' }
    });
    
    return expired.count;
  }
  
  static async getAvailableStock(orgId, productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, organizationId: orgId }
    });
    
    if (!product) return 0;
    
    const activeReservations = await prisma.reservation.aggregate({
      where: {
        productId,
        status: 'active',
        expiresAt: { gt: new Date() }
      },
      _sum: { quantity: true }
    });
    
    const reservedQuantity = activeReservations._sum.quantity || 0;
    return Math.max(0, product.stock - reservedQuantity);
  }
  
  static async getReservations(orgId, filters = {}) {
    const where = { organizationId: orgId };
    
    if (filters.status) where.status = filters.status;
    if (filters.productId) where.productId = filters.productId;
    if (filters.reference) where.reference = filters.reference;
    
    return await prisma.reservation.findMany({
      where,
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = { StockReservationService };