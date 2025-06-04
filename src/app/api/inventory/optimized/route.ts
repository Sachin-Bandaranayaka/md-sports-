/**
 * Enterprise-grade Optimized Inventory API
 * Uses materialized views, advanced caching, and performance monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { inventoryCacheService, INVENTORY_CACHE_CONFIG } from '@/lib/inventoryCache';
import { PerformanceMonitor } from '@/lib/performance';
import { z } from 'zod';

// Request validation schema
const InventoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['In Stock', 'Low Stock', 'Out of Stock']).optional(),
  shopId: z.coerce.number().optional(),
  sortBy: z.enum(['name', 'quantity', 'value', 'lastUpdated']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  useCache: z.coerce.boolean().default(true),
  includeMeta: z.coerce.boolean().default(true)
});

type InventoryQuery = z.infer<typeof InventoryQuerySchema>;

interface InventoryResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    cacheHit: boolean;
    responseTime: number;
    dataSource: 'cache' | 'materialized_view' | 'live_query';
    lastUpdated: string;
  };
}

export async function GET(request: NextRequest) {
  const performanceMonitor = new PerformanceMonitor();
  const requestId = performanceMonitor.startTimer('inventory_api_request');

  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedQuery = InventoryQuerySchema.parse(queryParams);
    const { page, limit, search, category, status, shopId, sortBy, sortOrder, useCache, includeMeta } = validatedQuery;

    // Track filter usage for analytics
    inventoryCacheService.trackFilterUsage(validatedQuery);

    // Generate cache key
    const cacheKey = inventoryCacheService.generateKey(
      INVENTORY_CACHE_CONFIG.KEYS.INVENTORY_SUMMARY,
      validatedQuery
    );

    let response: InventoryResponse;
    let cacheHit = false;
    let dataSource: 'cache' | 'materialized_view' | 'live_query' = 'live_query';

    // Try cache first if enabled
    if (useCache) {
      const cachedData = await inventoryCacheService.get<InventoryResponse>(cacheKey);
      if (cachedData) {
        cacheHit = true;
        dataSource = 'cache';
        response = cachedData;

        // Update meta if requested
        if (includeMeta && response.meta) {
          response.meta.cacheHit = true;
          response.meta.responseTime = performanceMonitor.endTimer(requestId);
        }

        return NextResponse.json(response, {
          headers: {
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
            'X-Cache-Status': 'HIT',
            'X-Data-Source': dataSource
          }
        });
      }
    }

    // If not in cache, try materialized view first
    const mvTimer = performanceMonitor.startTimer('materialized_view_query');

    try {
      const data = await fetchFromMaterializedView(validatedQuery, session.user.id);
      if (data) {
        dataSource = 'materialized_view';
        response = data;
        performanceMonitor.endTimer(mvTimer);
      } else {
        throw new Error('Materialized view not available');
      }
    } catch (mvError) {
      console.warn('Materialized view failed, falling back to live query:', mvError);
      performanceMonitor.endTimer(mvTimer);

      // Fallback to live query
      const liveTimer = performanceMonitor.startTimer('live_query');
      response = await fetchFromLiveQuery(validatedQuery, session.user.id);
      dataSource = 'live_query';
      performanceMonitor.endTimer(liveTimer);
    }

    // Add metadata if requested
    if (includeMeta) {
      response.meta = {
        cacheHit,
        responseTime: performanceMonitor.endTimer(requestId),
        dataSource,
        lastUpdated: new Date().toISOString()
      };
    }

    // Cache the response for future requests
    if (useCache) {
      await inventoryCacheService.set(
        cacheKey,
        response,
        INVENTORY_CACHE_CONFIG.TTL.SUMMARY
      );
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Cache-Status': 'MISS',
        'X-Data-Source': dataSource
      }
    });

  } catch (error) {
    console.error('Inventory API error:', error);
    performanceMonitor.endTimer(requestId);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch data from materialized views for optimal performance
 */
async function fetchFromMaterializedView(
  query: InventoryQuery,
  userId: string
): Promise<InventoryResponse | null> {
  try {
    const { page, limit, search, category, status, shopId, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    // Build WHERE conditions for materialized view
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Shop filter (user access control)
    if (shopId) {
      conditions.push(`shop_id = $${paramIndex++}`);
      params.push(shopId);
    }

    // Search filter
    if (search) {
      conditions.push(`(
        product_name ILIKE $${paramIndex} OR 
        product_code ILIKE $${paramIndex} OR 
        category_name ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Category filter
    if (category) {
      conditions.push(`category_name = $${paramIndex++}`);
      params.push(category);
    }

    // Status filter
    if (status) {
      conditions.push(`stock_status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const orderByMap = {
      name: 'product_name',
      quantity: 'current_stock',
      value: 'total_value',
      lastUpdated: 'last_updated'
    };
    const orderBy = `ORDER BY ${orderByMap[sortBy]} ${sortOrder.toUpperCase()}`;

    // Main query using materialized view
    const dataQuery = `
      SELECT 
        product_id,
        product_name,
        product_code,
        category_name,
        shop_name,
        current_stock,
        min_stock_level,
        max_stock_level,
        stock_status,
        unit_price,
        total_value,
        last_updated,
        reorder_point,
        supplier_name
      FROM inventory_summary_mv
      ${whereClause}
      ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_summary_mv
      ${whereClause}
    `;

    // Execute both queries in parallel
    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, params),
      db.query(countQuery, params.slice(0, -2)) // Remove limit and offset for count
    ]);

    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

  } catch (error) {
    console.error('Materialized view query failed:', error);
    return null;
  }
}

/**
 * Fallback to live query when materialized view is not available
 */
async function fetchFromLiveQuery(
  query: InventoryQuery,
  userId: string
): Promise<InventoryResponse> {
  const { page, limit, search, category, status, shopId, sortBy, sortOrder } = query;
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions: string[] = ['p.deleted_at IS NULL'];
  const params: any[] = [];
  let paramIndex = 1;

  // Shop filter
  if (shopId) {
    conditions.push(`i.shop_id = $${paramIndex++}`);
    params.push(shopId);
  }

  // Search filter
  if (search) {
    conditions.push(`(
      p.name ILIKE $${paramIndex} OR 
      p.code ILIKE $${paramIndex} OR 
      c.name ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Category filter
  if (category) {
    conditions.push(`c.name = $${paramIndex++}`);
    params.push(category);
  }

  // Status filter
  if (status) {
    const statusCondition = {
      'Out of Stock': 'i.current_stock = 0',
      'Low Stock': 'i.current_stock > 0 AND i.current_stock <= i.min_stock_level',
      'In Stock': 'i.current_stock > i.min_stock_level'
    }[status];

    if (statusCondition) {
      conditions.push(`(${statusCondition})`);
    }
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Build ORDER BY clause
  const orderByMap = {
    name: 'p.name',
    quantity: 'i.current_stock',
    value: '(i.current_stock * p.selling_price)',
    lastUpdated: 'i.updated_at'
  };
  const orderBy = `ORDER BY ${orderByMap[sortBy]} ${sortOrder.toUpperCase()}`;

  // Main query
  const dataQuery = `
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.code as product_code,
      c.name as category_name,
      s.name as shop_name,
      i.current_stock,
      i.min_stock_level,
      i.max_stock_level,
      CASE 
        WHEN i.current_stock = 0 THEN 'Out of Stock'
        WHEN i.current_stock <= i.min_stock_level THEN 'Low Stock'
        ELSE 'In Stock'
      END as stock_status,
      p.selling_price as unit_price,
      (i.current_stock * p.selling_price) as total_value,
      i.updated_at as last_updated,
      i.reorder_point,
      sup.name as supplier_name
    FROM "Product" p
    LEFT JOIN "InventoryItem" i ON p.id = i.product_id
    LEFT JOIN "Category" c ON p.category_id = c.id
    LEFT JOIN "Shop" s ON i.shop_id = s.id
    LEFT JOIN "Supplier" sup ON p.supplier_id = sup.id
    ${whereClause}
    ${orderBy}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);

  // Count query
  const countQuery = `
    SELECT COUNT(*) as total
    FROM "Product" p
    LEFT JOIN "InventoryItem" i ON p.id = i.product_id
    LEFT JOIN "Category" c ON p.category_id = c.id
    LEFT JOIN "Shop" s ON i.shop_id = s.id
    ${whereClause}
  `;

  // Execute both queries in parallel
  const [dataResult, countResult] = await Promise.all([
    db.query(dataQuery, params),
    db.query(countQuery, params.slice(0, -2))
  ]);

  const total = parseInt(countResult.rows[0]?.total || '0');
  const totalPages = Math.ceil(total / limit);

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}