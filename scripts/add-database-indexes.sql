-- Critical Database Indexes for Performance Optimization
-- Based on slow query analysis showing 80% of queries >100ms

-- =====================================
-- IMMEDIATE PERFORMANCE FIXES
-- =====================================

-- 1. User table indexes (Dashboard Summary Count: 841ms → target: <50ms)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_id_btree ON "User" USING btree (id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email_btree ON "User" USING btree (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_btree ON "User" USING btree ("roleName");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_shop_btree ON "User" USING btree ("shopId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_created_btree ON "User" USING btree ("createdAt");

-- 2. Product table indexes (Product Count: 142ms → target: <20ms)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_id_btree ON "Product" USING btree (id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_name_btree ON "Product" USING btree (name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_category_btree ON "Product" USING btree ("categoryId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_barcode_btree ON "Product" USING btree (barcode);

-- 3. InventoryItem table indexes (Inventory queries: 154ms → target: <30ms)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_btree ON "InventoryItem" USING btree ("productId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_shop_btree ON "InventoryItem" USING btree ("shopId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_quantity_btree ON "InventoryItem" USING btree (quantity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_updated_btree ON "InventoryItem" USING btree ("updatedAt");

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_shop_product ON "InventoryItem" USING btree ("shopId", "productId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_quantity_shop ON "InventoryItem" USING btree (quantity, "shopId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_quantity ON "InventoryItem" USING btree ("productId", quantity);

-- 4. Category table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_id_btree ON "Category" USING btree (id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_name_btree ON "Category" USING btree (name);

-- 5. Shop table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shop_id_btree ON "Shop" USING btree (id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shop_name_btree ON "Shop" USING btree (name);

-- 6. Invoice table indexes (for future optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_created_btree ON "Invoice" USING btree ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_customer_btree ON "Invoice" USING btree ("customerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_shop_btree ON "Invoice" USING btree ("shopId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_user_btree ON "Invoice" USING btree ("createdByUserId");

-- 7. InventoryTransfer table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_created_btree ON "InventoryTransfer" USING btree ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_status_btree ON "InventoryTransfer" USING btree (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_from_shop_btree ON "InventoryTransfer" USING btree ("fromShopId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_to_shop_btree ON "InventoryTransfer" USING btree ("toShopId");

-- Composite indexes for transfer queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_status_created ON "InventoryTransfer" USING btree (status, "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_shop_status ON "InventoryTransfer" USING btree ("fromShopId", status);

-- =====================================
-- QUERY OPTIMIZATION VIEWS
-- =====================================

-- Materialized view for dashboard summary (reduce 800ms → 50ms)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_summary AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT s.id) as total_shops,
    COUNT(DISTINCT ii.id) as total_inventory_items,
    COALESCE(SUM(ii.quantity * ii."shopspecificcost"), 0) as total_inventory_value,
    COUNT(CASE WHEN ii.quantity < 10 THEN 1 END) as low_stock_items,
    COUNT(CASE WHEN it.status = 'pending' THEN 1 END) as pending_transfers,
    NOW() as last_updated
FROM "User" u
CROSS JOIN "Product" p
CROSS JOIN "Shop" s
LEFT JOIN "InventoryItem" ii ON ii."shopId" = s.id AND ii."productId" = p.id
LEFT JOIN "InventoryTransfer" it ON it."fromShopId" = s.id OR it."toShopId" = s.id;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_summary_unique ON dashboard_summary (last_updated);

-- Materialized view for inventory summary by shop
CREATE MATERIALIZED VIEW IF NOT EXISTS inventory_summary_by_shop AS
SELECT 
    s.id as shop_id,
    s.name as shop_name,
    COUNT(ii.id) as total_items,
    COALESCE(SUM(ii.quantity), 0) as total_quantity,
    COALESCE(SUM(ii.quantity * ii."shopspecificcost"), 0) as total_value,
    COUNT(CASE WHEN ii.quantity < 10 THEN 1 END) as low_stock_count,
    MAX(ii."updatedAt") as last_updated
FROM "Shop" s
LEFT JOIN "InventoryItem" ii ON ii."shopId" = s.id
GROUP BY s.id, s.name;

-- Create unique index for shop summary view
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_summary_shop_unique ON inventory_summary_by_shop (shop_id);

-- =====================================
-- PERFORMANCE MONITORING
-- =====================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_summary_by_shop;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- STATISTICS UPDATE
-- =====================================

-- Update table statistics for better query planning
ANALYZE "User";
ANALYZE "Product";
ANALYZE "InventoryItem";
ANALYZE "Category";
ANALYZE "Shop";
ANALYZE "Invoice";
ANALYZE "InventoryTransfer";

-- =====================================
-- VERIFICATION QUERIES
-- =====================================

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC; 