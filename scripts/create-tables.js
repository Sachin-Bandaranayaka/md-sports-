require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// Connection details from environment variable
const connectionString = process.env.DATABASE_URL;

// Create a new pool with the connection string
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// SQL to create tables
const createTablesSQL = `
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES categories(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  barcode VARCHAR(50),
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  retail_price DECIMAL(10, 2) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  image_url VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shop_id, product_id)
);
`;

// Function to seed initial data
const seedDataSQL = `
-- Check if categories exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM categories LIMIT 1) THEN
        -- Insert categories
        INSERT INTO categories (name, description) 
        VALUES ('Sporting Goods', 'All sporting equipment and accessories')
        RETURNING id INTO sporting_goods_id;
        
        -- Insert subcategories
        WITH 
            sporting_goods AS (SELECT id FROM categories WHERE name = 'Sporting Goods' LIMIT 1)
        INSERT INTO categories (name, description, parent_id) 
        VALUES 
            ('Apparel', 'Clothing and uniforms', (SELECT id FROM sporting_goods)),
            ('Equipment', 'Sports equipment', (SELECT id FROM sporting_goods));
            
        -- Insert products
        WITH 
            equipment AS (SELECT id FROM categories WHERE name = 'Equipment' LIMIT 1),
            apparel AS (SELECT id FROM categories WHERE name = 'Apparel' LIMIT 1)
        INSERT INTO products (name, sku, barcode, description, base_price, retail_price, category_id) 
        VALUES 
            ('Professional Basketball', 'BB-PRO-001', '123456789012', 'Official size and weight basketball', 25.00, 39.99, (SELECT id FROM equipment)),
            ('Team Jersey', 'APP-JRS-001', '123456789013', 'Official team jersey', 35.00, 59.99, (SELECT id FROM apparel));
            
        -- Insert shops
        INSERT INTO shops (name, location, contact_person, phone, email) 
        VALUES 
            ('MS Sports Main Store', 'Colombo', 'John Doe', '+94123456789', 'main@mssports.lk'),
('MS Sports Kandy Branch', 'Kandy', 'Jane Smith', '+94123456790', 'kandy@mssports.lk');
            
        -- Insert inventory items
        WITH 
            main_store AS (SELECT id FROM shops WHERE name = 'MS Sports Main Store' LIMIT 1),
kandy_store AS (SELECT id FROM shops WHERE name = 'MS Sports Kandy Branch' LIMIT 1),
            basketball AS (SELECT id FROM products WHERE name = 'Professional Basketball' LIMIT 1),
            jersey AS (SELECT id FROM products WHERE name = 'Team Jersey' LIMIT 1)
        INSERT INTO inventory_items (shop_id, product_id, quantity, reorder_level) 
        VALUES 
            ((SELECT id FROM main_store), (SELECT id FROM basketball), 50, 10),
            ((SELECT id FROM main_store), (SELECT id FROM jersey), 30, 5),
            ((SELECT id FROM kandy_store), (SELECT id FROM basketball), 25, 8),
            ((SELECT id FROM kandy_store), (SELECT id FROM jersey), 15, 3);
    END IF;
END $$;
`;

async function createTables() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    try {
      console.log('Creating tables...');
      await client.query(createTablesSQL);
      console.log('Tables created successfully!');
      
      console.log('Seeding data...');
      await client.query(seedDataSQL);
      console.log('Data seeded successfully!');
    } finally {
      client.release();
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // End the pool
    await pool.end();
  }
}

// Execute the function
createTables();