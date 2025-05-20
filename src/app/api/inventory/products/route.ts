import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/utils/middleware';

// GET: List all products
export async function GET(req: NextRequest) {
    // First check for 'inventory:view' permission
    const permissionError = await requirePermission('inventory:view')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const url = new URL(req.url);
        const categoryId = url.searchParams.get('categoryId');
        const searchTerm = url.searchParams.get('search');

        // Build query conditions for Prisma
        const where: any = {};

        if (categoryId) {
            where.categoryId = parseInt(categoryId);
        }

        if (searchTerm) {
            where.name = {
                contains: searchTerm,
                mode: 'insensitive'
            };
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

// POST: Create a new product
export async function POST(req: NextRequest) {
    // Check for 'inventory:manage' permission
    const permissionError = await requirePermission('inventory:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const body = await req.json();
        const {
            name,
            sku,
            barcode,
            description,
            cost, // renamed from basePrice in Prisma
            price, // renamed from retailPrice in Prisma
            categoryId
        } = body;

        // Validate required fields
        if (!name || !sku || !cost || !price || !categoryId) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if SKU or barcode already exists
        const existingProduct = await prisma.product.findFirst({
            where: {
                OR: [
                    { sku },
                    { barcode }
                ]
            }
        });

        if (existingProduct) {
            return NextResponse.json(
                { success: false, message: 'SKU or barcode already exists' },
                { status: 409 }
            );
        }

        // Create product
        const product = await prisma.product.create({
            data: {
                name,
                sku,
                barcode,
                description,
                cost,
                price,
                categoryId
            }
        });

        return NextResponse.json({
            success: true,
            product
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create product' },
            { status: 500 }
        );
    }
} 