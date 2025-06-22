-- MS Sport Test Data Population Script
-- This script will populate the database with 2000 products and 1000 customers
-- for comprehensive testing

-- First, let's create some categories if they don't exist
INSERT INTO "Category" (id, name, description, "createdAt", "updatedAt") 
VALUES 
  (1, 'Sports Equipment', 'General sports equipment and gear', NOW(), NOW()),
  (2, 'Footwear', 'Sports shoes and athletic footwear', NOW(), NOW()),
  (3, 'Apparel', 'Sports clothing and uniforms', NOW(), NOW()),
  (4, 'Accessories', 'Sports accessories and small items', NOW(), NOW()),
  (5, 'Team Sports', 'Equipment for team sports', NOW(), NOW()),
  (6, 'Individual Sports', 'Equipment for individual sports', NOW(), NOW()),
  (7, 'Fitness Equipment', 'Gym and fitness equipment', NOW(), NOW()),
  (8, 'Outdoor Sports', 'Outdoor and adventure sports gear', NOW(), NOW()),
  (9, 'Water Sports', 'Swimming and water sports equipment', NOW(), NOW()),
  (10, 'Winter Sports', 'Winter and snow sports equipment', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create suppliers if they don't exist
INSERT INTO "Supplier" (id, name, email, phone, address, "createdAt", "updatedAt")
VALUES 
  (1, 'SportsTech Global', 'orders@sportstech.com', '+1-555-0101', '123 Sports Ave, New York, NY', NOW(), NOW()),
  (2, 'Athletic Pro Supply', 'sales@athleticpro.com', '+1-555-0102', '456 Fitness Blvd, Los Angeles, CA', NOW(), NOW()),
  (3, 'Elite Sports Distributors', 'info@elitesports.com', '+1-555-0103', '789 Champion St, Chicago, IL', NOW(), NOW()),
  (4, 'Premium Athletics', 'contact@premiumath.com', '+1-555-0104', '321 Victory Lane, Miami, FL', NOW(), NOW()),
  (5, 'Global Sports Network', 'orders@globalsports.com', '+1-555-0105', '654 Athletic Way, Dallas, TX', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Generate 2000 products
WITH product_data AS (
  SELECT 
    generate_series(1, 2000) as id,
    CASE 
      WHEN generate_series(1, 2000) % 10 = 1 THEN 'Running Shoes Model ' || generate_series(1, 2000)
      WHEN generate_series(1, 2000) % 10 = 2 THEN 'Basketball Jersey #' || generate_series(1, 2000)
      WHEN generate_series(1, 2000) % 10 = 3 THEN 'Tennis Racket Pro ' || generate_series(1, 2000)
      WHEN generate_series(1, 2000) % 10 = 4 THEN 'Football Cleats ' || generate_series(1, 2000)
      WHEN generate_series(1, 2000) % 10 = 5 THEN 'Yoga Mat Premium ' || generate_series(1, 2000)
      WHEN generate_series(1, 2000) % 10 = 6 THEN 'Dumbbells Set ' || generate_series(1, 2000) || 'kg'
      WHEN generate_series(1, 2000) % 10 = 7 THEN 'Swimming Goggles ' || generate_series(1, 2000)
      WHEN generate_series(1, 2000) % 10 = 8 THEN 'Cycling Helmet ' || generate_series(1, 2000)
      WHEN generate_series(1, 2000) % 10 = 9 THEN 'Golf Club Driver ' || generate_series(1, 2000)
      ELSE 'Sports Water Bottle ' || generate_series(1, 2000)
    END as name,
    CASE 
      WHEN generate_series(1, 2000) % 10 IN (1, 4) THEN 2  -- Footwear
      WHEN generate_series(1, 2000) % 10 = 2 THEN 3        -- Apparel
      WHEN generate_series(1, 2000) % 10 IN (3, 9) THEN 6  -- Individual Sports
      WHEN generate_series(1, 2000) % 10 IN (5, 6) THEN 7  -- Fitness Equipment
      WHEN generate_series(1, 2000) % 10 = 7 THEN 9        -- Water Sports
      WHEN generate_series(1, 2000) % 10 = 8 THEN 8        -- Outdoor Sports
      ELSE 4                                                -- Accessories
    END as "categoryId",
    'SKU-' || LPAD(generate_series(1, 2000)::text, 6, '0') as sku,
    'Barcode-' || (1000000000 + generate_series(1, 2000))::text as barcode,
    CASE 
      WHEN generate_series(1, 2000) % 10 = 1 THEN 'High-performance running shoes with advanced cushioning technology'
      WHEN generate_series(1, 2000) % 10 = 2 THEN 'Professional basketball jersey with moisture-wicking fabric'
      WHEN generate_series(1, 2000) % 10 = 3 THEN 'Professional tennis racket with carbon fiber construction'
      WHEN generate_series(1, 2000) % 10 = 4 THEN 'Football cleats with superior grip and comfort'
      WHEN generate_series(1, 2000) % 10 = 5 THEN 'Premium yoga mat with non-slip surface'
      WHEN generate_series(1, 2000) % 10 = 6 THEN 'Professional dumbbells set for strength training'
      WHEN generate_series(1, 2000) % 10 = 7 THEN 'Anti-fog swimming goggles with UV protection'
      WHEN generate_series(1, 2000) % 10 = 8 THEN 'Lightweight cycling helmet with ventilation system'
      WHEN generate_series(1, 2000) % 10 = 9 THEN 'Professional golf driver with titanium head'
      ELSE 'BPA-free sports water bottle with leak-proof design'
    END as description,
    ROUND((RANDOM() * 500 + 10)::numeric, 2) as "sellingPrice",
    ROUND((RANDOM() * 300 + 5)::numeric, 2) as "costPrice",
    (RANDOM() * 5 + 1)::int as "supplierId",
    NOW() as "createdAt",
    NOW() as "updatedAt"
)
INSERT INTO "Product" (
  id, name, "categoryId", sku, barcode, description, 
  "sellingPrice", "costPrice", "supplierId", "createdAt", "updatedAt"
)
SELECT 
  id, name, "categoryId", sku, barcode, description,
  "sellingPrice", "costPrice", "supplierId", "createdAt", "updatedAt"
FROM product_data
ON CONFLICT (id) DO NOTHING;

-- Generate 1000 customers
WITH customer_data AS (
  SELECT 
    generate_series(1, 1000) as id,
    CASE 
      WHEN generate_series(1, 1000) % 20 = 1 THEN 'John Smith ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 2 THEN 'Sarah Johnson ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 3 THEN 'Michael Brown ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 4 THEN 'Emily Davis ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 5 THEN 'David Wilson ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 6 THEN 'Jessica Miller ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 7 THEN 'Christopher Moore ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 8 THEN 'Ashley Taylor ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 9 THEN 'Matthew Anderson ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 10 THEN 'Amanda Thomas ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 11 THEN 'Daniel Jackson ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 12 THEN 'Jennifer White ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 13 THEN 'James Harris ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 14 THEN 'Lisa Martin ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 15 THEN 'Robert Thompson ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 16 THEN 'Michelle Garcia ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 17 THEN 'William Martinez ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 18 THEN 'Stephanie Robinson ' || generate_series(1, 1000)
      WHEN generate_series(1, 1000) % 20 = 19 THEN 'Joseph Clark ' || generate_series(1, 1000)
      ELSE 'Rachel Rodriguez ' || generate_series(1, 1000)
    END as name,
    'customer' || generate_series(1, 1000) || '@example.com' as email,
    '+1-555-' || LPAD((generate_series(1, 1000) % 10000)::text, 4, '0') as phone,
    CASE 
      WHEN generate_series(1, 1000) % 10 = 1 THEN generate_series(1, 1000) || ' Main Street, New York, NY 10001'
      WHEN generate_series(1, 1000) % 10 = 2 THEN generate_series(1, 1000) || ' Oak Avenue, Los Angeles, CA 90210'
      WHEN generate_series(1, 1000) % 10 = 3 THEN generate_series(1, 1000) || ' Pine Road, Chicago, IL 60601'
      WHEN generate_series(1, 1000) % 10 = 4 THEN generate_series(1, 1000) || ' Maple Drive, Houston, TX 77001'
      WHEN generate_series(1, 1000) % 10 = 5 THEN generate_series(1, 1000) || ' Cedar Lane, Phoenix, AZ 85001'
      WHEN generate_series(1, 1000) % 10 = 6 THEN generate_series(1, 1000) || ' Elm Street, Philadelphia, PA 19101'
      WHEN generate_series(1, 1000) % 10 = 7 THEN generate_series(1, 1000) || ' Birch Way, San Antonio, TX 78201'
      WHEN generate_series(1, 1000) % 10 = 8 THEN generate_series(1, 1000) || ' Willow Court, San Diego, CA 92101'
      WHEN generate_series(1, 1000) % 10 = 9 THEN generate_series(1, 1000) || ' Spruce Boulevard, Dallas, TX 75201'
      ELSE generate_series(1, 1000) || ' Poplar Place, San Jose, CA 95101'
    END as address,
    CASE 
      WHEN generate_series(1, 1000) % 5 = 0 THEN 'VIP'
      WHEN generate_series(1, 1000) % 3 = 0 THEN 'Premium'
      ELSE 'Regular'
    END as "customerType",
    ROUND((RANDOM() * 10000)::numeric, 2) as "creditLimit",
    0 as balance,
    NOW() as "createdAt",
    NOW() as "updatedAt"
)
INSERT INTO "Customer" (
  id, name, email, phone, address, "customerType", 
  "creditLimit", balance, "createdAt", "updatedAt"
)
SELECT 
  id, name, email, phone, address, "customerType",
  "creditLimit", balance, "createdAt", "updatedAt"
FROM customer_data
ON CONFLICT (id) DO NOTHING;

-- Create some shops if they don't exist
INSERT INTO "Shop" (id, name, address, phone, "managerId", "createdAt", "updatedAt")
VALUES 
  (1, 'Main Sports Store', '100 Sports Plaza, Downtown', '+1-555-1001', NULL, NOW(), NOW()),
  (2, 'Sports Outlet North', '200 Athletic Center, North District', '+1-555-1002', NULL, NOW(), NOW()),
  (3, 'Pro Sports South', '300 Champion Mall, South Side', '+1-555-1003', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create inventory items for products across shops
WITH inventory_data AS (
  SELECT 
    (p.id * 10 + s.id) as id,
    p.id as "productId",
    s.id as "shopId",
    FLOOR(RANDOM() * 100 + 10)::int as quantity,
    FLOOR(RANDOM() * 20 + 5)::int as "minQuantity",
    p."costPrice" as "averageCost",
    NOW() as "createdAt",
    NOW() as "updatedAt"
  FROM "Product" p
  CROSS JOIN "Shop" s
  WHERE p.id <= 2000 AND s.id <= 3
)
INSERT INTO "InventoryItem" (
  id, "productId", "shopId", quantity, "minQuantity", 
  "averageCost", "createdAt", "updatedAt"
)
SELECT 
  id, "productId", "shopId", quantity, "minQuantity",
  "averageCost", "createdAt", "updatedAt"
FROM inventory_data
ON CONFLICT (id) DO NOTHING;

-- Update sequences to ensure they're at the correct values
SELECT setval('"Product_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Product"));
SELECT setval('"Customer_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Customer"));
SELECT setval('"Category_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Category"));
SELECT setval('"Supplier_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Supplier"));
SELECT setval('"Shop_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Shop"));
SELECT setval('"InventoryItem_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "InventoryItem"));

-- Display summary of created data
SELECT 
  'Products' as "Table", 
  COUNT(*) as "Records Created" 
FROM "Product"
UNION ALL
SELECT 
  'Customers' as "Table", 
  COUNT(*) as "Records Created" 
FROM "Customer"
UNION ALL
SELECT 
  'Categories' as "Table", 
  COUNT(*) as "Records Created" 
FROM "Category"
UNION ALL
SELECT 
  'Suppliers' as "Table", 
  COUNT(*) as "Records Created" 
FROM "Supplier"
UNION ALL
SELECT 
  'Shops' as "Table", 
  COUNT(*) as "Records Created" 
FROM "Shop"
UNION ALL
SELECT 
  'Inventory Items' as "Table", 
  COUNT(*) as "Records Created" 
FROM "InventoryItem";

-- Display some sample data
SELECT 'Sample Products:' as info;
SELECT id, name, sku, "sellingPrice", "costPrice" 
FROM "Product" 
ORDER BY RANDOM() 
LIMIT 10;

SELECT 'Sample Customers:' as info;
SELECT id, name, email, "customerType", "creditLimit" 
FROM "Customer" 
ORDER BY RANDOM() 
LIMIT 10; 