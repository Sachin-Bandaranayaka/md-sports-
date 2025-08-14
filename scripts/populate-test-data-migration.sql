-- Migration to populate test data for MS Sports
-- This should be run as a migration to ensure proper permissions

-- First, add more categories
INSERT INTO "Category" (name, description) VALUES 
('Running Equipment', 'Athletic footwear and running gear'),
('Basketball Equipment', 'Basketball equipment and gear'),
('Tennis Equipment', 'Tennis rackets, balls, and accessories'),
('Swimming Gear', 'Swimming gear and accessories'),
('Football Equipment', 'Football boots and equipment')
ON CONFLICT DO NOTHING;

-- Add more shops
INSERT INTO "Shop" (id, name, location, address_line1, city, state, postal_code, phone, email, is_active, status) VALUES 
('shop_001', 'Athletic Central', 'Kuala Lumpur', '123 Sports Street', 'Kuala Lumpur', 'Selangor', '50000', '012-3456789', 'athletic@mssports.com', true, 'open'),
('shop_002', 'Sports World East', 'Penang', '456 Victory Road', 'Penang', 'Penang', '10000', '012-9876543', 'east@mssports.com', true, 'open')
ON CONFLICT DO NOTHING;

-- Add products in batches (this is a sample - repeat with different values)
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES 
('Running Shoes Pro', 'Professional running shoes', 299.99, 'RUN001', '1234567890123', 1, 'cmc4nqcog0000unnqei52hlhs', 150.00, 20),
('Basketball Jersey', 'Premium basketball jersey', 89.99, 'BBJ001', '1234567890124', 2, 'cmc4nqj9b0001unnq2fqc59ci', 45.00, 30),
('Tennis Racket Elite', 'Elite tennis racket', 199.99, 'TEN001', '1234567890125', 3, 'cmc4nqcog0000unnqei52hlhs', 100.00, 15),
('Swimming Goggles', 'Professional swimming goggles', 49.99, 'SWM001', '1234567890126', 4, 'cmc4nqj9b0001unnq2fqc59ci', 25.00, 50),
('Football Boots', 'Professional football boots', 179.99, 'FB001', '1234567890127', 5, 'cmc4nqcog0000unnqei52hlhs', 90.00, 25);

-- Add customers in batches
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES 
('Ahmad Rahman', 'ahmad.rahman@email.com', '012-3456789', '123 Jalan Bukit Bintang', 'Kuala Lumpur', 'retail', 'active', 5000.00, 30, '50000'),
('Siti Nurhaliza', 'siti.nurhaliza@email.com', '013-4567890', '456 Lorong Maarof', 'Kuala Lumpur', 'wholesale', 'active', 10000.00, 45, '50100'),
('Lim Wei Ming', 'lim.weiming@email.com', '014-5678901', '789 Jalan Ampang', 'Kuala Lumpur', 'corporate', 'active', 15000.00, 60, '50200'),
('Raj Kumar', 'raj.kumar@email.com', '016-6789012', '321 Persiaran KLCC', 'Kuala Lumpur', 'retail', 'active', 3000.00, 30, '50300'),
('Tan Mei Ling', 'tan.meiling@email.com', '017-7890123', '654 Jalan Tun Razak', 'Kuala Lumpur', 'wholesale', 'active', 8000.00, 45, '50400');

-- Create inventory items for existing products and shops
INSERT INTO "InventoryItem" ("productId", "shopId", quantity, shopspecificcost)
SELECT 
  p.id,
  s.id,
  floor(random() * 100 + 10)::int, -- Random quantity between 10-109
  (random() * 200 + 50)::numeric(10,2) -- Random cost between 50-250
FROM "Product" p
CROSS JOIN "Shop" s
WHERE NOT EXISTS (
  SELECT 1 FROM "InventoryItem" i 
  WHERE i."productId" = p.id AND i."shopId" = s.id
);

-- Show final counts
SELECT 
  'Categories' as table_name, COUNT(*) as count FROM "Category"
UNION ALL
SELECT 'Shops', COUNT(*) FROM "Shop"
UNION ALL
SELECT 'Products', COUNT(*) FROM "Product"
UNION ALL
SELECT 'Customers', COUNT(*) FROM "Customer"
UNION ALL
SELECT 'Suppliers', COUNT(*) FROM "Supplier"
UNION ALL
SELECT 'InventoryItems', COUNT(*) FROM "InventoryItem";