import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import { smsService } from '@/services/smsService';

// POST: Send an invoice notification
export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { invoiceId } = data;

        // Validate input
        if (!invoiceId) {
            return NextResponse.json(
                { success: false, message: 'Invoice ID is required' },
                { status: 400 }
            );
        }

        // Initialize SMS service if needed
        await smsService.init();

        // Check if SMS service is configured
        if (!smsService.isConfigured()) {
            return NextResponse.json(
                { success: false, message: 'SMS service is not configured or is disabled' },
                { status: 400 }
            );
        }

        // Send invoice notification
        const response = await smsService.sendInvoiceNotification(invoiceId);

        if (response.status >= 200 && response.status < 300) {
            return NextResponse.json({
                success: true,
                message: 'Invoice notification sent successfully',
                data: response.data
            });
        } else {
            return NextResponse.json(
                { success: false, message: response.message },
                { status: response.status }
            );
        }
    } catch (error) {
        console.error('Error sending invoice notification:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to send invoice notification' },
            { status: 500 }
        );
    }
} 