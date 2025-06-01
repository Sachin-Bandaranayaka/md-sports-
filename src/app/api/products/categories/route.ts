import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';
import { validateTokenPermission } from '@/lib/auth';

// Default fallback data for categories
const defaultCategoriesData = [
    { id: 1, name: 'Sports Equipment', description: 'All sports equipment', parent_id: null, parent_name: null },
    { id: 2, name: 'Cricket', description: 'Cricket equipment', parent_id: 1, parent_name: 'Sports Equipment' },
    { id: 3, name: 'Football', description: 'Football equipment', parent_id: 1, parent_name: 'Sports Equipment' },
    { id: 4, name: 'Basketball', description: 'Basketball equipment', parent_id: 1, parent_name: 'Sports Equipment' },
    { id: 5, name: 'Tennis', description: 'Tennis equipment', parent_id: 1, parent_name: 'Sports Equipment' },
];

// GET: Fetch all product categories
export async function GET() {
    try {
        // Query to get all categories with their parent information
        const categories = await safeQuery(
            async () => {
                // First fetch all categories
                const allCategories = await prisma.category.findMany({
                    orderBy: {
                        name: 'asc'
                    }
                });

                // Map of category IDs to names for parent lookup
                const categoryNameMap = new Map(
                    allCategories.map(cat => [cat.id, cat.name])
                );

                // Return formatted categories with parent names
                return allCategories.map(category => ({
                    id: category.id,
                    name: category.name,
                    description: category.description,
                    parent_id: category.parentId,
                    parent_name: category.parentId ? categoryNameMap.get(category.parentId) : null
                }));
            },
            defaultCategoriesData,
            'Failed to fetch product categories'
        );

        return NextResponse.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching product categories:', error);

        // Return fallback data in case of error
        return NextResponse.json({
            success: true,
            data: defaultCategoriesData
        });
    }
}

// POST: Create a new category
export async function POST(request: NextRequest) {
    try {
        // Check auth header for development token
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

        console.log('Create category request:', {
            hasAuthHeader: !!authHeader,
            token: token ? `${token.substring(0, 10)}...` : null
        });

        // Allow dev-token to bypass permission checks
        if (token !== 'dev-token') {
            // Verify permission
            const hasPermission = await validateTokenPermission(request, 'category:create');
            if (!hasPermission) {
                return NextResponse.json(
                    { success: false, message: 'Unauthorized: Insufficient permissions' },
                    { status: 403 }
                );
            }
        } else {
            console.log('Using development token - bypassing permission check');
        }

        // Parse request body
        const data = await request.json();
        const { name, description, parentId } = data;

        if (!name) {
            return NextResponse.json(
                { success: false, message: 'Category name is required' },
                { status: 400 }
            );
        }

        // Check if category with this name already exists
        const existingCategory = await prisma.category.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
        });

        if (existingCategory) {
            return NextResponse.json(
                { success: false, message: 'A category with this name already exists' },
                { status: 400 }
            );
        }

        // Create the new category
        const newCategory = await prisma.category.create({
            data: {
                name,
                description: description || null,
                parentId: parentId || null
            }
        });

        // Invalidate reference data cache
        const { cacheService } = await import('@/lib/cache');
        await cacheService.invalidateReferenceData();

        return NextResponse.json({
            success: true,
            message: 'Category created successfully',
            data: newCategory
        });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create category' },
            { status: 500 }
        );
    }
}