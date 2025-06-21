import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function globalSetup(config: FullConfig) {
  // Clean up test data
  await prisma.invoice.deleteMany({
    where: {
      customer: {
        email: { contains: 'test' }
      }
    }
  });
  
  await prisma.customer.deleteMany({
    where: {
      email: { contains: 'test' }
    }
  });
  
  await prisma.product.deleteMany({
    where: {
      name: { contains: 'Test' }
    }
  });
  
  await prisma.inventoryItem.deleteMany({
    where: {
      product: {
        name: { contains: 'Test' }
      }
    }
  });
  
  await prisma.user.deleteMany({
    where: {
      email: { contains: 'test' }
    }
  });

  // Create test data
  const testUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      name: 'Test User',
      email: 'test@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      roleName: 'admin'
    }
  });

  const testCustomer = await prisma.customer.create({
    data: {
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      phone: '123-456-7890'
    }
  });

  const testProduct = await prisma.product.create({
    data: {
      name: 'Test Product',
      description: 'A test product',
      price: 99.99,
      sku: 'TEST-001'
    }
  });

  // Create inventory item
  await prisma.inventoryItem.create({
    data: {
      productId: testProduct.id,
      quantity: 100,
      shopSpecificCost: 50.00,
      shopId: 'default'
    }
  });

  // Store test data IDs for use in tests
  process.env.TEST_USER_ID = testUser.id.toString();
  process.env.TEST_CUSTOMER_ID = testCustomer.id.toString();
  process.env.TEST_PRODUCT_ID = testProduct.id.toString();

  // Start the application server if needed
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Wait for the application to be ready
  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  } catch (error) {
    console.log('Application not ready yet, continuing...');
  }
  
  await browser.close();
}

export default globalSetup;