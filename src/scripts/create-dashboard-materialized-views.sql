-- Dashboard Performance Optimization: Materialized Views
-- This script creates materialized views to improve dashboard query performance

-- 1. Dashboard Summary Materialized View
-- Pre-calculates total inventory value, pending transfers, and outstanding invoices
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_summary_mv AS
SELECT 
    'global' as scope,
    NULL as shop_id,
    COALESCE(SUM(ii.quantity * ii.unit_cost), 0) as total_inventory_value,
    COUNT(DISTINCT CASE WHEN t.status = 'PENDING' THEN t.id END) as pending_transfers,
    COALESCE(SUM(CASE WHEN i.status IN ('PENDING', 'OVERDUE') THEN i.total_amount ELSE 0 END), 0) as outstanding_invoices,
    NOW() as last_updated
FROM "InventoryItem" ii
LEFT JOIN "Transfer" t ON t.status = 'PENDING'
LEFT JOIN "Invoice" i ON i.status IN ('PENDING', 'OVERDUE')

UNION ALL

-- Shop-specific summary data
SELECT 
    'shop' as scope,
    s.id as shop_id,
    COALESCE(SUM(ii.quantity * ii.unit_cost), 0) as total_inventory_value,
    COUNT(DISTINCT CASE WHEN t.status = 'PENDING' AND (t."fromShopId" = s.id OR t."toShopId" = s.id) THEN t.id END) as pending_transfers,
    COALESCE(SUM(CASE WHEN i.status IN ('PENDING', 'OVERDUE') AND i."shopId" = s.id THEN i.total_amount ELSE 0 END), 0) as outstanding_invoices,
    NOW() as last_updated
FROM "Shop" s
LEFT JOIN "InventoryItem" ii ON ii."shopId" = s.id
LEFT JOIN "Transfer" t ON t.status = 'PENDING' AND (t."fromShopId" = s.id OR t."toShopId" = s.id)
LEFT JOIN "Invoice" i ON i.status IN ('PENDING', 'OVERDUE') AND i."shopId" = s.id
GROUP BY s.id;

-- 2. Inventory Distribution Materialized View
-- Pre-calculates inventory distribution by category and shop
CREATE MATERIALIZED VIEW IF NOT EXISTS inventory_distribution_mv AS
SELECT 
    ii."shopId",
    p.category,
    COUNT(*) as item_count,
    SUM(ii.quantity) as total_quantity,
    SUM(ii.quantity * ii.unit_cost) as total_value,
    AVG(ii.quantity) as avg_quantity,
    NOW() as last_updated
FROM "InventoryItem" ii
JOIN "Product" p ON ii."productId" = p.id
GROUP BY ii."shopId", p.category;

-- 3. Sales Performance Materialized View
-- Pre-calculates sales data for different time periods
CREATE MATERIALIZED VIEW IF NOT EXISTS sales_performance_mv AS
SELECT 
    t."shopId",
    DATE_TRUNC('day', t."createdAt") as sale_date,
    DATE_TRUNC('week', t."createdAt") as sale_week,
    DATE_TRUNC('month', t."createdAt") as sale_month,
    COUNT(*) as transaction_count,
    SUM(t."totalAmount") as total_sales,
    AVG(t."totalAmount") as avg_transaction_value,
    SUM(CASE WHEN t.type = 'SALE' THEN t."totalAmount" ELSE 0 END) as sales_amount,
    SUM(CASE WHEN t.type = 'RETURN' THEN t."totalAmount" ELSE 0 END) as returns_amount,
    NOW() as last_updated
FROM "Transaction" t
WHERE t."createdAt" >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY t."shopId", DATE_TRUNC('day', t."createdAt"), DATE_TRUNC('week', t."createdAt"), DATE_TRUNC('month', t."createdAt");

-- 4. Transfer Activity Materialized View
-- Pre-calculates transfer statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS transfer_activity_mv AS
SELECT 
    t."fromShopId" as shop_id,
    'outgoing' as direction,
    DATE_TRUNC('day', t."createdAt") as transfer_date,
    COUNT(*) as transfer_count,
    SUM(ti.quantity) as total_quantity,
    COUNT(DISTINCT t."toShopId") as unique_destinations,
    NOW() as last_updated
FROM "Transfer" t
JOIN "TransferItem" ti ON ti."transferId" = t.id
WHERE t."createdAt" >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY t."fromShopId", DATE_TRUNC('day', t."createdAt")

UNION ALL

SELECT 
    t."toShopId" as shop_id,
    'incoming' as direction,
    DATE_TRUNC('day', t."createdAt") as transfer_date,
    COUNT(*) as transfer_count,
    SUM(ti.quantity) as total_quantity,
    COUNT(DISTINCT t."fromShopId") as unique_sources,
    NOW() as last_updated
FROM "Transfer" t
JOIN "TransferItem" ti ON ti."transferId" = t.id
WHERE t."createdAt" >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY t."toShopId", DATE_TRUNC('day', t."createdAt");

-- Create indexes on materialized views for better query performance
CREATE INDEX IF NOT EXISTS idx_dashboard_summary_mv_shop_id ON dashboard_summary_mv(shop_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_summary_mv_scope ON dashboard_summary_mv(scope);

CREATE INDEX IF NOT EXISTS idx_inventory_distribution_mv_shop_id ON inventory_distribution_mv("shopId");
CREATE INDEX IF NOT EXISTS idx_inventory_distribution_mv_category ON inventory_distribution_mv(category);

CREATE INDEX IF NOT EXISTS idx_sales_performance_mv_shop_id ON sales_performance_mv("shopId");
CREATE INDEX IF NOT EXISTS idx_sales_performance_mv_date ON sales_performance_mv(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_performance_mv_week ON sales_performance_mv(sale_week);
CREATE INDEX IF NOT EXISTS idx_sales_performance_mv_month ON sales_performance_mv(sale_month);

CREATE INDEX IF NOT EXISTS idx_transfer_activity_mv_shop_id ON transfer_activity_mv(shop_id);
CREATE INDEX IF NOT EXISTS idx_transfer_activity_mv_date ON transfer_activity_mv(transfer_date);
CREATE INDEX IF NOT EXISTS idx_transfer_activity_mv_direction ON transfer_activity_mv(direction);

-- Create a function to refresh all dashboard materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW dashboard_summary_mv;
    REFRESH MATERIALIZED VIEW inventory_distribution_mv;
    REFRESH MATERIALIZED VIEW sales_performance_mv;
    REFRESH MATERIALIZED VIEW transfer_activity_mv;
    
    -- Log the refresh
    RAISE NOTICE 'Dashboard materialized views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to refresh materialized views every 15 minutes
-- Note: This requires pg_cron extension to be installed
-- SELECT cron.schedule('refresh-dashboard-views', '*/15 * * * *', 'SELECT refresh_dashboard_materialized_views();');

-- Manual refresh command (run this after creating the views)
-- SELECT refresh_dashboard_materialized_views();