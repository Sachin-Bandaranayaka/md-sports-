import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        // Get the Deepseek API key setting
        const apiKeySetting = await prisma.systemSettings.findUnique({
            where: { key: 'deepseek_api_key' }
        });

        // Check if setting exists
        if (!apiKeySetting) {
            return NextResponse.json({
                success: false,
                message: 'Deepseek API key setting not found',
                exists: false
            });
        }

        // Return information about the setting
        return NextResponse.json({
            success: true,
            message: 'Deepseek API key setting found',
            exists: true,
            isEmpty: !apiKeySetting.value || apiKeySetting.value.trim() === '',
            valueLength: apiKeySetting.value?.length || 0,
            firstFourChars: apiKeySetting.value ? apiKeySetting.value.substring(0, 4) : null,
            lastUpdated: apiKeySetting.updatedAt
        });
    } catch (error) {
        console.error('Error testing settings:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to test settings',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 