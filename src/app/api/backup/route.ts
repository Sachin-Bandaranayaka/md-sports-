import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth';
import { hasPermission } from '@/lib/utils/permissions';

export async function GET(request: NextRequest) {
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload || !payload.sub) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const userId = payload.sub as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roleName: true, permissions: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check for admin access via permissions first, then roleName
  const isAdmin = hasPermission(user.permissions || [], 'admin:all') || user.roleName === 'admin';

  if (!isAdmin) {
    return NextResponse.json({ error: 'Insufficient permissions - Admin required' }, { status: 403 });
  }

  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      users: await prisma.user.findMany(),
      products: await prisma.product.findMany(),
      shops: await prisma.shop.findMany(),
      inventoryItems: await prisma.inventoryItem.findMany(),
      invoices: await prisma.invoice.findMany(),
      customers: await prisma.customer.findMany(),
      categories: await prisma.category.findMany(),
      suppliers: await prisma.supplier.findMany(),
      // Add more tables as needed
    };

    return NextResponse.json(backupData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename=backup.json'
      }
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload || !payload.sub) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const userId = payload.sub as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roleName: true, permissions: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check for admin access via permissions first, then roleName
  const isAdmin = hasPermission(user.permissions || [], 'admin:all') || user.roleName === 'admin';

  if (!isAdmin) {
    return NextResponse.json({ error: 'Insufficient permissions - Admin required' }, { status: 403 });
  }

  try {
    const backupData = await request.json();
    
    // Validate backup data structure
    if (!backupData || typeof backupData !== 'object') {
      return NextResponse.json({ error: 'Invalid backup data format' }, { status: 400 });
    }

    // Validate backup version compatibility
    if (backupData.version && backupData.version !== '1.0') {
      return NextResponse.json({ 
        error: 'Backup version incompatible. Expected version 1.0' 
      }, { status: 400 });
    }

    // Perform restore in transaction
    const result = await prisma.$transaction(async (tx) => {
      const restoredCounts = {
        users: 0,
        products: 0,
        shops: 0,
        inventoryItems: 0,
        invoices: 0,
        customers: 0,
        categories: 0,
        suppliers: 0,
      };

      // WARNING: This will clear existing data - use with caution
      console.log('Starting database restore - clearing existing data...');
      
      // Clear data in proper order (respecting foreign key constraints)
      await tx.inventoryItem.deleteMany({});
      await tx.invoice.deleteMany({});
      await tx.product.deleteMany({});
      await tx.customer.deleteMany({});
      await tx.category.deleteMany({});
      await tx.supplier.deleteMany({});
      // Note: Not deleting users and shops to preserve system integrity
      
      console.log('Existing data cleared, restoring from backup...');

      // Restore data
      if (backupData.categories && Array.isArray(backupData.categories)) {
        for (const category of backupData.categories) {
          await tx.category.create({
            data: {
              id: category.id,
              name: category.name,
              description: category.description,
              createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
              updatedAt: category.updatedAt ? new Date(category.updatedAt) : new Date(),
            }
          });
          restoredCounts.categories++;
        }
      }

      if (backupData.suppliers && Array.isArray(backupData.suppliers)) {
        for (const supplier of backupData.suppliers) {
          await tx.supplier.create({
            data: {
              id: supplier.id,
              name: supplier.name,
              email: supplier.email,
              phone: supplier.phone,
              address: supplier.address,
              city: supplier.city,
              contactPerson: supplier.contactPerson,
              notes: supplier.notes,
              status: supplier.status ?? 'active',
              createdAt: supplier.createdAt ? new Date(supplier.createdAt) : new Date(),
              updatedAt: supplier.updatedAt ? new Date(supplier.updatedAt) : new Date(),
            }
          });
          restoredCounts.suppliers++;
        }
      }

      if (backupData.customers && Array.isArray(backupData.customers)) {
        for (const customer of backupData.customers) {
          await tx.customer.create({
            data: {
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              city: customer.city,
              postalCode: customer.postalCode,
              contactPerson: customer.contactPerson,
              contactPersonPhone: customer.contactPersonPhone,
              customerType: customer.customerType,
              creditLimit: customer.creditLimit,
              creditPeriod: customer.creditPeriod,
              taxId: customer.taxId,
              notes: customer.notes,
              status: customer.status,
              createdAt: customer.createdAt ? new Date(customer.createdAt) : new Date(),
              updatedAt: customer.updatedAt ? new Date(customer.updatedAt) : new Date(),
            }
          });
          restoredCounts.customers++;
        }
      }

      if (backupData.products && Array.isArray(backupData.products)) {
        for (const product of backupData.products) {
          await tx.product.create({
            data: {
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              sku: product.sku,
              barcode: product.barcode,
              categoryId: product.categoryId,
              shopId: product.shopId,
              minStockLevel: product.minStockLevel,
              weightedAverageCost: product.weightedAverageCost ?? product.cost ?? 0,
              createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
              updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
            }
          });
          restoredCounts.products++;
        }
      }

      if (backupData.inventoryItems && Array.isArray(backupData.inventoryItems)) {
        for (const item of backupData.inventoryItems) {
          await tx.inventoryItem.create({
            data: {
              id: item.id,
              productId: item.productId,
              shopId: item.shopId,
              quantity: item.quantity,
              shopSpecificCost: item.shopSpecificCost ?? 0,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
            }
          });
          restoredCounts.inventoryItems++;
        }
      }

      if (backupData.invoices && Array.isArray(backupData.invoices)) {
        for (const invoice of backupData.invoices) {
          await tx.invoice.create({
            data: {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              customerId: invoice.customerId,
              total: invoice.total,
              discountType: invoice.discountType,
              discountValue: invoice.discountValue,
              totalProfit: invoice.totalProfit,
              profitMargin: invoice.profitMargin,
              status: invoice.status,
              paymentMethod: invoice.paymentMethod,
              invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate) : null,
              dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
              notes: invoice.notes,
              shopId: invoice.shopId,
              createdBy: invoice.createdBy,
              createdAt: invoice.createdAt ? new Date(invoice.createdAt) : new Date(),
              updatedAt: invoice.updatedAt ? new Date(invoice.updatedAt) : new Date(),
            }
          });
          restoredCounts.invoices++;
        }
      }

      return restoredCounts;
    });

    console.log('Database restore completed successfully:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database restored successfully',
      restoredCounts: result
    });

  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json({ 
      error: 'Failed to restore backup: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
} 