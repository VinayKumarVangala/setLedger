const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

class StockLedgerService {
  static async recordStockMove(orgId, productId, moveType, quantity, reference, description, userId) {
    const transactionId = uuidv4();
    
    return await prisma.$transaction(async (tx) => {
      // Get current stock for validation
      const product = await tx.product.findFirst({
        where: { id: productId, organizationId: orgId }
      });
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Calculate new stock level
      let newStock = product.stock;
      if (moveType === 'in') {
        newStock += quantity;
      } else if (moveType === 'out') {
        newStock -= quantity;
        if (newStock < 0) {
          throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
        }
      } else if (moveType === 'adjustment') {
        newStock = quantity; // Direct set for adjustments
      }
      
      // Create immutable stock move record
      const stockMove = await tx.stockMove.create({
        data: {
          displayId: `STK${Date.now().toString().slice(-6)}`,
          moveType,
          quantity: Math.abs(quantity),
          reference,
          description,
          transactionId,
          organizationId: orgId,
          productId,
          metadata: JSON.stringify({
            previousStock: product.stock,
            newStock,
            userId,
            timestamp: new Date().toISOString()
          })
        }
      });
      
      // Update product stock
      await tx.product.update({
        where: { id: productId },
        data: { 
          stock: newStock,
          version: { increment: 1 },
          updatedAt: new Date()
        }
      });
      
      // Create transaction record
      await tx.transaction.create({
        data: {
          id: transactionId,
          displayId: `TXN${Date.now().toString().slice(-6)}`,
          operation: 'stock_move',
          status: 'completed',
          metadata: JSON.stringify({
            stockMoveId: stockMove.id,
            productId,
            moveType,
            quantity,
            previousStock: product.stock,
            newStock
          }),
          organizationId: orgId
        }
      });
      
      return { stockMove, previousStock: product.stock, newStock };
    });
  }
  
  static async getStockLedger(orgId, productId = null, filters = {}) {
    const where = { organizationId: orgId };
    
    if (productId) where.productId = productId;
    if (filters.moveType) where.moveType = filters.moveType;
    if (filters.reference) where.reference = { contains: filters.reference };
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
    
    return await prisma.stockMove.findMany({
      where,
      include: {
        product: {
          select: { name: true, sku: true, displayId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100
    });
  }
  
  static async reconcileStock(orgId, productId) {
    const stockMoves = await prisma.stockMove.findMany({
      where: { productId, organizationId: orgId },
      orderBy: { createdAt: 'asc' }
    });
    
    let calculatedStock = 0;
    const reconciliation = [];
    
    for (const move of stockMoves) {
      const metadata = JSON.parse(move.metadata || '{}');
      
      if (move.moveType === 'in') {
        calculatedStock += move.quantity;
      } else if (move.moveType === 'out') {
        calculatedStock -= move.quantity;
      } else if (move.moveType === 'adjustment') {
        calculatedStock = move.quantity;
      }
      
      reconciliation.push({
        moveId: move.id,
        date: move.createdAt,
        moveType: move.moveType,
        quantity: move.quantity,
        runningBalance: calculatedStock,
        expectedBalance: metadata.newStock,
        variance: calculatedStock - (metadata.newStock || 0)
      });
    }
    
    // Get current product stock
    const product = await prisma.product.findFirst({
      where: { id: productId, organizationId: orgId }
    });
    
    const finalVariance = calculatedStock - (product?.stock || 0);
    
    return {
      productId,
      currentStock: product?.stock || 0,
      calculatedStock,
      variance: finalVariance,
      isReconciled: finalVariance === 0,
      movements: reconciliation
    };
  }
  
  static async getStockSummary(orgId, asOfDate = new Date()) {
    const products = await prisma.product.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, sku: true, stock: true }
    });
    
    const summary = [];
    
    for (const product of products) {
      const stockMoves = await prisma.stockMove.findMany({
        where: {
          productId: product.id,
          createdAt: { lte: asOfDate }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      let calculatedStock = 0;
      let totalIn = 0;
      let totalOut = 0;
      let adjustments = 0;
      
      for (const move of stockMoves) {
        if (move.moveType === 'in') {
          calculatedStock += move.quantity;
          totalIn += move.quantity;
        } else if (move.moveType === 'out') {
          calculatedStock -= move.quantity;
          totalOut += move.quantity;
        } else if (move.moveType === 'adjustment') {
          adjustments++;
          calculatedStock = move.quantity;
        }
      }
      
      summary.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.stock,
        calculatedStock,
        variance: calculatedStock - product.stock,
        totalIn,
        totalOut,
        adjustments,
        lastMovement: stockMoves[stockMoves.length - 1]?.createdAt
      });
    }
    
    return summary;
  }
  
  static async createStockAdjustment(orgId, productId, newStock, reason, userId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, organizationId: orgId }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    const difference = newStock - product.stock;
    const description = `Stock adjustment: ${reason} (${difference > 0 ? '+' : ''}${difference})`;
    
    return await this.recordStockMove(
      orgId,
      productId,
      'adjustment',
      newStock,
      `ADJ${Date.now().toString().slice(-6)}`,
      description,
      userId
    );
  }
}

module.exports = { StockLedgerService };