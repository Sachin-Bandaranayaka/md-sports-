import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateTokenPermission } from '@/lib/auth';

// PUT: Update a category
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Verify permission
        const hasPermission = await validateTokenPermission(request, 'category:update');
        if (!hasPermission) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized: Insufficient permissions' },
                { status: 403 }
            );
        }

        const categoryId = parseInt(params.id);
        if (isNaN(categoryId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid category ID' },
                { status: 400 }
            );
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

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        // Check for circular parent relationship
        if (parentId) {
            // Can't set a category as its own parent
            if (parentId === categoryId) {
                return NextResponse.json(
                    { success: false, message: 'A category cannot be its own parent' },
                    { status: 400 }
                );
            }

            // Check for deeper circular relationships
            let currentParentId = parentId;
            while (currentParentId) {
                const parent = await prisma.category.findUnique({
                    where: { id: currentParentId }
                });

                if (!parent) break;

                if (parent.parentId === categoryId) {
                    return NextResponse.json(
                        { success: false, message: 'Circular parent relationship detected' },
                        { status: 400 }
                    );
                }

                currentParentId = parent.parentId;
            }
        }

        // Check if the new name already exists (excluding the current category)
        const existingCategory = await prisma.category.findFirst({
            where: {
                name: { equals: name, mode: 'insensitive' },
                id: { not: categoryId }
            }
        });

        if (existingCategory) {
            return NextResponse.json(
                { success: false, message: 'A category with this name already exists' },
                { status: 400 }
            );
        }

        // Update the category
        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: {
                name,
                description: description || null,
                parentId: parentId || null
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Category updated successfully',
            data: updatedCategory
        });
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update category' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a category by ID
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const categoryId = parseInt(params.id);

        if (isNaN(categoryId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid category ID' },
                { status: 400 }
            );
        }

        // Check auth header for development token
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

        console.log('Delete category request:', {
            categoryId,
            hasAuthHeader: !!authHeader,
            token: token ? `${token.substring(0, 10)}...` : null
        });

        // Allow dev-token to bypass permission checks
        if (token !== 'dev-token') {
            // Verify permission
            const hasPermission = await validateTokenPermission(request, 'category:delete');
            if (!hasPermission) {
                return NextResponse.json(
                    { success: false, message: 'Unauthorized: Insufficient permissions' },
                    { status: 403 }
                );
            }
        } else {
            console.log('Using development token - bypassing permission check');
        }

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        // Check if category has child categories
        const childCategories = await prisma.category.findMany({
            where: { parentId: categoryId }
        });

        if (childCategories.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Cannot delete category with subcategories. Please delete subcategories first.'
                },
                { status: 400 }
            );
        }

        // Check if category is used by any products
        const products = await prisma.product.findMany({
            where: { categoryId: categoryId }
        });

        if (products.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Cannot delete category that is assigned to products. Please reassign products first.'
                },
                { status: 400 }
            );
        }

        // Delete the category
        await prisma.category.delete({
            where: { id: categoryId }
        });

        return NextResponse.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete category' },
            { status: 500 }
        );
    }
}

// GET: Get a category by ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const categoryId = parseInt(params.id);

        if (isNaN(categoryId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid category ID' },
                { status: 400 }
            );
        }

        // Get the category
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        // If there's a parent ID, get the parent name
        let parentName = null;
        if (category.parentId) {
            const parentCategory = await prisma.category.findUnique({
                where: { id: category.parentId }
            });
            parentName = parentCategory?.name;
        }

        return NextResponse.json({
            success: true,
            data: {
                id: category.id,
                name: category.name,
                description: category.description,
                parent_id: category.parentId,
                parent_name: parentName
            }
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch category' },
            { status: 500 }
        );
    }
}

// PATCH: Update a category
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const categoryId = parseInt(params.id);

        if (isNaN(categoryId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid category ID' },
                { status: 400 }
            );
        }

        // Verify permission
        const hasPermission = await validateTokenPermission(request, 'category:update');
        if (!hasPermission) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized: Insufficient permissions' },
                { status: 403 }
            );
        }

        // Parse request body
        const data = await request.json();
        const { name, description, parentId } = data;

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        // If name is being changed, check for duplicates
        if (name && name !== category.name) {
            const existingCategory = await prisma.category.findFirst({
                where: {
                    name: { equals: name, mode: 'insensitive' },
                    id: { not: categoryId }
                }
            });

            if (existingCategory) {
                return NextResponse.json(
                    { success: false, message: 'A category with this name already exists' },
                    { status: 400 }
                );
            }
        }

        // Check for circular reference if changing parent
        if (parentId && parentId !== category.parentId) {
            // Can't make itself its own parent
            if (parentId === categoryId) {
                return NextResponse.json(
                    { success: false, message: 'Category cannot be its own parent' },
                    { status: 400 }
                );
            }

            // Check if the new parent is a descendant of this category (would create a loop)
            let checkId = parentId;
            while (checkId) {
                if (checkId === categoryId) {
                    return NextResponse.json(
                        { success: false, message: 'Cannot create circular hierarchy' },
                        { status: 400 }
                    );
                }

                const parentCategory = await prisma.category.findUnique({
                    where: { id: checkId }
                });

                checkId = parentCategory?.parentId || null;
            }
        }

        // Update the category
        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: {
                name: name || undefined,
                description: description !== undefined ? description : undefined,
                parentId: parentId !== undefined ? (parentId || null) : undefined
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Category updated successfully',
            data: updatedCategory
        });
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update category' },
            { status: 500 }
        );
    }
} 