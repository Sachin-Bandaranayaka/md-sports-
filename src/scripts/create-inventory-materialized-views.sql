-- Enterprise-grade Inventory Materialized Views
-- This script creates optimized materialized views for inventory management

-- 1. Main Inventory Summary Materialized View
-- Pre-calculates all inventory data with status and aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS inventory_summary_mv AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.barcode,
    c.name as category,
    c.id as category_id,
    COALESCE(SUM(ii.quantity), 0) as total_stock,
    COUNT(DISTINCT ii."shopId") as shop_count,
    p.price as retail_price,
    COALESCE(p.weightedaveragecost, 0) as weighted_avg_cost,
    CASE 
        WHEN COALESCE(SUM(ii.quantity), 0) = 0 THEN 'Out of Stock'
        WHEN COALESCE(SUM(ii.quantity), 0) <= 10 THEN 'Low Stock'
        ELSE 'In Stock'
    END as status,
    COALESCE(SUM(ii.quantity * ii.unit_cost), 0) as total_value,
    AVG(ii.unit_cost) as avg_unit_cost,
    MIN(ii.quantity) as min_shop_stock,
    MAX(ii.quantity) as max_shop_stock,
    NOW() as last_updated,
    -- Search vector for full-text search
    to_tsvector('english', COALESCE(p.name, '') || ' ' || COALESCE(p.sku, '') || ' ' || COALESCE(p.barcode, '')) as search_vector
FROM "Product" p
LEFT JOIN "Category" c ON p."categoryId" = c.id
LEFT JOIN "InventoryItem" ii ON p.id = ii."productId"
GROUP BY p.id, p.name, p.sku, p.barcode, p.price, p.weightedaveragecost, c.name, c.id;

-- Create indexes on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_summary_mv_id ON inventory_summary_mv (id);
CREATE INDEX IF NOT EXISTS idx_inventory_summary_mv_category ON inventory_summary_mv (category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_summary_mv_status ON inventory_summary_mv (status);
CREATE INDEX IF NOT EXISTS idx_inventory_summary_mv_stock ON inventory_summary_mv (total_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_summary_mv_search ON inventory_summary_mv USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_inventory_summary_mv_name_sku ON inventory_summary_mv (name, sku);

-- 2. Inventory by Shop Materialized View
-- Pre-calculates inventory distribution across shops
CREATE MATERIALIZED VIEW IF NOT EXISTS inventory_by_shop_mv AS
SELECT 
    s.id as shop_id,
    s.name as shop_name,
    p.id as product_id,
    p.name as product_name,
    p.sku,
    c.name as category,
    ii.quantity,
    ii.unit_cost,
    (ii.quantity * ii.unit_cost) as total_value,
    CASE 
        WHEN ii.quantity = 0 THEN 'Out of Stock'
        WHEN ii.quantity <= 5 THEN 'Low Stock'
        ELSE 'In Stock'
    END as shop_status,
    NOW() as last_updated
FROM "Shop" s
CROSS JOIN "Product" p
LEFT JOIN "Category" c ON p."categoryId" = c.id
LEFT JOIN "InventoryItem" ii ON p.id = ii."productId" AND s.id = ii."shopId"
WHERE s.active = true;

-- Create indexes for shop-based queries
CREATE INDEX IF NOT EXISTS idx_inventory_by_shop_mv_shop_id ON inventory_by_shop_mv (shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_by_shop_mv_product_id ON inventory_by_shop_mv (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_by_shop_mv_category ON inventory_by_shop_mv (category);
CREATE INDEX IF NOT EXISTS idx_inventory_by_shop_mv_status ON inventory_by_shop_mv (shop_status);

-- 3. Inventory Analytics Materialized View
-- Pre-calculates analytics data for reporting
CREATE MATERIALIZED VIEW IF NOT EXISTS inventory_analytics_mv AS
SELECT 
    c.name as category,
    COUNT(DISTINCT p.id) as product_count,
    SUM(COALESCE(ii.quantity, 0)) as total_quantity,
    SUM(COALESCE(ii.quantity * ii.unit_cost, 0)) as total_value,
    AVG(COALESCE(ii.quantity, 0)) as avg_quantity_per_product,
    COUNT(DISTINCT ii."shopId") as shops_with_inventory,
    COUNT(CASE WHEN COALESCE(ii.quantity, 0) = 0 THEN 1 END) as out_of_stock_count,
    COUNT(CASE WHEN COALESCE(ii.quantity, 0) > 0 AND COALESCE(ii.quantity, 0) <= 10 THEN 1 END) as low_stock_count,
    COUNT(CASE WHEN COALESCE(ii.quantity, 0) > 10 THEN 1 END) as in_stock_count,
    NOW() as last_updated
FROM "Category" c
LEFT JOIN "Product" p ON c.id = p."categoryId"
LEFT JOIN "InventoryItem" ii ON p.id = ii."productId"
GROUP BY c.id, c.name;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_inventory_analytics_mv_category ON inventory_analytics_mv (category);

-- 4. Low Stock Alert Materialized View
-- Pre-calculates items that need attention
CREATE MATERIALIZED VIEW IF NOT EXISTS low_stock_alerts_mv AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku,
    c.name as category,
    s.id as shop_id,
    s.name as shop_name,
    COALESCE(ii.quantity, 0) as current_stock,
    CASE 
        WHEN COALESCE(ii.quantity, 0) = 0 THEN 'critical'
        WHEN COALESCE(ii.quantity, 0) <= 5 THEN 'low'
        WHEN COALESCE(ii.quantity, 0) <= 10 THEN 'warning'
        ELSE 'normal'
    END as alert_level,
    NOW() as last_updated
FROM "Product" p
LEFT JOIN "Category" c ON p."categoryId" = c.id
CROSS JOIN "Shop" s
LEFT JOIN "InventoryItem" ii ON p.id = ii."productId" AND s.id = ii."shopId"
WHERE s.active = true
  AND COALESCE(ii.quantity, 0) <= 10;

-- Create indexes for alert queries
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_mv_alert_level ON low_stock_alerts_mv (alert_level);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_mv_shop_id ON low_stock_alerts_mv (shop_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_mv_product_id ON low_stock_alerts_mv (product_id);

-- Function to refresh all inventory materialized views
CREATE OR REPLACE FUNCTION refresh_inventory_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_summary_mv;
    REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_by_shop_mv;
    REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_analytics_mv;
    REFRESH MATERIALIZED VIEW CONCURRENTLY low_stock_alerts_mv;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to auto-refresh materialized views
CREATE OR REPLACE FUNCTION trigger_refresh_inventory_views()
RETURNS trigger AS $$
BEGIN
    -- Use pg_notify to signal that views need refreshing
    PERFORM pg_notify('inventory_views_refresh', 'refresh_needed');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers on relevant tables
DROP TRIGGER IF EXISTS inventory_item_refresh_trigger ON "InventoryItem";
CREATE TRIGGER inventory_item_refresh_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "InventoryItem"
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_inventory_views();

DROP TRIGGER IF EXISTS product_refresh_trigger ON "Product";
CREATE TRIGGER product_refresh_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Product"
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_inventory_views();

DROP TRIGGER IF EXISTS category_refresh_trigger ON "Category";
CREATE TRIGGER category_refresh_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Category"
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_inventory_views();

-- Initial refresh of all views
SELECT refresh_inventory_materialized_views();