
-- ZIMANTRA INVENTORY SETUP SUMMARY
-- =================================
-- Total Products: 360
-- Total Inventory Value: RM 8779106.56
-- Expected Total: RM 8,779,108.81
-- 
-- Categories:
--   GRIPS: 8 products
--   STRINGS: 44 products
--   SOCKS: 7 products
--   SHUTTLECOCKS: 7 products
--   RACKETS: 78 products
--   WRISTBAND: 2 products
--   OTHERS: 1 products
--   OTHER: 13 products
--   SHUTTLE: 1 products
--   BAGS: 39 products
--   SHOES: 151 products
--   NETS: 3 products
--   SHOE: 6 products
--
-- This script will:
-- 1. Create 360 products for Zimantra shop
-- 2. Create 1 purchase invoice (PI-ZIM-2025-001) 
-- 3. Create 360 purchase invoice items
-- 4. Create 360 inventory items
--
-- Insert Products for Zimantra Shop
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING GP 20', 'GRP0001', 500, 22, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING GP 16/17/18/19', 'GRP0002', 700, 22, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING GP 24', 'GRP0003', 500, 22, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('SPACESHIP OVER GRIP', 'GRP0004', 400, 22, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING TOWEL GRIP (S)', 'GRP0005', 600, 22, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX TOWEL GRIPS', 'GRP0006', 700, 22, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING TOWEL GRIP (L)', 'GRP0007', 600, 22, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING GP 2000', 'GRP0008', 300, 22, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED 700S/600S', 'STR0001', 1000, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT STRING MBS 66', 'STR0002', 1800, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 WHITE', 'STR0003', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('GOSEN RY 58/65', 'STR0004', 2000, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT MBS 6+', 'STR0005', 1600, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT MBS 66 WHITE', 'STR0006', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 66 ULTIMAX METTALIC WHITE', 'STR0007', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT MBS 66 RED', 'STR0008', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 66 ULTIMAX RED', 'STR0009', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('KONEX STRINGS', 'STR0010', 1000, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 ROYAL BLUE', 'STR0011', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 YELLOW', 'STR0012', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 TITANIUM SINGLE', 'STR0013', 2500, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 SINGLE', 'STR0014', 2000, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT MBS 63', 'STR0015', 1800, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 BLACK', 'STR0016', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 80 POWER', 'STR0017', 3000, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 VIOLET', 'STR0018', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 RED', 'STR0019', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 GREEN', 'STR0020', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 LAVENDER', 'STR0021', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('BABOLAT RPM BLAST BLACK SINGLE', 'STR0022', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('GOSEN POLYON WHITE SINGLE', 'STR0023', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('SOLINCO HYPER G GREEN SINGLE', 'STR0024', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING N 70 SINGLE', 'STR0025', 2000, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING NO 1 BOOST', 'STR0026', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING NO 1', 'STR0027', 2500, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 TURQUOISE', 'STR0028', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 ORANGE', 'STR0029', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('GOSEN RY 65/58 SINGLE', 'STR0030', 2000, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING NO 5', 'STR0031', 2000, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX EXBOLT 68', 'STR0032', 3500, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT MBS 66 TWO TONE (RED/BLACK)', 'STR0033', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 66 ULTIMAX YELLOW', 'STR0034', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX EXBOLT 63', 'STR0035', 4000, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX EXBOLT 65', 'STR0036', 4000, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('TRANSFORMER TS 101 PRO', 'STR0037', 1800, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 66 ULTIMAX PASTAL GREEN', 'STR0038', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT MBS 66 YELLOW', 'STR0039', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 GOLD', 'STR0040', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING L 67', 'STR0041', 2000, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 PINK', 'STR0042', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 65 TITANIUM', 'STR0043', 2500, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BG 66 ULTIMAX BLACK', 'STR0044', 0, 29, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT JUNIOR SOCKS', 'SOC0001', 800, 28, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX 3 PACK SOCKS', 'SOC0002', 2500, 28, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT SOCKS', 'SOC0003', 1000, 28, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING SOCKS (AWLS)', 'SOC0004', 0, 28, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING SOCKS (AWST)', 'SOC0005', 0, 28, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING 3 PACK SOCKS', 'SOC0006', 2500, 28, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED SOCKS', 'SOC0007', 1500, 28, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAVIS 600', 'SHU0001', 3950, 27, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAVIS 600 SINGLES', 'SHU0002', 0, 27, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING D3', 'SHU0003', 4400, 27, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI MEI 10 PRO', 'SHU0004', 4900, 27, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LIN MEI F7', 'SHU0005', 4900, 27, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('VONEX TUBE', 'SHU0006', 3800, 27, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('VONEX TUBE SINGLE', 'SHU0007', 400, 27, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX GR 303', 'RAC0001', 2000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX LITE 43i', 'RAC0002', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX NANORAY 72 LIte / HL', 'RAC0003', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VOLTRIC LITE 40i', 'RAC0004', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VOLTRIC LITE 47i', 'RAC0005', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT RACKET COVER', 'RAC0006', 500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT SUPERSTAR 11', 'RAC0007', 13500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX ATTACK 9', 'RAC0008', 7000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT NEZER / HH', 'RAC0009', 8500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX LITE 45i', 'RAC0010', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT EXTREME 8 / EB', 'RAC0011', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT NEW TENO 12', 'RAC0012', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT BLUEFLARE (MYS) / EB', 'RAC0013', 8000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT GALLANT TOUR / HH', 'RAC0014', 14500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('EXERGY RACKET', 'RAC0015', 6000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX NANOFLARE 700 PLAY', 'RAC0016', 17500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX NANORAY LIte / HL', 'RAC0017', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VOLTRIC LITE 35i', 'RAC0018', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED SET RACKETS', 'RAC0019', 4000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT ASSASIN / HH', 'RAC0020', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT BLADE', 'RAC0021', 10000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT SUPERSTAR LT / HH', 'RAC0022', 10000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT SUPERSTAR SWIFT', 'RAC0023', 10000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 1DG / HH', 'RAC0024', 15000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 7DG / HH', 'RAC0025', 19000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ARCSABER 7 PLAY / EB', 'RAC0026', 17500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX LITE 37i', 'RAC0027', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING AX FORCE 80', 'RAC0028', 50000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT RALLY', 'RAC0029', 10000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT WOVEN TEC 60 / EB', 'RAC0030', 10000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 88D GAME / HH', 'RAC0031', 30000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 88S PRO', 'RAC0032', 50000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING 3D CALIBER 300 I / B', 'RAC0033', 25000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING AX FORCE BIG BANG', 'RAC0034', 28000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING AX FORCE BLAST', 'RAC0035', 18000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING HALBERTEC 2000', 'RAC0036', 18000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING WINDSTORM 78S / HH', 'RAC0037', 30000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT BLACK (MYS)', 'RAC0038', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT BOLT 8 / HH', 'RAC0039', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('WISH RACKET CLASSICAL 316/317 / BEGINNER', 'RAC0040', 1500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ARCSABER 11 PLAY', 'RAC0041', 17500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 77 PRO (4U) HH', 'RAC0042', 45000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 77 TOUR', 'RAC0043', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 88 PLAY / HH', 'RAC0044', 17500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 99 GAME', 'RAC0045', 30000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX NANOFLARE 700 PRO', 'RAC0046', 50000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX NANOFLARE 800 PRO', 'RAC0047', 55000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('FELET BLACK / ZFORCE / HH', 'RAC0048', 8000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('FELET TJ POWER / HH', 'RAC0049', 9500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED N-ERGY 80 / HH', 'RAC0050', 7500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED ROCK 88 RACKET / HH', 'RAC0051', 6000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED TRAINING 120/140', 'RAC0052', 7500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING 3D CALIBER X BOOST / HH', 'RAC0053', 22000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING AX FORCE 40', 'RAC0054', 25000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING AX FORCE 50', 'RAC0055', 30000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING AX FORCE 70', 'RAC0056', 45000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING AX FORCE CANNON PRO', 'RAC0057', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT METAL (MYS) / EB', 'RAC0058', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT MINI RACKETS', 'RAC0059', 7500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT PREDATOR(MYS)', 'RAC0060', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT RAPTOR X 7 / HH', 'RAC0061', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT SUPREME DNA / HH', 'RAC0062', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT SWORD 3 / EB', 'RAC0063', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('MAXBOLT THUNDER BOLT / EB', 'RAC0064', 9000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ARCSABER 11 PRO', 'RAC0065', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ARCSABER 7 PRO', 'RAC0066', 45000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 100 GAME', 'RAC0067', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 77 PLAY', 'RAC0068', 17500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 88D PRO / HH', 'RAC0069', 50000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 99 play / HH', 'RAC0070', 17500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 99 PRO / HH', 'RAC0071', 56000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX 99 TOUR', 'RAC0072', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ASTROX NEXTAGE', 'RAC0073', 25000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX NANOFLARE 1000 GAME', 'RAC0074', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX NANOFLARE 1000ZZ', 'RAC0075', 0, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX NANOFLARE 800 play', 'RAC0076', 17500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX NANOFLARE NEXTAGE', 'RAC0077', 35000, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX NANORAY 9 / ACE', 'RAC0078', 4500, 25, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX WRIST BAND', 'WRS0001', 1300, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('Li Ning WRIST BAND', 'WRS0002', 1300, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('DUNLOP SQUASH BALLS', 'OTH0001', 950, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX WATER BOTTLE', 'OTH0002', 0, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('SHUTTLE KEY TAG', 'OTH0003', 500, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING MASK', 'OTH0004', 50, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED INSOLE', 'OTH0005', 2000, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX KEY TAG', 'OTH0006', 500, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING WATER BOTTLE', 'OTH0007', 3000, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('IODEX RAPID SPRAY', 'OTH0008', 0, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING SKIPPING ROPE (SP333)', 'OTH0009', 0, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING SLIPPERS', 'OTH0010', 4000, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING SKIPPING ROPE (SP421)', 'OTH0011', 2000, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING TOWEL (YY216)', 'OTH0012', 0, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('SILVER KEY TAG', 'OTH0013', 500, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('STAY SAFE ICE COLD SPRAY', 'OTH0014', 2500, 23, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LIN MEI 10', 'SHL0001', 5500, 27, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING BAG ABDU313 BLUE', 'BAG0001', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BASIC KITBAG NAVY BLUE CYBER LIME', 'BAG0002', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BASIC KITBAG RED BLACK', 'BAG0003', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING 2 ZIPPER BLUE/GREEN - ABDT403', 'BAG0004', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BASIC KITBAG ROYAL BLUE BLACK', 'BAG0005', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED 4M260/4M261 BLUE', 'BAG0006', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED BOX TYPE 2 POCKET - 3M120 BLACK', 'BAG0007', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING 3 ZIPPER BLUE/GREEN 835', 'BAG0008', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING MAXIMUS 667/647', 'BAG0009', 16000, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED BOX TYPE - 3M121 BLACK', 'BAG0010', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED URBAN POD BAG - 3M152', 'BAG0011', 4500, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING 2 ZIPPER WHITE - ABDS681-4', 'BAG0012', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING 3 ZIPPER BAG (837/365/687)', 'BAG0013', 8000, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING BOX BAG 397 BLUE', 'BAG0014', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX 1226 BAG WHITE', 'BAG0015', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX 1431 BAG BLUE', 'BAG0016', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BASIC KITBAG BLACK GRAY', 'BAG0017', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED 4M260/4M261 RED', 'BAG0018', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COSMO RACKET BAG- 3M085 BLACK/ASH', 'BAG0019', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COSMO RACKET BAG- 3M085 BLUE/GOLD', 'BAG0020', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING 2 ZIPPER BLACK - ABDS681-1', 'BAG0021', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING 2 ZIPPER BLUE/ORANGE - ABDT403', 'BAG0022', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING ABDU443 WHITE/RED', 'BAG0023', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX CLUB BACK PACK (22412S)', 'BAG0024', 9000, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED 4M260/4M261', 'BAG0025', 6500, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED 4M260/4M261 YELLOW', 'BAG0026', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COSMO RACKET BAG- 3M085 BLUE/BLACK', 'BAG0027', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING 2 ZIPPER BLUE/GREEN - ABDS681-2', 'BAG0028', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING 2 ZIPPER RED - ABDS681-5', 'BAG0029', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING ABDU441 WHITE/BLUE', 'BAG0030', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING ABDU443 WHITE/BLUE', 'BAG0031', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING BOX BAG 397 BLACK', 'BAG0032', 18500, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING BOX BAG 397 RED', 'BAG0033', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING SHOE BAG (285)', 'BAG0034', 3000, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX 2 ZIPPER BAG (BT6)', 'BAG0035', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX 3 ZIP PRO PERFORM BAG - 92429EX', 'BAG0036', 35000, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX ACE 2326 BAG', 'BAG0037', 9500, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BASIC KITBAG BLACK GRAY YELLOW', 'BAG0038', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BOX TYPE (22931 WT)', 'BAG0039', 0, 20, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-6 BLACK/ORANGE', 'SHO0001', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-1 BLACK/ORANGE', 'SHO0002', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-10 BLACK/ORANGE', 'SHO0003', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-7 BLACK/ORANGE', 'SHO0004', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-8 BLACK/ORANGE', 'SHO0005', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-8 BLUE', 'SHO0006', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-5 LIGHT BLUE', 'SHO0007', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-6 DARK BLUE', 'SHO0008', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-7 DARK BLUE', 'SHO0009', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-7 RED', 'SHO0010', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-7 BLACK', 'SHO0011', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-7 BLUE', 'SHO0012', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HALF GEL PAD', 'SHO0013', 1500, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-2 BLACK/ORANGE', 'SHO0014', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-3 BLACK/ORANGE', 'SHO0015', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-4 BLACK/ORANGE', 'SHO0016', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-5 BLACK/ORANGE', 'SHO0017', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-9 BLACK/ORANGE', 'SHO0018', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING ALMIGHTY V UK-9 LIGHT BLUE', 'SHO0019', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-4 RED', 'SHO0020', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-8 RED', 'SHO0021', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX SHB 39 UK-1 BLUE', 'SHO0022', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-8 BLUE', 'SHO0023', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-10 BLUE/GREEN', 'SHO0024', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-2 BLUE/GREEN', 'SHO0025', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-3 RED', 'SHO0026', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-4 BLUE', 'SHO0027', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING ALMIGHTY V UK-10 LIGHT BLUE', 'SHO0028', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('NIVIA/KONNEX (KIDS)', 'SHO0029', 5500, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X EUR-33 BLUE\CYAN', 'SHO0030', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-10 DARK BLUE', 'SHO0031', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-11 DARK BLUE', 'SHO0032', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-3 DARK BLUE', 'SHO0033', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-3 LIGHT BLUE', 'SHO0034', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-4 DARK BLUE', 'SHO0035', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-6 LIGHT BLUE', 'SHO0036', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-8 DARK BLUE', 'SHO0037', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-9 DARK BLUE', 'SHO0038', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-9 RED', 'SHO0039', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-3 BLACK', 'SHO0040', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-4 BLUE', 'SHO0041', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-8 BLACK', 'SHO0042', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-9 BLACK', 'SHO0043', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-9 RED', 'SHO0044', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED BLADE LITE UK-8 RED', 'SHO0045', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED BLADE LITE UK-9 RED', 'SHO0046', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-11 BLACK/ORANGE', 'SHO0047', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-1 RED', 'SHO0048', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-11 BLUE/GREEN', 'SHO0049', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-2 BLUE', 'SHO0050', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-6 BLUE/GREEN', 'SHO0051', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-6 RED', 'SHO0052', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-7 RED', 'SHO0053', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-9 BLUE/GREEN', 'SHO0054', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-1 LIGHT BLUE', 'SHO0055', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-1 RED', 'SHO0056', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-10 RED', 'SHO0057', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-2 DARK BLUE', 'SHO0058', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-7 LIGHT BLUE', 'SHO0059', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-10 BLACK', 'SHO0060', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-11 RED', 'SHO0061', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-4 BLACK', 'SHO0062', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-6 BLACK', 'SHO0063', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED BLADE LITE UK-10 BLACK', 'SHO0064', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED BLADE LITE UK-11 BLACK', 'SHO0065', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED BLADE LITE UK-6 BLACK', 'SHO0066', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED BLADE LITE UK-7 BLACK', 'SHO0067', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED BLADE LITE UK-8 BLACK', 'SHO0068', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED BLADE LITE UK-9 BLACK', 'SHO0069', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-1 BLUE/ORANGE', 'SHO0070', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-10 BLUE/ORANGE', 'SHO0071', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-10 GREEN/DARK GREY', 'SHO0072', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-11 BLUE/ORANGE', 'SHO0073', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-11 GREEN/DARK GREY', 'SHO0074', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-2 BLACK\BLUE', 'SHO0075', 7000, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-3 GREEN/DARK GREY', 'SHO0076', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-5 BLACK\LIME', 'SHO0077', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-5 BLUE/ORANGE', 'SHO0078', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-5 GREEN/DARK GREY', 'SHO0079', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-6 BLACK\BLUE', 'SHO0080', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-6 BLACK\LIME', 'SHO0081', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-6 BLUE/ORANGE', 'SHO0082', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-7 GREEN/DARK GREY', 'SHO0083', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-8 GREEN/DARK GREY', 'SHO0084', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-9 BLUE/ORANGE', 'SHO0085', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT STAR PRO UK-1 BLUE/RED', 'SHO0086', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT STAR PRO UK-2 BLUE/RED', 'SHO0087', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT STAR PRO UK-3 BLUE/RED', 'SHO0088', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT STAR PRO UK-4 BLUE/RED', 'SHO0089', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT STAR PRO UK-5 BLUE/RED', 'SHO0090', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT STAR PRO UK-6 WHITE/PINK', 'SHO0091', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT ZOOM UK-8 BLUE/GREEN', 'SHO0092', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT ZOOM UK-9 BLUE/LIME', 'SHO0093', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-2 BLUE', 'SHO0094', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE PRO UK-6 BLACK/BLUE', 'SHO0095', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-1 WHITE', 'SHO0096', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-2 BLACK', 'SHO0097', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-2 RED', 'SHO0098', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-2 WHITE', 'SHO0099', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-3 BLUE', 'SHO0100', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-3 BLUE/GREEN', 'SHO0101', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-4 WHITE', 'SHO0102', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-5 BLACK', 'SHO0103', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-9 BLUE', 'SHO0104', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-9 BLUE', 'SHO0105', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-9 RED', 'SHO0106', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING ALMIGHTY V UK-7 LIGHT BLUE', 'SHO0107', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING ALMIGHTY V UK-8 LIGHT BLUE', 'SHO0108', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING DF LITE UK-5 RED/WHITE', 'SHO0109', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING DF LITE UK-6 BLUE/NEON', 'SHO0110', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING DF LITE UK-7 RED/WHITE', 'SHO0111', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING DF LITE UK-9 BLACK/WHITE', 'SHO0112', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING HYPERSONIC UK-7 BLUE/LIME', 'SHO0113', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X EUR-32 BLACK\YELLOW', 'SHO0114', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X EUR-32 BLUE\CYAN', 'SHO0115', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-10 LIGHT BLUE', 'SHO0116', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-10 WHITE\GOLD', 'SHO0117', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-11 LIGHT BLUE', 'SHO0118', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-11 RED', 'SHO0119', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-11 WHITE\GOLD', 'SHO0120', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-3 RED', 'SHO0121', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-4 LIGHT BLUE', 'SHO0122', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-6 RED', 'SHO0123', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-8 LIGHT BLUE', 'SHO0124', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('PUKS DRIVE X UK-9 LIGHT BLUE', 'SHO0125', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX DRIVE I UK-10 BLUE', 'SHO0126', 10000, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX SHB 37 UK-1 WHITE', 'SHO0127', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX SHB 37 UK-2 WHITE', 'SHO0128', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX SHB 37 UK-8 YELLOW', 'SHO0129', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX SHB 39 UK-2 BLUE', 'SHO0130', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX SHB 39 UK-3 BLUE', 'SHO0131', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX SHB 65 Z3 UK-10 WHITE/BLUE', 'SHO0132', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX STRIDER BEAT UK-6 WHITE', 'SHO0133', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-1 BLACK', 'SHO0134', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-1 BLUE', 'SHO0135', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-1 GRAY/LIME', 'SHO0136', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-10 RED', 'SHO0137', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-11 YELLOW', 'SHO0138', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-2 BLACK', 'SHO0139', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-2 BLUE', 'SHO0140', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-2 RED', 'SHO0141', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-3 BLUE', 'SHO0142', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-3 RED', 'SHO0143', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-4 RED', 'SHO0144', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-5 BLACK', 'SHO0145', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-5 GRAY/LIME', 'SHO0146', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-6 GRAY/LIME', 'SHO0147', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-6 YELLOW', 'SHO0148', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-8 RED', 'SHO0149', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-9 BLUE', 'SHO0150', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX VELO 100 UK-9 WHITE', 'SHO0151', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BN139R NET', 'NET0001', 0, 24, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BADMINTON NET (AC152EX/139A)', 'NET0002', 9500, 24, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('YONEX BN-152 PRO HQ NET', 'NET0003', 13500, 24, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED RAZE UK-7 BLUE/GREEN', 'SHE0001', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-1 GREEN/DARK GREY', 'SHE0002', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-2 BLUE/ORANGE', 'SHE0003', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-2 GREEN/DARK GREY', 'SHE0004', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('HUNDRED COURT FLYER UK-9 GREEN/DARK GREY', 'SHE0005', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());
INSERT INTO "Product" (name, sku, price, "categoryId", "shopId", "createdAt", "updatedAt") 
VALUES ('LI NING SAGA LITE 3 EUR-42 BLACK\BLUE', 'SHE0006', 0, 26, 'cmc7vurx10000x5r4mrml2kh4', NOW(), NOW());

-- Create Purchase Invoice for Zimantra Initial Inventory
INSERT INTO "PurchaseInvoice" ("invoiceNumber", "supplierId", total, status, "createdAt", "updatedAt", date) 
VALUES ('PI-ZIM-2025-001', 23, 8779106.56, 'completed', NOW(), NOW(), '2025-07-02');

-- Purchase Invoice Items
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'GRP0001'),
  1403,
  220.8,
  309782.40,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'GRP0002'),
  788,
  461.6,
  363740.80,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'GRP0003'),
  457,
  160.43,
  73316.51,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'GRP0004'),
  11,
  110.07,
  1210.77,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'GRP0005'),
  10,
  450,
  4500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'GRP0006'),
  7,
  500,
  3500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'GRP0007'),
  4,
  500,
  2000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'GRP0008'),
  1,
  200.76,
  200.76,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0001'),
  202,
  343.03,
  69292.06,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0002'),
  182,
  720.57,
  131143.74,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0003'),
  136,
  1199.37,
  163114.32,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0004'),
  131,
  1581.78,
  207213.18,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0005'),
  106,
  503.2,
  53339.20,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0006'),
  77,
  720,
  55440.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0007'),
  70,
  1910,
  133700.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0008'),
  66,
  720,
  47520.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0009'),
  56,
  1910,
  106960.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0010'),
  48,
  235.3,
  11294.40,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0011'),
  47,
  1010.9,
  47512.30,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0012'),
  44,
  1069.08,
  47039.52,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0013'),
  42,
  1045.45,
  43908.90,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0014'),
  38,
  1045.45,
  39727.10,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0015'),
  35,
  667.21,
  23352.35,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0016'),
  35,
  870.05,
  30451.75,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0017'),
  34,
  1847.78,
  62824.52,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0018'),
  31,
  1337,
  41447.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0019'),
  30,
  790,
  23700.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0020'),
  29,
  790,
  22910.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0021'),
  24,
  1337,
  32088.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0022'),
  20,
  1900,
  38000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0023'),
  20,
  500,
  10000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0024'),
  20,
  1650,
  33000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0025'),
  16,
  950,
  15200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0026'),
  15,
  1745,
  26175.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0027'),
  14,
  1600,
  22400.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0028'),
  14,
  1337,
  18718.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0029'),
  12,
  926.75,
  11121.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0030'),
  11,
  1050,
  11550.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0031'),
  9,
  1292.31,
  11630.79,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0032'),
  7,
  2555.55,
  17888.85,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0033'),
  6,
  720,
  4320.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0034'),
  5,
  1910,
  9550.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0035'),
  5,
  2925,
  14625.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0036'),
  5,
  3000,
  15000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0037'),
  4,
  1094.08,
  4376.32,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0038'),
  4,
  1910,
  7640.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0039'),
  3,
  720,
  2160.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0040'),
  3,
  790,
  2370.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0041'),
  2,
  900,
  1800.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0042'),
  2,
  790,
  1580.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0043'),
  2,
  1386.82,
  2773.64,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'STR0044'),
  1,
  1910,
  1910.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SOC0001'),
  74,
  576,
  42624.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SOC0002'),
  55,
  1525.91,
  83925.05,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SOC0003'),
  36,
  570.87,
  20551.32,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SOC0004'),
  35,
  950,
  33250.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SOC0005'),
  14,
  1150,
  16100.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SOC0006'),
  11,
  1605.15,
  17656.65,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SOC0007'),
  10,
  750,
  7500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHU0001'),
  54,
  3849.03,
  207847.62,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHU0002'),
  4,
  639.81,
  2559.24,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHU0003'),
  3,
  4362.91,
  13088.73,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHU0004'),
  1,
  4300,
  4300.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHU0005'),
  1,
  4300,
  4300.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHU0006'),
  1,
  3800,
  3800.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHU0007'),
  1,
  316.67,
  316.67,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0001'),
  37,
  1456.6,
  53894.20,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0002'),
  36,
  5254.93,
  189177.48,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0003'),
  20,
  4500,
  90000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0004'),
  20,
  5050,
  101000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0005'),
  15,
  5503.07,
  82546.05,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0006'),
  13,
  300,
  3900.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0007'),
  12,
  9912.92,
  118955.04,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0008'),
  12,
  5500,
  66000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0009'),
  11,
  5821.52,
  64036.72,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0010'),
  10,
  5501.69,
  55016.90,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0011'),
  9,
  5088,
  45792.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0012'),
  9,
  5050,
  45450.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0013'),
  8,
  5015.46,
  40123.68,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0014'),
  8,
  9857.23,
  78857.84,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0015'),
  6,
  4029.08,
  24174.48,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0016'),
  6,
  10250,
  61500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0017'),
  6,
  5884.62,
  35307.72,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0018'),
  6,
  5511.5,
  33069.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0019'),
  5,
  2500,
  12500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0020'),
  5,
  5110,
  25550.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0021'),
  5,
  6607.33,
  33036.65,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0022'),
  5,
  8000,
  40000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0023'),
  5,
  5795,
  28975.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0024'),
  5,
  10500,
  52500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0025'),
  5,
  14500,
  72500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0026'),
  4,
  10125,
  40500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0027'),
  4,
  5503.67,
  22014.68,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0028'),
  3,
  45666.67,
  137000.01,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0029'),
  3,
  5750,
  17250.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0030'),
  3,
  5895.37,
  17686.11,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0031'),
  3,
  21333.33,
  63999.99,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0032'),
  3,
  45833.33,
  137499.99,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0033'),
  2,
  16142.86,
  32285.72,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0034'),
  2,
  23000,
  46000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0035'),
  2,
  14000,
  28000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0036'),
  2,
  12250,
  24500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0037'),
  2,
  19990,
  39980.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0038'),
  2,
  5055,
  10110.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0039'),
  2,
  5600,
  11200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0040'),
  2,
  1290,
  2580.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0041'),
  2,
  11250,
  22500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0042'),
  2,
  32000,
  64000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0043'),
  2,
  27000,
  54000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0044'),
  2,
  12583.34,
  25166.68,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0045'),
  2,
  23000,
  46000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0046'),
  2,
  46500,
  93000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0047'),
  2,
  48500,
  97000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0048'),
  1,
  7500,
  7500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0049'),
  1,
  9000,
  9000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0050'),
  1,
  6500,
  6500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0051'),
  1,
  4500,
  4500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0052'),
  1,
  6500,
  6500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0053'),
  1,
  18705.5,
  18705.50,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0054'),
  1,
  18000,
  18000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0055'),
  1,
  21500,
  21500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0056'),
  1,
  35500,
  35500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0057'),
  1,
  18000,
  18000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0058'),
  1,
  5180,
  5180.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0059'),
  1,
  5452,
  5452.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0060'),
  1,
  5050,
  5050.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0061'),
  1,
  5600,
  5600.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0062'),
  1,
  5600,
  5600.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0063'),
  1,
  5133.34,
  5133.34,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0064'),
  1,
  5321.42,
  5321.42,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0065'),
  1,
  50675.5,
  50675.50,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0066'),
  1,
  38000,
  38000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0067'),
  1,
  21500,
  21500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0068'),
  1,
  11125,
  11125.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0069'),
  1,
  47000,
  47000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0070'),
  1,
  10500,
  10500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0071'),
  1,
  52000,
  52000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0072'),
  1,
  27000,
  27000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0073'),
  1,
  23000,
  23000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0074'),
  1,
  21500,
  21500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0075'),
  1,
  52000,
  52000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0076'),
  1,
  10500,
  10500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0077'),
  1,
  15000,
  15000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'RAC0078'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'WRS0001'),
  34,
  631.52,
  21471.68,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'WRS0002'),
  6,
  770.19,
  4621.14,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0001'),
  23,
  775,
  17825.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0002'),
  19,
  2800,
  53200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0003'),
  12,
  100,
  1200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0004'),
  10,
  30,
  300.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0005'),
  8,
  1215,
  9720.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0006'),
  7,
  500,
  3500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0007'),
  6,
  3550,
  21300.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0008'),
  5,
  1020,
  5100.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0009'),
  3,
  1000,
  3000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0010'),
  2,
  2000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0011'),
  1,
  1500,
  1500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0012'),
  1,
  900,
  900.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0013'),
  1,
  300,
  300.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'OTH0014'),
  1,
  1699.6,
  1699.60,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHL0001'),
  16,
  5200,
  83200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0001'),
  10,
  11000,
  110000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0002'),
  10,
  3094.7,
  30947.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0003'),
  6,
  3473.5,
  20841.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0004'),
  5,
  4000,
  20000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0005'),
  5,
  3378.8,
  16894.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0006'),
  4,
  3500,
  14000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0007'),
  4,
  10068.75,
  40275.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0008'),
  4,
  5000,
  20000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0009'),
  4,
  12512.5,
  50050.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0010'),
  3,
  10000,
  30000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0011'),
  3,
  3128.57,
  9385.71,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0012'),
  3,
  3633.33,
  10899.99,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0013'),
  3,
  5400,
  16200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0014'),
  3,
  13500,
  40500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0015'),
  3,
  9000,
  27000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0016'),
  3,
  7500,
  22500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0017'),
  3,
  3947,
  11841.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0018'),
  2,
  3500,
  7000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0019'),
  2,
  3000,
  6000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0020'),
  2,
  3000,
  6000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0021'),
  2,
  3630,
  7260.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0022'),
  2,
  4000,
  8000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0023'),
  2,
  13000,
  26000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0024'),
  2,
  7000,
  14000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0025'),
  1,
  3800,
  3800.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0026'),
  1,
  3500,
  3500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0027'),
  1,
  3000,
  3000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0028'),
  1,
  3630,
  3630.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0029'),
  1,
  3630,
  3630.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0030'),
  1,
  13000,
  13000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0031'),
  1,
  13000,
  13000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0032'),
  1,
  14500,
  14500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0033'),
  1,
  13500,
  13500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0034'),
  1,
  2500,
  2500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0035'),
  1,
  9000,
  9000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0036'),
  1,
  35000,
  35000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0037'),
  1,
  9000,
  9000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0038'),
  1,
  3947,
  3947.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'BAG0039'),
  1,
  16000,
  16000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0001'),
  7,
  5785.71,
  40499.97,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0002'),
  6,
  5800,
  34800.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0003'),
  6,
  5800,
  34800.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0004'),
  5,
  5500,
  27500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0005'),
  5,
  5500,
  27500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0006'),
  5,
  6150,
  30750.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0007'),
  5,
  3200,
  16000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0008'),
  5,
  3320,
  16600.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0009'),
  5,
  3619.2,
  18096.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0010'),
  5,
  3974.67,
  19873.35,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0011'),
  5,
  6100,
  30500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0012'),
  5,
  6300,
  31500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0013'),
  4,
  750,
  3000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0014'),
  4,
  5650,
  22600.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0015'),
  4,
  5650,
  22600.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0016'),
  4,
  5650,
  22600.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0017'),
  4,
  5500,
  22000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0018'),
  4,
  5500,
  22000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0019'),
  4,
  19500,
  78000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0020'),
  4,
  3600.5,
  14402.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0021'),
  4,
  3350,
  13400.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0022'),
  4,
  10519,
  42076.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0023'),
  4,
  5750,
  23000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0024'),
  3,
  6000,
  18000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0025'),
  3,
  5411,
  16233.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0026'),
  3,
  5411,
  16233.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0027'),
  3,
  5803.67,
  17411.01,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0028'),
  3,
  19500,
  58500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0029'),
  3,
  4000,
  12000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0030'),
  3,
  3797.33,
  11391.99,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0031'),
  3,
  3733.33,
  11199.99,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0032'),
  3,
  3566.67,
  10700.01,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0033'),
  3,
  3400,
  10200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0034'),
  3,
  3365.33,
  10095.99,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0035'),
  3,
  3300,
  9900.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0036'),
  3,
  3200,
  9600.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0037'),
  3,
  3365.33,
  10095.99,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0038'),
  3,
  3416,
  10248.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0039'),
  3,
  3530.67,
  10592.01,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0040'),
  3,
  5833.33,
  17499.99,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0041'),
  3,
  6000,
  18000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0042'),
  3,
  5833.33,
  17499.99,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0043'),
  3,
  5833.33,
  17499.99,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0044'),
  3,
  6500,
  19500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0045'),
  2,
  4500,
  9000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0046'),
  2,
  4500,
  9000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0047'),
  2,
  5500,
  11000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0048'),
  2,
  5411,
  10822.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0049'),
  2,
  6000,
  12000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0050'),
  2,
  5411,
  10822.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0051'),
  2,
  7000,
  14000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0052'),
  2,
  6500,
  13000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0053'),
  2,
  6500,
  13000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0054'),
  2,
  6000,
  12000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0055'),
  2,
  3200,
  6400.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0056'),
  2,
  3200,
  6400.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0057'),
  2,
  3600,
  7200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0058'),
  2,
  3500,
  7000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0059'),
  2,
  3200,
  6400.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0060'),
  2,
  7000,
  14000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0061'),
  2,
  7153.5,
  14307.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0062'),
  2,
  6250,
  12500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0063'),
  2,
  7000,
  14000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0064'),
  1,
  4500,
  4500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0065'),
  1,
  4500,
  4500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0066'),
  1,
  4500,
  4500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0067'),
  1,
  4500,
  4500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0068'),
  1,
  4500,
  4500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0069'),
  1,
  4500,
  4500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0070'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0071'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0072'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0073'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0074'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0075'),
  1,
  4500,
  4500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0076'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0077'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0078'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0079'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0080'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0081'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0082'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0083'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0084'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0085'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0086'),
  1,
  5225,
  5225.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0087'),
  1,
  5225,
  5225.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0088'),
  1,
  5225,
  5225.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0089'),
  1,
  5225,
  5225.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0090'),
  1,
  5225,
  5225.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0091'),
  1,
  5225,
  5225.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0092'),
  1,
  5000,
  5000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0093'),
  1,
  5000,
  5000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0094'),
  1,
  6100,
  6100.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0095'),
  1,
  6100,
  6100.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0096'),
  1,
  5411,
  5411.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0097'),
  1,
  5411,
  5411.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0098'),
  1,
  6000,
  6000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0099'),
  1,
  5411,
  5411.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0100'),
  1,
  5411,
  5411.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0101'),
  1,
  5411,
  5411.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0102'),
  1,
  5411,
  5411.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0103'),
  1,
  5411,
  5411.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0104'),
  1,
  7000,
  7000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0105'),
  1,
  6000,
  6000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0106'),
  1,
  6000,
  6000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0107'),
  1,
  19500,
  19500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0108'),
  1,
  19500,
  19500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0109'),
  1,
  23100,
  23100.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0110'),
  1,
  23100,
  23100.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0111'),
  1,
  23100,
  23100.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0112'),
  1,
  23100,
  23100.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0113'),
  1,
  15600,
  15600.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0114'),
  1,
  3696,
  3696.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0115'),
  1,
  3696,
  3696.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0116'),
  1,
  3200,
  3200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0117'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0118'),
  1,
  3200,
  3200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0119'),
  1,
  3200,
  3200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0120'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0121'),
  1,
  3200,
  3200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0122'),
  1,
  3200,
  3200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0123'),
  1,
  3750,
  3750.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0124'),
  1,
  3200,
  3200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0125'),
  1,
  3200,
  3200.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0126'),
  1,
  6863,
  6863.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0127'),
  1,
  11166,
  11166.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0128'),
  1,
  11166,
  11166.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0129'),
  1,
  11166,
  11166.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0130'),
  1,
  10519,
  10519.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0131'),
  1,
  10519,
  10519.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0132'),
  1,
  33000,
  33000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0133'),
  1,
  19100,
  19100.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0134'),
  1,
  7307,
  7307.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0135'),
  1,
  7307,
  7307.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0136'),
  1,
  7307,
  7307.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0137'),
  1,
  7000,
  7000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0138'),
  1,
  7000,
  7000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0139'),
  1,
  6500,
  6500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0140'),
  1,
  7307,
  7307.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0141'),
  1,
  6500,
  6500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0142'),
  1,
  5500,
  5500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0143'),
  1,
  6500,
  6500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0144'),
  1,
  6500,
  6500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0145'),
  1,
  7000,
  7000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0146'),
  1,
  7000,
  7000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0147'),
  1,
  7000,
  7000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0148'),
  1,
  7000,
  7000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0149'),
  1,
  6500,
  6500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0150'),
  1,
  5500,
  5500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHO0151'),
  1,
  7307,
  7307.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'NET0001'),
  3,
  6500,
  19500.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'NET0002'),
  2,
  9500,
  19000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'NET0003'),
  2,
  12500,
  25000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHE0001'),
  2,
  6000,
  12000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHE0002'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHE0003'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHE0004'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHE0005'),
  1,
  4000,
  4000.00,
  NOW(),
  NOW();
INSERT INTO "PurchaseInvoiceItem" ("purchaseInvoiceId", "productId", quantity, price, total, "createdAt", "updatedAt")
SELECT 
  (SELECT id FROM "PurchaseInvoice" WHERE "invoiceNumber" = 'PI-ZIM-2025-001'),
  (SELECT id FROM "Product" WHERE sku = 'SHE0006'),
  1,
  14000,
  14000.00,
  NOW(),
  NOW();

-- Create Inventory Items for Zimantra Shop
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'GRP0001'),
  1403,
  'cmc7vurx10000x5r4mrml2kh4',
  220.8,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'GRP0002'),
  788,
  'cmc7vurx10000x5r4mrml2kh4',
  461.6,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'GRP0003'),
  457,
  'cmc7vurx10000x5r4mrml2kh4',
  160.43,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'GRP0004'),
  11,
  'cmc7vurx10000x5r4mrml2kh4',
  110.07,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'GRP0005'),
  10,
  'cmc7vurx10000x5r4mrml2kh4',
  450,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'GRP0006'),
  7,
  'cmc7vurx10000x5r4mrml2kh4',
  500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'GRP0007'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'GRP0008'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  200.76,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0001'),
  202,
  'cmc7vurx10000x5r4mrml2kh4',
  343.03,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0002'),
  182,
  'cmc7vurx10000x5r4mrml2kh4',
  720.57,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0003'),
  136,
  'cmc7vurx10000x5r4mrml2kh4',
  1199.37,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0004'),
  131,
  'cmc7vurx10000x5r4mrml2kh4',
  1581.78,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0005'),
  106,
  'cmc7vurx10000x5r4mrml2kh4',
  503.2,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0006'),
  77,
  'cmc7vurx10000x5r4mrml2kh4',
  720,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0007'),
  70,
  'cmc7vurx10000x5r4mrml2kh4',
  1910,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0008'),
  66,
  'cmc7vurx10000x5r4mrml2kh4',
  720,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0009'),
  56,
  'cmc7vurx10000x5r4mrml2kh4',
  1910,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0010'),
  48,
  'cmc7vurx10000x5r4mrml2kh4',
  235.3,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0011'),
  47,
  'cmc7vurx10000x5r4mrml2kh4',
  1010.9,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0012'),
  44,
  'cmc7vurx10000x5r4mrml2kh4',
  1069.08,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0013'),
  42,
  'cmc7vurx10000x5r4mrml2kh4',
  1045.45,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0014'),
  38,
  'cmc7vurx10000x5r4mrml2kh4',
  1045.45,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0015'),
  35,
  'cmc7vurx10000x5r4mrml2kh4',
  667.21,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0016'),
  35,
  'cmc7vurx10000x5r4mrml2kh4',
  870.05,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0017'),
  34,
  'cmc7vurx10000x5r4mrml2kh4',
  1847.78,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0018'),
  31,
  'cmc7vurx10000x5r4mrml2kh4',
  1337,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0019'),
  30,
  'cmc7vurx10000x5r4mrml2kh4',
  790,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0020'),
  29,
  'cmc7vurx10000x5r4mrml2kh4',
  790,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0021'),
  24,
  'cmc7vurx10000x5r4mrml2kh4',
  1337,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0022'),
  20,
  'cmc7vurx10000x5r4mrml2kh4',
  1900,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0023'),
  20,
  'cmc7vurx10000x5r4mrml2kh4',
  500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0024'),
  20,
  'cmc7vurx10000x5r4mrml2kh4',
  1650,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0025'),
  16,
  'cmc7vurx10000x5r4mrml2kh4',
  950,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0026'),
  15,
  'cmc7vurx10000x5r4mrml2kh4',
  1745,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0027'),
  14,
  'cmc7vurx10000x5r4mrml2kh4',
  1600,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0028'),
  14,
  'cmc7vurx10000x5r4mrml2kh4',
  1337,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0029'),
  12,
  'cmc7vurx10000x5r4mrml2kh4',
  926.75,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0030'),
  11,
  'cmc7vurx10000x5r4mrml2kh4',
  1050,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0031'),
  9,
  'cmc7vurx10000x5r4mrml2kh4',
  1292.31,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0032'),
  7,
  'cmc7vurx10000x5r4mrml2kh4',
  2555.55,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0033'),
  6,
  'cmc7vurx10000x5r4mrml2kh4',
  720,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0034'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  1910,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0035'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  2925,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0036'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  3000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0037'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  1094.08,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0038'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  1910,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0039'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  720,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0040'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  790,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0041'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  900,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0042'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  790,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0043'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  1386.82,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'STR0044'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  1910,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SOC0001'),
  74,
  'cmc7vurx10000x5r4mrml2kh4',
  576,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SOC0002'),
  55,
  'cmc7vurx10000x5r4mrml2kh4',
  1525.91,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SOC0003'),
  36,
  'cmc7vurx10000x5r4mrml2kh4',
  570.87,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SOC0004'),
  35,
  'cmc7vurx10000x5r4mrml2kh4',
  950,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SOC0005'),
  14,
  'cmc7vurx10000x5r4mrml2kh4',
  1150,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SOC0006'),
  11,
  'cmc7vurx10000x5r4mrml2kh4',
  1605.15,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SOC0007'),
  10,
  'cmc7vurx10000x5r4mrml2kh4',
  750,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHU0001'),
  54,
  'cmc7vurx10000x5r4mrml2kh4',
  3849.03,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHU0002'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  639.81,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHU0003'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  4362.91,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHU0004'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4300,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHU0005'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4300,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHU0006'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3800,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHU0007'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  316.67,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0001'),
  37,
  'cmc7vurx10000x5r4mrml2kh4',
  1456.6,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0002'),
  36,
  'cmc7vurx10000x5r4mrml2kh4',
  5254.93,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0003'),
  20,
  'cmc7vurx10000x5r4mrml2kh4',
  4500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0004'),
  20,
  'cmc7vurx10000x5r4mrml2kh4',
  5050,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0005'),
  15,
  'cmc7vurx10000x5r4mrml2kh4',
  5503.07,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0006'),
  13,
  'cmc7vurx10000x5r4mrml2kh4',
  300,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0007'),
  12,
  'cmc7vurx10000x5r4mrml2kh4',
  9912.92,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0008'),
  12,
  'cmc7vurx10000x5r4mrml2kh4',
  5500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0009'),
  11,
  'cmc7vurx10000x5r4mrml2kh4',
  5821.52,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0010'),
  10,
  'cmc7vurx10000x5r4mrml2kh4',
  5501.69,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0011'),
  9,
  'cmc7vurx10000x5r4mrml2kh4',
  5088,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0012'),
  9,
  'cmc7vurx10000x5r4mrml2kh4',
  5050,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0013'),
  8,
  'cmc7vurx10000x5r4mrml2kh4',
  5015.46,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0014'),
  8,
  'cmc7vurx10000x5r4mrml2kh4',
  9857.23,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0015'),
  6,
  'cmc7vurx10000x5r4mrml2kh4',
  4029.08,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0016'),
  6,
  'cmc7vurx10000x5r4mrml2kh4',
  10250,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0017'),
  6,
  'cmc7vurx10000x5r4mrml2kh4',
  5884.62,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0018'),
  6,
  'cmc7vurx10000x5r4mrml2kh4',
  5511.5,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0019'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  2500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0020'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  5110,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0021'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  6607.33,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0022'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  8000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0023'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  5795,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0024'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  10500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0025'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  14500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0026'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  10125,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0027'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  5503.67,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0028'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  45666.67,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0029'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  5750,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0030'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  5895.37,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0031'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  21333.33,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0032'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  45833.33,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0033'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  16142.86,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0034'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  23000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0035'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  14000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0036'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  12250,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0037'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  19990,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0038'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  5055,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0039'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  5600,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0040'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  1290,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0041'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  11250,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0042'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  32000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0043'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  27000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0044'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  12583.34,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0045'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  23000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0046'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  46500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0047'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  48500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0048'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0049'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  9000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0050'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0051'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0052'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0053'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  18705.5,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0054'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  18000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0055'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  21500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0056'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  35500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0057'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  18000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0058'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5180,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0059'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5452,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0060'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5050,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0061'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5600,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0062'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5600,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0063'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5133.34,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0064'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5321.42,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0065'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  50675.5,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0066'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  38000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0067'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  21500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0068'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  11125,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0069'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  47000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0070'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  10500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0071'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  52000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0072'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  27000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0073'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  23000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0074'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  21500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0075'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  52000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0076'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  10500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0077'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  15000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'RAC0078'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'WRS0001'),
  34,
  'cmc7vurx10000x5r4mrml2kh4',
  631.52,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'WRS0002'),
  6,
  'cmc7vurx10000x5r4mrml2kh4',
  770.19,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0001'),
  23,
  'cmc7vurx10000x5r4mrml2kh4',
  775,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0002'),
  19,
  'cmc7vurx10000x5r4mrml2kh4',
  2800,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0003'),
  12,
  'cmc7vurx10000x5r4mrml2kh4',
  100,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0004'),
  10,
  'cmc7vurx10000x5r4mrml2kh4',
  30,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0005'),
  8,
  'cmc7vurx10000x5r4mrml2kh4',
  1215,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0006'),
  7,
  'cmc7vurx10000x5r4mrml2kh4',
  500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0007'),
  6,
  'cmc7vurx10000x5r4mrml2kh4',
  3550,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0008'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  1020,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0009'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  1000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0010'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  2000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0011'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  1500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0012'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  900,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0013'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  300,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'OTH0014'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  1699.6,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHL0001'),
  16,
  'cmc7vurx10000x5r4mrml2kh4',
  5200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0001'),
  10,
  'cmc7vurx10000x5r4mrml2kh4',
  11000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0002'),
  10,
  'cmc7vurx10000x5r4mrml2kh4',
  3094.7,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0003'),
  6,
  'cmc7vurx10000x5r4mrml2kh4',
  3473.5,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0004'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0005'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  3378.8,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0006'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  3500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0007'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  10068.75,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0008'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  5000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0009'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  12512.5,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0010'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  10000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0011'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3128.57,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0012'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3633.33,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0013'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  5400,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0014'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  13500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0015'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  9000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0016'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  7500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0017'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3947,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0018'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  3500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0019'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  3000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0020'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  3000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0021'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  3630,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0022'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0023'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  13000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0024'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  7000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0025'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3800,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0026'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0027'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0028'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3630,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0029'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3630,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0030'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  13000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0031'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  13000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0032'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  14500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0033'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  13500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0034'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  2500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0035'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  9000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0036'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  35000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0037'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  9000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0038'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3947,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'BAG0039'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  16000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0001'),
  7,
  'cmc7vurx10000x5r4mrml2kh4',
  5785.71,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0002'),
  6,
  'cmc7vurx10000x5r4mrml2kh4',
  5800,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0003'),
  6,
  'cmc7vurx10000x5r4mrml2kh4',
  5800,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0004'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  5500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0005'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  5500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0006'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  6150,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0007'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0008'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  3320,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0009'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  3619.2,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0010'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  3974.67,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0011'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  6100,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0012'),
  5,
  'cmc7vurx10000x5r4mrml2kh4',
  6300,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0013'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  750,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0014'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  5650,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0015'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  5650,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0016'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  5650,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0017'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  5500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0018'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  5500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0019'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  19500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0020'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  3600.5,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0021'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  3350,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0022'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  10519,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0023'),
  4,
  'cmc7vurx10000x5r4mrml2kh4',
  5750,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0024'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  6000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0025'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  5411,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0026'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  5411,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0027'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  5803.67,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0028'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  19500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0029'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0030'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3797.33,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0031'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3733.33,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0032'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3566.67,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0033'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3400,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0034'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3365.33,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0035'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3300,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0036'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0037'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3365.33,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0038'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3416,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0039'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  3530.67,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0040'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  5833.33,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0041'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  6000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0042'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  5833.33,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0043'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  5833.33,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0044'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  6500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0045'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  4500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0046'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  4500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0047'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  5500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0048'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  5411,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0049'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  6000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0050'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  5411,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0051'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  7000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0052'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  6500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0053'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  6500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0054'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  6000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0055'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0056'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0057'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  3600,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0058'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  3500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0059'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0060'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  7000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0061'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  7153.5,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0062'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  6250,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0063'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  7000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0064'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0065'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0066'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0067'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0068'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0069'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0070'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0071'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0072'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0073'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0074'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0075'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0076'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0077'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0078'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0079'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0080'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0081'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0082'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0083'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0084'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0085'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0086'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5225,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0087'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5225,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0088'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5225,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0089'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5225,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0090'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5225,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0091'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5225,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0092'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0093'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0094'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6100,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0095'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6100,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0096'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5411,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0097'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5411,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0098'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0099'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5411,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0100'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5411,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0101'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5411,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0102'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5411,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0103'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5411,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0104'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0105'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0106'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0107'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  19500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0108'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  19500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0109'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  23100,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0110'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  23100,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0111'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  23100,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0112'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  23100,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0113'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  15600,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0114'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3696,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0115'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3696,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0116'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0117'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0118'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0119'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0120'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0121'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0122'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0123'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3750,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0124'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0125'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  3200,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0126'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6863,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0127'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  11166,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0128'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  11166,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0129'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  11166,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0130'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  10519,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0131'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  10519,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0132'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  33000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0133'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  19100,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0134'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7307,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0135'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7307,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0136'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7307,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0137'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0138'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0139'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0140'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7307,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0141'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0142'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0143'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0144'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0145'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0146'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0147'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0148'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0149'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  6500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0150'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  5500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHO0151'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  7307,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'NET0001'),
  3,
  'cmc7vurx10000x5r4mrml2kh4',
  6500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'NET0002'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  9500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'NET0003'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  12500,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHE0001'),
  2,
  'cmc7vurx10000x5r4mrml2kh4',
  6000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHE0002'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHE0003'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHE0004'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHE0005'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  4000,
  NOW(),
  NOW()
);
INSERT INTO "InventoryItem" ("productId", quantity, "shopId", "shopspecificcost", "createdAt", "updatedAt")
VALUES (
  (SELECT id FROM "Product" WHERE sku = 'SHE0006'),
  1,
  'cmc7vurx10000x5r4mrml2kh4',
  14000,
  NOW(),
  NOW()
);
