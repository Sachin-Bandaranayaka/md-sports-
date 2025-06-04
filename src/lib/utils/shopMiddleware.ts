import { NextRequest, NextResponse } from 'next/server';
import { validateTokenPermission, getUserIdFromToken, getShopIdFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Shop-based access control middleware for API routes
 */
export class ShopAccessControl {
    /**
     * Validate if user can access data from a specific shop
     */
    static async validateShopAccess(req: NextRequest, targetShopId?: string | number): Promise<{
        hasAccess: boolean;
        userShopId: number | null;
        isAdmin: boolean;
        error?: string;
    }> {
        try {
            const userShopId = await getShopIdFromToken(req);
            const userId = await getUserIdFromToken(req);

            // Development mode - allow all access
            const token = req.headers.get('authorization')?.split(' ')[1];
            if (token === 'dev-token') {
                return { hasAccess: true, userShopId: null, isAdmin: true };
            }

            // Check if user has admin permissions for cross-shop access
            const shopManagePermission = await validateTokenPermission(req, 'shop:manage');
            const adminAllPermission = await validateTokenPermission(req, 'admin:all');
            const userManagePermission = await validateTokenPermission(req, 'user:manage');

            const isAdmin = shopManagePermission.isValid || adminAllPermission.isValid || userManagePermission.isValid;

            // If no target shop specified, allow access
            if (!targetShopId) {
                return { hasAccess: true, userShopId, isAdmin };
            }

            // Admins can access any shop
            if (isAdmin) {
                return { hasAccess: true, userShopId, isAdmin };
            }

            // Check if user belongs to the target shop
            const targetShopIdNum = typeof targetShopId === 'string' ? parseInt(targetShopId) : targetShopId;
            const hasAccess = userShopId === targetShopIdNum;

            return {
                hasAccess,
                userShopId,
                isAdmin,
                error: hasAccess ? undefined : 'Access denied: You can only access data from your assigned shop'
            };

        } catch (error) {
            console.error('Error validating shop access:', error);
            return {
                hasAccess: false,
                userShopId: null,
                isAdmin: false,
                error: 'Failed to validate shop access'
            };
        }
    }

    /**
     * Get the effective shop ID for filtering data
     * Returns user's shop ID if they're restricted, or the requested shop ID if they're admin
     */
    static async getEffectiveShopId(req: NextRequest, requestedShopId?: string | number): Promise<{
        shopId: number | null;
        isFiltered: boolean;
        error?: string;
    }> {
        const accessResult = await this.validateShopAccess(req, requestedShopId);

        if (!accessResult.hasAccess) {
            return {
                shopId: null,
                isFiltered: false,
                error: accessResult.error
            };
        }

        // If user is admin and requested a specific shop, use that
        if (accessResult.isAdmin && requestedShopId) {
            const shopIdNum = typeof requestedShopId === 'string' ? parseInt(requestedShopId) : requestedShopId;
            return {
                shopId: shopIdNum,
                isFiltered: true
            };
        }

        // If user is not admin, use their shop ID
        if (!accessResult.isAdmin && accessResult.userShopId) {
            return {
                shopId: accessResult.userShopId,
                isFiltered: true
            };
        }

        // Admin with no specific shop requested - no filtering
        return {
            shopId: null,
            isFiltered: false
        };
    }

    /**
     * Create a standardized error response for shop access violations
     */
    static createAccessDeniedResponse(message?: string): NextResponse {
        return NextResponse.json({
            success: false,
            message: message || 'Access denied: You can only access data from your assigned shop'
        }, { status: 403 });
    }

    /**
     * Middleware wrapper for API routes that need shop-based filtering
     */
    static withShopAccess(handler: (req: NextRequest, context: {
        shopId: number | null;
        isFiltered: boolean;
        userShopId: number | null;
        isAdmin: boolean;
    }) => Promise<NextResponse>) {
        return async (req: NextRequest) => {
            try {
                // Extract shopId from query parameters
                const url = new URL(req.url);
                const requestedShopId = url.searchParams.get('shopId');

                // Get effective shop ID for filtering
                const shopResult = await this.getEffectiveShopId(req, requestedShopId || undefined);

                if (shopResult.error) {
                    return this.createAccessDeniedResponse(shopResult.error);
                }

                // Get user context
                const userShopId = await getShopIdFromToken(req);

                const shopManagePermission = await validateTokenPermission(req, 'shop:manage');
                const adminAllPermission = await validateTokenPermission(req, 'admin:all');
                const userManagePermission = await validateTokenPermission(req, 'user:manage');

                const isAdmin = shopManagePermission.isValid || adminAllPermission.isValid || userManagePermission.isValid;

                // Call the handler with shop context
                return await handler(req, {
                    shopId: shopResult.shopId,
                    isFiltered: shopResult.isFiltered,
                    userShopId,
                    isAdmin
                });

            } catch (error) {
                console.error('Shop access middleware error:', error);
                return NextResponse.json({
                    success: false,
                    message: 'Internal server error'
                }, { status: 500 });
            }
        };
    }

    /**
     * Helper to build Prisma where clauses with shop filtering
     */
    static buildShopFilter(shopId: number | null, isFiltered: boolean) {
        if (!isFiltered || !shopId) {
            return {};
        }

        return {
            shopId: shopId
        };
    }

    /**
     * Helper to build Prisma where clauses for inventory items with shop filtering
     */
    static buildInventoryShopFilter(shopId: number | null, isFiltered: boolean) {
        if (!isFiltered || !shopId) {
            return {};
        }

        return {
            inventoryItems: {
                some: {
                    shopId: shopId,
                    quantity: {
                        gt: 0
                    }
                }
            }
        };
    }

    /**
     * Helper to validate shop exists and user has access
     */
    static async validateShopExists(shopId: number): Promise<boolean> {
        try {
            const shop = await prisma.shop.findUnique({
                where: { id: shopId }
            });
            return !!shop;
        } catch (error) {
            console.error('Error validating shop exists:', error);
            return false;
        }
    }
}

/**
 * Utility function to extract shop ID from request (query param or user's shop)
 */
export async function getRequestShopId(req: NextRequest): Promise<number | null> {
    const url = new URL(req.url);
    const queryShopId = url.searchParams.get('shopId');

    if (queryShopId) {
        return parseInt(queryShopId);
    }

    return getShopIdFromToken(req);
}

/**
 * Utility function to check if user can perform cross-shop operations
 */
export async function canAccessAllShops(req: NextRequest): Promise<boolean> {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (token === 'dev-token') {
        return true;
    }

    const shopManagePermission = await validateTokenPermission(req, 'shop:manage');
    const adminAllPermission = await validateTokenPermission(req, 'admin:all');
    const userManagePermission = await validateTokenPermission(req, 'user:manage');

    return shopManagePermission.isValid || adminAllPermission.isValid || userManagePermission.isValid;
}