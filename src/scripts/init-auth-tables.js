require('dotenv').config({ path: '.env.local' });
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

console.log('Initializing authentication tables...');

// Get connection string from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable not found');
  process.exit(1);
}

// Create Sequelize instance
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log
});

async function initAuthTables() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Define models
    // Role model
    const Role = sequelize.define('role', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    }, {
      tableName: 'roles',
      timestamps: true
    });

    // Permission model
    const Permission = sequelize.define('permission', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      module: {
        type: DataTypes.STRING(50),
        allowNull: false
      }
    }, {
      tableName: 'permissions',
      timestamps: true
    });

    // User model
    const User = sequelize.define('user', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fullName: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        }
      },
      shopId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'shops',
          key: 'id'
        }
      }
    }, {
      tableName: 'users',
      timestamps: true
    });

    // Define the role_permission join table
    const RolePermission = sequelize.define('role_permission', {}, {
      tableName: 'role_permissions',
      timestamps: false
    });

    // Set up associations
    Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId' });
    Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId' });
    
    User.belongsTo(Role, { foreignKey: 'roleId' });
    Role.hasMany(User, { foreignKey: 'roleId' });

    // Sync models with database
    console.log('Syncing models with database...');
    await Role.sync({ force: true });
    await Permission.sync({ force: true });
    await RolePermission.sync({ force: true });
    await User.sync({ force: true });

    // Create default roles
    console.log('Creating default roles...');
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
    console.log('Creating permissions...');
    const permissions = await Permission.bulkCreate([
      {
        name: 'inventory:view',
        description: 'View inventory items',
        module: 'inventory'
      },
      {
        name: 'inventory:manage',
        description: 'Create, update, delete inventory items',
        module: 'inventory'
      },
      {
        name: 'sales:view',
        description: 'View sales data and transactions',
        module: 'sales'
      },
      {
        name: 'sales:manage',
        description: 'Full sales management access',
        module: 'sales'
      },
      {
        name: 'invoice:create',
        description: 'Create new invoices',
        module: 'invoice'
      },
      {
        name: 'user:manage',
        description: 'Manage user accounts',
        module: 'user'
      },
      {
        name: 'shop:manage',
        description: 'Manage shop details',
        module: 'shop'
      },
      {
        name: 'report:view',
        description: 'View reports',
        module: 'report'
      }
    ]);

    // Assign permissions to roles
    console.log('Assigning permissions to roles...');
    
    // Admin gets all permissions
    await RolePermission.bulkCreate(permissions.map(permission => ({
      roleId: adminRole.id,
      permissionId: permission.id
    })));
    
    // Manager permissions
    const managerPermissions = permissions.filter(p => 
      ['inventory:view', 'inventory:manage', 'invoice:create', 'report:view'].includes(p.name));
    
    await RolePermission.bulkCreate(managerPermissions.map(permission => ({
      roleId: managerRole.id,
      permissionId: permission.id
    })));
    
    // Cashier permissions
    const cashierPermissions = permissions.filter(p => 
      ['inventory:view', 'invoice:create'].includes(p.name));
    
    await RolePermission.bulkCreate(cashierPermissions.map(permission => ({
      roleId: cashierRole.id,
      permissionId: permission.id
    })));

    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    await User.create({
      username: 'admin',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      email: 'admin@mssport.lk',
      phone: '+94123456789',
      roleId: adminRole.id
    });

    console.log('Authentication tables initialized successfully!');
  } catch (error) {
    console.error('Error initializing authentication tables:', error);
  } finally {
    await sequelize.close();
  }
}

initAuthTables();