-- Inventory Transfer Performance Optimization Script
-- This script implements the recommended database optimizations

-- 1. Add composite index for transfer list queries
-- This will significantly improve the performance of transfer list loading
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_status_created 
ON "InventoryTransfer" (status, "createdAt" DESC);

-- 2. Add index for source shop queries
-- Improves performance when filtering transfers by source shop
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_source_shop 
ON "InventoryTransfer" ("sourceShopId", "createdAt" DESC);

-- 3. Add index for destination shop queries
-- Improves performance when filtering transfers by destination shop
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_destination_shop 
ON "InventoryTransfer" ("destinationShopId", "createdAt" DESC);

-- 4. Add composite index for user-specific queries
-- Improves performance when showing transfers created by specific users
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_user_status 
ON "InventoryTransfer" ("createdBy", status, "createdAt" DESC);

-- 5. Add index for transfer items product lookup
-- Improves performance when loading transfer details with items
CREATE INDEX IF NOT EXISTS idx_transfer_items_product 
ON "TransferItem" ("productId", "transferId");

-- 6. Add index for inventory items shop-product lookup
-- Improves performance for inventory availability checks
CREATE INDEX IF NOT EXISTS idx_inventory_items_shop_product 
ON "InventoryItem" ("shopId", "productId");

-- 7. Add index for inventory items with available quantity
-- Improves performance for inventory availability queries
CREATE INDEX IF NOT EXISTS idx_inventory_items_available_qty 
ON "InventoryItem" ("shopId", "productId") 
WHERE (quantity - "reservedQuantity") > 0;

-- 8. Add partial index for pending transfers
-- Improves performance for active transfer monitoring
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_pending 
ON "InventoryTransfer" ("createdAt" DESC) 
WHERE status = 'PENDING';

-- 9. Add index for audit log queries
-- Improves performance when showing transfer history
CREATE INDEX IF NOT EXISTS idx_audit_logs_transfer_actions 
ON "AuditLog" (action, "timestamp" DESC) 
WHERE action LIKE '%TRANSFER%';

-- 10. Add index for product search in transfers
-- Improves performance when searching transfers by product
CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer_product 
ON "TransferItem" ("transferId", "productId");

-- Performance Statistics Query
-- Run this to check index usage after implementation
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename IN ('InventoryTransfer', 'TransferItem', 'InventoryItem')
ORDER BY idx_scan DESC;
*/

-- Query Performance Analysis
-- Use EXPLAIN ANALYZE to test query performance
/*
EXPLAIN ANALYZE 
SELECT 
    it.*,
    ss.name as source_shop_name,
    ds.name as destination_shop_name
FROM "InventoryTransfer" it
JOIN "Shop" ss ON it."sourceShopId" = ss.id
JOIN "Shop" ds ON it."destinationShopId" = ds.id
WHERE it.status = 'PENDING'
ORDER BY it."createdAt" DESC
LIMIT 20;
*/