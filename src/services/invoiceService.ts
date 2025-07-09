import prisma from '@/lib/prisma';

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
export async function deleteInvoice(invoiceId: number): Promise<DeletedInvoiceResult> {
  return prisma.$transaction(async (tx) => {
    const invoiceToDelete = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!invoiceToDelete) {
      throw new Error('Invoice not found for deletion');
    }

    // Adjust inventory for each item removed from the invoice.
    if (invoiceToDelete.items && invoiceToDelete.items.length > 0) {
      for (const item of invoiceToDelete.items) {
        const targetShopId: string | undefined = invoiceToDelete.shopId || undefined;

        await tx.inventoryItem.updateMany({
          where: {
            productId: item.productId,
            ...(targetShopId && { shopId: targetShopId }),
          },
          data: { quantity: { increment: item.quantity } },
        });
      }
    }

    // Cascade delete payments first
    await tx.payment.deleteMany({ where: { invoiceId } });
    await tx.invoiceItem.deleteMany({ where: { invoiceId } });

    await tx.invoice.delete({ where: { id: invoiceId } });

    return {
      id: invoiceId,
      customerId: invoiceToDelete.customerId,
      invoiceNumber: invoiceToDelete.invoiceNumber,
      shopId: invoiceToDelete.shopId,
    };
  });
} 