-- Script to Add Invoices and Quotations Only
-- This script adds 2000 sales invoices, 2000 purchase invoices, and 2000 quotations
-- Products already exist (SKU-000001 to SKU-002000), so we skip product creation

-- =====================================================
-- STEP 1: ADD 2000 SALES INVOICES
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

-- Add invoice items (2-4 items per invoice) using existing products
WITH invoice_items AS (
  SELECT 
    i.id AS invoiceId,
    gs.item_number,
    p.id AS productId,
    (1 + (RANDOM() * 5)::int) AS quantity,
    ROUND((p.price * (0.8 + RANDOM() * 0.4))::numeric, 2) AS price, -- Price based on product price ± 20%
    ROUND((p.weightedaveragecost * (0.8 + RANDOM() * 0.4))::numeric, 2) AS costPrice
  FROM "Invoice" i 
  CROSS JOIN generate_series(1, 4) AS gs(item_number)
  CROSS JOIN LATERAL (
    SELECT id, price, weightedaveragecost 
    FROM "Product" 
    WHERE sku LIKE 'SKU-%'
    ORDER BY RANDOM() 
    LIMIT 1
  ) p
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
-- STEP 2: ADD 2000 PURCHASE INVOICES
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

-- Add purchase invoice items using existing products
WITH purchase_items AS (
  SELECT 
    pi.id AS purchaseInvoiceId,
    gs.item_number,
    p.id AS productId,
    (5 + (RANDOM() * 20)::int) AS quantity,
    ROUND((p.weightedaveragecost * (0.7 + RANDOM() * 0.6))::numeric, 2) AS price -- Wholesale price based on cost
  FROM "PurchaseInvoice" pi 
  CROSS JOIN generate_series(1, 6) AS gs(item_number)
  CROSS JOIN LATERAL (
    SELECT id, weightedaveragecost 
    FROM "Product" 
    WHERE sku LIKE 'SKU-%'
    ORDER BY RANDOM() 
    LIMIT 1
  ) p
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
-- STEP 3: ADD 2000 QUOTATIONS
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

-- Add quotation items using existing products
WITH quotation_items AS (
  SELECT 
    q.id AS quotationId,
    gs.item_number,
    p.id AS productId,
    (1 + (RANDOM() * 8)::int) AS quantity,
    ROUND((p.price * (0.85 + RANDOM() * 0.3))::numeric, 2) AS price -- Quoted price with potential discounts
  FROM "Quotation" q 
  CROSS JOIN generate_series(1, 5) AS gs(item_number)
  CROSS JOIN LATERAL (
    SELECT id, price 
    FROM "Product" 
    WHERE sku LIKE 'SKU-%'
    ORDER BY RANDOM() 
    LIMIT 1
  ) p
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
  'Products (Existing)' as data_type,
  COUNT(*) as total_records,
  'SKU-000001 to SKU-002000' as range_info
FROM "Product"
WHERE sku LIKE 'SKU-%'

UNION ALL

SELECT 
  'Sales Invoices (New)' as data_type,
  COUNT(*) as total_records,
  'INV-YYYY-XXXXXX format' as range_info
FROM "Invoice"
WHERE "invoiceNumber" LIKE 'INV-%'

UNION ALL

SELECT 
  'Purchase Invoices (New)' as data_type,
  COUNT(*) as total_records,
  'PINV-YYYY-XXXXXX format' as range_info
FROM "PurchaseInvoice"
WHERE "invoiceNumber" LIKE 'PINV-%'

UNION ALL

SELECT 
  'Quotations (New)' as data_type,
  COUNT(*) as total_records,
  'QUO-YYYY-XXXXXX format' as range_info
FROM "Quotation"
WHERE "quotationNumber" LIKE 'QUO-%';

-- All invoice and quotation data has been successfully created! 