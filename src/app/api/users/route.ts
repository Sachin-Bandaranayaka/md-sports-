import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/utils/middleware';
import { permissionService } from '@/lib/services/PermissionService';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';

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
                allowedAccounts: true,
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

        // If a role template is selected, find its permissions
        if (userData.roleTemplate) {
            console.log(`Role template "${userData.roleTemplate}" selected. Fetching permissions...`);

            const roleWithPermissions = await prisma.role.findUnique({
                where: { name: userData.roleTemplate },
                include: { permissions: true }
            });

            if (roleWithPermissions) {
                const permissionNames = roleWithPermissions.permissions.map((p: { name: string }) => p.name);
                console.log(`Permissions for role "${userData.roleTemplate}":`, permissionNames);
                userData.permissions = permissionNames;
                userData.roleId = roleWithPermissions.id;
                userData.roleName = roleWithPermissions.name;
            } else {
                console.warn(`Role "${userData.roleTemplate}" not found in the database.`);
            }
        }
        
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Ensure shop:assigned_only permission exists if needed
        let shopAssignedPermissionId: string | null = null;
        if (userData.permissions.includes('shop:assigned_only')) {
            const permission = await prisma.permission.upsert({
                where: { name: 'shop:assigned_only' },
                update: {},
                create: {
                    name: 'shop:assigned_only',
                    description: 'Restricts user access to only their assigned shop',
                },
            });
            shopAssignedPermissionId = permission.id.toString();
        }

                        // Prepare user data
        const newUser = await prisma.user.create({
            data: {
                id: randomUUID(),
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                roleId: userData.roleId,
                roleName: userData.roleName, // Add this line
                shopId: shopId,
                permissions: userData.permissions,
                allowedAccounts: userData.allowedAccounts || [],
                isActive: true
            },
        });

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            data: newUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create user' },
            { status: 500 }
        );
    }
}