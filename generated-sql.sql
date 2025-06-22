🚀 Starting to populate test data using direct SQL...
📝 This script will generate SQL statements that can be executed manually

-- =====================================================
-- CATEGORIES
-- =====================================================
INSERT INTO "Category" (name, description) VALUES ('Running Equipment', 'Athletic footwear and running gear');
INSERT INTO "Category" (name, description) VALUES ('Basketball Equipment', 'Basketball equipment and gear');
INSERT INTO "Category" (name, description) VALUES ('Tennis Equipment', 'Tennis rackets, balls, and accessories');
INSERT INTO "Category" (name, description) VALUES ('Swimming Gear', 'Swimming gear and accessories');
INSERT INTO "Category" (name, description) VALUES ('Football Equipment', 'Football boots and equipment');
INSERT INTO "Category" (name, description) VALUES ('Badminton Equipment', 'Badminton rackets and shuttlecocks');
INSERT INTO "Category" (name, description) VALUES ('Gym Equipment', 'Fitness and gym equipment');
INSERT INTO "Category" (name, description) VALUES ('Sports Apparel', 'Athletic clothing and sportswear');
INSERT INTO "Category" (name, description) VALUES ('Outdoor Sports', 'Equipment for outdoor activities');
INSERT INTO "Category" (name, description) VALUES ('Water Sports', 'Equipment for water-based sports');

-- =====================================================
-- ADDITIONAL SHOPS
-- =====================================================
INSERT INTO "Shop" (id, name, location, address_line1, city, state, postal_code, phone, email, is_active, status) VALUES (
    'shop_1750601051280_0',
    'Athletic Central',
    'Kota Kinabalu',
    '703 Persiaran Bukit',
    'Kota Kinabalu',
    'Penang',
    '78628',
    '014-4734641',
    'shop3@mdsports.com',
    true,
    'open'
  );
INSERT INTO "Shop" (id, name, location, address_line1, city, state, postal_code, phone, email, is_active, status) VALUES (
    'shop_1750601051280_1',
    'Sports World East',
    'Sibu',
    '678 Persiaran Bandar',
    'Sibu',
    'Penang',
    '37253',
    '012-7508232',
    'shop4@mdsports.com',
    true,
    'open'
  );
INSERT INTO "Shop" (id, name, location, address_line1, city, state, postal_code, phone, email, is_active, status) VALUES (
    'shop_1750601051280_2',
    'Champions Sports',
    'Penang',
    '847 Lorong Taman',
    'Penang',
    'Johor',
    '63869',
    '016-8521036',
    'shop5@mdsports.com',
    true,
    'open'
  );
INSERT INTO "Shop" (id, name, location, address_line1, city, state, postal_code, phone, email, is_active, status) VALUES (
    'shop_1750601051280_3',
    'Elite Athletics',
    'Penang',
    '25 Jalan Bukit',
    'Penang',
    'Penang',
    '23129',
    '019-7752856',
    'shop6@mdsports.com',
    true,
    'open'
  );

-- =====================================================
-- PRODUCTS (Sample batch of 100)
-- =====================================================
-- Note: Repeat this pattern for more products, adjusting category and shop IDs
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports Shorts 1',
    'High quality sports shorts for sports enthusiasts',
    124.36,
    'SKU000001',
    '259422335793',
    7,
    'cmc4nqj9b0001unnq2fqc59ci',
    193.53,
    22
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Swimming Goggles 2',
    'High quality swimming goggles for sports enthusiasts',
    489.07,
    'SKU000002',
    '114833200439',
    7,
    'cmc4nqj9b0001unnq2fqc59ci',
    54.47,
    45
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Track Pants 3',
    'High quality track pants for sports enthusiasts',
    236.01,
    'SKU000003',
    '941814193493',
    1,
    'cmc4nqcog0000unnqei52hlhs',
    24.49,
    8
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Ball 4',
    'High quality tennis ball for sports enthusiasts',
    301.07,
    'SKU000004',
    '460417326398',
    9,
    'cmc4nqcog0000unnqei52hlhs',
    136.84,
    24
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports Bag 5',
    'High quality sports bag for sports enthusiasts',
    280.54,
    'SKU000005',
    '425254527265',
    7,
    'cmc4nqj9b0001unnq2fqc59ci',
    102.87,
    14
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Ball 6',
    'High quality tennis ball for sports enthusiasts',
    188.66,
    'SKU000006',
    '944184868845',
    6,
    'cmc4nqj9b0001unnq2fqc59ci',
    79.99,
    46
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Racket 7',
    'High quality tennis racket for sports enthusiasts',
    326.17,
    'SKU000007',
    '765943565087',
    5,
    'cmc4nqj9b0001unnq2fqc59ci',
    58.08,
    35
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Yoga Mat 8',
    'High quality yoga mat for sports enthusiasts',
    129.5,
    'SKU000008',
    '834932723843',
    3,
    'cmc4nqj9b0001unnq2fqc59ci',
    39.06,
    49
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Swimming Cap 9',
    'High quality swimming cap for sports enthusiasts',
    238.71,
    'SKU000009',
    '707566693568',
    7,
    'cmc4nqj9b0001unnq2fqc59ci',
    118.51,
    38
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Swimming Cap 10',
    'High quality swimming cap for sports enthusiasts',
    308.4,
    'SKU000010',
    '960430824955',
    1,
    'cmc4nqj9b0001unnq2fqc59ci',
    173.54,
    30
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Water Bottle 11',
    'High quality water bottle for sports enthusiasts',
    281.92,
    'SKU000011',
    '170298894939',
    8,
    'cmc4nqj9b0001unnq2fqc59ci',
    138.68,
    8
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Badminton Racket 12',
    'High quality badminton racket for sports enthusiasts',
    357.96,
    'SKU000012',
    '470296293645',
    6,
    'cmc4nqcog0000unnqei52hlhs',
    189.09,
    45
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Yoga Mat 13',
    'High quality yoga mat for sports enthusiasts',
    442.62,
    'SKU000013',
    '699672277940',
    1,
    'cmc4nqj9b0001unnq2fqc59ci',
    40.9,
    15
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Yoga Mat 14',
    'High quality yoga mat for sports enthusiasts',
    293.45,
    'SKU000014',
    '689116298680',
    7,
    'cmc4nqj9b0001unnq2fqc59ci',
    38.69,
    33
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Gym Weights 15',
    'High quality gym weights for sports enthusiasts',
    291.5,
    'SKU000015',
    '309144270672',
    8,
    'cmc4nqcog0000unnqei52hlhs',
    170.23,
    11
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Ball 16',
    'High quality tennis ball for sports enthusiasts',
    325.26,
    'SKU000016',
    '948846588215',
    2,
    'cmc4nqj9b0001unnq2fqc59ci',
    15.8,
    47
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Football Boots 17',
    'High quality football boots for sports enthusiasts',
    321.76,
    'SKU000017',
    '193276939236',
    6,
    'cmc4nqj9b0001unnq2fqc59ci',
    68.94,
    42
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports T-Shirt 18',
    'High quality sports t-shirt for sports enthusiasts',
    282.82,
    'SKU000018',
    '863804419410',
    5,
    'cmc4nqcog0000unnqei52hlhs',
    182.77,
    7
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Basketball 19',
    'High quality basketball for sports enthusiasts',
    179.07,
    'SKU000019',
    '597834081891',
    9,
    'cmc4nqcog0000unnqei52hlhs',
    40.58,
    18
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Cycling Helmet 20',
    'High quality cycling helmet for sports enthusiasts',
    207.05,
    'SKU000020',
    '505259989283',
    2,
    'cmc4nqj9b0001unnq2fqc59ci',
    79.38,
    10
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Swimming Cap 21',
    'High quality swimming cap for sports enthusiasts',
    486.53,
    'SKU000021',
    '790971316736',
    4,
    'cmc4nqcog0000unnqei52hlhs',
    61.08,
    50
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Fitness Tracker 22',
    'High quality fitness tracker for sports enthusiasts',
    280.96,
    'SKU000022',
    '814469120473',
    3,
    'cmc4nqj9b0001unnq2fqc59ci',
    146.36,
    11
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Racket 23',
    'High quality tennis racket for sports enthusiasts',
    424.45,
    'SKU000023',
    '683873452668',
    3,
    'cmc4nqcog0000unnqei52hlhs',
    22.99,
    28
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Basketball 24',
    'High quality basketball for sports enthusiasts',
    259.68,
    'SKU000024',
    '919974096175',
    3,
    'cmc4nqcog0000unnqei52hlhs',
    42.62,
    33
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Swimming Cap 25',
    'High quality swimming cap for sports enthusiasts',
    220.76,
    'SKU000025',
    '732029041195',
    10,
    'cmc4nqcog0000unnqei52hlhs',
    44.15,
    48
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Gym Weights 26',
    'High quality gym weights for sports enthusiasts',
    140.57,
    'SKU000026',
    '831227922419',
    3,
    'cmc4nqj9b0001unnq2fqc59ci',
    197.31,
    45
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Basketball Jersey 27',
    'High quality basketball jersey for sports enthusiasts',
    116.21,
    'SKU000027',
    '518763665653',
    7,
    'cmc4nqcog0000unnqei52hlhs',
    22.63,
    48
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports Shorts 28',
    'High quality sports shorts for sports enthusiasts',
    134.92,
    'SKU000028',
    '894522383241',
    1,
    'cmc4nqj9b0001unnq2fqc59ci',
    149.86,
    22
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Swimming Goggles 29',
    'High quality swimming goggles for sports enthusiasts',
    128.82,
    'SKU000029',
    '368649825073',
    7,
    'cmc4nqj9b0001unnq2fqc59ci',
    73.09,
    48
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Running Shoes 30',
    'High quality running shoes for sports enthusiasts',
    167.14,
    'SKU000030',
    '731965119932',
    1,
    'cmc4nqcog0000unnqei52hlhs',
    167.23,
    15
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports Shorts 31',
    'High quality sports shorts for sports enthusiasts',
    42.41,
    'SKU000031',
    '464060040756',
    9,
    'cmc4nqj9b0001unnq2fqc59ci',
    64.25,
    18
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Athletic Socks 32',
    'High quality athletic socks for sports enthusiasts',
    467.01,
    'SKU000032',
    '809069559117',
    3,
    'cmc4nqcog0000unnqei52hlhs',
    177.45,
    12
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Badminton Racket 33',
    'High quality badminton racket for sports enthusiasts',
    209.52,
    'SKU000033',
    '984865856560',
    5,
    'cmc4nqcog0000unnqei52hlhs',
    93.54,
    27
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports Shorts 34',
    'High quality sports shorts for sports enthusiasts',
    71.43,
    'SKU000034',
    '905155006348',
    4,
    'cmc4nqcog0000unnqei52hlhs',
    38.42,
    50
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Ball 35',
    'High quality tennis ball for sports enthusiasts',
    101.73,
    'SKU000035',
    '765519190255',
    1,
    'cmc4nqj9b0001unnq2fqc59ci',
    73.54,
    16
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Cycling Helmet 36',
    'High quality cycling helmet for sports enthusiasts',
    128.27,
    'SKU000036',
    '319833963771',
    6,
    'cmc4nqcog0000unnqei52hlhs',
    77.11,
    8
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Swimming Cap 37',
    'High quality swimming cap for sports enthusiasts',
    171.48,
    'SKU000037',
    '298162482271',
    5,
    'cmc4nqcog0000unnqei52hlhs',
    104.73,
    47
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Athletic Socks 38',
    'High quality athletic socks for sports enthusiasts',
    459.89,
    'SKU000038',
    '854098482978',
    1,
    'cmc4nqcog0000unnqei52hlhs',
    11.57,
    41
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Track Pants 39',
    'High quality track pants for sports enthusiasts',
    66.26,
    'SKU000039',
    '814748550079',
    2,
    'cmc4nqj9b0001unnq2fqc59ci',
    43.71,
    18
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports Bag 40',
    'High quality sports bag for sports enthusiasts',
    286.15,
    'SKU000040',
    '499598797324',
    3,
    'cmc4nqcog0000unnqei52hlhs',
    176.22,
    26
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Badminton Racket 41',
    'High quality badminton racket for sports enthusiasts',
    175.55,
    'SKU000041',
    '890631310713',
    7,
    'cmc4nqcog0000unnqei52hlhs',
    149.83,
    15
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Running Shoes 42',
    'High quality running shoes for sports enthusiasts',
    108.63,
    'SKU000042',
    '825471295777',
    6,
    'cmc4nqcog0000unnqei52hlhs',
    72.22,
    26
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Football Boots 43',
    'High quality football boots for sports enthusiasts',
    322.11,
    'SKU000043',
    '175045156739',
    1,
    'cmc4nqcog0000unnqei52hlhs',
    81.02,
    10
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Athletic Socks 44',
    'High quality athletic socks for sports enthusiasts',
    138.04,
    'SKU000044',
    '891363307603',
    2,
    'cmc4nqcog0000unnqei52hlhs',
    108.87,
    29
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Swimming Cap 45',
    'High quality swimming cap for sports enthusiasts',
    43.23,
    'SKU000045',
    '298656100460',
    10,
    'cmc4nqcog0000unnqei52hlhs',
    128.63,
    44
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Soccer Ball 46',
    'High quality soccer ball for sports enthusiasts',
    178.06,
    'SKU000046',
    '117457006524',
    10,
    'cmc4nqcog0000unnqei52hlhs',
    90.79,
    31
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Football Boots 47',
    'High quality football boots for sports enthusiasts',
    421.51,
    'SKU000047',
    '251804698541',
    6,
    'cmc4nqj9b0001unnq2fqc59ci',
    196.22,
    45
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Badminton Racket 48',
    'High quality badminton racket for sports enthusiasts',
    411.79,
    'SKU000048',
    '899166543604',
    9,
    'cmc4nqcog0000unnqei52hlhs',
    132.74,
    16
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Badminton Racket 49',
    'High quality badminton racket for sports enthusiasts',
    460.06,
    'SKU000049',
    '868586755599',
    8,
    'cmc4nqj9b0001unnq2fqc59ci',
    59.28,
    9
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Track Pants 50',
    'High quality track pants for sports enthusiasts',
    480.41,
    'SKU000050',
    '807916903134',
    3,
    'cmc4nqj9b0001unnq2fqc59ci',
    51.8,
    32
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Racket 51',
    'High quality tennis racket for sports enthusiasts',
    108.06,
    'SKU000051',
    '598972926878',
    2,
    'cmc4nqcog0000unnqei52hlhs',
    156.65,
    39
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Water Bottle 52',
    'High quality water bottle for sports enthusiasts',
    142.97,
    'SKU000052',
    '377293556452',
    9,
    'cmc4nqcog0000unnqei52hlhs',
    125.26,
    41
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Swimming Goggles 53',
    'High quality swimming goggles for sports enthusiasts',
    189.75,
    'SKU000053',
    '197364763176',
    2,
    'cmc4nqcog0000unnqei52hlhs',
    106.85,
    25
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports T-Shirt 54',
    'High quality sports t-shirt for sports enthusiasts',
    40.93,
    'SKU000054',
    '650527886986',
    1,
    'cmc4nqcog0000unnqei52hlhs',
    86.33,
    32
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Racket 55',
    'High quality tennis racket for sports enthusiasts',
    404.6,
    'SKU000055',
    '431557464580',
    10,
    'cmc4nqcog0000unnqei52hlhs',
    96.95,
    33
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Racket 56',
    'High quality tennis racket for sports enthusiasts',
    48.45,
    'SKU000056',
    '275113973642',
    10,
    'cmc4nqj9b0001unnq2fqc59ci',
    56.92,
    16
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Ball 57',
    'High quality tennis ball for sports enthusiasts',
    202.14,
    'SKU000057',
    '306778028566',
    10,
    'cmc4nqj9b0001unnq2fqc59ci',
    27.43,
    27
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Cycling Helmet 58',
    'High quality cycling helmet for sports enthusiasts',
    289.22,
    'SKU000058',
    '327056462321',
    1,
    'cmc4nqcog0000unnqei52hlhs',
    180.83,
    37
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Track Pants 59',
    'High quality track pants for sports enthusiasts',
    220.76,
    'SKU000059',
    '515229724817',
    1,
    'cmc4nqj9b0001unnq2fqc59ci',
    31.28,
    8
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Gym Weights 60',
    'High quality gym weights for sports enthusiasts',
    218.77,
    'SKU000060',
    '175445293250',
    5,
    'cmc4nqcog0000unnqei52hlhs',
    198.04,
    5
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Ball 61',
    'High quality tennis ball for sports enthusiasts',
    89.59,
    'SKU000061',
    '309772961415',
    5,
    'cmc4nqj9b0001unnq2fqc59ci',
    136.16,
    37
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Yoga Mat 62',
    'High quality yoga mat for sports enthusiasts',
    168.29,
    'SKU000062',
    '701378822327',
    5,
    'cmc4nqcog0000unnqei52hlhs',
    131.12,
    34
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Badminton Racket 63',
    'High quality badminton racket for sports enthusiasts',
    283.89,
    'SKU000063',
    '723264533346',
    7,
    'cmc4nqj9b0001unnq2fqc59ci',
    191.14,
    7
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Yoga Mat 64',
    'High quality yoga mat for sports enthusiasts',
    463.31,
    'SKU000064',
    '445391514483',
    7,
    'cmc4nqj9b0001unnq2fqc59ci',
    199.18,
    7
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Badminton Racket 65',
    'High quality badminton racket for sports enthusiasts',
    259.43,
    'SKU000065',
    '700122897020',
    1,
    'cmc4nqcog0000unnqei52hlhs',
    83.04,
    6
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Racket 66',
    'High quality tennis racket for sports enthusiasts',
    477.61,
    'SKU000066',
    '316262101337',
    4,
    'cmc4nqcog0000unnqei52hlhs',
    106.22,
    44
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Football Boots 67',
    'High quality football boots for sports enthusiasts',
    24.49,
    'SKU000067',
    '865790464682',
    9,
    'cmc4nqj9b0001unnq2fqc59ci',
    130.79,
    19
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Athletic Socks 68',
    'High quality athletic socks for sports enthusiasts',
    107.42,
    'SKU000068',
    '361549696336',
    3,
    'cmc4nqj9b0001unnq2fqc59ci',
    17.42,
    50
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports Bag 69',
    'High quality sports bag for sports enthusiasts',
    196.17,
    'SKU000069',
    '526073216443',
    5,
    'cmc4nqcog0000unnqei52hlhs',
    172.89,
    18
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Ball 70',
    'High quality tennis ball for sports enthusiasts',
    427.87,
    'SKU000070',
    '118773525969',
    2,
    'cmc4nqcog0000unnqei52hlhs',
    95.79,
    14
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Basketball Jersey 71',
    'High quality basketball jersey for sports enthusiasts',
    51.07,
    'SKU000071',
    '695460592037',
    8,
    'cmc4nqcog0000unnqei52hlhs',
    81.43,
    43
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Cycling Helmet 72',
    'High quality cycling helmet for sports enthusiasts',
    231.85,
    'SKU000072',
    '298741675359',
    7,
    'cmc4nqj9b0001unnq2fqc59ci',
    172.22,
    41
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Gym Weights 73',
    'High quality gym weights for sports enthusiasts',
    448.15,
    'SKU000073',
    '619078608332',
    2,
    'cmc4nqcog0000unnqei52hlhs',
    34.74,
    39
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports Shorts 74',
    'High quality sports shorts for sports enthusiasts',
    460.29,
    'SKU000074',
    '319820228412',
    8,
    'cmc4nqj9b0001unnq2fqc59ci',
    15.26,
    13
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Swimming Goggles 75',
    'High quality swimming goggles for sports enthusiasts',
    477.41,
    'SKU000075',
    '787293865728',
    5,
    'cmc4nqcog0000unnqei52hlhs',
    85.29,
    5
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports T-Shirt 76',
    'High quality sports t-shirt for sports enthusiasts',
    277.94,
    'SKU000076',
    '941662445929',
    10,
    'cmc4nqj9b0001unnq2fqc59ci',
    125.09,
    22
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Badminton Racket 77',
    'High quality badminton racket for sports enthusiasts',
    32.97,
    'SKU000077',
    '908885917228',
    1,
    'cmc4nqj9b0001unnq2fqc59ci',
    142.45,
    29
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Sports Shorts 78',
    'High quality sports shorts for sports enthusiasts',
    117.51,
    'SKU000078',
    '461348753744',
    4,
    'cmc4nqcog0000unnqei52hlhs',
    134.04,
    23
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Basketball Jersey 79',
    'High quality basketball jersey for sports enthusiasts',
    207.52,
    'SKU000079',
    '835984596751',
    2,
    'cmc4nqcog0000unnqei52hlhs',
    128.89,
    44
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Water Bottle 80',
    'High quality water bottle for sports enthusiasts',
    221.61,
    'SKU000080',
    '270408611789',
    7,
    'cmc4nqcog0000unnqei52hlhs',
    13.33,
    19
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Water Bottle 81',
    'High quality water bottle for sports enthusiasts',
    213.33,
    'SKU000081',
    '303899927719',
    9,
    'cmc4nqcog0000unnqei52hlhs',
    120.99,
    19
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Ball 82',
    'High quality tennis ball for sports enthusiasts',
    382.72,
    'SKU000082',
    '761281751183',
    8,
    'cmc4nqj9b0001unnq2fqc59ci',
    168.65,
    20
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Soccer Ball 83',
    'High quality soccer ball for sports enthusiasts',
    76.4,
    'SKU000083',
    '761466014257',
    4,
    'cmc4nqj9b0001unnq2fqc59ci',
    168.08,
    24
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Swimming Cap 84',
    'High quality swimming cap for sports enthusiasts',
    356.21,
    'SKU000084',
    '493790625035',
    2,
    'cmc4nqcog0000unnqei52hlhs',
    153.89,
    21
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Cycling Helmet 85',
    'High quality cycling helmet for sports enthusiasts',
    321.66,
    'SKU000085',
    '302728152848',
    2,
    'cmc4nqj9b0001unnq2fqc59ci',
    181.14,
    27
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Running Shoes 86',
    'High quality running shoes for sports enthusiasts',
    136.38,
    'SKU000086',
    '949168527612',
    5,
    'cmc4nqj9b0001unnq2fqc59ci',
    45.39,
    42
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Basketball Jersey 87',
    'High quality basketball jersey for sports enthusiasts',
    110.1,
    'SKU000087',
    '771187952616',
    7,
    'cmc4nqj9b0001unnq2fqc59ci',
    189.23,
    17
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Basketball Jersey 88',
    'High quality basketball jersey for sports enthusiasts',
    30.82,
    'SKU000088',
    '353392211919',
    9,
    'cmc4nqj9b0001unnq2fqc59ci',
    129.37,
    22
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Ball 89',
    'High quality tennis ball for sports enthusiasts',
    462.56,
    'SKU000089',
    '326622033925',
    10,
    'cmc4nqj9b0001unnq2fqc59ci',
    101.89,
    31
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Water Bottle 90',
    'High quality water bottle for sports enthusiasts',
    305.87,
    'SKU000090',
    '235637291646',
    10,
    'cmc4nqj9b0001unnq2fqc59ci',
    23.97,
    43
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Fitness Tracker 91',
    'High quality fitness tracker for sports enthusiasts',
    35.69,
    'SKU000091',
    '203154159986',
    6,
    'cmc4nqcog0000unnqei52hlhs',
    84.32,
    17
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Soccer Ball 92',
    'High quality soccer ball for sports enthusiasts',
    199.57,
    'SKU000092',
    '448484308971',
    2,
    'cmc4nqcog0000unnqei52hlhs',
    142.88,
    28
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Football Boots 93',
    'High quality football boots for sports enthusiasts',
    468.54,
    'SKU000093',
    '117394996086',
    3,
    'cmc4nqj9b0001unnq2fqc59ci',
    102.11,
    45
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Basketball 94',
    'High quality basketball for sports enthusiasts',
    316.95,
    'SKU000094',
    '686359226937',
    1,
    'cmc4nqcog0000unnqei52hlhs',
    139.32,
    18
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Soccer Ball 95',
    'High quality soccer ball for sports enthusiasts',
    293.73,
    'SKU000095',
    '916913000928',
    9,
    'cmc4nqcog0000unnqei52hlhs',
    148.23,
    41
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Tennis Ball 96',
    'High quality tennis ball for sports enthusiasts',
    384.69,
    'SKU000096',
    '130721448860',
    4,
    'cmc4nqcog0000unnqei52hlhs',
    123.93,
    43
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Running Shoes 97',
    'High quality running shoes for sports enthusiasts',
    242.16,
    'SKU000097',
    '565120816449',
    10,
    'cmc4nqj9b0001unnq2fqc59ci',
    27.09,
    23
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Basketball Jersey 98',
    'High quality basketball jersey for sports enthusiasts',
    84.44,
    'SKU000098',
    '426221753169',
    3,
    'cmc4nqcog0000unnqei52hlhs',
    17.95,
    24
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Fitness Tracker 99',
    'High quality fitness tracker for sports enthusiasts',
    117.21,
    'SKU000099',
    '778956830417',
    6,
    'cmc4nqj9b0001unnq2fqc59ci',
    101.75,
    22
  );
INSERT INTO "Product" (name, description, price, sku, barcode, "categoryId", "shopId", weightedaveragecost, min_stock_level) VALUES (
    'Fitness Tracker 100',
    'High quality fitness tracker for sports enthusiasts',
    278.28,
    'SKU000100',
    '960771149363',
    3,
    'cmc4nqj9b0001unnq2fqc59ci',
    136.16,
    48
  );

-- =====================================================
-- CUSTOMERS (Sample batch of 50)
-- =====================================================
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Lakshmi Menon 1',
    'lakshmi.menon.1@outlook.com',
    '016-1195844',
    '746 Jalan Bandar, Sibu',
    'Sibu',
    'corporate',
    'inactive',
    6564.59,
    68,
    '57462'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Halimah Yusof 2',
    'halimah.yusof.2@yahoo.com',
    '018-6753915',
    '883 Jalan Bandar, Kuantan',
    'Kuantan',
    'retail',
    'inactive',
    7310.32,
    69,
    '62187'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Ismail Daud 3',
    'ismail.daud.3@yahoo.com',
    '016-8518271',
    '172 Jalan Bandar, Kuching',
    'Kuching',
    'wholesale',
    'active',
    7553.66,
    55,
    '53275'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Abdul Aziz 4',
    'abdul.aziz.4@gmail.com',
    '019-2738967',
    '381 Lorong Bandar, Miri',
    'Miri',
    'wholesale',
    'active',
    1303.14,
    11,
    '40599'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Siti Nurhaliza 5',
    'siti.nurhaliza.5@hotmail.com',
    '016-5851216',
    '641 Persiaran Bandar, Selangor',
    'Selangor',
    'retail',
    'active',
    7491.36,
    46,
    '25805'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Teo Chin Hock 6',
    'teo.chin.hock.6@yahoo.com',
    '018-1748304',
    '407 Jalan Bukit, Johor Bahru',
    'Johor Bahru',
    'retail',
    'active',
    6857.82,
    80,
    '79508'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Ng Boon Huat 7',
    'ng.boon.huat.7@hotmail.com',
    '017-4738909',
    '319 Persiaran Bandar, Penang',
    'Penang',
    'corporate',
    'inactive',
    5169.95,
    36,
    '90523'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Hassan Ibrahim 8',
    'hassan.ibrahim.8@hotmail.com',
    '019-5340537',
    '555 Lorong Bandar, Kuantan',
    'Kuantan',
    'retail',
    'active',
    1581.21,
    57,
    '96091'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Priya Devi 9',
    'priya.devi.9@hotmail.com',
    '018-2578753',
    '519 Lorong Bukit, Ipoh',
    'Ipoh',
    'wholesale',
    'inactive',
    2929.38,
    27,
    '68015'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Khadijah Mohamed 10',
    'khadijah.mohamed.10@outlook.com',
    '019-9950520',
    '463 Lorong Bukit, Kuching',
    'Kuching',
    'corporate',
    'inactive',
    2524.11,
    88,
    '10816'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Mohan Das 11',
    'mohan.das.11@outlook.com',
    '019-2579383',
    '604 Persiaran Bandar, Kota Kinabalu',
    'Kota Kinabalu',
    'corporate',
    'inactive',
    5036.82,
    16,
    '79962'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Tan Mei Ling 12',
    'tan.mei.ling.12@gmail.com',
    '016-8377333',
    '854 Lorong Bandar, Kota Kinabalu',
    'Kota Kinabalu',
    'corporate',
    'active',
    8097.59,
    50,
    '84404'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Siti Nurhaliza 13',
    'siti.nurhaliza.13@hotmail.com',
    '016-2346112',
    '461 Persiaran Bukit, Kuching',
    'Kuching',
    'wholesale',
    'inactive',
    4030.93,
    61,
    '39976'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Mohan Das 14',
    'mohan.das.14@gmail.com',
    '016-9853184',
    '92 Lorong Bukit, Ipoh',
    'Ipoh',
    'corporate',
    'active',
    1920.93,
    65,
    '94164'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Yap Li Hua 15',
    'yap.li.hua.15@hotmail.com',
    '013-7235025',
    '462 Jalan Bandar, Sibu',
    'Sibu',
    'corporate',
    'inactive',
    9901.31,
    38,
    '63596'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Maryam Hassan 16',
    'maryam.hassan.16@outlook.com',
    '012-5407351',
    '405 Jalan Bukit, Miri',
    'Miri',
    'wholesale',
    'active',
    1426.13,
    56,
    '21252'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Raj Kumar 17',
    'raj.kumar.17@outlook.com',
    '018-9114855',
    '53 Lorong Taman, Alor Setar',
    'Alor Setar',
    'retail',
    'inactive',
    2640.32,
    50,
    '30787'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Tan Mei Ling 18',
    'tan.mei.ling.18@yahoo.com',
    '017-7201159',
    '377 Persiaran Taman, Selangor',
    'Selangor',
    'retail',
    'inactive',
    5891.3,
    65,
    '48456'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Deepak Singh 19',
    'deepak.singh.19@gmail.com',
    '012-5277692',
    '602 Jalan Taman, Malacca',
    'Malacca',
    'corporate',
    'inactive',
    8772.38,
    38,
    '43478'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Zakaria Osman 20',
    'zakaria.osman.20@hotmail.com',
    '019-7055240',
    '628 Lorong Bandar, Johor Bahru',
    'Johor Bahru',
    'corporate',
    'active',
    9893.82,
    55,
    '76888'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Rashid Mahmud 21',
    'rashid.mahmud.21@gmail.com',
    '019-3115915',
    '898 Jalan Taman, Sibu',
    'Sibu',
    'corporate',
    'active',
    5431.93,
    56,
    '19923'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Muhammad Ali 22',
    'muhammad.ali.22@yahoo.com',
    '012-4942397',
    '613 Lorong Bandar, Ipoh',
    'Ipoh',
    'corporate',
    'inactive',
    1466.37,
    56,
    '26699'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Ng Boon Huat 23',
    'ng.boon.huat.23@hotmail.com',
    '017-8842915',
    '995 Persiaran Taman, Sibu',
    'Sibu',
    'retail',
    'active',
    4576.75,
    83,
    '27848'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Mohd Farid 24',
    'mohd.farid.24@yahoo.com',
    '016-7331109',
    '517 Lorong Bandar, Shah Alam',
    'Shah Alam',
    'wholesale',
    'active',
    8036.56,
    60,
    '55849'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Fatimah Zahra 25',
    'fatimah.zahra.25@yahoo.com',
    '013-6483967',
    '702 Lorong Bandar, Johor Bahru',
    'Johor Bahru',
    'corporate',
    'active',
    7587.48,
    68,
    '59374'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Suraya Ahmad 26',
    'suraya.ahmad.26@yahoo.com',
    '019-6488637',
    '558 Lorong Taman, Kuantan',
    'Kuantan',
    'wholesale',
    'inactive',
    1796.16,
    59,
    '61691'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Vijay Kumar 27',
    'vijay.kumar.27@outlook.com',
    '016-6740516',
    '528 Persiaran Bukit, Kuantan',
    'Kuantan',
    'wholesale',
    'active',
    5878.96,
    15,
    '71275'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Mohan Das 28',
    'mohan.das.28@gmail.com',
    '018-3399138',
    '465 Lorong Bandar, Kuching',
    'Kuching',
    'wholesale',
    'inactive',
    7291.36,
    7,
    '75672'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Goh Swee Choo 29',
    'goh.swee.choo.29@gmail.com',
    '012-7419700',
    '573 Jalan Taman, Sandakan',
    'Sandakan',
    'corporate',
    'active',
    3658.83,
    61,
    '93201'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Goh Swee Choo 30',
    'goh.swee.choo.30@yahoo.com',
    '019-3270941',
    '288 Jalan Bukit, Kuantan',
    'Kuantan',
    'wholesale',
    'inactive',
    3319.08,
    35,
    '74550'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Abdul Aziz 31',
    'abdul.aziz.31@yahoo.com',
    '012-5676929',
    '400 Jalan Taman, Alor Setar',
    'Alor Setar',
    'wholesale',
    'inactive',
    4442.24,
    48,
    '95313'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Deepak Singh 32',
    'deepak.singh.32@yahoo.com',
    '016-8266484',
    '902 Lorong Bukit, Malacca',
    'Malacca',
    'retail',
    'active',
    7696.68,
    14,
    '36091'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Vijay Kumar 33',
    'vijay.kumar.33@outlook.com',
    '017-7720182',
    '18 Persiaran Bukit, Penang',
    'Penang',
    'corporate',
    'active',
    9775.61,
    85,
    '92539'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Wong Kok Wai 34',
    'wong.kok.wai.34@yahoo.com',
    '016-8807494',
    '292 Lorong Bukit, Penang',
    'Penang',
    'wholesale',
    'inactive',
    3061.38,
    11,
    '37891'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Goh Swee Choo 35',
    'goh.swee.choo.35@outlook.com',
    '013-4220640',
    '857 Lorong Bukit, Miri',
    'Miri',
    'wholesale',
    'active',
    8348.48,
    33,
    '86338'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Kavitha Sharma 36',
    'kavitha.sharma.36@hotmail.com',
    '018-3796349',
    '600 Lorong Taman, Miri',
    'Miri',
    'retail',
    'inactive',
    1598.57,
    30,
    '20323'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Khadijah Mohamed 37',
    'khadijah.mohamed.37@hotmail.com',
    '019-9699440',
    '81 Persiaran Taman, Kuantan',
    'Kuantan',
    'wholesale',
    'active',
    1901.19,
    90,
    '49508'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Hassan Ibrahim 38',
    'hassan.ibrahim.38@yahoo.com',
    '013-5321731',
    '643 Lorong Bandar, Kuantan',
    'Kuantan',
    'wholesale',
    'active',
    9812.94,
    11,
    '21878'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Deepak Singh 39',
    'deepak.singh.39@yahoo.com',
    '017-9162884',
    '755 Persiaran Bukit, Kota Kinabalu',
    'Kota Kinabalu',
    'corporate',
    'inactive',
    2053.31,
    8,
    '72327'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Chua Mei Fong 40',
    'chua.mei.fong.40@gmail.com',
    '016-2612494',
    '495 Lorong Bandar, Malacca',
    'Malacca',
    'corporate',
    'inactive',
    8555.13,
    13,
    '67353'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Ahmad Rahman 41',
    'ahmad.rahman.41@gmail.com',
    '018-8163248',
    '624 Lorong Bukit, Johor Bahru',
    'Johor Bahru',
    'retail',
    'inactive',
    8957.42,
    44,
    '21412'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Koh Beng Seng 42',
    'koh.beng.seng.42@outlook.com',
    '014-7179351',
    '983 Persiaran Taman, Miri',
    'Miri',
    'retail',
    'inactive',
    2984.88,
    63,
    '40441'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Yap Li Hua 43',
    'yap.li.hua.43@hotmail.com',
    '016-8568491',
    '576 Persiaran Bukit, Malacca',
    'Malacca',
    'wholesale',
    'active',
    4388.46,
    47,
    '88991'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Zainab Ali 44',
    'zainab.ali.44@hotmail.com',
    '014-8655922',
    '627 Lorong Bandar, Tawau',
    'Tawau',
    'retail',
    'inactive',
    9304.04,
    19,
    '96417'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Hassan Ibrahim 45',
    'hassan.ibrahim.45@hotmail.com',
    '016-3835744',
    '493 Lorong Bandar, Sandakan',
    'Sandakan',
    'wholesale',
    'inactive',
    5983.02,
    89,
    '97735'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Deepak Singh 46',
    'deepak.singh.46@yahoo.com',
    '016-3867746',
    '565 Jalan Bandar, Kuching',
    'Kuching',
    'retail',
    'inactive',
    9124.39,
    62,
    '82193'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Kavitha Sharma 47',
    'kavitha.sharma.47@yahoo.com',
    '016-9294085',
    '441 Jalan Bandar, Alor Setar',
    'Alor Setar',
    'wholesale',
    'active',
    6659.7,
    84,
    '94422'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Koh Beng Seng 48',
    'koh.beng.seng.48@hotmail.com',
    '013-9350798',
    '172 Jalan Taman, Malacca',
    'Malacca',
    'retail',
    'inactive',
    6932.39,
    30,
    '71545'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Aminah Binti Ahmad 49',
    'aminah.binti.ahmad.49@hotmail.com',
    '016-9222127',
    '55 Lorong Bandar, Kota Kinabalu',
    'Kota Kinabalu',
    'retail',
    'inactive',
    5439.15,
    82,
    '71854'
  );
INSERT INTO "Customer" (name, email, phone, address, city, "customerType", status, "creditLimit", "creditPeriod", "postalCode") VALUES (
    'Omar Abdullah 50',
    'omar.abdullah.50@gmail.com',
    '016-6184312',
    '621 Persiaran Taman, Miri',
    'Miri',
    'retail',
    'inactive',
    6536.19,
    69,
    '52679'
  );

-- =====================================================
-- INVENTORY ITEMS
-- =====================================================
-- Run this after products are created:
-- INSERT INTO "InventoryItem" ("productId", "shopId", quantity, shopspecificcost)
-- SELECT 
--   p.id,
--   s.id,
--   floor(random() * 100),
--   (random() * 290 + 10)::numeric(10,2)
-- FROM "Product" p
-- CROSS JOIN "Shop" s
-- WHERE NOT EXISTS (
--   SELECT 1 FROM "InventoryItem" i 
--   WHERE i."productId" = p.id AND i."shopId" = s.id
-- );

🎉 SQL generation completed!
📋 Instructions:
1. Copy the SQL statements above
2. Execute them in your database client
3. Repeat the product and customer sections to reach 2000 products and 1000 customers
4. Run the inventory items query at the end
