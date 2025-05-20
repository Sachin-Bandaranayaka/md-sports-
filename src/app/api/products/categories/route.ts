import { NextResponse } from 'next/server';
import { prisma, safeQuery } from '@/lib/prisma';

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