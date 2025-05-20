import { NextRequest, NextResponse } from 'next/server';
import { Product, Category } from '@/lib/models';
import { requirePermission } from '@/lib/utils/middleware';
import { Op } from 'sequelize';

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

        // Build query conditions
        const where: {
            categoryId?: number;
            name?: { [key: symbol]: string };
        } = {};

        if (categoryId) {
            where.categoryId = parseInt(categoryId);
        }

        if (searchTerm) {
            where.name = {
                [Op.iLike]: `%${searchTerm}%`
            };
        }

        const products = await Product.findAll({
            where,
            include: [
                {
                    model: Category,
                    attributes: ['id', 'name']
                }
            ],
            order: [['name', 'ASC']]
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
            basePrice,
            retailPrice,
            categoryId
        } = body;

        // Validate required fields
        if (!name || !sku || !basePrice || !retailPrice || !categoryId) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if SKU or barcode already exists
        const existingProduct = await Product.findOne({
            where: {
                [Op.or]: [
                    { sku },
                    { barcode: barcode || null }
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
        const product = await Product.create({
            name,
            sku,
            barcode,
            description,
            basePrice,
            retailPrice,
            categoryId
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