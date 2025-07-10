/**
 * Batch Transfer Operations API
 * Handles multiple transfer operations efficiently with transaction safety
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { transferCacheService } from '@/lib/transferCache';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const batchCompleteSchema = z.object({
  transferIds: z.array(z.number().positive()).min(1).max(50), // Limit batch size
  action: z.literal('complete')
});

const batchCancelSchema = z.object({
  transferIds: z.array(z.number().positive()).min(1).max(50),
  action: z.literal('cancel')
});

const batchCreateSchema = z.object({
  transfers: z.array(z.object({
    sourceShopId: z.number().positive(),
    destinationShopId: z.number().positive(),
    items: z.array(z.object({
      productId: z.number().positive(),
      quantity: z.number().positive()
    })).min(1)
  })).min(1).max(20) // Limit batch size
});

type BatchCompleteRequest = z.infer<typeof batchCompleteSchema>;
type BatchCancelRequest = z.infer<typeof batchCancelSchema>;
type BatchCreateRequest = z.infer<typeof batchCreateSchema>;

// Helper function to calculate weighted average cost
const calculateWeightedAverageCost = (
  currentQuantity: number,
  currentCost: number,
  addedQuantity: number,
  addedCost: number
): number => {
  if (currentQuantity + addedQuantity === 0) return 0;

  const totalValue = (currentQuantity * currentCost) + (addedQuantity * addedCost);
  const totalQuantity = currentQuantity + addedQuantity;

  return totalValue / totalQuantity;
};

// Batch complete transfers
const batchCompleteTransfers = async (transferIds: number[], userId: number) => {
  const results: { id: number; success: boolean; error?: string }[] = [];
  const affectedShopIds = new Set<number>();
  const affectedProductIds = new Set<number>();

  await prisma.$transaction(async (tx) => {
    // Fetch all transfers with their items in one query
    const transfers = await tx.inventoryTransfer.findMany({
      where: {
        id: { in: transferIds },
        status: 'pending'
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        sourceShop: true,
        destinationShop: true
      }
    });

    // Validate permissions for all transfers
    for (const transfer of transfers) {
      const hasPermission = await tx.userShop.findFirst({
        where: {
          userId,
          shopId: { in: [transfer.sourceShopId, transfer.destinationShopId] }
        }
      });

      if (!hasPermission) {
        results.push({
          id: transfer.id,
          success: false,
          error: 'Insufficient permissions'
        });
        continue;
      }

      try {
        // Process each transfer item
        for (const item of transfer.items) {
          // If we ever switch back to the old behaviour we can flip this flag.
          const APPLY_SOURCE_DECREMENT = false;

          if (APPLY_SOURCE_DECREMENT) {
            // Update source inventory (decrease)
            await tx.inventoryItem.update({
              where: {
                productId_shopId: {
                  productId: item.productId,
                  shopId: transfer.sourceShopId
                }
              },
              data: {
                quantity: { decrement: item.quantity }
              }
            });
          }

          // Find or create destination inventory
          const destinationInventory = await tx.inventoryItem.findUnique({
            where: {
              productId_shopId: {
                productId: item.productId,
                shopId: transfer.destinationShopId
              }
            }
          });

          if (destinationInventory) {
            // Calculate new shop-specific WAC
            const newShopSpecificCost = calculateWeightedAverageCost(
              destinationInventory.quantity,
              parseFloat(destinationInventory.shopSpecificCost),
              item.quantity,
              parseFloat(item.product.weightedAverageCost)
            );

            // Update existing inventory
            await tx.inventoryItem.update({
              where: {
                productId_shopId: {
                  productId: item.productId,
                  shopId: transfer.destinationShopId
                }
              },
              data: {
                quantity: { increment: item.quantity },
                shopSpecificCost: newShopSpecificCost.toFixed(2)
              }
            });
          } else {
            // Create new inventory item
            await tx.inventoryItem.create({
              data: {
                productId: item.productId,
                shopId: transfer.destinationShopId,
                quantity: item.quantity,
                shopSpecificCost: item.product.weightedAverageCost
              }
            });
          }

          affectedShopIds.add(transfer.sourceShopId);
          affectedShopIds.add(transfer.destinationShopId);
          affectedProductIds.add(item.productId);
        }

        // Mark transfer as completed
        await tx.inventoryTransfer.update({
          where: { id: transfer.id },
          data: {
            status: 'completed',
            completedAt: new Date()
          }
        });

        results.push({ id: transfer.id, success: true });
      } catch (error) {
        results.push({
          id: transfer.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Batch update global WAC for all affected products
    for (const productId of affectedProductIds) {
      const allInventories = await tx.inventoryItem.findMany({
        where: {
          productId,
          quantity: { gt: 0 }
        }
      });

      if (allInventories.length > 0) {
        let totalValue = 0;
        let totalQuantity = 0;

        for (const inventory of allInventories) {
          totalValue += inventory.quantity * parseFloat(inventory.shopSpecificCost);
          totalQuantity += inventory.quantity;
        }

        const newGlobalWAC = totalQuantity > 0 ? totalValue / totalQuantity : 0;

        await tx.product.update({
          where: { id: productId },
          data: { weightedAverageCost: newGlobalWAC.toFixed(2) }
        });
      }
    }
  });

  // Invalidate cache for affected shops
  await transferCacheService.invalidateTransferCache(undefined, Array.from(affectedShopIds));

  return results;
};

// Batch cancel transfers
const batchCancelTransfers = async (transferIds: number[], userId: number) => {
  const results: { id: number; success: boolean; error?: string }[] = [];

  await prisma.$transaction(async (tx) => {
    const transfers = await tx.inventoryTransfer.findMany({
      where: {
        id: { in: transferIds },
        status: 'pending'
      },
      include: {
        sourceShop: true,
        destinationShop: true
      }
    });

    for (const transfer of transfers) {
      // Check permissions
      const hasPermission = await tx.userShop.findFirst({
        where: {
          userId,
          shopId: { in: [transfer.sourceShopId, transfer.destinationShopId] }
        }
      });

      if (!hasPermission) {
        results.push({
          id: transfer.id,
          success: false,
          error: 'Insufficient permissions'
        });
        continue;
      }

      try {
        await tx.inventoryTransfer.update({
          where: { id: transfer.id },
          data: {
            status: 'cancelled',
            completedAt: new Date()
          }
        });

        results.push({ id: transfer.id, success: true });
      } catch (error) {
        results.push({
          id: transfer.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Invalidate transfer cache
  await transferCacheService.invalidateTransferCache();

  return results;
};

// Batch create transfers
const batchCreateTransfers = async (transfers: BatchCreateRequest['transfers'], userId: number) => {
  const results: { success: boolean; transferId?: number; error?: string }[] = [];
  const affectedShopIds = new Set<number>();

  await prisma.$transaction(async (tx) => {
    for (const transferData of transfers) {
      try {
        // Validate permissions
        const hasPermission = await tx.userShop.findFirst({
          where: {
            userId,
            shopId: { in: [transferData.sourceShopId, transferData.destinationShopId] }
          }
        });

        if (!hasPermission) {
          results.push({
            success: false,
            error: 'Insufficient permissions for one or both shops'
          });
          continue;
        }

        // Validate inventory availability
        for (const item of transferData.items) {
          const inventory = await tx.inventoryItem.findUnique({
            where: {
              productId_shopId: {
                productId: item.productId,
                shopId: transferData.sourceShopId
              }
            }
          });

          if (!inventory || inventory.quantity < item.quantity) {
            results.push({
              success: false,
              error: `Insufficient inventory for product ${item.productId}`
            });
            continue;
          }
        }

        // Create transfer
        const transfer = await tx.inventoryTransfer.create({
          data: {
            sourceShopId: transferData.sourceShopId,
            destinationShopId: transferData.destinationShopId,
            initiatedBy: userId,
            status: 'pending'
          }
        });

        // Create transfer items
        await tx.transferItem.createMany({
          data: transferData.items.map(item => ({
            transferId: transfer.id,
            productId: item.productId,
            quantity: item.quantity
          }))
        });

        affectedShopIds.add(transferData.sourceShopId);
        affectedShopIds.add(transferData.destinationShopId);

        results.push({
          success: true,
          transferId: transfer.id
        });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Invalidate cache for affected shops
  await transferCacheService.invalidateTransferCache(undefined, Array.from(affectedShopIds));

  return results;
};

// POST handler for batch operations
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    let results;

    switch (action) {
      case 'complete': {
        const validatedData = batchCompleteSchema.parse(body);
        results = await batchCompleteTransfers(validatedData.transferIds, decoded.userId);
        break;
      }
      case 'cancel': {
        const validatedData = batchCancelSchema.parse(body);
        results = await batchCancelTransfers(validatedData.transferIds, decoded.userId);
        break;
      }
      case 'create': {
        const validatedData = batchCreateSchema.parse(body);
        results = await batchCreateTransfers(validatedData.transfers, decoded.userId);
        break;
      }
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Must be "complete", "cancel", or "create"' },
          { status: 400 }
        );
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        }
      }
    });
  } catch (error) {
    console.error('Batch transfer operation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET handler for batch operation status
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transferIds = searchParams.get('ids')?.split(',').map(Number) || [];

    if (transferIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Transfer IDs required' },
        { status: 400 }
      );
    }

    const transfers = await prisma.inventoryTransfer.findMany({
      where: {
        id: { in: transferIds }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        completedAt: true,
        sourceShop: { select: { name: true } },
        destinationShop: { select: { name: true } },
        _count: {
          select: { items: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: transfers.map(transfer => ({
        id: transfer.id,
        status: transfer.status,
        createdAt: transfer.createdAt,
        completedAt: transfer.completedAt,
        sourceShopName: transfer.sourceShop.name,
        destinationShopName: transfer.destinationShop.name,
        itemCount: transfer._count.items
      }))
    });
  } catch (error) {
    console.error('Batch transfer status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}