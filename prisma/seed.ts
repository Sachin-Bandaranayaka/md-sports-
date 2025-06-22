import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seeding...');

    // Create permissions
    const permissions = [
        { name: 'user:view', description: 'View users' },
        { name: 'user:manage', description: 'Create, update, delete users' },
        { name: 'inventory:view', description: 'View inventory' },
        { name: 'inventory:view:basic', description: 'View inventory without costs' },
        { name: 'inventory:manage', description: 'Manage inventory' },
        { name: 'inventory:transfer', description: 'Transfer inventory between shops' },
        { name: 'sales:view', description: 'View sales' },
        { name: 'sales:manage', description: 'Manage sales' },
        { name: 'sales:create:shop', description: 'Create sales for specific shop only' },
        { name: 'customer:create', description: 'Create customers' },
        { name: 'customer:view', description: 'View customers' },
        { name: 'reports:view', description: 'View reports' },
        { name: 'settings:manage', description: 'Manage system settings' },
        { name: 'dashboard:view', description: 'View dashboard' },
        { name: 'view_sales', description: 'View sales dashboard' },
        { name: 'manage_dashboard', description: 'Manage dashboard' },
        { name: 'view_transfers', description: 'View inventory transfers' },
        { name: 'category:create', description: 'Create categories' },
        { name: 'category:update', description: 'Update categories' },
        { name: 'category:delete', description: 'Delete categories' },
        { name: 'admin:all', description: 'Full admin access' },
        { name: 'shop:manage', description: 'Manage shops' },
        { name: 'shop:distribution:view', description: 'View shop distribution' },
        { name: 'shop:assigned_only', description: 'Restricts user access to only their assigned shop' },
        { name: 'invoice:create', description: 'Create invoices' },
        { name: 'invoice:view', description: 'View invoices' },
        { name: 'quotation:create', description: 'Create quotations' },
        { name: 'quotation:view', description: 'View quotations' },
    ];

    console.log('Creating permissions...');
    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { name: permission.name },
            update: {},
            create: permission,
        });
    }

    // Create admin role
    console.log('Creating admin role...');
    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {
            description: 'Administrator with full access',
        },
        create: {
            id: 'admin-role-id',
            name: 'Admin',
            description: 'Administrator with full access',
        },
    });

    // Create Shop Staff role
    console.log('Creating Shop Staff role...');
    const shopStaffRole = await prisma.role.upsert({
        where: { name: 'Shop Staff' },
        update: {
            description: 'Shop operations staff with limited access',
        },
        create: {
            id: 'shop-staff-role-id',
            name: 'Shop Staff',
            description: 'Shop operations staff with limited access',
        },
    });

    // Associate all permissions with admin role
    console.log('Associating permissions with admin role...');
    const allPermissions = await prisma.permission.findMany();
    await prisma.role.update({
        where: { id: adminRole.id },
        data: {
            permissions: {
                connect: allPermissions.map(p => ({ id: p.id })),
            },
        },
    });

    // Associate Shop Staff permissions
    console.log('Associating permissions with Shop Staff role...');
    const shopStaffPermissionNames = [
        'dashboard:view',
        'sales:view',
        'sales:manage',
        'invoice:create',
        'invoice:view',
        'customer:create',
        'customer:view',
        'quotation:create',
        'quotation:view',
        'shop:distribution:view',
        'inventory:transfer',
        'shop:assigned_only'
    ];
    
    const shopStaffPermissions = await prisma.permission.findMany({
        where: {
            name: {
                in: shopStaffPermissionNames
            }
        }
    });
    
    await prisma.role.update({
        where: { id: shopStaffRole.id },
        data: {
            permissions: {
                connect: shopStaffPermissions.map(p => ({ id: p.id })),
            },
        },
    });

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Get permission names for direct assignment
    const permissionNames = allPermissions.map(p => p.name);

    await prisma.user.upsert({
        where: { email: 'admin@mssports.lk' },
        update: {
            password: hashedPassword,
            roleId: adminRole.id,
            roleName: 'Admin',
            permissions: permissionNames,
            isActive: true,
        },
        create: {
            name: 'Admin User',
            email: 'admin@mssports.lk',
            password: hashedPassword,
            roleId: adminRole.id,
            roleName: 'Admin',
            permissions: permissionNames,
            isActive: true,
        },
    });

    // Also create the user with the typo in email that was attempted in the logs
    await prisma.user.upsert({
        where: { email: 'admin@mssport.lk' },
        update: {
            password: hashedPassword,
            roleId: adminRole.id,
            roleName: 'Admin',
            permissions: permissionNames,
            isActive: true,
        },
        create: {
            name: 'Admin User (Alt)',
            email: 'admin@mssport.lk',
            password: hashedPassword,
            roleId: adminRole.id,
            roleName: 'Admin',
            permissions: permissionNames,
            isActive: true,
        },
    });

    console.log('Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error during database seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });