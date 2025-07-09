-- Master Script to Add All Inventory and Transaction Data
-- This script adds 2000 products, 2000 sales invoices, 2000 purchase invoices, and 2000 quotations
-- Run this script when you have write access to the database

-- =====================================================
-- STEP 1: ADD 2000 PRODUCTS
-- =====================================================
-- Creating 2000 products...

-- First batch: 1000 products with basic generation
WITH product_batch_1 AS (
  SELECT 
    CASE 
      WHEN (generate_series % 10) = 0 THEN 'Professional ' || 
        CASE 
          WHEN (generate_series % 3) = 0 THEN 'Grip Tape Pro-' || generate_series
          WHEN (generate_series % 3) = 1 THEN 'Carbon Racket Elite-' || generate_series
          ELSE 'Feather Shuttle Premium-' || generate_series
        END
      WHEN (generate_series % 10) = 1 THEN 'Tournament ' ||
        CASE 
          WHEN (generate_series % 3) = 0 THEN 'Grip Wrap Tournament-' || generate_series
          WHEN (generate_series % 3) = 1 THEN 'Titanium Racket Pro-' || generate_series
          ELSE 'Synthetic Shuttle Tour-' || generate_series
        END
      WHEN (generate_series % 10) = 2 THEN 'Training ' ||
        CASE 
          WHEN (generate_series % 3) = 0 THEN 'Comfort Grip Train-' || generate_series
          WHEN (generate_series % 3) = 1 THEN 'Aluminum Racket Basic-' || generate_series
          ELSE 'Plastic Shuttle Practice-' || generate_series
        END
      ELSE 'Sports ' ||
        CASE 
          WHEN (generate_series % 3) = 0 THEN 'Grip Accessory-' || generate_series
          WHEN (generate_series % 3) = 1 THEN 'Badminton Racket-' || generate_series
          ELSE 'Shuttlecock Set-' || generate_series
        END
    END AS name,
    CASE 
      WHEN (generate_series % 5) = 0 THEN 'Professional grade sports equipment with premium materials and advanced engineering for competitive play'
      WHEN (generate_series % 5) = 1 THEN 'High-quality sporting goods designed for tournament-level performance and durability'
      WHEN (generate_series % 5) = 2 THEN 'Training equipment suitable for skill development and regular practice sessions'
      WHEN (generate_series % 5) = 3 THEN 'Recreational sports gear perfect for casual play and fitness activities'
      ELSE 'Durable and reliable sports equipment designed for consistent performance and long-lasting use'
    END AS description,
    CASE 
      WHEN (generate_series % 100) < 25 THEN ROUND((RANDOM() * 40 + 10)::numeric, 2)  -- Budget range: 10-50
      WHEN (generate_series % 100) < 50 THEN ROUND((RANDOM() * 60 + 40)::numeric, 2)  -- Mid range: 40-100
      WHEN (generate_series % 100) < 75 THEN ROUND((RANDOM() * 100 + 80)::numeric, 2) -- High range: 80-180
      ELSE ROUND((RANDOM() * 150 + 150)::numeric, 2) -- Premium range: 150-300
    END AS price,
    'SKU-' || LPAD(generate_series::text, 6, '0') AS sku,
    'BAR' || LPAD((generate_series * 13 + 1000000)::text, 12, '0') AS barcode,
    CASE 
      WHEN (generate_series % 3) = 0 THEN 17  -- Grips
      WHEN (generate_series % 3) = 1 THEN 18  -- Rackets
      ELSE 19 -- Shuttle
    END AS categoryId,
    CASE 
      WHEN (generate_series % 2) = 0 THEN 'cmc7vurx10000x5r4mrml2kh4'  -- Zimantra
      ELSE 'cmc7vuzmj0001x5r4ep9oblj2' -- MBA
    END AS shopId,
    NOW() AS createdAt,
    NOW() AS updatedAt,
    CASE 
      WHEN (generate_series % 100) < 25 THEN ROUND((RANDOM() * 25 + 5)::numeric, 2)   -- Low cost
      WHEN (generate_series % 100) < 50 THEN ROUND((RANDOM() * 45 + 20)::numeric, 2)  -- Mid cost
      WHEN (generate_series % 100) < 75 THEN ROUND((RANDOM() * 70 + 40)::numeric, 2)  -- High cost
      ELSE ROUND((RANDOM() * 100 + 80)::numeric, 2) -- Premium cost
    END AS weightedaveragecost,
    (RANDOM() * 45 + 10)::integer AS min_stock_level
  FROM generate_series(1, 1000)
)
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", "createdAt", "updatedAt", weightedaveragecost, min_stock_level)
SELECT name, description, price, sku, barcode, categoryId, shopId, createdAt, updatedAt, weightedaveragecost, min_stock_level
FROM product_batch_1;

-- Second batch: Another 1000 products
WITH product_batch_2 AS (
  SELECT 
    CASE 
      WHEN (generate_series % 8) = 0 THEN 'Elite ' || 
        CASE 
          WHEN (generate_series % 3) = 0 THEN 'Grip Master Elite-' || (generate_series + 1000)
          WHEN (generate_series % 3) = 1 THEN 'Power Racket Elite-' || (generate_series + 1000)
          ELSE 'Speed Shuttle Elite-' || (generate_series + 1000)
        END
      WHEN (generate_series % 8) = 1 THEN 'Champion ' ||
        CASE 
          WHEN (generate_series % 3) = 0 THEN 'Grip Champion-' || (generate_series + 1000)
          WHEN (generate_series % 3) = 1 THEN 'Flex Racket Champion-' || (generate_series + 1000)
          ELSE 'Flight Shuttle Champion-' || (generate_series + 1000)
        END
      ELSE 'Supreme ' ||
        CASE 
          WHEN (generate_series % 3) = 0 THEN 'Grip Supreme-' || (generate_series + 1000)
          WHEN (generate_series % 3) = 1 THEN 'Ultra Racket Supreme-' || (generate_series + 1000)
          ELSE 'Shuttle Supreme-' || (generate_series + 1000)
        END
    END AS name,
    'State-of-the-art sporting goods featuring modern technology and professional-grade specifications' AS description,
    ROUND((50 + RANDOM() * 250)::numeric, 2) AS price,
    'SKU-' || LPAD((generate_series + 1000)::text, 6, '0') AS sku,
    'BAR' || LPAD(((generate_series + 1000) * 17 + 2000000)::text, 12, '0') AS barcode,
    CASE 
      WHEN (generate_series % 3) = 0 THEN 17  -- Grips
      WHEN (generate_series % 3) = 1 THEN 18  -- Rackets
      ELSE 19 -- Shuttle
    END AS categoryId,
    CASE 
      WHEN (generate_series % 2) = 0 THEN 'cmc7vuzmj0001x5r4ep9oblj2'  -- MBA
      ELSE 'cmc7vurx10000x5r4mrml2kh4' -- Zimantra
    END AS shopId,
    NOW() AS createdAt,
    NOW() AS updatedAt,
    ROUND((30 + RANDOM() * 120)::numeric, 2) AS weightedaveragecost,
    (RANDOM() * 40 + 15)::integer AS min_stock_level
  FROM generate_series(1, 1000)
)
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", "createdAt", "updatedAt", weightedaveragecost, min_stock_level)
SELECT name, description, price, sku, barcode, categoryId, shopId, createdAt, updatedAt, weightedaveragecost, min_stock_level
FROM product_batch_2;

-- Products created successfully!

-- =====================================================
-- STEP 2: ADD 2000 SALES INVOICES
-- =====================================================
-- Creating 2000 sales invoices...

-- Create sales invoices
WITH invoice_data AS (
  SELECT 
    'INV-' || TO_CHAR(CURRENT_DATE - (RANDOM() * 365)::int, 'YYYY') || '-' || LPAD(generate_series::text, 6, '0') AS invoiceNumber,
    CASE 
      WHEN (generate_series % 4) = 0 THEN 81  -- ERANGA
      WHEN (generate_series % 4) = 1 THEN 82  -- SAUMI
      WHEN (generate_series % 4) = 2 THEN 83  -- sachin
      ELSE 84 -- test
    END AS customerId,
    0.00 AS total,
    CASE 
      WHEN (generate_series % 10) < 7 THEN 'paid'
      WHEN (generate_series % 10) < 9 THEN 'pending'
      ELSE 'overdue'
    END AS status,
    (CURRENT_DATE - (RANDOM() * 365)::int) AS invoiceDate,
    (CURRENT_DATE - (RANDOM() * 365)::int + (RANDOM() * 30 + 15)::int) AS dueDate,
    'Thank you for your business!' AS notes,
    CASE 
      WHEN (generate_series % 6) = 0 THEN 'Cash'
      WHEN (generate_series % 6) = 1 THEN 'Credit Card'
      ELSE 'Bank Transfer'
    END AS paymentMethod,
    0.00 AS profitMargin,
    CASE 
      WHEN (generate_series % 2) = 0 THEN 'cmc7vurx10000x5r4mrml2kh4'
      ELSE 'cmc7vuzmj0001x5r4ep9oblj2'
    END AS shopId,
    0.00 AS totalProfit,
    '4447d3a9-595b-483e-b55a-38f0f6160121' AS createdBy,
    NOW() AS createdAt,
    NOW() AS updatedAt
  FROM generate_series(1, 2000)
)
INSERT INTO "Invoice" (
  "invoiceNumber", "customerId", total, status, "invoiceDate", "dueDate", 
  notes, "paymentMethod", "profitMargin", "shopId", "totalProfit", "createdBy", "createdAt", "updatedAt"
)
SELECT * FROM invoice_data;

-- Add invoice items (2-4 items per invoice)
WITH invoice_items AS (
  SELECT 
    i.id AS invoiceId,
    gs.item_number,
    (1 + (RANDOM() * 2000)::int) AS productId,
    (1 + (RANDOM() * 5)::int) AS quantity,
    ROUND((50 + RANDOM() * 150)::numeric, 2) AS price,
    ROUND((30 + RANDOM() * 80)::numeric, 2) AS costPrice
  FROM "Invoice" i 
  CROSS JOIN generate_series(1, 4) AS gs(item_number)
  WHERE i."invoiceNumber" LIKE 'INV-%'
  AND (
    gs.item_number <= 2 OR 
    (gs.item_number = 3 AND RANDOM() > 0.3) OR
    (gs.item_number = 4 AND RANDOM() > 0.7)
  )
)
INSERT INTO "InvoiceItem" ("invoiceId", "productId", quantity, price, total, "costPrice", profit, "createdAt", "updatedAt")
SELECT 
  invoiceId, productId, quantity, price,
  ROUND((price * quantity)::numeric, 2) AS total,
  costPrice,
  ROUND(((price - costPrice) * quantity)::numeric, 2) AS profit,
  NOW(), NOW()
FROM invoice_items;

-- Update invoice totals
UPDATE "Invoice" 
SET total = subquery.invoice_total,
    "totalProfit" = subquery.total_profit,
    "profitMargin" = CASE WHEN subquery.invoice_total > 0 THEN ROUND((subquery.total_profit / subquery.invoice_total * 100)::numeric, 2) ELSE 0 END
FROM (
  SELECT "invoiceId", SUM(total) AS invoice_total, SUM(profit) AS total_profit
  FROM "InvoiceItem" GROUP BY "invoiceId"
) AS subquery
WHERE "Invoice".id = subquery."invoiceId" AND "Invoice"."invoiceNumber" LIKE 'INV-%';

-- Sales invoices created successfully!

-- =====================================================
-- STEP 3: ADD 2000 PURCHASE INVOICES
-- =====================================================
-- Creating 2000 purchase invoices...

-- Create purchase invoices
WITH purchase_data AS (
  SELECT 
    'PINV-' || TO_CHAR(CURRENT_DATE - (RANDOM() * 365)::int, 'YYYY') || '-' || LPAD(generate_series::text, 6, '0') AS invoiceNumber,
    CASE 
      WHEN (generate_series % 3) = 0 THEN 23  -- INDIA
      WHEN (generate_series % 3) = 1 THEN 24  -- CHINA
      ELSE 25 -- USA
    END AS supplierId,
    0.00 AS total,
    CASE 
      WHEN (generate_series % 10) < 6 THEN 'received'
      WHEN (generate_series % 10) < 8 THEN 'pending'
      ELSE 'ordered'
    END AS status,
    (CURRENT_DATE - (RANDOM() * 365)::int) AS date,
    NULL AS distributions,
    (CURRENT_DATE + (RANDOM() * 30 + 15)::int) AS dueDate,
    NOW() AS createdAt,
    NOW() AS updatedAt
  FROM generate_series(1, 2000)
)
INSERT INTO "PurchaseInvoice" ("invoiceNumber", "supplierId", total, status, date, distributions, "dueDate", "createdAt", "updatedAt")
SELECT * FROM purchase_data;

-- Add purchase invoice items
WITH purchase_items AS (
  SELECT 
    pi.id AS purchaseInvoiceId,
    gs.item_number,
    (1 + (RANDOM() * 2000)::int) AS productId,
    (5 + (RANDOM() * 20)::int) AS quantity,
    ROUND((20 + RANDOM() * 60)::numeric, 2) AS price
  FROM "PurchaseInvoice" pi 
  CROSS JOIN generate_series(1, 6) AS gs(item_number)
  WHERE pi."invoiceNumber" LIKE 'PINV-%'
  AND (
    gs.item_number <= 3 OR 
    (gs.item_number = 4 AND RANDOM() > 0.3) OR
    (gs.item_number = 5 AND RANDOM() > 0.6) OR
    (gs.item_number = 6 AND RANDOM() > 0.8)
  )
)
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  purchaseInvoiceId, productId, quantity, price,
  ROUND((price * quantity)::numeric, 2) AS total,
  NOW(), NOW()
FROM purchase_items;

-- Update purchase invoice totals
UPDATE "PurchaseInvoice" 
SET total = subquery.invoice_total
FROM (
  SELECT "purchaseInvoiceId", SUM(total) AS invoice_total
  FROM "PurchaseInvoiceItem" GROUP BY "purchaseInvoiceId"
) AS subquery
WHERE "PurchaseInvoice".id = subquery."purchaseInvoiceId" AND "PurchaseInvoice"."invoiceNumber" LIKE 'PINV-%';

-- Purchase invoices created successfully!

-- =====================================================
-- STEP 4: ADD 2000 QUOTATIONS
-- =====================================================
-- Creating 2000 quotations...

-- Create quotations
WITH quotation_data AS (
  SELECT 
    'QUO-' || TO_CHAR(CURRENT_DATE - (RANDOM() * 365)::int, 'YYYY') || '-' || LPAD(generate_series::text, 6, '0') AS quotationNumber,
    CASE 
      WHEN (generate_series % 4) = 0 THEN 81  -- ERANGA
      WHEN (generate_series % 4) = 1 THEN 82  -- SAUMI
      WHEN (generate_series % 4) = 2 THEN 83  -- sachin
      ELSE 84 -- test
    END AS customerId,
    0.00 AS total,
    (CURRENT_DATE + (RANDOM() * 60 + 15)::int) AS validUntil,
    CASE 
      WHEN (generate_series % 2) = 0 THEN 'cmc7vurx10000x5r4mrml2kh4'
      ELSE 'cmc7vuzmj0001x5r4ep9oblj2'
    END AS shopId,
    NOW() AS createdAt,
    NOW() AS updatedAt
  FROM generate_series(1, 2000)
)
INSERT INTO "Quotation" ("quotationNumber", "customerId", total, "validUntil", "shopId", "createdAt", "updatedAt")
SELECT * FROM quotation_data;

-- Add quotation items
WITH quotation_items AS (
  SELECT 
    q.id AS quotationId,
    gs.item_number,
    (1 + (RANDOM() * 2000)::int) AS productId,
    (1 + (RANDOM() * 8)::int) AS quantity,
    ROUND((40 + RANDOM() * 180)::numeric, 2) AS price
  FROM "Quotation" q 
  CROSS JOIN generate_series(1, 5) AS gs(item_number)
  WHERE q."quotationNumber" LIKE 'QUO-%'
  AND (
    gs.item_number <= 2 OR 
    (gs.item_number = 3 AND RANDOM() > 0.4) OR
    (gs.item_number = 4 AND RANDOM() > 0.7) OR
    (gs.item_number = 5 AND RANDOM() > 0.85)
  )
)
INSERT INTO "QuotationItem" ("quotationId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  quotationId, productId, quantity, price,
  ROUND((price * quantity)::numeric, 2) AS total,
  NOW(), NOW()
FROM quotation_items;

-- Update quotation totals
UPDATE "Quotation" 
SET total = subquery.quotation_total
FROM (
  SELECT "quotationId", SUM(total) AS quotation_total
  FROM "QuotationItem" GROUP BY "quotationId"
) AS subquery
WHERE "Quotation".id = subquery."quotationId" AND "Quotation"."quotationNumber" LIKE 'QUO-%';

-- Quotations created successfully!

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================
-- Data creation completed! Here is the summary:

SELECT 
  'Products' as data_type,
  COUNT(*) as total_records,
  'SKU-000001 to SKU-002000' as range_info
FROM "Product"
WHERE sku LIKE 'SKU-%'

UNION ALL

SELECT 
  'Sales Invoices' as data_type,
  COUNT(*) as total_records,
  'INV-YYYY-XXXXXX format' as range_info
FROM "Invoice"
WHERE "invoiceNumber" LIKE 'INV-%'

UNION ALL

SELECT 
  'Purchase Invoices' as data_type,
  COUNT(*) as total_records,
  'PINV-YYYY-XXXXXX format' as range_info
FROM "PurchaseInvoice"
WHERE "invoiceNumber" LIKE 'PINV-%'

UNION ALL

SELECT 
  'Quotations' as data_type,
  COUNT(*) as total_records,
  'QUO-YYYY-XXXXXX format' as range_info
FROM "Quotation"
WHERE "quotationNumber" LIKE 'QUO-%';

-- All data has been successfully created! 