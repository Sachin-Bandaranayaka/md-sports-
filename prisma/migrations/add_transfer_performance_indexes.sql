-- Performance Optimization Indexes for Inventory Transfers
-- This migration adds indexes to improve transfer operation performance

-- Index for transfer queries by status and shop
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_status_shops 
ON "InventoryTransfer" ("status", "sourceShopId", "destinationShopId");

-- Index for transfer queries by date range
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_created_at 
ON "InventoryTransfer" ("createdAt" DESC);

-- Index for transfer queries by user
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_user 
ON "InventoryTransfer" ("initiatedBy", "status");

-- Composite index for transfer items lookup
CREATE INDEX IF NOT EXISTS idx_transfer_item_transfer_product 
ON "TransferItem" ("transferId", "productId");

-- Index for inventory items by shop and product (for WAC calculations)
CREATE INDEX IF NOT EXISTS idx_inventory_item_shop_product_quantity 
ON "InventoryItem" ("shopId", "productId", "quantity") 
WHERE "quantity" > 0;

-- Index for inventory items by product (for global WAC calculations)
CREATE INDEX IF NOT EXISTS idx_inventory_item_product_quantity 
ON "InventoryItem" ("productId", "quantity") 
WHERE "quantity" > 0;

-- Index for product WAC lookups
CREATE INDEX IF NOT EXISTS idx_product_wac 
ON "Product" ("id", "weightedAverageCost");

-- Index for user shop permissions
CREATE INDEX IF NOT EXISTS idx_user_shop_permissions 
ON "UserShop" ("userId", "shopId");

-- Partial index for pending transfers (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_pending 
ON "InventoryTransfer" ("sourceShopId", "destinationShopId", "createdAt" DESC) 
WHERE "status" = 'pending';

-- Partial index for completed transfers (for reporting)
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_completed 
ON "InventoryTransfer" ("completedAt" DESC, "sourceShopId", "destinationShopId") 
WHERE "status" = 'completed';

-- Index for transfer search by product name (if needed)
-- This would require a join, so we'll add it to the product table
CREATE INDEX IF NOT EXISTS idx_product_name_search 
ON "Product" USING gin(to_tsvector('english', "name"));

-- Index for shop name searches
CREATE INDEX IF NOT EXISTS idx_shop_name_search 
ON "Shop" USING gin(to_tsvector('english', "name"));

-- Statistics update to help query planner
ANALYZE "InventoryTransfer";
ANALYZE "TransferItem";
ANALYZE "InventoryItem";
ANALYZE "Product";
ANALYZE "Shop";
ANALYZE "UserShop";