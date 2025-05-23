import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/utils/middleware';
import { smsService } from '@/services/smsService';

// POST: Send a custom SMS message
export async function POST(req: NextRequest) {
    // Check for 'settings:manage' permission
    const permissionError = await requirePermission('settings:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const data = await req.json();
        const { to, message } = data;

        // Validate input
        if (!to || !message) {
            return NextResponse.json(
                { success: false, message: 'Recipient phone number and message are required' },
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

        // Send SMS
        const response = await smsService.sendSMS({ to, message });

        if (response.status >= 200 && response.status < 300) {
            return NextResponse.json({
                success: true,
                message: 'SMS sent successfully',
                data: response.data
            });
        } else {
            return NextResponse.json(
                { success: false, message: response.message },
                { status: response.status }
            );
        }
    } catch (error) {
        console.error('Error sending SMS:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to send SMS' },
            { status: 500 }
        );
    }
} 