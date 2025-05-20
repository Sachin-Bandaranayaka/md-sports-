import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/utils/middleware';
import bcrypt from 'bcryptjs';

// GET: List all users
export async function GET(req: NextRequest) {
    // Check for 'user:manage' permission
    const permissionError = await requirePermission('user:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                roleId: true,
                shopId: true,
                roleName: true,
                permissions: true,
                createdAt: true,
                updatedAt: true,
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// POST: Create a new user
export async function POST(req: NextRequest) {
    // Temporarily bypass permission check for adding users
    // const permissionError = await requirePermission('user:manage')(req);
    // if (permissionError) {
    //     return permissionError;
    // }

    try {
        const userData = await req.json();

        console.log('Received user data:', userData); // Log the incoming data

        // Validation examples
        if (!userData.name) {
            return NextResponse.json(
                { success: false, message: 'Name is required' },
                { status: 400 }
            );
        }

        if (!userData.email) {
            return NextResponse.json(
                { success: false, message: 'Email is required' },
                { status: 400 }
            );
        }

        if (!userData.password || userData.password.length < 8) {
            return NextResponse.json(
                { success: false, message: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        if (!userData.role) {
            return NextResponse.json(
                { success: false, message: 'Role is required' },
                { status: 400 }
            );
        }

        // Get or create a role based on the role name
        let roleId;

        try {
            // Check if there's an existing role with this name
            const existingRole = await prisma.role.findFirst({
                where: { name: userData.role }
            });

            console.log('Existing role:', existingRole); // Log the role lookup result

            if (existingRole) {
                roleId = existingRole.id;
            } else {
                // Create a new role with the provided name
                const newRole = await prisma.role.create({
                    data: {
                        name: userData.role,
                        description: `Role for ${userData.role}`
                    }
                });
                roleId = newRole.id;
                console.log('Created new role:', newRole); // Log the new role
            }
        } catch (roleError) {
            console.error('Error with role:', roleError);
            return NextResponse.json(
                { success: false, message: 'Error creating or finding role' },
                { status: 500 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Prepare user data
        const userData_final = {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            roleId: roleId,
            roleName: userData.role,
            shopId: userData.shop ? parseInt(userData.shop) : null,
            permissions: userData.permissions || [],
            isActive: true
        };

        console.log('Final user data to be saved:', userData_final); // Log the final data

        // Create the user
        const user = await prisma.user.create({
            data: userData_final,
            select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
                roleName: true,
                shopId: true,
                permissions: true,
                createdAt: true
            }
        });

        // Return success response
        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create user' },
            { status: 500 }
        );
    }
} 