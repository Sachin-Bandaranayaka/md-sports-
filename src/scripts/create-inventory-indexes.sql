-- Enterprise-grade Database Indexes for Inventory Optimization
-- This script creates optimized indexes for inventory management queries

-- 1. Product Table Indexes
-- Full-text search index for product names and SKUs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_search_gin 
ON "Product" USING gin(to_tsvector('english', name || ' ' || COALESCE(sku, '') || ' ' || COALESCE(barcode, '')));

-- Composite index for category and status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_category_active 
ON "Product" ("categoryId", active) WHERE active = true;

-- Index for SKU lookups (unique constraint should already exist)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_sku 
ON "Product" (sku) WHERE sku IS NOT NULL;

-- Index for barcode lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_barcode 
ON "Product" (barcode) WHERE barcode IS NOT NULL;

-- Index for price range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_price_range 
ON "Product" (price) WHERE price > 0;

-- Index for weighted average cost calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_cost 
ON "Product" (weightedaveragecost) WHERE weightedaveragecost > 0;

-- 2. InventoryItem Table Indexes
-- Composite index for shop and product queries (most common)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_shop_product 
ON "InventoryItem" ("shopId", "productId") INCLUDE (quantity, unit_cost, last_updated);

-- Index for product-based queries across all shops
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_quantity 
ON "InventoryItem" ("productId", quantity) WHERE quantity >= 0;

-- Index for shop-based inventory queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_shop_quantity 
ON "InventoryItem" ("shopId", quantity) WHERE quantity > 0;

-- Index for low stock alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_low_stock 
ON "InventoryItem" ("productId", "shopId", quantity) WHERE quantity <= 10;

-- Index for out of stock items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_out_of_stock 
ON "InventoryItem" ("productId", "shopId") WHERE quantity = 0;

-- Index for inventory value calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_value 
ON "InventoryItem" ("shopId", unit_cost, quantity) WHERE quantity > 0 AND unit_cost > 0;

-- Index for last updated tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_last_updated 
ON "InventoryItem" (last_updated DESC);

-- 3. Category Table Indexes
-- Index for active categories
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_active 
ON "Category" (active, name) WHERE active = true;

-- Index for category hierarchy (if parent_id exists)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_parent 
-- ON "Category" (parent_id, name) WHERE parent_id IS NOT NULL;

-- 4. Shop Table Indexes
-- Index for active shops
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shop_active 
ON "Shop" (active, name) WHERE active = true;

-- Index for shop location queries (if location fields exist)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shop_location 
-- ON "Shop" (city, state) WHERE active = true;

-- 5. Composite Indexes for Complex Queries
-- Index for inventory summary queries (product + category + shop)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_summary_complex 
ON "InventoryItem" ("productId", "shopId") 
INCLUDE (quantity, unit_cost);

-- Index for category-based inventory queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_category_inventory 
ON "Product" ("categoryId") 
INCLUDE (name, sku, price, weightedaveragecost);

-- 6. Partial Indexes for Performance
-- Index only for products with inventory
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_with_inventory 
ON "Product" (id, name, sku) 
WHERE EXISTS (
    SELECT 1 FROM "InventoryItem" ii 
    WHERE ii."productId" = "Product".id AND ii.quantity > 0
);

-- Index for recently updated inventory items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_recent_updates 
ON "InventoryItem" (last_updated DESC, "productId", "shopId") 
WHERE last_updated > NOW() - INTERVAL '7 days';

-- 7. Indexes for Reporting and Analytics
-- Index for inventory value reports
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_value_reporting 
ON "InventoryItem" ("shopId", "productId", (quantity * unit_cost)) 
WHERE quantity > 0 AND unit_cost > 0;

-- Index for stock movement tracking (if movement table exists)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movement_date 
-- ON "StockMovement" (movement_date DESC, "productId", "shopId");

-- 8. Function-based Indexes
-- Index for total inventory value per product
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_total_value_per_product 
ON "InventoryItem" ("productId", (quantity * unit_cost)) 
WHERE quantity > 0 AND unit_cost > 0;

-- Index for average unit cost per product
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_avg_cost_per_product 
ON "InventoryItem" ("productId", unit_cost) 
WHERE unit_cost > 0;

-- 9. Maintenance Indexes
-- Index for cleanup operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_cleanup 
ON "InventoryItem" (last_updated, quantity) 
WHERE quantity = 0;

-- 10. Statistics Update
-- Update table statistics for better query planning
ANALYZE "Product";
ANALYZE "InventoryItem";
ANALYZE "Category";
ANALYZE "Shop";

-- Create a function to monitor index usage
CREATE OR REPLACE FUNCTION get_inventory_index_usage()
RETURNS TABLE(
    schemaname text,
    tablename text,
    indexname text,
    idx_scan bigint,
    idx_tup_read bigint,
    idx_tup_fetch bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::text,
        s.tablename::text,
        s.indexname::text,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.tablename IN ('Product', 'InventoryItem', 'Category', 'Shop')
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to identify unused indexes
CREATE OR REPLACE FUNCTION get_unused_inventory_indexes()
RETURNS TABLE(
    schemaname text,
    tablename text,
    indexname text,
    index_size text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::text,
        s.tablename::text,
        s.indexname::text,
        pg_size_pretty(pg_relation_size(s.indexrelid))::text as index_size
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.tablename IN ('Product', 'InventoryItem', 'Category', 'Shop')
      AND s.idx_scan = 0
      AND NOT i.indisunique
    ORDER BY pg_relation_size(s.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

COMMIT;