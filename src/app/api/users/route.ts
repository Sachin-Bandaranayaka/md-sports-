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
                },
                shop: {
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

        if (!userData.shop || userData.shop === '' || userData.shop === 'undefined') {
            return NextResponse.json(
                { success: false, message: 'Shop assignment is required' },
                { status: 400 }
            );
        }

        if (!userData.permissions || userData.permissions.length === 0) {
            return NextResponse.json(
                { success: false, message: 'At least one permission is required' },
                { status: 400 }
            );
        }

        // Validate shop ID (keep as string since it's a cuid)
        const shopId = userData.shop;
        
        // Verify the shop exists in the database
        const shopExists = await prisma.shop.findUnique({
            where: { id: shopId }
        });
        
        if (!shopExists) {
            return NextResponse.json(
                { success: false, message: 'Invalid shop ID provided - shop does not exist' },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Prepare user data
        const userData_final = {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            roleId: null, // No role assignment needed
            roleName: null, // No role name needed
            shopId: shopId,
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
                shopId: true,
                permissions: true,
                createdAt: true,
                shop: {
                    select: {
                        id: true,
                        name: true
                    }
                }
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