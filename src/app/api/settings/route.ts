import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/utils/middleware';

// GET: Retrieve all system settings
export async function GET(req: NextRequest) {
    // Check for 'settings:manage' permission
    const permissionError = await requirePermission('settings:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const settings = await prisma.systemSettings.findMany();

        return NextResponse.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

// POST: Create or update system settings
export async function POST(req: NextRequest) {
    // Check for 'settings:manage' permission
    const permissionError = await requirePermission('settings:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const data = await req.json();
        const { key, value, description } = data;

        // Validate input
        if (!key || value === undefined) {
            return NextResponse.json(
                { success: false, message: 'Key and value are required' },
                { status: 400 }
            );
        }

        // Check if setting exists
        const existingSetting = await prisma.systemSettings.findUnique({
            where: { key }
        });

        let setting;
        if (existingSetting) {
            // Update existing setting
            setting = await prisma.systemSettings.update({
                where: { key },
                data: {
                    value,
                    description: description || existingSetting.description
                }
            });
        } else {
            // Create new setting
            setting = await prisma.systemSettings.create({
                data: {
                    key,
                    value,
                    description
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: existingSetting ? 'Setting updated successfully' : 'Setting created successfully',
            setting
        });
    } catch (error) {
        console.error('Error saving setting:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to save setting' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a system setting
export async function DELETE(req: NextRequest) {
    // Check for 'settings:manage' permission
    const permissionError = await requirePermission('settings:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json(
                { success: false, message: 'Key parameter is required' },
                { status: 400 }
            );
        }

        await prisma.systemSettings.delete({
            where: { key }
        });

        return NextResponse.json({
            success: true,
            message: 'Setting deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting setting:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete setting' },
            { status: 500 }
        );
    }
} 