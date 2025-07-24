// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface AuditLogEntry {
  id?: number;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: number;
  details?: any;
  originalData?: any;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  canRecover?: boolean;
  recoveredAt?: Date;
  recoveredBy?: string;
  createdAt?: Date;
}

export interface RecycleBinItem {
  id: number;
  entity: string;
  entityId: number;
  originalData: any;
  deletedAt: Date;
  deletedBy: string;
  deletedByUser?: {
    id: string;
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
    userId: string, // Changed to string
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
      deletedBy: userId, // No toString needed
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
          deletedBy: details?.deletedBy || (item.userId as string),
          deletedByUser: undefined,
          canRecover: details?.canRecover || false,
        } as RecycleBinItem;
      });

    // Fetch user details for deletedBy users if any
    const userIds = Array.from(new Set(recycleBinItems.map((i) => i.deletedBy).filter(Boolean)));
    if (userIds.length) {
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: userIds.map((id) => id.toString()) },
        },
        select: { id: true, name: true, email: true },
      });
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      recycleBinItems.forEach((item) => {
        if (item.deletedBy && userMap[item.deletedBy]) {
          item.deletedByUser = userMap[item.deletedBy];
        }
      });
    }

    return {
      items: recycleBinItems,
      total,
    };
  }

  /**
   * Get paginated list of ALL audit entries (create/update/delete etc)
   */
  async getAuditEntries(
    entity?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: AuditLogEntry[]; total: number }> {
    const where: any = {};
    if (entity) {
      where.entity = entity;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items: items as AuditLogEntry[], total };
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
        recoveredBy: userId.toString(),
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
              paymentId: originalData.paymentId,
              receiptDate: originalData.receiptDate ? new Date(originalData.receiptDate) : new Date(),
              bankName: originalData.bankName,
              accountNumber: originalData.accountNumber,
              chequeNumber: originalData.chequeNumber,
              transactionId: originalData.transactionId,
              notes: originalData.notes,
              confirmedBy: originalData.confirmedBy,
            },
          });
          break;

        case 'user':
          restoredData = await this.prisma.user.create({
            data: {
              id: originalData.id,
              name: originalData.name,
              email: originalData.email,
              password: originalData.password,
              phone: originalData.phone,
              roleId: originalData.roleId,
              roleName: originalData.roleName,
              shopId: originalData.shopId,
              permissions: originalData.permissions,
              allowedAccounts: originalData.allowedAccounts,
              isActive: originalData.isActive ?? true,
            },
          });
          break;

        case 'shop':
          restoredData = await this.prisma.shop.create({
            data: {
              id: originalData.id,
              name: originalData.name,
              location: originalData.location,
              contact_person: originalData.contact_person,
              phone: originalData.phone,
              email: originalData.email,
              is_active: originalData.is_active ?? true,
              opening_time: originalData.opening_time,
              closing_time: originalData.closing_time,
              manager_id: originalData.manager_id,
              opening_date: originalData.opening_date ? new Date(originalData.opening_date) : null,
              status: originalData.status,
              address_line1: originalData.address_line1,
              address_line2: originalData.address_line2,
              city: originalData.city,
              state: originalData.state,
              postal_code: originalData.postal_code,
              country: originalData.country,
              latitude: originalData.latitude,
              longitude: originalData.longitude,
              tax_rate: originalData.tax_rate,
            },
          });
          break;

        case 'inventoryitem':
          restoredData = await this.prisma.inventoryItem.create({
            data: {
              productId: originalData.productId,
              shopId: originalData.shopId,
              quantity: originalData.quantity,
              shopSpecificCost: originalData.shopSpecificCost,
              minStockLevel: originalData.minStockLevel,
              maxStockLevel: originalData.maxStockLevel,
            },
          });
          break;

        case 'inventorytransfer':
          restoredData = await this.prisma.inventoryTransfer.create({
            data: {
              fromShopId: originalData.fromShopId,
              toShopId: originalData.toShopId,
              fromUserId: originalData.fromUserId,
              toUserId: originalData.toUserId,
              status: originalData.status || 'pending',
              notes: originalData.notes,
            },
          });
          break;

        case 'purchaseinvoice':
          restoredData = await this.prisma.purchaseInvoice.create({
            data: {
              invoiceNumber: originalData.invoiceNumber,
              supplierId: originalData.supplierId,
              total: originalData.total,
              status: originalData.status,
              distributions: originalData.distributions,
              date: originalData.date ? new Date(originalData.date) : null,
              dueDate: originalData.dueDate ? new Date(originalData.dueDate) : null,
            },
          });
          break;

        case 'payment':
          restoredData = await this.prisma.payment.create({
            data: {
              invoiceId: originalData.invoiceId,
              customerId: originalData.customerId,
              amount: originalData.amount,
              paymentMethod: originalData.paymentMethod,
              referenceNumber: originalData.referenceNumber,
              accountId: originalData.accountId,
            },
          });
          break;

        case 'notification':
          restoredData = await this.prisma.notification.create({
            data: {
              userId: originalData.userId,
              title: originalData.title,
              message: originalData.message,
              isRead: originalData.isRead ?? false,
            },
          });
          break;

        case 'systemsettings':
          restoredData = await this.prisma.systemSettings.create({
            data: {
              key: originalData.key,
              value: originalData.value,
              description: originalData.description,
            },
          });
          break;

        case 'account':
          restoredData = await this.prisma.account.create({
            data: {
              name: originalData.name,
              type: originalData.type,
              balance: originalData.balance,
              description: originalData.description,
              isActive: originalData.isActive ?? true,
              parentId: originalData.parentId,
            },
          });
          break;

        case 'transaction':
          restoredData = await this.prisma.transaction.create({
            data: {
              date: originalData.date ? new Date(originalData.date) : new Date(),
              description: originalData.description,
              accountId: originalData.accountId,
              toAccountId: originalData.toAccountId,
              type: originalData.type,
              amount: originalData.amount,
              reference: originalData.reference,
              category: originalData.category,
            },
          });
          break;

        case 'quotation':
          restoredData = await this.prisma.quotation.create({
            data: {
              quotationNumber: originalData.quotationNumber,
              customerId: originalData.customerId,
              total: originalData.total,
              validUntil: originalData.validUntil ? new Date(originalData.validUntil) : null,
              shopId: originalData.shopId,
            },
          });
          break;

        case 'invoice':
          restoredData = await this.prisma.invoice.create({
            data: {
              invoiceNumber: originalData.invoiceNumber,
              customerId: originalData.customerId,
              total: originalData.total,
              discountType: originalData.discountType,
              discountValue: originalData.discountValue,
              totalProfit: originalData.totalProfit,
              profitMargin: originalData.profitMargin,
              status: originalData.status,
              paymentMethod: originalData.paymentMethod,
              invoiceDate: originalData.invoiceDate ? new Date(originalData.invoiceDate) : null,
              dueDate: originalData.dueDate ? new Date(originalData.dueDate) : null,
              notes: originalData.notes,
              shopId: originalData.shopId,
              createdBy: originalData.createdBy,
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
    // Permanently remove audit log entries (DELETE actions)
    await this.prisma.auditLog.deleteMany({
      where: {
        id: { in: auditLogIds },
        action: 'DELETE',
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