import sequelize, { testConnection } from './db';
import { Product, Category, Shop, InventoryItem } from './models';

// Function to sync database schema
export const syncDatabase = async (force: boolean = false) => {
    try {
        // Test the connection
        const connected = await testConnection();
        if (!connected) {
            console.error('Failed to connect to the database. Schema sync aborted.');
            return false;
        }

        // Sync all models with the database
        // force: true will drop tables if they exist
        // alter: true will alter tables to match models
        await sequelize.sync({ force, alter: !force });

        console.log('Database schema synchronized successfully.');
        return true;
    } catch (error) {
        console.error('Error synchronizing database schema:', error);
        return false;
    }
};

// Function to seed initial data for testing
export const seedTestData = async () => {
    try {
        // Check if data already exists
        const categoryCount = await Category.count();
        if (categoryCount > 0) {
            console.log('Test data already exists. Skipping seed.');
            return true;
        }

        // Create categories
        const sportingGoods = await Category.create({
            name: 'Sporting Goods',
            description: 'All sporting equipment and accessories'
        });

        const apparel = await Category.create({
            name: 'Apparel',
            description: 'Clothing and uniforms',
            parentId: sportingGoods.id
        });

        const equipment = await Category.create({
            name: 'Equipment',
            description: 'Sports equipment',
            parentId: sportingGoods.id
        });

        // Create products
        const basketball = await Product.create({
            name: 'Professional Basketball',
            sku: 'BB-PRO-001',
            barcode: '123456789012',
            description: 'Official size and weight basketball',
            basePrice: 25.00,
            retailPrice: 39.99,
            categoryId: equipment.id
        });

        const jersey = await Product.create({
            name: 'Team Jersey',
            sku: 'APP-JRS-001',
            barcode: '123456789013',
            description: 'Official team jersey',
            basePrice: 35.00,
            retailPrice: 59.99,
            categoryId: apparel.id
        });

        // Create shops
        const mainStore = await Shop.create({
            name: 'MD Sports Main Store',
            location: 'Colombo',
            contactPerson: 'John Doe',
            phone: '+94123456789',
            email: 'main@mdsports.lk'
        });

        const branchStore = await Shop.create({
            name: 'MD Sports Kandy Branch',
            location: 'Kandy',
            contactPerson: 'Jane Smith',
            phone: '+94123456790',
            email: 'kandy@mdsports.lk'
        });

        // Create inventory items
        await InventoryItem.create({
            shopId: mainStore.id,
            productId: basketball.id,
            quantity: 50,
            reorderLevel: 10
        });

        await InventoryItem.create({
            shopId: mainStore.id,
            productId: jersey.id,
            quantity: 30,
            reorderLevel: 5
        });

        await InventoryItem.create({
            shopId: branchStore.id,
            productId: basketball.id,
            quantity: 25,
            reorderLevel: 8
        });

        await InventoryItem.create({
            shopId: branchStore.id,
            productId: jersey.id,
            quantity: 15,
            reorderLevel: 3
        });

        console.log('Test data seeded successfully.');
        return true;
    } catch (error) {
        console.error('Error seeding test data:', error);
        return false;
    }
};

// Execute if this file is run directly
if (require.main === module) {
    (async () => {
        // Force sync by default when run directly (drops all tables)
        const forceSync = process.argv.includes('--force');

        // Sync database schema
        const syncSuccess = await syncDatabase(forceSync);

        if (syncSuccess && process.argv.includes('--seed')) {
            // Seed test data
            await seedTestData();
        }

        // Close database connection
        await sequelize.close();
    })();
} 