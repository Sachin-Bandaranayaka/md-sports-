import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import { sendOverduePaymentReminders } from '@/utils/invoiceUtils';

// POST: Send payment reminders for all overdue invoices
export async function POST(req: NextRequest) {
    // Check for 'settings:manage' permission
    const permissionError = await requirePermission('settings:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const result = await sendOverduePaymentReminders();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message,
                data: {
                    successCount: result.successCount,
                    failedCount: result.failedCount
                }
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    message: result.message
                },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error sending payment reminders:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to send payment reminders' },
            { status: 500 }
        );
    }
} 