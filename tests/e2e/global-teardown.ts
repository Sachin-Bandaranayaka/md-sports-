import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function globalTeardown() {
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

  await prisma.$disconnect();
}

export default globalTeardown;