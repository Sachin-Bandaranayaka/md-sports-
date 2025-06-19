import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface AuditLogEntry {
  id?: number;
  userId?: number;
  action: string;
  entity: string;
  entityId?: number;
  details?: any;
  originalData?: any;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: number;
  canRecover?: boolean;
  recoveredAt?: Date;
  recoveredBy?: number;
  createdAt?: Date;
}

export interface RecycleBinItem {
  id: number;
  entity: string;
  entityId: number;
  originalData: any;
  deletedAt: Date;
  deletedBy: number;
  deletedByUser?: {
    id: number;
    name: string;
    email: string;
  };
  canRecover: boolean;
}

export class AuditService {
  private static instance: AuditService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = prisma;
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Log an audit entry
   */
  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      // Prepare details object with all the additional information
      const details = {
        ...entry.details,
        originalData: entry.originalData,
        isDeleted: entry.isDeleted || false,
        deletedAt: entry.deletedAt,
        deletedBy: entry.deletedBy,
        canRecover: entry.canRecover || false,
        recoveredAt: entry.recoveredAt,
        recoveredBy: entry.recoveredBy,
      };

      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          details: details,
        },
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Soft delete an entity and log it
   */
  async softDelete(
    entity: string,
    entityId: number,
    originalData: any,
    userId: number,
    canRecover: boolean = true
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'DELETE',
      entity,
      entityId,
      originalData,
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      canRecover,
      details: {
        type: 'soft_delete',
        recoverable: canRecover,
      },
    });
  }

  /**
   * Get recycle bin items (deleted items that can be recovered)
   */
  async getRecycleBinItems(
    entity?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: RecycleBinItem[]; total: number }> {
    const where = {
      action: 'DELETE',
      ...(entity && { entity }),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Filter and map items that are deleted and recoverable
    const recycleBinItems = items
      .filter((item) => {
        const details = item.details as any;
        return details?.isDeleted && details?.canRecover && !details?.recoveredAt;
      })
      .map((item) => {
        const details = item.details as any;
        return {
          id: item.id,
          entity: item.entity,
          entityId: item.entityId!,
          originalData: details?.originalData,
          deletedAt: details?.deletedAt ? new Date(details.deletedAt) : item.createdAt,
          deletedBy: details?.deletedBy || item.userId!,
          deletedByUser: undefined, // We'll need to fetch this separately if needed
          canRecover: details?.canRecover || false,
        };
      });

    return {
      items: recycleBinItems,
      total,
    };
  }

  /**
   * Recover a deleted item
   */
  async recoverItem(
    auditLogId: number,
    userId: number
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const auditEntry = await this.prisma.auditLog.findUnique({
        where: { id: auditLogId },
      });

      if (!auditEntry) {
        return { success: false, message: 'Audit entry not found' };
      }

      const details = auditEntry.details as any;
      if (!details?.isDeleted || !details?.canRecover || details?.recoveredAt) {
        return { success: false, message: 'Item cannot be recovered' };
      }

      // Restore the data based on entity type
      const restoredData = await this.restoreEntityData(
        auditEntry.entity,
        details.originalData
      );

      if (!restoredData.success) {
        return restoredData;
      }

      // Mark as recovered by updating the details
      const updatedDetails = {
        ...details,
        recoveredAt: new Date(),
        recoveredBy: userId,
      };

      await this.prisma.auditLog.update({
        where: { id: auditLogId },
        data: {
          details: updatedDetails,
        },
      });

      // Log the recovery action
      await this.logAction({
        userId,
        action: 'RECOVER',
        entity: auditEntry.entity,
        entityId: restoredData.data?.id,
        details: {
          type: 'recovery',
          originalAuditLogId: auditLogId,
          recoveredData: restoredData.data,
        },
      });

      return {
        success: true,
        message: 'Item recovered successfully',
        data: restoredData.data,
      };
    } catch (error) {
      console.error('Failed to recover item:', error);
      return { success: false, message: 'Failed to recover item' };
    }
  }

  /**
   * Restore entity data based on entity type
   */
  private async restoreEntityData(
    entity: string,
    originalData: any
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      let restoredData;

      switch (entity.toLowerCase()) {
        case 'product':
          restoredData = await this.prisma.product.create({
            data: {
              name: originalData.name,
              description: originalData.description,
              price: originalData.price,
              cost: originalData.cost,
              sku: originalData.sku,
              barcode: originalData.barcode,
              categoryId: originalData.categoryId,
              supplierId: originalData.supplierId,
              minStockLevel: originalData.minStockLevel,
              maxStockLevel: originalData.maxStockLevel,
              unit: originalData.unit,
              weight: originalData.weight,
              dimensions: originalData.dimensions,
              isActive: originalData.isActive ?? true,
            },
          });
          break;

        case 'customer':
          restoredData = await this.prisma.customer.create({
            data: {
              name: originalData.name,
              email: originalData.email,
              phone: originalData.phone,
              address: originalData.address,
              city: originalData.city,
              postalCode: originalData.postalCode,
              country: originalData.country,
              taxNumber: originalData.taxNumber,
              creditLimit: originalData.creditLimit,
              paymentTerms: originalData.paymentTerms,
              isActive: originalData.isActive ?? true,
            },
          });
          break;

        case 'supplier':
          restoredData = await this.prisma.supplier.create({
            data: {
              name: originalData.name,
              email: originalData.email,
              phone: originalData.phone,
              address: originalData.address,
              city: originalData.city,
              postalCode: originalData.postalCode,
              country: originalData.country,
              taxNumber: originalData.taxNumber,
              paymentTerms: originalData.paymentTerms,
              isActive: originalData.isActive ?? true,
            },
          });
          break;

        case 'category':
          restoredData = await this.prisma.category.create({
            data: {
              name: originalData.name,
              description: originalData.description,
              isActive: originalData.isActive ?? true,
            },
          });
          break;

        case 'receipt':
          restoredData = await this.prisma.receipt.create({
            data: {
              receiptNumber: originalData.receiptNumber,
              amount: originalData.amount,
              paymentId: originalData.paymentId,
              issuedAt: originalData.issuedAt,
              notes: originalData.notes,
            },
          });
          break;

        default:
          return {
            success: false,
            message: `Recovery not supported for entity type: ${entity}`,
          };
      }

      return {
        success: true,
        message: 'Entity restored successfully',
        data: restoredData,
      };
    } catch (error) {
      console.error(`Failed to restore ${entity}:`, error);
      return {
        success: false,
        message: `Failed to restore ${entity}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get audit history for an entity
   */
  async getEntityHistory(
    entity: string,
    entityId: number,
    limit: number = 20
  ): Promise<AuditLogEntry[]> {
    const entries = await this.prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deletedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recoveredByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return entries;
  }

  /**
   * Permanently delete items from recycle bin
   */
  async permanentlyDelete(auditLogIds: number[]): Promise<void> {
    await this.prisma.auditLog.updateMany({
      where: {
        id: { in: auditLogIds },
        isDeleted: true,
      },
      data: {
        canRecover: false,
      },
    });
  }

  /**
   * Clean up old deleted items (older than specified days)
   */
  async cleanupOldDeletedItems(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.auditLog.updateMany({
      where: {
        isDeleted: true,
        canRecover: true,
        deletedAt: {
          lt: cutoffDate,
        },
      },
      data: {
        canRecover: false,
      },
    });

    return result.count;
  }

  /**
   * Get IDs of soft-deleted entities for a specific entity type
   */
  async getDeletedEntityIds(entity: string): Promise<number[]> {
    try {
      const deletedEntries = await this.prisma.auditLog.findMany({
        where: {
          entity,
          action: 'DELETE',
        },
        select: {
          entityId: true,
          details: true,
        },
      });

      // Filter for items that are deleted and not recovered
      const deletedIds = deletedEntries
        .filter((entry) => {
          const details = entry.details as any;
          return details?.isDeleted && !details?.recoveredAt;
        })
        .map((entry) => entry.entityId!)
        .filter((id) => id !== null);

      return deletedIds;
    } catch (error) {
      console.error(`Error getting deleted entity IDs for ${entity}:`, error);
      return [];
    }
  }
}

export const auditService = AuditService.getInstance();