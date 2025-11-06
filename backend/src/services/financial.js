const prisma = require('../db/prisma');
const { v4: uuidv4 } = require('uuid');

class FinancialService {
  // Transaction tracking and rollback
  async createTransaction(orgId, operation, metadata = {}) {
    return await prisma.transaction.create({
      data: {
        id: uuidv4(),
        displayId: `TXN${Date.now()}`,
        operation,
        status: 'pending',
        metadata,
        organizationId: orgId
      }
    });
  }

  async completeTransaction(transactionId) {
    return await prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        status: 'completed',
        completedAt: new Date()
      }
    });
  }

  async rollbackTransaction(transactionId) {
    return await prisma.$transaction(async (tx) => {
      // Mark transaction as rolled back
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'rolled_back' }
      });

      // Reverse stock moves
      const stockMoves = await tx.stockMove.findMany({
        where: { transactionId },
        include: { product: true }
      });

      for (const move of stockMoves) {
        const reverseQuantity = move.moveType === 'out' ? move.quantity : -move.quantity;
        await tx.product.update({
          where: { id: move.productId },
          data: { stock: { increment: reverseQuantity } }
        });
      }

      // Delete related records
      await tx.journalEntry.deleteMany({ where: { transactionId } });
      await tx.stockMove.deleteMany({ where: { transactionId } });
      await tx.reservation.deleteMany({ where: { transactionId } });
    });
  }

  // Invoice operations with transaction tracking
  async createInvoice(orgId, data) {
    const transaction = await this.createTransaction(orgId, 'invoice_create', {
      invoiceDisplayId: data.displayId,
      total: data.total
    });

    try {
      const result = await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
          data: {
            id: uuidv4(),
            displayId: data.displayId,
            customerName: data.customerName,
            customerMobile: data.customerMobile,
            subtotal: data.subtotal,
            taxAmount: data.taxAmount || 0,
            discount: data.discount || 0,
            total: data.total,
            status: data.status || 'draft',
            metadata: { ...data.metadata, transactionId: transaction.id },
            organizationId: orgId,
            lines: {
              create: data.lines.map(line => ({
                id: uuidv4(),
                productId: line.productId,
                quantity: line.quantity,
                price: line.price,
                total: line.total
              }))
            }
          },
          include: { lines: { include: { product: true } } }
        });

        // Create stock moves with transaction tracking
        for (const line of data.lines) {
          await tx.stockMove.create({
            data: {
              id: uuidv4(),
              displayId: `SM${Date.now()}${Math.random().toString(36).substr(2, 4)}`,
              moveType: 'out',
              quantity: line.quantity,
              reference: invoice.displayId,
              description: `Sale - Invoice ${invoice.displayId}`,
              transactionId: transaction.id,
              organizationId: orgId,
              productId: line.productId
            }
          });

          await tx.product.update({
            where: { id: line.productId },
            data: { stock: { decrement: line.quantity } }
          });
        }

        // Create journal entries with transaction tracking
        await tx.journalEntry.createMany({
          data: [
            {
              id: uuidv4(),
              displayId: `JE${Date.now()}1`,
              accountName: 'Accounts Receivable',
              accountType: 'asset',
              debit: data.total,
              reference: invoice.displayId,
              description: `Invoice ${invoice.displayId}`,
              transactionId: transaction.id,
              organizationId: orgId
            },
            {
              id: uuidv4(),
              displayId: `JE${Date.now()}2`,
              accountName: 'Sales Revenue',
              accountType: 'revenue',
              credit: data.total,
              reference: invoice.displayId,
              description: `Invoice ${invoice.displayId}`,
              transactionId: transaction.id,
              organizationId: orgId
            }
          ]
        });

        return invoice;
      });

      await this.completeTransaction(transaction.id);
      return result;
    } catch (error) {
      await this.rollbackTransaction(transaction.id);
      throw error;
    }
  }

  async getInvoices(orgId, filters = {}) {
    return await prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        ...filters
      },
      include: {
        items: { include: { product: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Stock reservation operations with transaction tracking
  async createReservation(orgId, data) {
    const transaction = await this.createTransaction(orgId, 'reservation_create', {
      productId: data.productId,
      quantity: data.quantity
    });

    try {
      const result = await prisma.$transaction(async (tx) => {
        const reservation = await tx.reservation.create({
          data: {
            id: uuidv4(),
            displayId: data.displayId,
            quantity: data.quantity,
            reference: data.reference,
            expiresAt: data.expiresAt,
            metadata: data.metadata || {},
            transactionId: transaction.id,
            organizationId: orgId,
            productId: data.productId
          }
        });

        await tx.product.update({
          where: { id: data.productId },
          data: { stock: { decrement: data.quantity } }
        });

        return reservation;
      });

      await this.completeTransaction(transaction.id);
      return result;
    } catch (error) {
      await this.rollbackTransaction(transaction.id);
      throw error;
    }
  }

  // Product/Stock operations
  async createProduct(orgId, data) {
    return await prisma.product.create({
      data: {
        id: uuidv4(),
        displayId: data.displayId,
        name: data.name,
        sku: data.sku,
        price: data.price,
        stock: data.stock || 0,
        isPerishable: data.isPerishable || false,
        metadata: data.metadata || {},
        organizationId: orgId
      }
    });
  }

  async updateStock(orgId, productId, quantity, operation = 'set', reference = null) {
    const transaction = await this.createTransaction(orgId, 'stock_update', {
      productId,
      quantity,
      operation
    });

    try {
      const result = await prisma.$transaction(async (tx) => {
        const updateData = operation === 'increment' 
          ? { stock: { increment: quantity } }
          : operation === 'decrement'
          ? { stock: { decrement: quantity } }
          : { stock: quantity };

        const product = await tx.product.update({
          where: { id: productId },
          data: updateData
        });

        await tx.stockMove.create({
          data: {
            id: uuidv4(),
            displayId: `SM${Date.now()}${Math.random().toString(36).substr(2, 4)}`,
            moveType: operation === 'increment' ? 'in' : operation === 'decrement' ? 'out' : 'adjustment',
            quantity: Math.abs(quantity),
            reference: reference,
            description: `Stock ${operation} - ${quantity} units`,
            transactionId: transaction.id,
            organizationId: orgId,
            productId: productId
          }
        });

        return product;
      });

      await this.completeTransaction(transaction.id);
      return result;
    } catch (error) {
      await this.rollbackTransaction(transaction.id);
      throw error;
    }
  }

  async getLowStockProducts(orgId, threshold = 10) {
    return await prisma.product.findMany({
      where: {
        organizationId: orgId,
        stock: { lte: threshold }
      }
    });
  }

  // Journal entry operations
  async createJournalEntry(orgId, data, transactionId = null) {
    const txnId = transactionId || (await this.createTransaction(orgId, 'journal_entry', data)).id;
    
    try {
      const result = await prisma.journalEntry.create({
        data: {
          id: uuidv4(),
          displayId: data.displayId || `JE${Date.now()}`,
          accountName: data.accountName,
          accountType: data.accountType,
          debit: data.debit || 0,
          credit: data.credit || 0,
          reference: data.reference,
          description: data.description,
          metadata: data.metadata || {},
          transactionId: txnId,
          organizationId: orgId
        }
      });

      if (!transactionId) await this.completeTransaction(txnId);
      return result;
    } catch (error) {
      if (!transactionId) await this.rollbackTransaction(txnId);
      throw error;
    }
  }

  // Transaction monitoring
  async getTransactions(orgId, filters = {}) {
    return await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        ...filters
      },
      include: {
        journalEntries: true,
        stockMoves: { include: { product: true } },
        reservations: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getFailedTransactions(orgId) {
    return await this.getTransactions(orgId, {
      status: { in: ['failed', 'rolled_back'] }
    });
  }

  async getJournalEntries(orgId, filters = {}) {
    return await prisma.journalEntry.findMany({
      where: {
        organizationId: orgId,
        ...filters
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getStockMoves(orgId, filters = {}) {
    return await prisma.stockMove.findMany({
      where: {
        organizationId: orgId,
        ...filters
      },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getReservations(orgId, filters = {}) {
    return await prisma.reservation.findMany({
      where: {
        organizationId: orgId,
        ...filters
      },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAccountBalance(orgId, accountName) {
    const result = await prisma.journalEntry.aggregate({
      where: {
        organizationId: orgId,
        accountName: accountName
      },
      _sum: {
        debit: true,
        credit: true
      }
    });

    return {
      debit: result._sum.debit || 0,
      credit: result._sum.credit || 0,
      balance: (result._sum.debit || 0) - (result._sum.credit || 0)
    };
  }

  // Financial reports
  async getFinancialSummary(orgId, startDate, endDate) {
    const [revenue, expenses] = await Promise.all([
      prisma.journalEntry.aggregate({
        where: {
          organizationId: orgId,
          accountType: 'revenue',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { credit: true }
      }),
      prisma.journalEntry.aggregate({
        where: {
          organizationId: orgId,
          accountType: 'expense',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { debit: true }
      })
    ]);

    return {
      revenue: revenue._sum.credit || 0,
      expenses: expenses._sum.debit || 0,
      profit: (revenue._sum.credit || 0) - (expenses._sum.debit || 0)
    };
  }
}

module.exports = new FinancialService();