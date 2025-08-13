import prisma from '@/lib/prisma';
import { AuditService } from './auditService';

export interface DeletedInvoiceResult {
  id: number;
  customerId?: number | null;
  invoiceNumber?: string | null;
  shopId?: string | null;
}

/**
 * Delete an invoice and related records inside a single transaction.
 * Returns a lightweight object with useful metadata for further follow-up
 * (cache invalidation, notifications, etc.).
 */
export async function deleteInvoice(invoiceId: number, userId: number): Promise<DeletedInvoiceResult> {
  return await prisma.$transaction(async (tx) => {
    const auditService = AuditService.getInstance();
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { 
        items: true, 
        customer: true,
        payments: {
          include: {
            receipt: true
          }
        }
      }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    await auditService.softDelete('Invoice', invoiceId, invoice, String(userId), true);

    // Delete receipts first (they reference payments)
    if (invoice.payments.length > 0) {
      for (const payment of invoice.payments) {
        if (payment.receipt) {
          await tx.receipt.delete({ where: { id: payment.receipt.id } });
        }
      }
    }

    // Delete payments (they reference the invoice)
    await tx.payment.deleteMany({ where: { invoiceId } });

    // Adjust inventory
    if (invoice.items.length > 0) {
      for (const item of invoice.items) {
        await tx.inventoryItem.updateMany({
          where: { productId: item.productId, ...(invoice.shopId && { shopId: invoice.shopId }) },
          data: { quantity: { increment: item.quantity } }
        });
      }
    }

    // Delete invoice items
    await tx.invoiceItem.deleteMany({ where: { invoiceId } });
    
    // Finally delete the invoice
    await tx.invoice.delete({ where: { id: invoiceId } });

    return {
      id: invoiceId,
      customerId: invoice.customerId,
      invoiceNumber: invoice.invoiceNumber,
      shopId: invoice.shopId
    };
  });
}