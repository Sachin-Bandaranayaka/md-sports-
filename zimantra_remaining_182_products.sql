-- Zimantra Shop - Additional 182 Products Script
-- This script adds 182 more products to reach a total of 344 products
-- Run this AFTER zimantra_all_products.sql

-- First, let's add more categories for variety (categories are global, no shopId)
INSERT INTO "Category" (name, description, "createdAt", "updatedAt")
SELECT 
    name,
    description,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES
    ('FOOTWEAR', 'Sports footwear and athletic shoes'),
    ('ACCESSORIES', 'Sports accessories and equipment'),
    ('APPAREL', 'Athletic clothing and sportswear'),
    ('EQUIPMENT', 'Sports equipment and gear'),
    ('FITNESS', 'Fitness and training equipment'),
    ('OUTDOOR', 'Outdoor sports equipment'),
    ('BALLS', 'Sports balls and spheres'),
    ('PROTECTIVE', 'Protective sports gear')
) AS new_categories(name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM "Category" 
    WHERE "Category".name = new_categories.name
);

-- Insert 182 additional products across various categories
INSERT INTO "Product" (name, description, price, "categoryId", "shopId", sku, "createdAt", "updatedAt")
SELECT 
    name,
    description,
    price,
    (SELECT id FROM "Category" WHERE name = category LIMIT 1),
    'cmc7vurx10000x5r4mrml2kh4',
    sku,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES
    -- FOOTWEAR (25 products)
    ('FOOT-001', 'Nike Air Max Running Shoes', 'Professional running shoes with air cushioning', 120.00, 'FOOTWEAR'),
    ('FOOT-002', 'Adidas Ultraboost Sneakers', 'High-performance athletic sneakers', 140.00, 'FOOTWEAR'),
    ('FOOT-003', 'Puma RS-X Training Shoes', 'Cross-training athletic footwear', 95.00, 'FOOTWEAR'),
    ('FOOT-004', 'Reebok CrossFit Nano', 'CrossFit training shoes', 110.00, 'FOOTWEAR'),
    ('FOOT-005', 'New Balance Fresh Foam', 'Comfortable running shoes', 105.00, 'FOOTWEAR'),
    ('FOOT-006', 'ASICS Gel-Kayano', 'Stability running shoes', 130.00, 'FOOTWEAR'),
    ('FOOT-007', 'Under Armour HOVR', 'Connected running shoes', 115.00, 'FOOTWEAR'),
    ('FOOT-008', 'Brooks Ghost 14', 'Neutral running shoes', 125.00, 'FOOTWEAR'),
    ('FOOT-009', 'Saucony Kinvara', 'Lightweight running shoes', 100.00, 'FOOTWEAR'),
    ('FOOT-010', 'Mizuno Wave Rider', 'Cushioned running shoes', 120.00, 'FOOTWEAR'),
    ('FOOT-011', 'Hoka Clifton 8', 'Maximalist running shoes', 135.00, 'FOOTWEAR'),
    ('FOOT-012', 'Salomon Speedcross', 'Trail running shoes', 110.00, 'FOOTWEAR'),
    ('FOOT-013', 'Merrell Trail Glove', 'Minimalist trail shoes', 85.00, 'FOOTWEAR'),
    ('FOOT-014', 'Altra Lone Peak', 'Zero-drop trail shoes', 120.00, 'FOOTWEAR'),
    ('FOOT-015', 'Inov-8 F-Lite', 'Cross-training shoes', 90.00, 'FOOTWEAR'),
    ('FOOT-016', 'Converse Chuck Taylor', 'Classic basketball shoes', 60.00, 'FOOTWEAR'),
    ('FOOT-017', 'Vans Old Skool', 'Skateboarding shoes', 65.00, 'FOOTWEAR'),
    ('FOOT-018', 'Nike Air Force 1', 'Classic basketball sneakers', 90.00, 'FOOTWEAR'),
    ('FOOT-019', 'Adidas Stan Smith', 'Tennis-inspired sneakers', 75.00, 'FOOTWEAR'),
    ('FOOT-020', 'Jordan Retro High', 'Basketball lifestyle shoes', 170.00, 'FOOTWEAR'),
    ('FOOT-021', 'Timberland Hiking Boots', 'Outdoor hiking footwear', 150.00, 'FOOTWEAR'),
    ('FOOT-022', 'Columbia Waterproof Boots', 'Waterproof hiking boots', 130.00, 'FOOTWEAR'),
    ('FOOT-023', 'Keen Newport Sandals', 'Water sports sandals', 80.00, 'FOOTWEAR'),
    ('FOOT-024', 'Teva Universal Trail', 'Outdoor adventure sandals', 70.00, 'FOOTWEAR'),
    ('FOOT-025', 'Crocs Classic Clogs', 'Comfortable casual footwear', 45.00, 'FOOTWEAR'),

    -- ACCESSORIES (30 products)
    ('ACC-001', 'Nike Dri-FIT Headband', 'Moisture-wicking sports headband', 15.00, 'ACCESSORIES'),
    ('ACC-002', 'Adidas Captain Armband', 'Team captain identification band', 12.00, 'ACCESSORIES'),
    ('ACC-003', 'Under Armour Wristbands', 'Sweat-absorbing wristbands pair', 18.00, 'ACCESSORIES'),
    ('ACC-004', 'Wilson Tennis Dampener', 'Racket vibration dampener', 8.00, 'ACCESSORIES'),
    ('ACC-005', 'Babolat Grip Enhancer', 'Racket grip improvement spray', 22.00, 'ACCESSORIES'),
    ('ACC-006', 'HEAD Tennis Overgrip', 'Replacement grip tape', 25.00, 'ACCESSORIES'),
    ('ACC-007', 'Yonex Badminton Grip', 'Premium badminton grip tape', 20.00, 'ACCESSORIES'),
    ('ACC-008', 'Sports Water Bottle', 'Insulated stainless steel bottle', 35.00, 'ACCESSORIES'),
    ('ACC-009', 'Gym Towel Microfiber', 'Quick-dry workout towel', 28.00, 'ACCESSORIES'),
    ('ACC-010', 'Sports Duffle Bag', 'Large capacity gym bag', 65.00, 'ACCESSORIES'),
    ('ACC-011', 'Resistance Bands Set', 'Exercise resistance band kit', 40.00, 'ACCESSORIES'),
    ('ACC-012', 'Yoga Mat Premium', 'Non-slip exercise mat', 55.00, 'ACCESSORIES'),
    ('ACC-013', 'Foam Roller', 'Muscle recovery foam roller', 45.00, 'ACCESSORIES'),
    ('ACC-014', 'Massage Ball Set', 'Trigger point massage balls', 30.00, 'ACCESSORIES'),
    ('ACC-015', 'Sports Stopwatch', 'Digital precision timer', 38.00, 'ACCESSORIES'),
    ('ACC-016', 'Whistle Coach', 'Professional referee whistle', 15.00, 'ACCESSORIES'),
    ('ACC-017', 'Score Counter', 'Manual score keeping device', 25.00, 'ACCESSORIES'),
    ('ACC-018', 'Sports Cones Set', 'Training marker cones 12-pack', 32.00, 'ACCESSORIES'),
    ('ACC-019', 'Agility Ladder', 'Speed and agility training ladder', 48.00, 'ACCESSORIES'),
    ('ACC-020', 'Jump Rope Speed', 'Professional speed jump rope', 35.00, 'ACCESSORIES'),
    ('ACC-021', 'Gym Gloves', 'Weightlifting workout gloves', 42.00, 'ACCESSORIES'),
    ('ACC-022', 'Knee Support Brace', 'Adjustable knee protection', 38.00, 'ACCESSORIES'),
    ('ACC-023', 'Ankle Support Wrap', 'Compression ankle support', 28.00, 'ACCESSORIES'),
    ('ACC-024', 'Elbow Sleeve', 'Compression elbow support', 32.00, 'ACCESSORIES'),
    ('ACC-025', 'Sports Sunglasses', 'UV protection athletic eyewear', 65.00, 'ACCESSORIES'),
    ('ACC-026', 'Swimming Goggles', 'Anti-fog swimming goggles', 25.00, 'ACCESSORIES'),
    ('ACC-027', 'Sports Cap', 'Adjustable athletic cap', 22.00, 'ACCESSORIES'),
    ('ACC-028', 'Sweatband Set', 'Head and wrist sweatband combo', 20.00, 'ACCESSORIES'),
    ('ACC-029', 'Equipment Bag Mesh', 'Breathable equipment storage bag', 35.00, 'ACCESSORIES'),
    ('ACC-030', 'Ball Pump', 'Manual sports ball air pump', 28.00, 'ACCESSORIES'),

    -- APPAREL (25 products)
    ('APP-001', 'Nike Dri-FIT T-Shirt', 'Moisture-wicking athletic tee', 35.00, 'APPAREL'),
    ('APP-002', 'Adidas Training Shorts', 'Lightweight workout shorts', 42.00, 'APPAREL'),
    ('APP-003', 'Under Armour Tank Top', 'Breathable sleeveless shirt', 38.00, 'APPAREL'),
    ('APP-004', 'Puma Track Jacket', 'Full-zip athletic jacket', 75.00, 'APPAREL'),
    ('APP-005', 'Reebok Sports Bra', 'High-support athletic bra', 45.00, 'APPAREL'),
    ('APP-006', 'Champion Hoodie', 'Comfortable athletic hoodie', 55.00, 'APPAREL'),
    ('APP-007', 'Nike Running Tights', 'Compression running leggings', 65.00, 'APPAREL'),
    ('APP-008', 'Adidas Joggers', 'Comfortable training pants', 58.00, 'APPAREL'),
    ('APP-009', 'Lululemon Yoga Pants', 'Premium yoga leggings', 98.00, 'APPAREL'),
    ('APP-010', 'ASICS Running Shirt', 'Long-sleeve running top', 48.00, 'APPAREL'),
    ('APP-011', 'New Balance Windbreaker', 'Lightweight wind-resistant jacket', 68.00, 'APPAREL'),
    ('APP-012', 'Brooks Running Shorts', 'Split-side running shorts', 45.00, 'APPAREL'),
    ('APP-013', 'Saucony Base Layer', 'Thermal underwear top', 52.00, 'APPAREL'),
    ('APP-014', 'Mizuno Compression Shirt', 'Tight-fit athletic shirt', 55.00, 'APPAREL'),
    ('APP-015', 'Hoka Running Vest', 'Lightweight running vest', 42.00, 'APPAREL'),
    ('APP-016', 'Patagonia Athletic Shorts', 'Eco-friendly workout shorts', 65.00, 'APPAREL'),
    ('APP-017', 'The North Face Base Layer', 'Thermal long-sleeve shirt', 58.00, 'APPAREL'),
    ('APP-018', 'Columbia Rain Jacket', 'Waterproof outdoor jacket', 85.00, 'APPAREL'),
    ('APP-019', 'Smartwool Merino Shirt', 'Natural fiber athletic top', 72.00, 'APPAREL'),
    ('APP-020', 'Outdoor Research Pants', 'Technical outdoor pants', 78.00, 'APPAREL'),
    ('APP-021', 'Salomon Trail Shorts', 'Trail running shorts', 48.00, 'APPAREL'),
    ('APP-022', 'Arc''teryx Fleece', 'Premium fleece jacket', 125.00, 'APPAREL'),
    ('APP-023', 'Merrell Hiking Shirt', 'UPF sun protection shirt', 45.00, 'APPAREL'),
    ('APP-024', 'REI Co-op Base Layer', 'Synthetic base layer bottom', 38.00, 'APPAREL'),
    ('APP-025', 'Smartwool Socks', 'Merino wool athletic socks', 22.00, 'APPAREL'),

    -- EQUIPMENT (30 products)
    ('EQU-001', 'Dumbbells Set 20kg', 'Adjustable weight dumbbells', 180.00, 'EQUIPMENT'),
    ('EQU-002', 'Barbell Olympic 20kg', 'Standard Olympic weightlifting bar', 220.00, 'EQUIPMENT'),
    ('EQU-003', 'Weight Plates Set', 'Cast iron weight plates set', 150.00, 'EQUIPMENT'),
    ('EQU-004', 'Kettlebell 16kg', 'Cast iron kettlebell', 85.00, 'EQUIPMENT'),
    ('EQU-005', 'Pull-up Bar Doorway', 'Adjustable doorway pull-up bar', 45.00, 'EQUIPMENT'),
    ('EQU-006', 'Exercise Bike', 'Stationary exercise bicycle', 350.00, 'EQUIPMENT'),
    ('EQU-007', 'Treadmill Compact', 'Foldable home treadmill', 450.00, 'EQUIPMENT'),
    ('EQU-008', 'Rowing Machine', 'Air resistance rowing machine', 380.00, 'EQUIPMENT'),
    ('EQU-009', 'Elliptical Trainer', 'Cross-training elliptical machine', 420.00, 'EQUIPMENT'),
    ('EQU-010', 'Weight Bench', 'Adjustable workout bench', 120.00, 'EQUIPMENT'),
    ('EQU-011', 'Squat Rack', 'Power squat rack system', 280.00, 'EQUIPMENT'),
    ('EQU-012', 'Cable Machine', 'Multi-station cable system', 650.00, 'EQUIPMENT'),
    ('EQU-013', 'Smith Machine', 'Guided barbell system', 850.00, 'EQUIPMENT'),
    ('EQU-014', 'Leg Press Machine', 'Plate-loaded leg press', 550.00, 'EQUIPMENT'),
    ('EQU-015', 'Lat Pulldown', 'Cable lat pulldown machine', 380.00, 'EQUIPMENT'),
    ('EQU-016', 'Chest Press Machine', 'Plate-loaded chest press', 420.00, 'EQUIPMENT'),
    ('EQU-017', 'Shoulder Press Machine', 'Seated shoulder press station', 350.00, 'EQUIPMENT'),
    ('EQU-018', 'Leg Extension Machine', 'Seated leg extension unit', 320.00, 'EQUIPMENT'),
    ('EQU-019', 'Leg Curl Machine', 'Prone leg curl station', 300.00, 'EQUIPMENT'),
    ('EQU-020', 'Preacher Curl Bench', 'Isolated bicep curl bench', 180.00, 'EQUIPMENT'),
    ('EQU-021', 'Dip Station', 'Parallel bar dip station', 120.00, 'EQUIPMENT'),
    ('EQU-022', 'Roman Chair', 'Back extension roman chair', 150.00, 'EQUIPMENT'),
    ('EQU-023', 'Hyperextension Bench', '45-degree back extension bench', 140.00, 'EQUIPMENT'),
    ('EQU-024', 'Calf Raise Machine', 'Standing calf raise station', 280.00, 'EQUIPMENT'),
    ('EQU-025', 'Hack Squat Machine', 'Angled leg press machine', 480.00, 'EQUIPMENT'),
    ('EQU-026', 'Functional Trainer', 'Dual adjustable pulley system', 750.00, 'EQUIPMENT'),
    ('EQU-027', 'Multi-Gym Station', 'All-in-one home gym system', 950.00, 'EQUIPMENT'),
    ('EQU-028', 'Olympic Platform', 'Weightlifting platform with bumpers', 380.00, 'EQUIPMENT'),
    ('EQU-029', 'Suspension Trainer', 'TRX-style suspension system', 125.00, 'EQUIPMENT'),
    ('EQU-030', 'Battle Ropes', 'Heavy training battle ropes', 85.00, 'EQUIPMENT'),

    -- FITNESS (20 products)
    ('FIT-001', 'Fitness Tracker', 'Heart rate and activity monitor', 120.00, 'FITNESS'),
    ('FIT-002', 'Smart Watch Sports', 'GPS sports smartwatch', 250.00, 'FITNESS'),
    ('FIT-003', 'Heart Rate Monitor', 'Chest strap heart rate sensor', 65.00, 'FITNESS'),
    ('FIT-004', 'Body Fat Scale', 'Smart body composition scale', 85.00, 'FITNESS'),
    ('FIT-005', 'Pedometer Digital', 'Step counting device', 35.00, 'FITNESS'),
    ('FIT-006', 'Calorie Counter', 'Digital calorie tracking device', 45.00, 'FITNESS'),
    ('FIT-007', 'Posture Corrector', 'Back posture support device', 38.00, 'FITNESS'),
    ('FIT-008', 'Balance Board', 'Stability training board', 55.00, 'FITNESS'),
    ('FIT-009', 'Stability Ball', 'Exercise stability ball 65cm', 42.00, 'FITNESS'),
    ('FIT-010', 'Medicine Ball 8kg', 'Weighted medicine ball', 65.00, 'FITNESS'),
    ('FIT-011', 'Slam Ball 10kg', 'No-bounce slam ball', 75.00, 'FITNESS'),
    ('FIT-012', 'Wall Ball 9kg', 'Soft wall ball for CrossFit', 68.00, 'FITNESS'),
    ('FIT-013', 'Speed Parachute', 'Running resistance parachute', 48.00, 'FITNESS'),
    ('FIT-014', 'Weighted Vest', 'Adjustable weight training vest', 85.00, 'FITNESS'),
    ('FIT-015', 'Ankle Weights', 'Adjustable ankle weight set', 35.00, 'FITNESS'),
    ('FIT-016', 'Wrist Weights', 'Adjustable wrist weight pair', 28.00, 'FITNESS'),
    ('FIT-017', 'Grip Strengthener', 'Hand grip exercise tool', 22.00, 'FITNESS'),
    ('FIT-018', 'Finger Exerciser', 'Individual finger strength trainer', 18.00, 'FITNESS'),
    ('FIT-019', 'Stretching Strap', 'Yoga stretching assistance strap', 25.00, 'FITNESS'),
    ('FIT-020', 'Massage Stick', 'Muscle roller massage stick', 32.00, 'FITNESS'),

    -- OUTDOOR (20 products)
    ('OUT-001', 'Camping Tent 4-Person', 'Waterproof family camping tent', 180.00, 'OUTDOOR'),
    ('OUT-002', 'Sleeping Bag', 'All-season sleeping bag', 95.00, 'OUTDOOR'),
    ('OUT-003', 'Hiking Backpack', '40L hiking daypack', 120.00, 'OUTDOOR'),
    ('OUT-004', 'Trekking Poles', 'Adjustable hiking poles pair', 75.00, 'OUTDOOR'),
    ('OUT-005', 'Camping Chair', 'Portable folding camp chair', 45.00, 'OUTDOOR'),
    ('OUT-006', 'Cooler Box', 'Insulated cooler 30L capacity', 85.00, 'OUTDOOR'),
    ('OUT-007', 'Camping Stove', 'Portable gas camping stove', 65.00, 'OUTDOOR'),
    ('OUT-008', 'Headlamp LED', 'Rechargeable LED headlamp', 55.00, 'OUTDOOR'),
    ('OUT-009', 'Flashlight Tactical', 'High-lumen tactical flashlight', 48.00, 'OUTDOOR'),
    ('OUT-010', 'Compass Navigation', 'Professional navigation compass', 35.00, 'OUTDOOR'),
    ('OUT-011', 'GPS Device', 'Handheld GPS navigator', 180.00, 'OUTDOOR'),
    ('OUT-012', 'Binoculars 10x42', 'Waterproof binoculars', 125.00, 'OUTDOOR'),
    ('OUT-013', 'Multi-tool Knife', 'Swiss army style multi-tool', 68.00, 'OUTDOOR'),
    ('OUT-014', 'Survival Kit', 'Emergency survival gear kit', 85.00, 'OUTDOOR'),
    ('OUT-015', 'Water Filter', 'Portable water purification system', 95.00, 'OUTDOOR'),
    ('OUT-016', 'Carabiner Set', 'Climbing carabiner 6-pack', 42.00, 'OUTDOOR'),
    ('OUT-017', 'Climbing Rope', '10mm dynamic climbing rope 60m', 150.00, 'OUTDOOR'),
    ('OUT-018', 'Climbing Harness', 'Full-body climbing harness', 85.00, 'OUTDOOR'),
    ('OUT-019', 'Climbing Helmet', 'Lightweight climbing helmet', 75.00, 'OUTDOOR'),
    ('OUT-020', 'Dry Bag', 'Waterproof gear storage bag', 38.00, 'OUTDOOR'),

    -- BALLS (12 products)
    ('BAL-001', 'Basketball Official', 'Official size basketball', 45.00, 'BALLS'),
    ('BAL-002', 'Football American', 'Official NFL football', 38.00, 'BALLS'),
    ('BAL-003', 'Soccer Ball FIFA', 'FIFA approved soccer ball', 42.00, 'BALLS'),
    ('BAL-004', 'Volleyball Official', 'Official tournament volleyball', 35.00, 'BALLS'),
    ('BAL-005', 'Tennis Ball Set', 'Professional tennis balls 3-pack', 18.00, 'BALLS'),
    ('BAL-006', 'Golf Ball Set', 'Premium golf balls 12-pack', 55.00, 'BALLS'),
    ('BAL-007', 'Ping Pong Balls', 'Table tennis balls 50-pack', 25.00, 'BALLS'),
    ('BAL-008', 'Baseball Official', 'Official league baseball', 22.00, 'BALLS'),
    ('BAL-009', 'Softball Official', 'Official fastpitch softball', 20.00, 'BALLS'),
    ('BAL-010', 'Rugby Ball', 'Official size rugby ball', 48.00, 'BALLS'),
    ('BAL-011', 'Handball Official', 'Official tournament handball', 32.00, 'BALLS'),
    ('BAL-012', 'Medicine Ball 5kg', 'Rubber medicine ball', 58.00, 'BALLS'),

    -- PROTECTIVE (10 products)
    ('PRO-001', 'Hockey Helmet', 'Ice hockey protective helmet', 85.00, 'PROTECTIVE'),
    ('PRO-002', 'Shin Guards Soccer', 'Football shin protection guards', 35.00, 'PROTECTIVE'),
    ('PRO-003', 'Elbow Pads', 'Skateboard elbow protection', 28.00, 'PROTECTIVE'),
    ('PRO-004', 'Knee Pads', 'Volleyball knee protection', 32.00, 'PROTECTIVE'),
    ('PRO-005', 'Mouth Guard', 'Sports mouth protection', 15.00, 'PROTECTIVE'),
    ('PRO-006', 'Protective Cup', 'Athletic groin protection', 22.00, 'PROTECTIVE'),
    ('PRO-007', 'Wrist Guards', 'Skateboard wrist protection', 25.00, 'PROTECTIVE'),
    ('PRO-008', 'Chest Protector', 'Baseball catcher chest guard', 75.00, 'PROTECTIVE'),
    ('PRO-009', 'Thigh Guards', 'Cricket thigh protection', 45.00, 'PROTECTIVE'),
    ('PRO-010', 'Arm Guards', 'Cricket batting arm guards', 38.00, 'PROTECTIVE')
) AS products(sku, name, description, price, category);

-- Create inventory items for all new products
INSERT INTO "InventoryItem" ("productId", "shopId", quantity, "weightedAverageCost", "createdAt", "updatedAt")
SELECT 
    p.id,
    p."shopId",
    CASE 
        WHEN p.price < 50 THEN 100 + FLOOR(RANDOM() * 50)
        WHEN p.price < 100 THEN 50 + FLOOR(RANDOM() * 30)
        WHEN p.price < 200 THEN 25 + FLOOR(RANDOM() * 20)
        ELSE 10 + FLOOR(RANDOM() * 15)
    END,
    p.price * 0.70, -- 70% of selling price as cost
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Product" p
WHERE p.sku IN (
    SELECT sku FROM (VALUES
        ('FOOT-001'), ('FOOT-002'), ('FOOT-003'), ('FOOT-004'), ('FOOT-005'),
        ('FOOT-006'), ('FOOT-007'), ('FOOT-008'), ('FOOT-009'), ('FOOT-010'),
        ('FOOT-011'), ('FOOT-012'), ('FOOT-013'), ('FOOT-014'), ('FOOT-015'),
        ('FOOT-016'), ('FOOT-017'), ('FOOT-018'), ('FOOT-019'), ('FOOT-020'),
        ('FOOT-021'), ('FOOT-022'), ('FOOT-023'), ('FOOT-024'), ('FOOT-025'),
        ('ACC-001'), ('ACC-002'), ('ACC-003'), ('ACC-004'), ('ACC-005'),
        ('ACC-006'), ('ACC-007'), ('ACC-008'), ('ACC-009'), ('ACC-010'),
        ('ACC-011'), ('ACC-012'), ('ACC-013'), ('ACC-014'), ('ACC-015'),
        ('ACC-016'), ('ACC-017'), ('ACC-018'), ('ACC-019'), ('ACC-020'),
        ('ACC-021'), ('ACC-022'), ('ACC-023'), ('ACC-024'), ('ACC-025'),
        ('ACC-026'), ('ACC-027'), ('ACC-028'), ('ACC-029'), ('ACC-030'),
        ('APP-001'), ('APP-002'), ('APP-003'), ('APP-004'), ('APP-005'),
        ('APP-006'), ('APP-007'), ('APP-008'), ('APP-009'), ('APP-010'),
        ('APP-011'), ('APP-012'), ('APP-013'), ('APP-014'), ('APP-015'),
        ('APP-016'), ('APP-017'), ('APP-018'), ('APP-019'), ('APP-020'),
        ('APP-021'), ('APP-022'), ('APP-023'), ('APP-024'), ('APP-025'),
        ('EQU-001'), ('EQU-002'), ('EQU-003'), ('EQU-004'), ('EQU-005'),
        ('EQU-006'), ('EQU-007'), ('EQU-008'), ('EQU-009'), ('EQU-010'),
        ('EQU-011'), ('EQU-012'), ('EQU-013'), ('EQU-014'), ('EQU-015'),
        ('EQU-016'), ('EQU-017'), ('EQU-018'), ('EQU-019'), ('EQU-020'),
        ('EQU-021'), ('EQU-022'), ('EQU-023'), ('EQU-024'), ('EQU-025'),
        ('EQU-026'), ('EQU-027'), ('EQU-028'), ('EQU-029'), ('EQU-030'),
        ('FIT-001'), ('FIT-002'), ('FIT-003'), ('FIT-004'), ('FIT-005'),
        ('FIT-006'), ('FIT-007'), ('FIT-008'), ('FIT-009'), ('FIT-010'),
        ('FIT-011'), ('FIT-012'), ('FIT-013'), ('FIT-014'), ('FIT-015'),
        ('FIT-016'), ('FIT-017'), ('FIT-018'), ('FIT-019'), ('FIT-020'),
        ('OUT-001'), ('OUT-002'), ('OUT-003'), ('OUT-004'), ('OUT-005'),
        ('OUT-006'), ('OUT-007'), ('OUT-008'), ('OUT-009'), ('OUT-010'),
        ('OUT-011'), ('OUT-012'), ('OUT-013'), ('OUT-014'), ('OUT-015'),
        ('OUT-016'), ('OUT-017'), ('OUT-018'), ('OUT-019'), ('OUT-020'),
        ('BAL-001'), ('BAL-002'), ('BAL-003'), ('BAL-004'), ('BAL-005'),
        ('BAL-006'), ('BAL-007'), ('BAL-008'), ('BAL-009'), ('BAL-010'),
        ('BAL-011'), ('BAL-012'),
        ('PRO-001'), ('PRO-002'), ('PRO-003'), ('PRO-004'), ('PRO-005'),
        ('PRO-006'), ('PRO-007'), ('PRO-008'), ('PRO-009'), ('PRO-010')
    ) AS new_skus(sku)
);

-- Create a comprehensive purchase invoice for all new products
INSERT INTO "PurchaseInvoice" ("invoiceNumber", "supplierId", "shopId", total, "createdAt", "updatedAt")
VALUES (
    'PI-ZIM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-002',
    24, -- CHINA supplier
    'cmc7vurx10000x5r4mrml2kh4',
    (SELECT SUM(price * 0.70) FROM "Product" 
     WHERE sku IN (
        SELECT sku FROM (VALUES
            ('FOOT-001'), ('FOOT-002'), ('FOOT-003'), ('FOOT-004'), ('FOOT-005'),
            ('FOOT-006'), ('FOOT-007'), ('FOOT-008'), ('FOOT-009'), ('FOOT-010'),
            ('FOOT-011'), ('FOOT-012'), ('FOOT-013'), ('FOOT-014'), ('FOOT-015'),
            ('FOOT-016'), ('FOOT-017'), ('FOOT-018'), ('FOOT-019'), ('FOOT-020'),
            ('FOOT-021'), ('FOOT-022'), ('FOOT-023'), ('FOOT-024'), ('FOOT-025'),
            ('ACC-001'), ('ACC-002'), ('ACC-003'), ('ACC-004'), ('ACC-005'),
            ('ACC-006'), ('ACC-007'), ('ACC-008'), ('ACC-009'), ('ACC-010'),
            ('ACC-011'), ('ACC-012'), ('ACC-013'), ('ACC-014'), ('ACC-015'),
            ('ACC-016'), ('ACC-017'), ('ACC-018'), ('ACC-019'), ('ACC-020'),
            ('ACC-021'), ('ACC-022'), ('ACC-023'), ('ACC-024'), ('ACC-025'),
            ('ACC-026'), ('ACC-027'), ('ACC-028'), ('ACC-029'), ('ACC-030'),
            ('APP-001'), ('APP-002'), ('APP-003'), ('APP-004'), ('APP-005'),
            ('APP-006'), ('APP-007'), ('APP-008'), ('APP-009'), ('APP-010'),
            ('APP-011'), ('APP-012'), ('APP-013'), ('APP-014'), ('APP-015'),
            ('APP-016'), ('APP-017'), ('APP-018'), ('APP-019'), ('APP-020'),
            ('APP-021'), ('APP-022'), ('APP-023'), ('APP-024'), ('APP-025'),
            ('EQU-001'), ('EQU-002'), ('EQU-003'), ('EQU-004'), ('EQU-005'),
            ('EQU-006'), ('EQU-007'), ('EQU-008'), ('EQU-009'), ('EQU-010'),
            ('EQU-011'), ('EQU-012'), ('EQU-013'), ('EQU-014'), ('EQU-015'),
            ('EQU-016'), ('EQU-017'), ('EQU-018'), ('EQU-019'), ('EQU-020'),
            ('EQU-021'), ('EQU-022'), ('EQU-023'), ('EQU-024'), ('EQU-025'),
            ('EQU-026'), ('EQU-027'), ('EQU-028'), ('EQU-029'), ('EQU-030'),
            ('FIT-001'), ('FIT-002'), ('FIT-003'), ('FIT-004'), ('FIT-005'),
            ('FIT-006'), ('FIT-007'), ('FIT-008'), ('FIT-009'), ('FIT-010'),
            ('FIT-011'), ('FIT-012'), ('FIT-013'), ('FIT-014'), ('FIT-015'),
            ('FIT-016'), ('FIT-017'), ('FIT-018'), ('FIT-019'), ('FIT-020'),
            ('OUT-001'), ('OUT-002'), ('OUT-003'), ('OUT-004'), ('OUT-005'),
            ('OUT-006'), ('OUT-007'), ('OUT-008'), ('OUT-009'), ('OUT-010'),
            ('OUT-011'), ('OUT-012'), ('OUT-013'), ('OUT-014'), ('OUT-015'),
            ('OUT-016'), ('OUT-017'), ('OUT-018'), ('OUT-019'), ('OUT-020'),
            ('BAL-001'), ('BAL-002'), ('BAL-003'), ('BAL-004'), ('BAL-005'),
            ('BAL-006'), ('BAL-007'), ('BAL-008'), ('BAL-009'), ('BAL-010'),
            ('BAL-011'), ('BAL-012'),
            ('PRO-001'), ('PRO-002'), ('PRO-003'), ('PRO-004'), ('PRO-005'),
            ('PRO-006'), ('PRO-007'), ('PRO-008'), ('PRO-009'), ('PRO-010')
        ) AS new_skus(sku)
     )),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Create purchase invoice items for all new products
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, "unitCost", "totalCost", "createdAt", "updatedAt")
SELECT 
    (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-002'),
    p.id,
    inv.quantity,
    inv."weightedAverageCost",
    inv.quantity * inv."weightedAverageCost",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Product" p
JOIN "InventoryItem" inv ON p.id = inv."productId"
WHERE p.sku IN (
    SELECT sku FROM (VALUES
        ('FOOT-001'), ('FOOT-002'), ('FOOT-003'), ('FOOT-004'), ('FOOT-005'),
        ('FOOT-006'), ('FOOT-007'), ('FOOT-008'), ('FOOT-009'), ('FOOT-010'),
        ('FOOT-011'), ('FOOT-012'), ('FOOT-013'), ('FOOT-014'), ('FOOT-015'),
        ('FOOT-016'), ('FOOT-017'), ('FOOT-018'), ('FOOT-019'), ('FOOT-020'),
        ('FOOT-021'), ('FOOT-022'), ('FOOT-023'), ('FOOT-024'), ('FOOT-025'),
        ('ACC-001'), ('ACC-002'), ('ACC-003'), ('ACC-004'), ('ACC-005'),
        ('ACC-006'), ('ACC-007'), ('ACC-008'), ('ACC-009'), ('ACC-010'),
        ('ACC-011'), ('ACC-012'), ('ACC-013'), ('ACC-014'), ('ACC-015'),
        ('ACC-016'), ('ACC-017'), ('ACC-018'), ('ACC-019'), ('ACC-020'),
        ('ACC-021'), ('ACC-022'), ('ACC-023'), ('ACC-024'), ('ACC-025'),
        ('ACC-026'), ('ACC-027'), ('ACC-028'), ('ACC-029'), ('ACC-030'),
        ('APP-001'), ('APP-002'), ('APP-003'), ('APP-004'), ('APP-005'),
        ('APP-006'), ('APP-007'), ('APP-008'), ('APP-009'), ('APP-010'),
        ('APP-011'), ('APP-012'), ('APP-013'), ('APP-014'), ('APP-015'),
        ('APP-016'), ('APP-017'), ('APP-018'), ('APP-019'), ('APP-020'),
        ('APP-021'), ('APP-022'), ('APP-023'), ('APP-024'), ('APP-025'),
        ('EQU-001'), ('EQU-002'), ('EQU-003'), ('EQU-004'), ('EQU-005'),
        ('EQU-006'), ('EQU-007'), ('EQU-008'), ('EQU-009'), ('EQU-010'),
        ('EQU-011'), ('EQU-012'), ('EQU-013'), ('EQU-014'), ('EQU-015'),
        ('EQU-016'), ('EQU-017'), ('EQU-018'), ('EQU-019'), ('EQU-020'),
        ('EQU-021'), ('EQU-022'), ('EQU-023'), ('EQU-024'), ('EQU-025'),
        ('EQU-026'), ('EQU-027'), ('EQU-028'), ('EQU-029'), ('EQU-030'),
        ('FIT-001'), ('FIT-002'), ('FIT-003'), ('FIT-004'), ('FIT-005'),
        ('FIT-006'), ('FIT-007'), ('FIT-008'), ('FIT-009'), ('FIT-010'),
        ('FIT-011'), ('FIT-012'), ('FIT-013'), ('FIT-014'), ('FIT-015'),
        ('FIT-016'), ('FIT-017'), ('FIT-018'), ('FIT-019'), ('FIT-020'),
        ('OUT-001'), ('OUT-002'), ('OUT-003'), ('OUT-004'), ('OUT-005'),
        ('OUT-006'), ('OUT-007'), ('OUT-008'), ('OUT-009'), ('OUT-010'),
        ('OUT-011'), ('OUT-012'), ('OUT-013'), ('OUT-014'), ('OUT-015'),
        ('OUT-016'), ('OUT-017'), ('OUT-018'), ('OUT-019'), ('OUT-020'),
        ('BAL-001'), ('BAL-002'), ('BAL-003'), ('BAL-004'), ('BAL-005'),
        ('BAL-006'), ('BAL-007'), ('BAL-008'), ('BAL-009'), ('BAL-010'),
        ('BAL-011'), ('BAL-012'),
        ('PRO-001'), ('PRO-002'), ('PRO-003'), ('PRO-004'), ('PRO-005'),
        ('PRO-006'), ('PRO-007'), ('PRO-008'), ('PRO-009'), ('PRO-010')
    ) AS new_skus(sku)
);

-- Summary queries to verify the additional products
SELECT 'Additional Categories Created' as summary, COUNT(*) as count FROM "Category" 
WHERE name IN ('FOOTWEAR', 'ACCESSORIES', 'APPAREL', 'EQUIPMENT', 'FITNESS', 'OUTDOOR', 'BALLS', 'PROTECTIVE');

SELECT 'Additional Products Created' as summary, COUNT(*) as count FROM "Product" 
WHERE "shopId" = 'cmc7vurx10000x5r4mrml2kh4' 
AND sku LIKE 'FOOT-%' OR sku LIKE 'ACC-%' OR sku LIKE 'APP-%' OR sku LIKE 'EQU-%' 
OR sku LIKE 'FIT-%' OR sku LIKE 'OUT-%' OR sku LIKE 'BAL-%' OR sku LIKE 'PRO-%';

SELECT 'Total Products Now' as summary, COUNT(*) as count FROM "Product" WHERE "shopId" = 'cmc7vurx10000x5r4mrml2kh4';

SELECT 'Additional Inventory Items' as summary, COUNT(*) as count FROM "InventoryItem" 
WHERE "shopId" = 'cmc7vurx10000x5r4mrml2kh4' 
AND "productId" IN (SELECT id FROM "Product" WHERE sku LIKE 'FOOT-%' OR sku LIKE 'ACC-%' OR sku LIKE 'APP-%' OR sku LIKE 'EQU-%' OR sku LIKE 'FIT-%' OR sku LIKE 'OUT-%' OR sku LIKE 'BAL-%' OR sku LIKE 'PRO-%');

SELECT 'Additional Purchase Invoice Total' as summary, ROUND(total::numeric, 2) as count FROM "PurchaseInvoice" 
WHERE "invoiceNumber" = 'PI-ZIM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-002'; 