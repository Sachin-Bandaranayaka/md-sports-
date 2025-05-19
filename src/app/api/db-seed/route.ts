import { NextResponse } from 'next/server';
import { Product, Category, Shop, InventoryItem } from '@/lib/models';

export async function POST() {
    try {
        // Check if data already exists
        const categoryCount = await Category.count();
        if (categoryCount > 0) {
            return NextResponse.json({
                success: true,
                message: 'Data already exists. Skipping seed operation.'
            });
        }

        // Create categories
        const sportingGoods = await Category.create({
            name: 'Sporting Goods',
            description: 'All sporting equipment and accessories'
        });

        const apparel = await Category.create({
            name: 'Apparel',
            description: 'Clothing and uniforms',
            parentId: sportingGoods.id
        });

        const equipment = await Category.create({
            name: 'Equipment',
            description: 'Sports equipment',
            parentId: sportingGoods.id
        });

        // Create products
        const basketball = await Product.create({
            name: 'Professional Basketball',
            sku: 'BB-PRO-001',
            barcode: '123456789012',
            description: 'Official size and weight basketball',
            basePrice: 25.00,
            retailPrice: 39.99,
            categoryId: equipment.id
        });

        const jersey = await Product.create({
            name: 'Team Jersey',
            sku: 'APP-JRS-001',
            barcode: '123456789013',
            description: 'Official team jersey',
            basePrice: 35.00,
            retailPrice: 59.99,
            categoryId: apparel.id
        });

        // Create shops
        const mainStore = await Shop.create({
            name: 'MD Sports Main Store',
            location: 'Colombo',
            contactPerson: 'John Doe',
            phone: '+94123456789',
            email: 'main@mdsports.lk'
        });

        const branchStore = await Shop.create({
            name: 'MD Sports Kandy Branch',
            location: 'Kandy',
            contactPerson: 'Jane Smith',
            phone: '+94123456790',
            email: 'kandy@mdsports.lk'
        });

        // Create inventory items
        await InventoryItem.create({
            shopId: mainStore.id,
            productId: basketball.id,
            quantity: 50,
            reorderLevel: 10
        });

        await InventoryItem.create({
            shopId: mainStore.id,
            productId: jersey.id,
            quantity: 30,
            reorderLevel: 5
        });

        await InventoryItem.create({
            shopId: branchStore.id,
            productId: basketball.id,
            quantity: 25,
            reorderLevel: 8
        });

        await InventoryItem.create({
            shopId: branchStore.id,
            productId: jersey.id,
            quantity: 15,
            reorderLevel: 3
        });

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully.'
        });
    } catch (error) {
        console.error('Error seeding database:', error);
        return NextResponse.json({
            success: false,
            message: 'Error seeding database',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 