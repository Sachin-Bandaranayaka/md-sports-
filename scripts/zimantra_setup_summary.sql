-- ZIMANTRA INVENTORY SETUP - MANUAL EXECUTION GUIDE
-- ===================================================
-- 
-- Total Products: 360
-- Total Inventory Value: RM 8,779,106.56
-- Expected Total: RM 8,779,108.81
-- 
-- INSTRUCTIONS:
-- 1. Execute this file directly in your Supabase SQL Editor or psql
-- 2. Verify all products are created
-- 3. Verify purchase invoice is created with total RM 8,779,106.56
-- 
-- Shop Information:
-- Zimantra Shop ID: cmc7vurx10000x5r4mrml2kh4
-- Supplier: INDIA (ID: 23)
-- Purchase Invoice: PI-ZIM-2025-001
--

-- Step 1: Create Purchase Invoice Header
INSERT INTO "PurchaseInvoice" (
  "invoiceNumber", 
  "invoiceDate", 
  "supplierId", 
  "shopId", 
  "total", 
  "paid", 
  "balance", 
  "status", 
  "createdAt", 
  "updatedAt"
) VALUES (
  'PI-ZIM-2025-001',
  NOW(),
  23,
  'cmc7vurx10000x5r4mrml2kh4',
  8779106.56,
  8779106.56,
  0,
  'PAID',
  NOW(),
  NOW()
);

-- Step 2: Execute the full product creation script
-- Run the complete zimantra_inventory_setup.sql file to create:
-- - 360 products
-- - 360 purchase invoice items  
-- - 360 inventory items

-- Verification queries (run after executing the main script):

-- Check products count
SELECT COUNT(*) as products_count FROM "Product" WHERE "shopId" = 'cmc7vurx10000x5r4mrml2kh4';

-- Check purchase invoice total
SELECT "invoiceNumber", "total" FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001';

-- Check inventory total value
SELECT 
  SUM(ii.quantity * ii."shopspecificcost") as total_inventory_value
FROM "InventoryItem" ii
WHERE ii."shopId" = 'cmc7vurx10000x5r4mrml2kh4';

-- Products by category summary
SELECT 
  c.name as category_name,
  COUNT(p.id) as product_count
FROM "Product" p
JOIN "Category" c ON p."categoryId" = c.id
WHERE p."shopId" = 'cmc7vurx10000x5r4mrml2kh4'
GROUP BY c.name
ORDER BY product_count DESC; 