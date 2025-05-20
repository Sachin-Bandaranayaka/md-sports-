import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
    try {
        // Check if data already exists
        const categoryCount = await prisma.category.count();
        if (categoryCount > 0) {
            return NextResponse.json({
                success: true,
                message: 'Data already exists. Skipping seed operation.'
            });
        }

        // Create categories
        const sportingGoods = await prisma.category.create({
            data: {
                name: 'Sporting Goods',
                description: 'All sporting equipment and accessories'
            }
        });

        const apparel = await prisma.category.create({
            data: {
                name: 'Apparel',
                description: 'Clothing and uniforms',
                parentId: sportingGoods.id
            }
        });

        const equipment = await prisma.category.create({
            data: {
                name: 'Equipment',
                description: 'Sports equipment',
                parentId: sportingGoods.id
            }
        });

        // Create products
        const basketball = await prisma.product.create({
            data: {
                name: 'Professional Basketball',
                sku: 'BB-PRO-001',
                barcode: '123456789012',
                description: 'Official size and weight basketball',
                cost: 25.00,
                price: 39.99,
                categoryId: equipment.id
            }
        });

        const jersey = await prisma.product.create({
            data: {
                name: 'Team Jersey',
                sku: 'APP-JRS-001',
                barcode: '123456789013',
                description: 'Official team jersey',
                cost: 35.00,
                price: 59.99,
                categoryId: apparel.id
            }
        });

        // Create shops
        const mainStore = await prisma.shop.create({
            data: {
                name: 'MD Sports Main Store',
                location: 'Colombo'
            }
        });

        const branchStore = await prisma.shop.create({
            data: {
                name: 'MD Sports Kandy Branch',
                location: 'Kandy'
            }
        });

        // Create inventory items
        await prisma.inventoryItem.create({
            data: {
                shopId: mainStore.id,
                productId: basketball.id,
                quantity: 50
            }
        });

        await prisma.inventoryItem.create({
            data: {
                shopId: mainStore.id,
                productId: jersey.id,
                quantity: 30
            }
        });

        await prisma.inventoryItem.create({
            data: {
                shopId: branchStore.id,
                productId: basketball.id,
                quantity: 25
            }
        });

        await prisma.inventoryItem.create({
            data: {
                shopId: branchStore.id,
                productId: jersey.id,
                quantity: 15
            }
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