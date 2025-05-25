import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/utils/middleware';

// GET: Retrieve all system settings or a specific setting by key
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        // If key is provided, return just that setting (no permission check for specific key)
        if (key) {
            console.log(`Fetching specific setting: ${key}`);
            const setting = await prisma.systemSettings.findUnique({
                where: { key }
            });

            if (!setting) {
                console.log(`Setting not found: ${key}`);
                return NextResponse.json({
                    success: false,
                    message: 'Setting not found'
                }, { status: 404 });
            }

            console.log(`Setting found: ${key}, value length: ${setting.value?.length || 0}`);
            return NextResponse.json({
                success: true,
                setting
            });
        }

        // If fetching all settings, require permission
        const permissionError = await requirePermission('settings:manage')(req);
        if (permissionError) {
            return permissionError;
        }

        // Otherwise return all settings
        console.log('Fetching all settings');
        const settings = await prisma.systemSettings.findMany();
        console.log(`Found ${settings.length} settings`);

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
        console.error('Permission denied for settings:manage');
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

        console.log(`Saving setting: ${key}, value length: ${value?.length || 0}`);

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
            console.log(`Updated setting: ${key}`);
        } else {
            // Create new setting
            setting = await prisma.systemSettings.create({
                data: {
                    key,
                    value,
                    description
                }
            });
            console.log(`Created new setting: ${key}`);
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