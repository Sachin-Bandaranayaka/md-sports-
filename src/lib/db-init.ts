import sequelizeModule from './db';
import { testConnection } from './db';
import {
    Product,
    Category,
    Shop,
    InventoryItem,
    User,
    Role,
    Permission,
    Customer
} from './models';
import bcrypt from 'bcryptjs';

const sequelize = sequelizeModule;

// Function to sync database schema
const syncDatabase = async (force = false) => {
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
const seedTestData = async () => {
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
            name: 'MS Sport Main Store',
            location: 'Colombo',
            contactPerson: 'John Doe',
            phone: '+94123456789',
            email: 'main@mssport.lk'
        });

        const branchStore = await Shop.create({
            name: 'MS Sport Kandy Branch',
            location: 'Kandy',
            contactPerson: 'Jane Smith',
            phone: '+94123456790',
            email: 'kandy@mssport.lk'
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

        // Create roles and permissions
        const adminRole = await Role.create({
            name: 'Admin',
            description: 'Administrator with full access'
        });

        const managerRole = await Role.create({
            name: 'Shop Manager',
            description: 'Manager of a specific shop'
        });

        const cashierRole = await Role.create({
            name: 'Cashier',
            description: 'Processes sales and invoices'
        });

        // Create permissions
        const inventoryViewPermission = await Permission.create({
            name: 'inventory:view',
            description: 'View inventory items',
            module: 'inventory'
        });

        const inventoryManagePermission = await Permission.create({
            name: 'inventory:manage',
            description: 'Create, update, delete inventory items',
            module: 'inventory'
        });

        const invoiceCreatePermission = await Permission.create({
            name: 'invoice:create',
            description: 'Create new invoices',
            module: 'invoice'
        });

        const userManagePermission = await Permission.create({
            name: 'user:manage',
            description: 'Manage user accounts',
            module: 'user'
        });

        const shopManagePermission = await Permission.create({
            name: 'shop:manage',
            description: 'Manage shop details',
            module: 'shop'
        });

        const reportViewPermission = await Permission.create({
            name: 'report:view',
            description: 'View reports',
            module: 'report'
        });

        // Assign permissions to roles
        await adminRole.addPermission(inventoryViewPermission.id);
        await adminRole.addPermission(inventoryManagePermission.id);
        await adminRole.addPermission(invoiceCreatePermission.id);
        await adminRole.addPermission(userManagePermission.id);
        await adminRole.addPermission(shopManagePermission.id);
        await adminRole.addPermission(reportViewPermission.id);

        await managerRole.addPermission(inventoryViewPermission.id);
        await managerRole.addPermission(inventoryManagePermission.id);
        await managerRole.addPermission(invoiceCreatePermission.id);
        await managerRole.addPermission(reportViewPermission.id);

        await cashierRole.addPermission(inventoryViewPermission.id);
        await cashierRole.addPermission(invoiceCreatePermission.id);

        // Create users
        const adminPassword = await bcrypt.hash('admin123', 12);
        await User.create({
            username: 'admin',
            passwordHash: adminPassword,
            fullName: 'System Administrator',
            email: 'admin@mssport.lk',
            phone: '+94123456789',
            roleId: adminRole.id
        });

        const managerPassword = await bcrypt.hash('manager123', 12);
        await User.create({
            username: 'manager',
            passwordHash: managerPassword,
            fullName: 'Main Store Manager',
            email: 'manager@mssport.lk',
            phone: '+94123456790',
            roleId: managerRole.id,
            shopId: mainStore.id
        });

        const cashierPassword = await bcrypt.hash('cashier123', 12);
        await User.create({
            username: 'cashier',
            passwordHash: cashierPassword,
            fullName: 'Main Store Cashier',
            email: 'cashier@mssport.lk',
            phone: '+94123456791',
            roleId: cashierRole.id,
            shopId: mainStore.id
        });

        // Create customers
        await Customer.create({
            name: 'John Customer',
            email: 'john@example.com',
            phone: '+94771234567',
            address: '123 Main St, Colombo',
            type: 'cash'
        });

        await Customer.create({
            name: 'Business Corp',
            email: 'accounts@businesscorp.lk',
            phone: '+94112345678',
            address: '456 Business Ave, Colombo',
            type: 'credit',
            creditLimit: 50000.00
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

module.exports = {
    syncDatabase,
    seedTestData
}; 