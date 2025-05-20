import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET: Fetch all roles
 */
export async function GET() {
    try {
        const roles = await prisma.role.findMany({
            include: {
                permissions: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Roles retrieved successfully',
            data: roles
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to retrieve roles',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * POST: Create a new role
 */
export async function POST(request: Request) {
    try {
        const { name, description, permissions } = await request.json();

        // Validate required fields
        if (!name) {
            return NextResponse.json({
                success: false,
                message: 'Role name is required'
            }, { status: 400 });
        }

        // Check if role already exists
        const existingRole = await prisma.role.findUnique({
            where: { name }
        });

        if (existingRole) {
            return NextResponse.json({
                success: false,
                message: 'Role with this name already exists'
            }, { status: 409 });
        }

        // Create the role with permissions if provided
        const role = await prisma.role.create({
            data: {
                name,
                description,
                ...(permissions && permissions.length > 0 && {
                    permissions: {
                        connect: permissions.map((id: number) => ({ id }))
                    }
                })
            },
            include: {
                permissions: true
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Role created successfully',
            data: role
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating role:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating role',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 