const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization
  const org = await prisma.organization.create({
    data: {
      id: uuidv4(),
      displayId: 'ORG1000',
      name: 'Demo Company',
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        theme: 'light'
      }
    }
  });

  // Create demo admin user
  const hashedPassword = await bcrypt.hash('password123', 12);
  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      displayId: 'ORG1000-1',
      name: 'Admin User',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'admin',
      organizationId: org.id
    }
  });

  // Create demo products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: uuidv4(),
        displayId: 'PRD001',
        name: 'Laptop',
        sku: 'LAP001',
        price: 50000.00,
        stock: 10,
        metadata: { category: 'Electronics', brand: 'Dell' },
        organizationId: org.id
      }
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        displayId: 'PRD002',
        name: 'Mouse',
        sku: 'MOU001',
        price: 500.00,
        stock: 50,
        metadata: { category: 'Accessories', brand: 'Logitech' },
        organizationId: org.id
      }
    })
  ]);

  // Create demo invoice
  const invoice = await prisma.invoice.create({
    data: {
      id: uuidv4(),
      displayId: 'INV001',
      customerName: 'John Doe',
      customerMobile: '+91-9876543210',
      subtotal: 50500.00,
      taxAmount: 9090.00,
      total: 59590.00,
      status: 'paid',
      metadata: { paymentMethod: 'card', notes: 'Demo invoice' },
      organizationId: org.id,
      items: {
        create: [
          {
            id: uuidv4(),
            productId: products[0].id,
            quantity: 1,
            price: 50000.00,
            total: 50000.00
          },
          {
            id: uuidv4(),
            productId: products[1].id,
            quantity: 1,
            price: 500.00,
            total: 500.00
          }
        ]
      }
    }
  });

  // Create demo payment
  await prisma.payment.create({
    data: {
      id: uuidv4(),
      displayId: 'PAY001',
      amount: 59590.00,
      method: 'card',
      status: 'completed',
      transactionId: 'TXN123456',
      metadata: { gateway: 'razorpay', cardLast4: '1234' },
      organizationId: org.id,
      invoiceId: invoice.id
    }
  });

  // Create demo ledger entries
  await Promise.all([
    prisma.ledger.create({
      data: {
        id: uuidv4(),
        displayId: 'LED001',
        accountName: 'Sales Revenue',
        accountType: 'revenue',
        credit: 59590.00,
        balance: -59590.00,
        description: 'Invoice INV001',
        metadata: { invoiceId: invoice.id },
        organizationId: org.id
      }
    }),
    prisma.ledger.create({
      data: {
        id: uuidv4(),
        displayId: 'LED002',
        accountName: 'Cash Account',
        accountType: 'asset',
        debit: 59590.00,
        balance: 59590.00,
        description: 'Payment PAY001',
        metadata: { paymentId: 'PAY001' },
        organizationId: org.id
      }
    })
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`📧 Admin login: admin@demo.com / password123`);
  console.log(`🏢 Organization: ${org.displayId} - ${org.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });