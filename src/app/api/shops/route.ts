import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTokenPermission, getShopIdFromToken } from '@/lib/auth';
import { ShopAccessControl } from '@/lib/utils/shopMiddleware';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const simple = url.searchParams.get('simple') === 'true';

    // Validate token and permissions - check for shop distribution view or shop manage
    const shopDistributionPermission = await validateTokenPermission(req, 'shop:distribution:view');
    const shopManagePermission = await validateTokenPermission(req, 'shop:manage');
    
    if (!shopDistributionPermission.isValid && !shopManagePermission.isValid) {
      return NextResponse.json(
        { success: false, message: 'Permission denied: shop:distribution:view or shop:manage required' },
        { status: 401 }
      );
    }

    // Get user's shop context for filtering
    const userShopId = await getShopIdFromToken(req);
    const adminAllPermission = await validateTokenPermission(req, 'admin:all');
    const userManagePermission = await validateTokenPermission(req, 'user:manage');
    
    const isAdmin = shopManagePermission.isValid || adminAllPermission.isValid || userManagePermission.isValid;
    
    // Development mode - allow all access
    const token = req.headers.get('authorization')?.split(' ')[1];
    const isDevMode = token === 'dev-token';

    // Debug logging
    console.log('Shops API Debug:', {
        isAdmin,
        userShopId,
        isDevMode,
        shopManagePermission: shopManagePermission.isValid,
        adminAllPermission: adminAllPermission.isValid,
        userManagePermission: userManagePermission.isValid
    });

    if (simple) {
      // Return simplified shop data for dropdowns
      let whereClause = {};
      
      // If user is not admin, filter by their assigned shop
       if (!isAdmin && userShopId) {
         whereClause = {
           id: userShopId
         };
         console.log('Applying shop filter:', whereClause);
       } else {
         console.log('No shop filter applied - isAdmin:', isAdmin, 'userShopId:', userShopId);
       }
      
      const shops = await prisma.shop.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return NextResponse.json({
        success: true,
        data: shops,
      });
    }

        // Fetch shops from the database with proper numeric IDs
        let whereClause = {};
        
        // If user is not admin, filter by their assigned shop
         if (!isAdmin && userShopId) {
             whereClause = {
                 id: userShopId
             };
         }
        
        const shops = await prisma.shop.findMany({
            where: whereClause,
            orderBy: {
                name: 'asc'
            },
            select: {
                id: true,
                name: true,
                location: true,
                contact_person: true,
                phone: true,
                email: true,
                is_active: true,
                opening_time: true,
                closing_time: true,
                manager_id: true,
                opening_date: true,
                status: true,
                address_line1: true,
                address_line2: true,
                city: true,
                state: true,
                postal_code: true,
                country: true,
                latitude: true,
                longitude: true,
                tax_rate: true,
                createdAt: true,
                updatedAt: true,
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                _count: {
                    select: {
                        InventoryItem: true
                    }
                }
            }
        });

        // Transform the data to include total_inventory count
        const shopsWithInventory = shops.map(shop => {
            const { _count, ...restOfShop } = shop;
            return {
                ...restOfShop,
                total_inventory: _count.InventoryItem
            };
        });

        if (!shopsWithInventory || shopsWithInventory.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        return NextResponse.json({ success: true, data: shopsWithInventory });

    } catch (error) {
        console.error('[API/SHOPS_GET] Error fetching shops:', error);
        // It's good practice to avoid sending detailed internal error messages to the client.
        let errorMessage = 'An unexpected error occurred while fetching shops.';
        if (error instanceof Error) {
            errorMessage = error.message;
            // You could log error.message for server-side debugging
        }
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}

// POST: Create a new shop
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const newShop = await prisma.shop.create({
            data: {
                name: body.name,
                location: body.location,
                is_active: body.is_active,
                status: body.status,
            },
        });

        return NextResponse.json({
            success: true,
            data: newShop
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating shop:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create shop' },
            { status: 500 }
        );
    }
}