-- Combined script to add all categories and products
-- Run this script to add all badminton inventory data

-- First add categories
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

-- Now the script will execute the individual product files
-- You can run this using: psql -d your_database -f scripts/run_categories_and_products_migration.sql

\echo 'Categories added successfully'
\echo 'Now adding products from first batch...'
\i scripts/add_categories_and_products.sql
\echo 'First batch of products added successfully'
\echo 'Now adding remaining products...'
\i scripts/add_remaining_products.sql
\echo 'All products added successfully'
\echo 'Migration completed!' 