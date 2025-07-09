# Badminton Inventory Setup

This directory contains scripts to populate your badminton sports store inventory with categories and products.

## Files Created

1. **add_categories_and_products.sql** - Contains categories and first batch of products (BAGS, CLOTHS, GRIPS, OTHER, NETS, etc.)
2. **add_remaining_products.sql** - Contains remaining products (RACKETS, SHOES, SHUTTLECOCKS, SOCKS, STRINGS, WRISTBANDS)
3. **run_categories_and_products_migration.sql** - Master SQL script that runs both files above
4. **populate-inventory.js** - Node.js script using Prisma client (complete inventory)

## Categories Added

- **BAGS** - Sports bags and carrying equipment
- **CLOTHS** - Sports clothing and apparel  
- **GRIPS** - Racket grips and grip accessories
- **OTHER** - Miscellaneous sports accessories
- **NETS** - Badminton nets and net accessories
- **RACKETS** - Badminton rackets and racket equipment
- **SHOES** - Sports shoes and footwear
- **SHUTTLECOCKS** - Badminton shuttlecocks
- **SOCKS** - Sports socks and hosiery
- **STRINGS** - Racket strings and stringing supplies
- **WRISTBANDS** - Wristbands and sweatbands

## How to Run

### Option 1: Using Node.js/Prisma (Recommended)
```bash
# Run the complete inventory setup
node scripts/populate-inventory.js
```

### Option 2: Using SQL Scripts
```bash
# If using PostgreSQL directly
psql -d your_database_name -f scripts/run_categories_and_products_migration.sql

# Or run individual files
psql -d your_database_name -f scripts/add_categories_and_products.sql
psql -d your_database_name -f scripts/add_remaining_products.sql
```

**Note**: SQL scripts do not include SKU generation. Use Option 1 (Node.js) for automatic SKU creation.

### Option 3: Using Prisma CLI
```bash
# You can also execute the SQL using Prisma
npx prisma db execute --file scripts/add_categories_and_products.sql --schema prisma/schema.prisma
npx prisma db execute --file scripts/add_remaining_products.sql --schema prisma/schema.prisma
```

## Important Notes

1. **Prices**: All products are initially set with price = 0. You'll need to update them with actual pricing.
2. **Duplicates**: The scripts use `ON CONFLICT DO NOTHING` for categories to avoid duplicates.
3. **Complete Inventory**: Both the Node.js script and SQL scripts now contain the complete inventory list.
4. **Product Count**: The full inventory contains hundreds of products across all categories.
5. **SKUs**: The Node.js script automatically generates unique SKUs using the format: `CATEGORY-BRAND-NUMBER`

### SKU System

The Node.js script generates SKUs automatically using this format:
- **Format**: `CATEGORY-BRAND-NUMBER`
- **Example**: `RAC-YON-001` (Racket-Yonex-001), `BAG-HUN-002` (Bag-Hundred-002)

**Category Prefixes:**
- BAG (Bags), CLO (Cloths), GRP (Grips), NET (Nets), OTH (Other)
- RAC (Rackets), SHO (Shoes), SHU (Shuttlecocks), SOC (Socks)
- STR (Strings), WRI (Wristbands)

**Brand Prefixes:**
- YON (Yonex), LIN (Li Ning), HUN (Hundred), MAX (Maxbolt)
- VIC (Victor), FEL (Felet), KON (Konex), MAV (Mavis), etc.

**Example Generated SKUs:**
- `RAC-YON-001` → YONEX ASTROX 99 PRO / HH
- `BAG-HUN-001` → HUNDRED 3 ZIPPER LEVEL-UP BAG  
- `SHO-LIN-001` → LI NING SAGA LITE 3 EUR-42 BLACK\BLUE
- `STR-YON-001` → YONEX BG 65 BLACK
- `SHU-MAV-001` → MAVIS 600

## Next Steps After Running

1. **Update Prices**: Set actual prices for all products
2. **Add Inventory**: Add actual stock quantities to the `InventoryItem` table for each shop
3. **Review SKUs**: Check and modify auto-generated SKUs if needed (Node.js script only)
4. **Add Barcodes**: Consider adding barcode numbers for scanning
5. **Add Images**: Add product images and descriptions as needed

## Product Examples by Category

- **BAGS**: YONEX, HUNDRED, LI NING bags in various styles and colors
- **RACKETS**: Professional rackets from YONEX, LI NING, MAXBOLT, VICTOR
- **SHOES**: Badminton shoes in various sizes and colors
- **STRINGS**: High-quality badminton strings from top brands
- **SHUTTLECOCKS**: Tournament and practice shuttlecocks
- **And many more...**

## Troubleshooting

If you encounter any issues:
1. Make sure your database is running
2. Check that Prisma client is properly configured
3. Verify your database connection string
4. Ensure the Category and Product models exist in your schema

## Database Schema Requirements

Make sure your Prisma schema has:
- `Category` model with `id`, `name`, `description` fields
- `Product` model with `id`, `name`, `description`, `price`, `categoryId` fields
- Proper foreign key relationship between Product and Category 