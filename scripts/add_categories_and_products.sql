-- Add Categories First
INSERT INTO "Category" (name, description) VALUES
('BAGS', 'Sports bags and carrying equipment'),
('CLOTHS', 'Sports clothing and apparel'),
('GRIPS', 'Racket grips and grip accessories'),
('OTHER', 'Miscellaneous sports accessories'),
('NETS', 'Badminton nets and net accessories'),
('RACKETS', 'Badminton rackets and racket equipment'),
('SHOES', 'Sports shoes and footwear'),
('SHUTTLECOCKS', 'Badminton shuttlecocks'),
('SOCKS', 'Sports socks and hosiery'),
('STRINGS', 'Racket strings and stringing supplies'),
('WRISTBANDS', 'Wristbands and sweatbands')
ON CONFLICT (name) DO NOTHING;

-- Add Products (using category names to get IDs)
INSERT INTO "Product" (name, description, price, "categoryId") VALUES
-- BAGS
('YONEX BOX TYPE (22931 WT)', 'YONEX badminton bag box type', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED 3 ZIPPER LEVEL-UP BAG (2M145/144)', 'HUNDRED badminton bag with 3 zippers', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED 4M260/4M261', 'HUNDRED badminton bag model 4M260/4M261', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED 4M260/4M261 BLUE', 'HUNDRED badminton bag model 4M260/4M261 in blue color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED 4M260/4M261 RED', 'HUNDRED badminton bag model 4M260/4M261 in red color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED 4M260/4M261 YELLOW', 'HUNDRED badminton bag model 4M260/4M261 in yellow color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED BACKPACK 3M007', 'HUNDRED badminton backpack model 3M007', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED BOX TYPE - 3M121', 'HUNDRED box type badminton bag model 3M121', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED BOX TYPE - 3M121 BLACK', 'HUNDRED box type badminton bag model 3M121 in black', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED BOX TYPE - 3M121 BLUE', 'HUNDRED box type badminton bag model 3M121 in blue', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED BOX TYPE 2 POCKET - 3M120', 'HUNDRED box type badminton bag with 2 pockets model 3M120', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED BOX TYPE 2 POCKET - 3M120 BLACK', 'HUNDRED box type badminton bag with 2 pockets model 3M120 in black', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED BOX TYPE 2 POCKET - 3M120 WHITE', 'HUNDRED box type badminton bag with 2 pockets model 3M120 in white', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED BOX TYPE 3M009-1', 'HUNDRED box type badminton bag model 3M009-1', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED COSMO RACKET BAG- 3M085', 'HUNDRED cosmo racket bag model 3M085', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED COSMO RACKET BAG- 3M085 BLACK/ASH', 'HUNDRED cosmo racket bag model 3M085 in black/ash color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED COSMO RACKET BAG- 3M085 BLACK/RED', 'HUNDRED cosmo racket bag model 3M085 in black/red color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED COSMO RACKET BAG- 3M085 BLUE/BLACK', 'HUNDRED cosmo racket bag model 3M085 in blue/black color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED COSMO RACKET BAG- 3M085 BLUE/GOLD', 'HUNDRED cosmo racket bag model 3M085 in blue/gold color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED IDEAL BAG - 2M148/147/146', 'HUNDRED ideal badminton bag model 2M148/147/146', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED NUCLEAR EDGE BAG 2M090', 'HUNDRED nuclear edge badminton bag model 2M090', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('HUNDRED URBAN POD BAG - 3M152', 'HUNDRED urban pod badminton bag model 3M152', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING 2 ZIPPER BLACK -  ABDS681-1', 'LI NING badminton bag with 2 zippers in black color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING 2 ZIPPER BLUE -  ABDT359-3', 'LI NING badminton bag with 2 zippers in blue color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING 2 ZIPPER BLUE/GREEN -  ABDS681-2', 'LI NING badminton bag with 2 zippers in blue/green color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING 2 ZIPPER RED -  ABDS681-5', 'LI NING badminton bag with 2 zippers in red color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING 2 ZIPPER WHITE -  ABDS681-4', 'LI NING badminton bag with 2 zippers in white color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING 3 POCKET BAG(661/853)', 'LI NING badminton bag with 3 pockets', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING 3 ZIPPER BAG (837/365/687)', 'LI NING badminton bag with 3 zippers', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING BACK PACK ABSU385', 'LI NING badminton backpack model ABSU385', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING BAG ABDU309', 'LI NING badminton bag model ABDU309', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING BAG ABDU313', 'LI NING badminton bag model ABDU313', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING BAG ABJS059', 'LI NING badminton bag model ABJS059', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING BAG ABJU013', 'LI NING badminton bag model ABJU013', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING BAG ABJU033', 'LI NING badminton bag model ABJU033', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING BAG ABLU069', 'LI NING badminton bag model ABLU069', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING BAG ABLV029', 'LI NING badminton bag model ABLV029', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING BAG LU067', 'LI NING badminton bag model LU067', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING BOX BAG 397 BLACK', 'LI NING box type badminton bag model 397 in black', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING BOX BAG 399', 'LI NING box type badminton bag model 399', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING MAXIMUS 667/647', 'LI NING Maximus badminton bag model 667/647', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('LI NING SHOE BAG (285)', 'LI NING shoe bag model 285', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('MAXBOLT BOX 4013 BAG', 'MAXBOLT box type badminton bag model 4013', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX  BACKPACK ACE 2312', 'YONEX badminton backpack ACE model 2312', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX 2 ZIPPER BAG (BT6)', 'YONEX badminton bag with 2 zippers model BT6', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX 3 ZIP PRO PERFORM BAG - 92429EX', 'YONEX pro performance bag with 3 zippers model 92429EX', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX 3 ZIPPER (BT 9)', 'YONEX badminton bag with 3 zippers model BT9', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX 3D B1 ZIPPER BOX TYPE BAG', 'YONEX 3D box type bag with zipper model B1', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX 3D BOX TYPE BAG (3D-2231)', 'YONEX 3D box type badminton bag model 3D-2231', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX ACE 2326 BAG', 'YONEX ACE badminton bag model 2326', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX BAG 2331WEX', 'YONEX badminton bag model 2331WEX', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX BASIC KITBAG BLACK GRAY', 'YONEX basic kit bag in black gray color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX BASIC KITBAG BLACK GRAY YELLOW', 'YONEX basic kit bag in black gray yellow color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX BASIC KITBAG NAVY BLUE CYBER LIME', 'YONEX basic kit bag in navy blue cyber lime color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX BASIC KITBAG RED BLACK', 'YONEX basic kit bag in red black color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX BASIC KITBAG ROYAL BLUE BLACK', 'YONEX basic kit bag in royal blue black color', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX BOX TOURNAMENT BAG 2331', 'YONEX box tournament badminton bag model 2331', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),
('YONEX CLUB BACK PACK (22412S)', 'YONEX club backpack model 22412S', 0, (SELECT id FROM "Category" WHERE name = 'BAGS')),

-- CLOTHS
('HUNDRED SHORTS (3M130/131)', 'HUNDRED badminton shorts model 3M130/131', 0, (SELECT id FROM "Category" WHERE name = 'CLOTHS')),
('HUNDRED SHORTS (4M016/017)', 'HUNDRED badminton shorts model 4M016/017', 0, (SELECT id FROM "Category" WHERE name = 'CLOTHS')),
('HUNDRED T.SHIRTS (3M123/124/125/126/127/129)', 'HUNDRED badminton t-shirts various models', 0, (SELECT id FROM "Category" WHERE name = 'CLOTHS')),
('LI NING / YONEX  T SHIRT (963/707/995/993)', 'LI NING / YONEX badminton t-shirts various models', 0, (SELECT id FROM "Category" WHERE name = 'CLOTHS')),
('LI NING / YONEX SHORTS(725/727/745/723)', 'LI NING / YONEX badminton shorts various models', 0, (SELECT id FROM "Category" WHERE name = 'CLOTHS')),
('LI NING BOTTOM', 'LI NING badminton bottom wear', 0, (SELECT id FROM "Category" WHERE name = 'CLOTHS')),
('LI NING TOP', 'LI NING badminton top wear', 0, (SELECT id FROM "Category" WHERE name = 'CLOTHS')),

-- GRIPS
('FELET GRIP', 'FELET badminton racket grip', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('HUNDRED GRIP - GTO 20', 'HUNDRED badminton racket grip model GTO 20', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('HUNDRED GRIP - GTR 17/18/19/34', 'HUNDRED badminton racket grip model GTR series', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('KONEX TOWEL GRIP', 'KONEX towel grip for badminton racket', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('LI NING  GP 20', 'LI NING badminton racket grip model GP 20', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('LI NING  GP 24', 'LI NING badminton racket grip model GP 24', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('LI NING CUSHION WRAP SINGLE', 'LI NING cushion wrap grip single', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('LI NING GP 16/17/18/19', 'LI NING badminton racket grip GP series', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('LI NING GP 2000', 'LI NING badminton racket grip model GP 2000', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('LI NING TOWEL GRIP (L)', 'LI NING towel grip large size', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('LI NING TOWEL GRIP (S)', 'LI NING towel grip small size', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('LI NING TOWEL GRIP ROLL (GC-200R)', 'LI NING towel grip roll model GC-200R', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('LI NING TOWEL GRIPS(GC 001)', 'LI NING towel grips model GC 001', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('MAXBOLT PU GRIP', 'MAXBOLT PU badminton racket grip', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('MAXBOLT TOWEL GRIP ROLL', 'MAXBOLT towel grip roll', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('MAXBOLT TOWEL GRIP SINGLE', 'MAXBOLT towel grip single', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('OQO OVER GRIP', 'OQO over grip for badminton racket', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('SPACESHIP OVER GRIP', 'SPACESHIP over grip for badminton racket', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('YONEX SUPER GRAP OVER GRIP', 'YONEX super grap over grip', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),
('YONEX TOWEL GRIPS', 'YONEX towel grips for badminton racket', 0, (SELECT id FROM "Category" WHERE name = 'GRIPS')),

-- OTHER
('OUT GUTING', 'Out guting badminton accessory', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING K-TAPE BOX', 'LI NING K-tape box for injury support', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),

-- NETS
('HUNDRED BADMINTON NET BNT-80', 'HUNDRED badminton net model BNT-80', 0, (SELECT id FROM "Category" WHERE name = 'NETS')),
('LI NING BADMINTON NET BN450L', 'LI NING badminton net model BN450L', 0, (SELECT id FROM "Category" WHERE name = 'NETS')),
('LI NING BADMINTON NET BN600L', 'LI NING badminton net model BN600L', 0, (SELECT id FROM "Category" WHERE name = 'NETS')),
('YONEX BADMINTON NET (AC152EX/139A)', 'YONEX badminton net model AC152EX/139A', 0, (SELECT id FROM "Category" WHERE name = 'NETS')),
('YONEX BN-152 PRO HQ NET', 'YONEX professional high quality net model BN-152', 0, (SELECT id FROM "Category" WHERE name = 'NETS')),
('YONEX BN139R NET', 'YONEX badminton net model BN139R', 0, (SELECT id FROM "Category" WHERE name = 'NETS')),
('YONEX HIGH QUALITY NET', 'YONEX high quality badminton net', 0, (SELECT id FROM "Category" WHERE name = 'NETS')),

-- OTHER (continued)
('APACS GRIP POWDER', 'APACS grip powder for better grip', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('BADMINTON KEY TAG', 'Badminton themed key tag', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('GOLD KEY TAG', 'Gold colored key tag', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('GROMMET BOX', 'Grommet box for racket maintenance', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('HUNDRED INSOLE', 'HUNDRED sports insole', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('HUNDRED INSOLE PRO', 'HUNDRED professional sports insole', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('IODEX RAPID SPARAY', 'Iodex rapid spray for muscle relief', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING FLIP-FLOPS', 'LI NING flip-flops', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING INSOLE', 'LI NING sports insole', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING MASK', 'LI NING sports mask', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING SKIPPING ROPE (SP333)', 'LI NING skipping rope model SP333', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING SKIPPING ROPE (SP421)', 'LI NING skipping rope model SP421', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING SKIPPING ROPE 776/778', 'LI NING skipping rope model 776/778', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING SLIPPERS', 'LI NING sports slippers', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING TOWEL (L)', 'LI NING sports towel large size', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING TOWEL (S)', 'LI NING sports towel small size', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING TOWEL (YY216)', 'LI NING sports towel model YY216', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI NING WATER BOTTLE', 'LI NING sports water bottle', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('LI-NING KEY TAG', 'LI-NING branded key tag', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('Li-Ning Skipping Rope', 'Li-Ning skipping rope', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('SHUTTLE KEY TAG', 'Shuttlecock themed key tag', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('SILVER KEY TAG', 'Silver colored key tag', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('STAY SAFE ICE COLD SPRAY', 'Stay Safe ice cold spray for injury treatment', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('YONEX KEY TAG', 'YONEX branded key tag', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('YONEX WATER BOTTLE', 'YONEX sports water bottle', 0, (SELECT id FROM "Category" WHERE name = 'OTHER')),
('DUNLOP SQUASH BALLS', 'DUNLOP squash balls', 0, (SELECT id FROM "Category" WHERE name = 'OTHER'));

-- Continue with the rest in a separate statement due to length... 