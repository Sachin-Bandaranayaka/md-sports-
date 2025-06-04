-- Materialized View for Transfer Statistics
-- This view pre-calculates transfer statistics for improved dashboard performance

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS transfer_stats_mv;

-- Create materialized view for transfer statistics
CREATE MATERIALIZED VIEW transfer_stats_mv AS
SELECT 
    -- Shop-level statistics
    s.id as shop_id,
    s.name as shop_name,
    
    -- Transfer counts by status
    COUNT(CASE WHEN it.status = 'pending' THEN 1 END) as pending_transfers,
    COUNT(CASE WHEN it.status = 'completed' THEN 1 END) as completed_transfers,
    COUNT(CASE WHEN it.status = 'cancelled' THEN 1 END) as cancelled_transfers,
    
    -- Outgoing transfers (as source)
    COUNT(CASE WHEN it."sourceShopId" = s.id THEN 1 END) as outgoing_transfers,
    COUNT(CASE WHEN it."sourceShopId" = s.id AND it.status = 'pending' THEN 1 END) as pending_outgoing,
    COUNT(CASE WHEN it."sourceShopId" = s.id AND it.status = 'completed' THEN 1 END) as completed_outgoing,
    
    -- Incoming transfers (as destination)
    COUNT(CASE WHEN it."destinationShopId" = s.id THEN 1 END) as incoming_transfers,
    COUNT(CASE WHEN it."destinationShopId" = s.id AND it.status = 'pending' THEN 1 END) as pending_incoming,
    COUNT(CASE WHEN it."destinationShopId" = s.id AND it.status = 'completed' THEN 1 END) as completed_incoming,
    
    -- Time-based statistics (last 30 days)
    COUNT(CASE WHEN it."createdAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as transfers_last_30_days,
    COUNT(CASE WHEN it."completedAt" >= CURRENT_DATE - INTERVAL '30 days' AND it.status = 'completed' THEN 1 END) as completed_last_30_days,
    
    -- Item statistics
    COALESCE(SUM(CASE WHEN it."sourceShopId" = s.id THEN ti.quantity END), 0) as total_items_sent,
    COALESCE(SUM(CASE WHEN it."destinationShopId" = s.id THEN ti.quantity END), 0) as total_items_received,
    
    -- Average transfer size
    COALESCE(AVG(CASE WHEN it."sourceShopId" = s.id OR it."destinationShopId" = s.id THEN ti.quantity END), 0) as avg_transfer_size,
    
    -- Most recent transfer dates
    MAX(CASE WHEN it."sourceShopId" = s.id OR it."destinationShopId" = s.id THEN it."createdAt" END) as last_transfer_date,
    MAX(CASE WHEN (it."sourceShopId" = s.id OR it."destinationShopId" = s.id) AND it.status = 'completed' THEN it."completedAt" END) as last_completed_date,
    
    -- Performance metrics
    COALESCE(AVG(CASE 
        WHEN it.status = 'completed' AND it."completedAt" IS NOT NULL AND it."createdAt" IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (it."completedAt" - it."createdAt")) / 3600 -- Hours
    END), 0) as avg_completion_time_hours,
    
    -- Update timestamp
    CURRENT_TIMESTAMP as last_updated
    
FROM "Shop" s
LEFT JOIN "InventoryTransfer" it ON (s.id = it."sourceShopId" OR s.id = it."destinationShopId")
LEFT JOIN "TransferItem" ti ON it.id = ti."transferId"
GROUP BY s.id, s.name;

-- Create indexes on the materialized view
CREATE UNIQUE INDEX idx_transfer_stats_mv_shop_id ON transfer_stats_mv (shop_id);
CREATE INDEX idx_transfer_stats_mv_pending ON transfer_stats_mv (pending_transfers DESC);
CREATE INDEX idx_transfer_stats_mv_last_updated ON transfer_stats_mv (last_updated DESC);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_transfer_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY transfer_stats_mv;
END;
$$ LANGUAGE plpgsql;

-- Create a view for product transfer statistics
CREATE OR REPLACE VIEW product_transfer_stats_v AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku,
    
    -- Transfer frequency
    COUNT(ti.id) as total_transfers,
    COUNT(CASE WHEN it.status = 'completed' THEN ti.id END) as completed_transfers,
    COUNT(CASE WHEN it.status = 'pending' THEN ti.id END) as pending_transfers,
    
    -- Quantity statistics
    COALESCE(SUM(ti.quantity), 0) as total_quantity_transferred,
    COALESCE(AVG(ti.quantity), 0) as avg_quantity_per_transfer,
    COALESCE(MAX(ti.quantity), 0) as max_quantity_transferred,
    
    -- Time-based statistics
    COUNT(CASE WHEN it."createdAt" >= CURRENT_DATE - INTERVAL '30 days' THEN ti.id END) as transfers_last_30_days,
    COUNT(CASE WHEN it."createdAt" >= CURRENT_DATE - INTERVAL '7 days' THEN ti.id END) as transfers_last_7_days,
    
    -- Most recent transfer
    MAX(it."createdAt") as last_transfer_date,
    MAX(CASE WHEN it.status = 'completed' THEN it."completedAt" END) as last_completed_transfer,
    
    -- Shop distribution
    COUNT(DISTINCT it."sourceShopId") as source_shops_count,
    COUNT(DISTINCT it."destinationShopId") as destination_shops_count,
    
    -- Current inventory levels across all shops
    COALESCE(SUM(inv.quantity), 0) as current_total_inventory,
    COUNT(CASE WHEN inv.quantity > 0 THEN inv.id END) as shops_with_stock
    
FROM "Product" p
LEFT JOIN "TransferItem" ti ON p.id = ti."productId"
LEFT JOIN "InventoryTransfer" it ON ti."transferId" = it.id
LEFT JOIN "InventoryItem" inv ON p.id = inv."productId"
GROUP BY p.id, p.name, p.sku;

-- Create a view for daily transfer summary
CREATE OR REPLACE VIEW daily_transfer_summary_v AS
SELECT 
    DATE(it."createdAt") as transfer_date,
    
    -- Transfer counts
    COUNT(*) as total_transfers,
    COUNT(CASE WHEN it.status = 'completed' THEN 1 END) as completed_transfers,
    COUNT(CASE WHEN it.status = 'pending' THEN 1 END) as pending_transfers,
    COUNT(CASE WHEN it.status = 'cancelled' THEN 1 END) as cancelled_transfers,
    
    -- Item statistics
    COALESCE(SUM(ti.quantity), 0) as total_items_transferred,
    COALESCE(AVG(ti.quantity), 0) as avg_items_per_transfer,
    
    -- Shop statistics
    COUNT(DISTINCT it."sourceShopId") as unique_source_shops,
    COUNT(DISTINCT it."destinationShopId") as unique_destination_shops,
    COUNT(DISTINCT ti."productId") as unique_products,
    
    -- Performance metrics
    COALESCE(AVG(CASE 
        WHEN it.status = 'completed' AND it."completedAt" IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (it."completedAt" - it."createdAt")) / 3600
    END), 0) as avg_completion_time_hours
    
FROM "InventoryTransfer" it
LEFT JOIN "TransferItem" ti ON it.id = ti."transferId"
WHERE it."createdAt" >= CURRENT_DATE - INTERVAL '90 days' -- Last 90 days
GROUP BY DATE(it."createdAt")
ORDER BY transfer_date DESC;

-- Create indexes for the views
CREATE INDEX idx_product_transfer_stats_product_id ON "TransferItem" ("productId");
CREATE INDEX idx_daily_transfer_summary_date ON "InventoryTransfer" (DATE("createdAt"));

-- Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW transfer_stats_mv;

-- Grant permissions (adjust as needed for your user roles)
-- GRANT SELECT ON transfer_stats_mv TO your_app_user;
-- GRANT SELECT ON product_transfer_stats_v TO your_app_user;
-- GRANT SELECT ON daily_transfer_summary_v TO your_app_user;
-- GRANT EXECUTE ON FUNCTION refresh_transfer_stats() TO your_app_user;