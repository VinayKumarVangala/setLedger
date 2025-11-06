// Mock Prisma client for development
const mockPrisma = {
  product: {
    findFirst: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: (data) => Promise.resolve({ id: 1, ...data.data }),
    update: (params) => Promise.resolve({ id: params.where.id, ...params.data }),
    delete: (params) => Promise.resolve({ id: params.where.id })
  },
  invoice: {
    findFirst: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: (data) => Promise.resolve({ id: 1, ...data.data }),
    update: (params) => Promise.resolve({ id: params.where.id, ...params.data })
  },
  $transaction: (callback) => callback(mockPrisma)
};

module.exports = mockPrisma;