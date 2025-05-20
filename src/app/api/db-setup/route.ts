import { NextResponse } from 'next/server';
import db from '@/utils/db';

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

export async function POST(_request: Request) {
  try {
    // Create tables
    console.log('Creating tables...');
    await db.query(createTablesSQL);

    // Check if we already have data
    const categoryCheck = await db.query('SELECT COUNT(*) as count FROM categories');

    if (parseInt(categoryCheck.rows[0].count) === 0) {
      console.log('Seeding data...');

      // Create main category
      const sportingGoodsResult = await db.query(`
        INSERT INTO categories (name, description) 
        VALUES ('Sporting Goods', 'All sporting equipment and accessories')
        RETURNING id
      `);
      const sportingGoodsId = sportingGoodsResult.rows[0].id;

      // Create subcategories
      const categoriesResult = await db.query(`
        INSERT INTO categories (name, description, parent_id) 
        VALUES 
          ('Apparel', 'Clothing and uniforms', $1),
          ('Equipment', 'Sports equipment', $1)
        RETURNING id, name
      `, [sportingGoodsId]);

      // Get category IDs
      const equipmentId = categoriesResult.rows.find(c => c.name === 'Equipment').id;
      const apparelId = categoriesResult.rows.find(c => c.name === 'Apparel').id;

      // Create products
      const productsResult = await db.query(`
        INSERT INTO products (name, sku, barcode, description, base_price, retail_price, category_id) 
        VALUES 
          ('Professional Basketball', 'BB-PRO-001', '123456789012', 'Official size and weight basketball', 25.00, 39.99, $1),
          ('Team Jersey', 'APP-JRS-001', '123456789013', 'Official team jersey', 35.00, 59.99, $2)
        RETURNING id, name
      `, [equipmentId, apparelId]);

      // Get product IDs
      const basketballId = productsResult.rows.find(p => p.name === 'Professional Basketball').id;
      const jerseyId = productsResult.rows.find(p => p.name === 'Team Jersey').id;

      // Create shops
      const shopsResult = await db.query(`
        INSERT INTO shops (name, location, contact_person, phone, email) 
        VALUES 
          ('MS Sport Main Store', 'Colombo', 'John Doe', '+94123456789', 'main@mssport.lk'),
          ('MS Sport Kandy Branch', 'Kandy', 'Jane Smith', '+94123456790', 'kandy@mssport.lk')
        RETURNING id, name
      `);

      // Get shop IDs
      const mainStoreId = shopsResult.rows.find(s => s.name === 'MS Sport Main Store').id;
      const kandyStoreId = shopsResult.rows.find(s => s.name === 'MS Sport Kandy Branch').id;

      // Create inventory items
      await db.query(`
        INSERT INTO inventory_items (shop_id, product_id, quantity, reorder_level) 
        VALUES 
          ($1, $3, 50, 10),
          ($1, $4, 30, 5),
          ($2, $3, 25, 8),
          ($2, $4, 15, 3)
      `, [mainStoreId, kandyStoreId, basketballId, jerseyId]);

      console.log('Data seeded successfully!');
    } else {
      console.log('Data already exists, skipping seed.');
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully.'
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json({
      success: false,
      message: 'Error setting up database',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 