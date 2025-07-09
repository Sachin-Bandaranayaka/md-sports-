import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cacheService, CACHE_CONFIG } from '@/lib/cache';
import { measureAsync } from '@/lib/performance';

// Cache for 10 seconds
const CACHE_DURATION = 10;

export async function GET(request: NextRequest) {
  return measureAsync('inventory-summary-api', async () => {
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
      }

      const decoded = await verifyToken(token);
      if (!decoded) {
        return NextResponse.json({ error: 'Invalid token: signature verification failed' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limitParam = searchParams.get('limit');
      // Handle "Show All" case - if limit is 0 or null, show all items
      const limit = limitParam === '0' || limitParam === null ? 0 : Math.min(parseInt(limitParam || '10'), 50); // Cap at 50, unless showing all
      const search = searchParams.get('search') || '';
      const category = searchParams.get('category') || '';
      const status = searchParams.get('status') || '';
      const shopId = searchParams.get('shopId');

      // Generate cache key
      const cacheKey = cacheService.generateKey(CACHE_CONFIG.KEYS.INVENTORY_SUMMARY, {
        page,
        limit,
        search,
        category,
        status,
        shopId
      });

      // Try to get from cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        const response = NextResponse.json(cachedData);
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('Cache-Control', `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`);
        return response;
      }

      const offset = limit === 0 ? 0 : (page - 1) * limit;

      // Build dynamic WHERE conditions
      const whereConditions: string[] = ['1=1']; // Always true base condition
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Enhanced search filter - supports multiple words in any order
      if (search) {
        const searchWords = search.toLowerCase().trim().split(/\s+/);
        
        if (searchWords.length === 1) {
          // Single word search - search across name, SKU, and category
          whereConditions.push(`(
            LOWER(p.name) ILIKE $${paramIndex} OR 
            LOWER(p.sku) ILIKE $${paramIndex + 1} OR 
            LOWER(c.name) ILIKE $${paramIndex + 2}
          )`);
          queryParams.push(`%${searchWords[0]}%`, `%${searchWords[0]}%`, `%${searchWords[0]}%`);
          paramIndex += 3;
        } else {
          // Multi-word search - each word must appear somewhere in the searchable fields
          const wordConditions: string[] = [];
          
          searchWords.forEach(word => {
            if (word.length > 0) {
              wordConditions.push(`(
                LOWER(p.name) ILIKE $${paramIndex} OR 
                LOWER(p.sku) ILIKE $${paramIndex + 1} OR 
                LOWER(c.name) ILIKE $${paramIndex + 2}
              )`);
              queryParams.push(`%${word}%`, `%${word}%`, `%${word}%`);
              paramIndex += 3;
            }
          });
          
          if (wordConditions.length > 0) {
            whereConditions.push(`(${wordConditions.join(' AND ')})`);
          }
        }
      }

      // Category filter
      if (category) {
        whereConditions.push(`c.name = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
      }

      // Shop filter
      if (shopId) {
        whereConditions.push(`ii."shopId" = $${paramIndex}`);
        queryParams.push(parseInt(shopId));
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Execute queries in parallel
      const [inventoryData, countResult] = await Promise.all([
        measureAsync('inventory-main-query', async () => {
          // Main query with aggregation and status calculation
          let inventoryQuery = `
            WITH inventory_summary AS (
              SELECT 
                p.id,
                p.name,
                p.sku,
                p.price as "retailPrice",
                p.weightedaveragecost as "costPrice",
                c.name as category,
                COALESCE(SUM(ii.quantity), 0) as total_quantity,
                COALESCE(p.weightedaveragecost, 0) as weighted_avg_cost,
                COUNT(DISTINCT ii."shopId") as shop_count,
                COALESCE(p.min_stock_level, 10) as min_stock_level
              FROM "Product" p
              LEFT JOIN "Category" c ON p."categoryId" = c.id
              LEFT JOIN "InventoryItem" ii ON p.id = ii."productId"
              WHERE ${whereClause}
              GROUP BY p.id, p.name, p.sku, p.price, p.weightedaveragecost, c.name, p.min_stock_level
            ),
            status_calculation AS (
              SELECT *,
                CASE 
                  WHEN total_quantity = 0 THEN 'Out of Stock'
                  WHEN total_quantity <= min_stock_level THEN 'Low Stock'
                  ELSE 'In Stock'
                END as status
              FROM inventory_summary
            )
            SELECT * FROM status_calculation
          `;

          let mainQueryParams = [...queryParams];
          let mainParamIndex = paramIndex;

          // Add status filter if specified
          if (status) {
            inventoryQuery += ` WHERE status = $${mainParamIndex}`;
            mainQueryParams.push(status);
            mainParamIndex++;
          }

          // Add ordering and pagination
          inventoryQuery += ` ORDER BY name ASC`;
          if (limit > 0) {
            inventoryQuery += ` LIMIT $${mainParamIndex} OFFSET $${mainParamIndex + 1}`;
            mainQueryParams.push(limit, offset);
          }

          return prisma.$queryRawUnsafe(inventoryQuery, ...mainQueryParams);
        }),

        measureAsync('inventory-count-query', async () => {
          // Count query for pagination
          let countQuery = `
            WITH inventory_summary AS (
              SELECT 
                p.id,
                COALESCE(SUM(ii.quantity), 0) as total_quantity,
                COALESCE(p.min_stock_level, 10) as min_stock_level
              FROM "Product" p
              LEFT JOIN "Category" c ON p."categoryId" = c.id
              LEFT JOIN "InventoryItem" ii ON p.id = ii."productId"
              WHERE ${whereClause}
              GROUP BY p.id, p.min_stock_level
            ),
            status_calculation AS (
              SELECT *,
                CASE 
                  WHEN total_quantity = 0 THEN 'Out of Stock'
                  WHEN total_quantity <= min_stock_level THEN 'Low Stock'
                  ELSE 'In Stock'
                END as status
              FROM inventory_summary
            )
            SELECT COUNT(*) as total FROM status_calculation
          `;

          let countParams = [...queryParams];
          if (status) {
            countQuery += ` WHERE status = $${paramIndex}`;
            countParams.push(status);
          }

          return prisma.$queryRawUnsafe(countQuery, ...countParams) as Promise<any[]>;
        })
      ]);

      const total = parseInt(countResult[0]?.total || '0');

      // Format the response
      const formattedData = (inventoryData as any[]).map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category || 'Uncategorized',
        stock: parseInt(item.total_quantity),
        retailPrice: parseFloat(item.retailPrice || '0'),
        weightedAverageCost: parseFloat(item.weighted_avg_cost || '0'),
        status: item.status,
        shopCount: parseInt(item.shop_count || '0')
      }));

      const responseData = {
        success: true,
        data: formattedData,
        pagination: {
          page: limit === 0 ? 1 : page,
          limit,
          total,
          totalPages: limit === 0 ? 1 : Math.ceil(total / limit)
        }
      };

      // Cache the response
      await cacheService.set(cacheKey, responseData, CACHE_CONFIG.TTL.INVENTORY);

      const response = NextResponse.json(responseData);
      response.headers.set('X-Cache', 'MISS');
      response.headers.set('Cache-Control', `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`);

      return response;

    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch inventory summary' },
        { status: 500 }
      );
    }
  }, { endpoint: 'inventory-summary' });
}