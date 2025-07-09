-- FIX ZIMANTRA INVENTORY ISSUES
-- ===============================
-- This script fixes:
-- 1. Missing weighted average cost on products
-- 2. Missing distribution data on purchase invoice

-- Step 1: Update weighted average cost for all Zimantra products
-- Set the weighted average cost equal to the shop specific cost from inventory
UPDATE "Product" p
SET "weightedaveragecost" = ii."shopspecificcost",
    "updatedAt" = NOW()
FROM "InventoryItem" ii
WHERE p.id = ii."productId" 
  AND p."shopId" = 'cmc7vurx10000x5r4mrml2kh4'
  AND ii."shopId" = 'cmc7vurx10000x5r4mrml2kh4';

-- Step 2: Update purchase invoice with distribution data
-- Create distribution JSON showing that all items were distributed to Zimantra shop
UPDATE "PurchaseInvoice" 
SET "distributions" = jsonb_build_object(
    'cmc7vurx10000x5r4mrml2kh4', jsonb_build_object(
        'shopName', 'Zimantra',
        'totalQuantity', (
            SELECT SUM(pii.quantity) 
            FROM "PurchaseInvoiceItem" pii 
            WHERE pii."purchaseInvoiceId" = "PurchaseInvoice".id
        ),
        'totalValue', "total",
        'items', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'productId', pii."productId",
                    'productName', p.name,
                    'sku', p.sku,
                    'quantity', pii.quantity,
                    'unitCost', pii.price,
                    'totalCost', pii.total
                )
            )
            FROM "PurchaseInvoiceItem" pii
            JOIN "Product" p ON p.id = pii."productId"
            WHERE pii."purchaseInvoiceId" = "PurchaseInvoice".id
        )
    )
),
"updatedAt" = NOW()
WHERE "invoiceNumber" = 'PI-ZIM-2025-001';

-- Step 3: Verification queries
-- Check if weighted average costs are now updated
SELECT 
    'Weighted Average Cost Update' as check_type,
    COUNT(*) as total_products,
    COUNT(CASE WHEN "weightedaveragecost" IS NOT NULL THEN 1 END) as products_with_cost,
    COUNT(CASE WHEN "weightedaveragecost" IS NULL THEN 1 END) as products_without_cost
FROM "Product" 
WHERE "shopId" = 'cmc7vurx10000x5r4mrml2kh4';

-- Check if distribution data is now present
SELECT 
    'Distribution Data Update' as check_type,
    CASE 
        WHEN distributions IS NOT NULL THEN 'Distribution data present'
        ELSE 'Distribution data missing'
    END as status,
    jsonb_object_keys(distributions) as shop_ids
FROM "PurchaseInvoice" 
WHERE "invoiceNumber" = 'PI-ZIM-2025-001';

-- Sample of updated products
SELECT 
    name, 
    sku, 
    price as retail_price, 
    "weightedaveragecost",
    ROUND((price - "weightedaveragecost")::numeric, 2) as margin
FROM "Product" 
WHERE "shopId" = 'cmc7vurx10000x5r4mrml2kh4'
  AND "weightedaveragecost" IS NOT NULL
ORDER BY name
LIMIT 10; 