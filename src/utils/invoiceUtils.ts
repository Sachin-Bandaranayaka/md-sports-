import { prisma } from '@/lib/prisma';
import { smsService } from '@/services/smsService';

/**
 * Find all overdue invoices
 * @returns Array of overdue invoices
 */
export async function findOverdueInvoices() {
    try {
        const today = new Date();

        // Find invoices that are past due date and not fully paid
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                dueDate: {
                    lt: today
                },
                paymentStatus: {
                    not: 'paid'
                }
            },
            include: {
                customer: true
            }
        });

        return overdueInvoices;
    } catch (error) {
        console.error('Error finding overdue invoices:', error);
        throw error;
    }
}

/**
 * Send payment reminders for all overdue invoices
 * @returns Object with success count and failed count
 */
export async function sendOverduePaymentReminders() {
    try {
        // Initialize SMS service
        await smsService.init();

        // Check if SMS service is configured
        if (!smsService.isConfigured()) {
            console.warn('SMS service is not configured or disabled');
            return {
                success: false,
                message: 'SMS service is not configured or disabled',
                successCount: 0,
                failedCount: 0
            };
        }

        // Find overdue invoices
        const overdueInvoices = await findOverdueInvoices();

        if (overdueInvoices.length === 0) {
            return {
                success: true,
                message: 'No overdue invoices found',
                successCount: 0,
                failedCount: 0
            };
        }

        // Send reminders
        let successCount = 0;
        let failedCount = 0;

        for (const invoice of overdueInvoices) {
            try {
                const result = await smsService.sendPaymentReminder(invoice.id);

                if (result.status >= 200 && result.status < 300) {
                    successCount++;
                } else {
                    failedCount++;
                }
            } catch (error) {
                console.error(`Error sending reminder for invoice ${invoice.id}:`, error);
                failedCount++;
            }
        }

        return {
            success: true,
            message: `Sent ${successCount} payment reminders (${failedCount} failed)`,
            successCount,
            failedCount
        };
    } catch (error) {
        console.error('Error sending payment reminders:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            successCount: 0,
            failedCount: 0
        };
    }
} 