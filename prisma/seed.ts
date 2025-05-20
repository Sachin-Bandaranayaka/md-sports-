import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Create permissions
    const permissions = [
        { name: 'user:view', description: 'View users' },
        { name: 'user:manage', description: 'Manage users' },
        { name: 'inventory:view', description: 'View inventory' },
        { name: 'inventory:manage', description: 'Manage inventory' },
        { name: 'sales:view', description: 'View sales' },
        { name: 'sales:manage', description: 'Manage sales' },
        { name: 'reports:view', description: 'View reports' },
        { name: 'settings:manage', description: 'Manage settings' },
    ];

    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { name: permission.name },
            update: {},
            create: {
                name: permission.name,
                description: permission.description,
            },
        });
    }

    console.log('Created permissions');

    // Create roles
    const adminRole = await prisma.role.upsert({
        where: { name: 'Administrator' },
        update: {},
        create: {
            name: 'Administrator',
            description: 'Full system access',
            permissions: {
                connect: permissions.map(p => ({ name: p.name })),
            },
        },
    });

    const managerRole = await prisma.role.upsert({
        where: { name: 'Manager' },
        update: {},
        create: {
            name: 'Manager',
            description: 'Manage inventory and sales',
            permissions: {
                connect: [
                    { name: 'inventory:view' },
                    { name: 'inventory:manage' },
                    { name: 'sales:view' },
                    { name: 'sales:manage' },
                    { name: 'reports:view' },
                ],
            },
        },
    });

    const staffRole = await prisma.role.upsert({
        where: { name: 'Staff' },
        update: {},
        create: {
            name: 'Staff',
            description: 'Basic operations',
            permissions: {
                connect: [
                    { name: 'inventory:view' },
                    { name: 'sales:view' },
                ],
            },
        },
    });

    console.log('Created roles');

    // Create shop
    const mainShop = await prisma.shop.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Main Store',
            location: 'Colombo',
        },
    });

    const warehouseShop = await prisma.shop.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'Warehouse',
            location: 'Gampaha',
        },
    });

    console.log('Created shops');

    // Create admin user
    const password = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@example.com',
            password,
            roleId: adminRole.id,
        },
    });

    const staffUser = await prisma.user.upsert({
        where: { email: 'staff@example.com' },
        update: {},
        create: {
            name: 'Staff User',
            email: 'staff@example.com',
            password: await bcrypt.hash('staff123', 10),
            roleId: staffRole.id,
            shopId: mainShop.id,
        },
    });

    console.log('Created users');

    // Create some categories
    const sportsCategory = await prisma.category.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Sports Equipment',
            description: 'All sports equipment'
        },
    });

    const clothingCategory = await prisma.category.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'Clothing',
            description: 'Sports clothing and apparel',
            parentId: sportsCategory.id
        },
    });

    console.log('Created categories');

    // Create some products
    const product1 = await prisma.product.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Basketball',
            description: 'Official size basketball',
            price: 2500,
            cost: 1800,
            sku: 'BB-001',
            barcode: '1234567890',
            categoryId: sportsCategory.id,
            shopId: mainShop.id,
        },
    });

    const product2 = await prisma.product.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'Sports T-Shirt',
            description: 'Quick-dry sports t-shirt',
            price: 1500,
            cost: 900,
            sku: 'TS-001',
            barcode: '1234567891',
            categoryId: clothingCategory.id,
            shopId: mainShop.id,
        },
    });

    console.log('Created products');

    // Create inventory items
    await prisma.inventoryItem.upsert({
        where: { id: 1 },
        update: {},
        create: {
            productId: product1.id,
            quantity: 50,
            shopId: mainShop.id,
        },
    });

    await prisma.inventoryItem.upsert({
        where: { id: 2 },
        update: {},
        create: {
            productId: product2.id,
            quantity: 100,
            shopId: mainShop.id,
        },
    });

    console.log('Created inventory items');

    console.log('Database seeded successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 