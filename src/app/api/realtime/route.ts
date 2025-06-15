/**
 * Real-time updates API for Vercel serverless deployment
 * Replaces Socket.IO with polling-based approach
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache-vercel';
import { validateTokenPermission, getUserIdFromToken, getShopIdFromToken } from '@/lib/auth';

// Vercel serverless optimizations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

// Real-time data types
interface RealtimeUpdate {
  type: 'inventory' | 'invoice' | 'transfer' | 'notification' | 'purchase' | 'supplier';
  data: any;
  timestamp: number;
  shopId?: string;
}

// Cache keys for real-time updates
const REALTIME_CACHE_KEYS = {
  UPDATES: 'realtime:updates',
  LAST_POLL: 'realtime:last_poll',
  NOTIFICATIONS: 'realtime:notifications'
};

// Get latest updates since last poll
export async function GET(request: NextRequest) {
  try {
    // Validate authentication - check for any view permission since realtime provides updates for multiple modules
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has any view permissions for the requested data types
    const url = new URL(request.url);
    const types = url.searchParams.get('types')?.split(',') || ['inventory', 'invoice', 'transfer', 'notification', 'supplier'];
    
    // Check permissions based on requested types
    let hasAnyPermission = false;
    for (const type of types) {
      let requiredPermission = '';
      switch (type) {
        case 'inventory':
          requiredPermission = 'inventory:view';
          break;
        case 'invoice':
        case 'sales':
          requiredPermission = 'sales:view';
          break;
        case 'purchase':
          requiredPermission = 'purchases:view';
          break;
        case 'transfer':
          requiredPermission = 'inventory:view'; // transfers are part of inventory
          break;
        case 'notification':
          requiredPermission = 'view_dashboard'; // notifications are general
          break;
        case 'supplier':
          requiredPermission = 'purchases:view'; // suppliers are part of purchases
          break;
        default:
          continue;
      }
      
      const hasPermission = await validateTokenPermission(request, requiredPermission);
      if (hasPermission.isValid) {
        hasAnyPermission = true;
        break;
      }
    }
    
    if (!hasAnyPermission) {
      return NextResponse.json(
        { error: 'Unauthorized - No view permissions for requested data types' },
        { status: 401 }
      );
    }

    const shopId = await getShopIdFromToken(request);
    const lastPoll = url.searchParams.get('lastPoll');

    const since = lastPoll ? parseInt(lastPoll) : Date.now() - 60000; // Default to last minute
    const updates: RealtimeUpdate[] = [];

    // Get inventory updates
    if (types.includes('inventory')) {
      const inventoryUpdates = await getInventoryUpdates(shopId, since);
      updates.push(...inventoryUpdates);
    }

    // Get invoice updates
    if (types.includes('invoice')) {
      const invoiceUpdates = await getInvoiceUpdates(shopId, since);
      updates.push(...invoiceUpdates);
    }

    // Get purchase invoice updates
    if (types.includes('purchase') || types.includes('invoice')) {
      const purchaseUpdates = await getPurchaseInvoiceUpdates(shopId, since);
      updates.push(...purchaseUpdates);
    }

    // Get transfer updates
    if (types.includes('transfer')) {
      const transferUpdates = await getTransferUpdates(shopId, since);
      updates.push(...transferUpdates);
    }

    // Get notifications
    if (types.includes('notification')) {
      const notifications = await getNotifications(userId, since);
      updates.push(...notifications);
    }

    // Get supplier updates
    if (types.includes('supplier')) {
      const supplierUpdates = await getSupplierUpdates(since);
      updates.push(...supplierUpdates);
    }

    // Sort by timestamp
    updates.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      updates,
      timestamp: Date.now(),
      hasMore: updates.length > 0
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Realtime API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Publish an update (called by other API routes)
export async function POST(request: NextRequest) {
  try {
    const hasPermission = await validateTokenPermission(request, 'write');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, data, shopId } = body;

    const update: RealtimeUpdate = {
      type,
      data,
      timestamp: Date.now(),
      shopId
    };

    // Store update in cache for polling clients
    const cacheKey = `${REALTIME_CACHE_KEYS.UPDATES}:${shopId || 'global'}`;
    const existingUpdates = await cache.get<RealtimeUpdate[]>(cacheKey) || [];
    
    // Keep only last 100 updates
    const updatedList = [update, ...existingUpdates].slice(0, 100);
    await cache.set(cacheKey, updatedList, 300); // 5 minutes TTL

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Realtime publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions to get updates from different sources
async function getInventoryUpdates(shopId: string | null, since: number): Promise<RealtimeUpdate[]> {
  try {
    const whereClause = {
      updatedAt: {
        gte: new Date(since)
      },
      ...(shopId && { shopId })
    };

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        updatedAt: true,
        shopId: true,
        inventoryItems: {
          select: {
            quantity: true
          }
        }
      },
      take: 20
    });

    return products.map(product => ({
      type: 'inventory' as const,
      data: {
        productId: product.id,
        name: product.name,
        quantity: product.inventoryItems.reduce((total, item) => total + item.quantity, 0),
        action: 'updated'
      },
      timestamp: product.updatedAt.getTime(),
      shopId: product.shopId || undefined
    }));
  } catch (error) {
    console.error('Error fetching inventory updates:', error);
    return [];
  }
}

async function getInvoiceUpdates(shopId: string | null, since: number): Promise<RealtimeUpdate[]> {
  try {
    const whereClause = {
      createdAt: {
        gte: new Date(since)
      },
      ...(shopId && { shopId })
    };

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        shopId: true
      },
      take: 10
    });

    return invoices.map(invoice => ({
      type: 'invoice' as const,
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        action: 'created'
      },
      timestamp: invoice.createdAt.getTime(),
      shopId: invoice.shopId || undefined
    }));
  } catch (error) {
    console.error('Error fetching invoice updates:', error);
    return [];
  }
}

async function getTransferUpdates(shopId: string | null, since: number): Promise<RealtimeUpdate[]> {
  try {
    const whereClause = {
      updatedAt: {
        gte: new Date(since)
      },
      ...(shopId && {
        OR: [
          { fromShopId: shopId },
          { toShopId: shopId }
        ]
      })
    };

    const transfers = await prisma.inventoryTransfer.findMany({
      where: whereClause,
      select: {
        id: true,
        status: true,
        fromShopId: true,
        toShopId: true,
        updatedAt: true
      },
      take: 10
    });

    return transfers.map(transfer => ({
      type: 'transfer' as const,
      data: {
        transferId: transfer.id,
        status: transfer.status,
        fromShopId: transfer.fromShopId,
        toShopId: transfer.toShopId,
        action: 'updated'
      },
      timestamp: transfer.updatedAt.getTime(),
      shopId: shopId || undefined
    }));
  } catch (error) {
    console.error('Error fetching transfer updates:', error);
    return [];
  }
}

async function getPurchaseInvoiceUpdates(shopId: string | null, since: number): Promise<RealtimeUpdate[]> {
  try {
    const whereClause = {
      OR: [
        {
          createdAt: {
            gte: new Date(since)
          }
        },
        {
          updatedAt: {
            gte: new Date(since)
          }
        }
      ],
      ...(shopId && { shopId })
    };

    const purchaseInvoices = await prisma.purchaseInvoice.findMany({
      where: whereClause,
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        shopId: true,
        supplier: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    return purchaseInvoices.map(invoice => ({
      type: 'purchase' as const,
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        status: invoice.status,
        supplierName: invoice.supplier?.name,
        action: invoice.createdAt.getTime() >= since ? 'created' : 'updated'
      },
      timestamp: Math.max(invoice.createdAt.getTime(), invoice.updatedAt.getTime()),
      shopId: invoice.shopId || undefined
    }));
  } catch (error) {
    console.error('Error fetching purchase invoice updates:', error);
    return [];
  }
}

async function getNotifications(userId: number, since: number): Promise<RealtimeUpdate[]> {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(since)
        }
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true
      },
      take: 10
    });

    return notifications.map(notification => ({
      type: 'notification' as const,
      data: {
        notificationId: notification.id,
        title: notification.title,
        message: notification.message,
        notificationType: notification.type,
        isRead: notification.isRead,
        action: 'created'
      },
      timestamp: notification.createdAt.getTime()
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

async function getSupplierUpdates(since: number): Promise<RealtimeUpdate[]> {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        OR: [
          {
            createdAt: {
              gte: new Date(since)
            }
          },
          {
            updatedAt: {
              gte: new Date(since)
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    return suppliers.map(supplier => ({
      type: 'supplier' as const,
      data: {
        supplierId: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        action: supplier.createdAt.getTime() >= since ? 'created' : 'updated'
      },
      timestamp: Math.max(supplier.createdAt.getTime(), supplier.updatedAt.getTime())
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}