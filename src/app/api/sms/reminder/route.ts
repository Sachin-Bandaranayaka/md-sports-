import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import { smsService } from '@/services/smsService';

// POST: Send a payment reminder
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

        // Send payment reminder
        const response = await smsService.sendPaymentReminder(invoiceId);

        if (response.status >= 200 && response.status < 300) {
            return NextResponse.json({
                success: true,
                message: 'Payment reminder sent successfully',
                data: response.data
            });
        } else {
            return NextResponse.json(
                { success: false, message: response.message },
                { status: response.status }
            );
        }
    } catch (error) {
        console.error('Error sending payment reminder:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to send payment reminder' },
            { status: 500 }
        );
    }
} 