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
      users: await prisma.user.findMany(),
      products: await prisma.product.findMany(),
      shops: await prisma.shop.findMany(),
      inventoryItems: await prisma.inventoryItem.findMany(),
      invoices: await prisma.invoice.findMany(),
      customers: await prisma.customer.findMany(),
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