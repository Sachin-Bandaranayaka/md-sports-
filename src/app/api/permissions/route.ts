import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET handler for retrieving all permissions
 */
export async function GET() {
    try {
        const permissions = await prisma.permission.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Permissions retrieved successfully',
            data: permissions
        });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to retrieve permissions',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 