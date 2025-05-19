import sequelize from '../db';
import Product from './Product';
import Category from './Category';
import Shop from './Shop';
import InventoryItem from './InventoryItem';
import User from './User';
import Role from './Role';
import Permission from './Permission';
import Customer from './Customer';
import Invoice from './Invoice';
import InvoiceItem from './InvoiceItem';
import Payment from './Payment';
import InventoryTransfer from './InventoryTransfer';
import TransferItem from './TransferItem';
import AuditLog from './AuditLog';
import Notification from './Notification';

// Set up associations
User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

User.belongsTo(Shop, { foreignKey: 'shopId' });
Shop.hasMany(User, { foreignKey: 'shopId' });

Product.belongsTo(Category, { foreignKey: 'categoryId' });
Category.hasMany(Product, { foreignKey: 'categoryId' });

Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });
Category.hasMany(Category, { foreignKey: 'parentId', as: 'subcategories' });

InventoryItem.belongsTo(Shop, { foreignKey: 'shopId' });
Shop.hasMany(InventoryItem, { foreignKey: 'shopId' });

InventoryItem.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(InventoryItem, { foreignKey: 'productId' });

InventoryTransfer.belongsTo(Shop, { foreignKey: 'sourceShopId', as: 'sourceShop' });
InventoryTransfer.belongsTo(Shop, { foreignKey: 'destinationShopId', as: 'destinationShop' });
InventoryTransfer.belongsTo(User, { foreignKey: 'initiatedByUserId', as: 'initiatedBy' });

TransferItem.belongsTo(InventoryTransfer, { foreignKey: 'transferId' });
InventoryTransfer.hasMany(TransferItem, { foreignKey: 'transferId' });

TransferItem.belongsTo(Product, { foreignKey: 'productId' });

Customer.hasMany(Invoice, { foreignKey: 'customerId' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId' });

Invoice.belongsTo(Shop, { foreignKey: 'shopId' });
Shop.hasMany(Invoice, { foreignKey: 'shopId' });

Invoice.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Invoice, { foreignKey: 'userId' });

InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId' });

InvoiceItem.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(InvoiceItem, { foreignKey: 'productId' });

Payment.belongsTo(Invoice, { foreignKey: 'invoiceId' });
Invoice.hasMany(Payment, { foreignKey: 'invoiceId' });

AuditLog.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(AuditLog, { foreignKey: 'userId' });

Notification.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });
User.hasMany(Notification, { foreignKey: 'targetUserId', as: 'notifications' });

// Many-to-many relationship between Role and Permission
const RolePermission = sequelize.define('role_permission', {}, { timestamps: false });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId' });

export {
    Product,
    Category,
    Shop,
    InventoryItem,
    User,
    Role,
    Permission,
    Customer,
    Invoice,
    InvoiceItem,
    Payment,
    InventoryTransfer,
    TransferItem,
    AuditLog,
    Notification,
    RolePermission
}; 