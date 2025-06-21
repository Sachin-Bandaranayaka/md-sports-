import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        console.log('Fixing Shop Staff user permissions...');
        
        // First, ensure the shop:assigned_only permission exists
        const shopAssignedPermission = await prisma.permission.upsert({
            where: { name: 'shop:assigned_only' },
            update: {},
            create: {
                id: 53, // Use next available ID
                name: 'shop:assigned_only',
                description: 'Restricts user access to only their assigned shop'
            }
        });
        
        console.log('Shop assigned permission ensured:', shopAssignedPermission);
        
        // Find users who are likely shop staff (have inventory:transfer permission but no proper role)
        const potentialShopStaff = await prisma.user.findMany({
            where: {
                AND: [
                    { permissions: { has: '7' } }, // inventory:transfer permission ID
                    { shopId: { not: null } },
                    {
                        OR: [
                            { roleName: null },
                            { roleName: '' }
                        ]
                    }
                ]
            }
        });
        
        console.log(`Found ${potentialShopStaff.length} potential shop staff users`);
        
        const updates = [];
        
        // Define the complete shop staff permission set (using permission IDs)
        const requiredPermissionIds = [
            '5',  // dashboard:view
            '2',  // sales:view
            '7',  // inventory:transfer
            '9',  // customer:view
            '10', // invoice:create
            '11', // quotation:create
            '19', // shop:distribution:view
            shopAssignedPermission.id.toString() // shop:assigned_only
        ];
        
        for (const user of potentialShopStaff) {
            console.log(`Updating permissions for user: ${user.name} (${user.email})`);
            
            // Get current permissions
            let currentPermissions = user.permissions || [];
            let addedPermissions = [];
            let updated = false;
            
            // Add missing permissions if they don't exist
            for (const permissionId of requiredPermissionIds) {
                if (!currentPermissions.includes(permissionId)) {
                    currentPermissions.push(permissionId);
                    addedPermissions.push(permissionId);
                    updated = true;
                    console.log(`  Added permission ID: ${permissionId}`);
                }
            }
            
            if (updated || !user.roleName) {
                // Update the user with new permissions and role name
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        permissions: currentPermissions,
                        roleName: 'Shop Staff'
                    }
                });
                updates.push({
                    user: user.name,
                    email: user.email,
                    addedPermissions,
                    roleNameSet: !user.roleName
                });
                console.log(`  Updated user ${user.name} successfully`);
            }
        }
        
        return NextResponse.json({
            success: true,
            message: 'Shop Staff permissions fixed successfully',
            updates
        });
        
    } catch (error) {
        console.error('Error fixing shop staff permissions:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to fix shop staff permissions',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}