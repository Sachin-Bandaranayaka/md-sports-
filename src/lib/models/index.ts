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
import Supplier from './Supplier';
import PurchaseInvoice from './PurchaseInvoice';
import PurchaseInvoiceItem from './PurchaseInvoiceItem';
import Quotation from './Quotation';
import QuotationItem from './QuotationItem';

// Set up associations
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

User.belongsTo(Shop, { foreignKey: 'shop_id' });
Shop.hasMany(User, { foreignKey: 'shop_id' });

Product.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(Product, { foreignKey: 'category_id' });

Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'subcategories' });

InventoryItem.belongsTo(Shop, { foreignKey: 'shop_id' });
Shop.hasMany(InventoryItem, { foreignKey: 'shop_id' });

InventoryItem.belongsTo(Product, { foreignKey: 'product_id' });
Product.hasMany(InventoryItem, { foreignKey: 'product_id' });

InventoryTransfer.belongsTo(Shop, { foreignKey: 'source_shop_id', as: 'sourceShop' });
InventoryTransfer.belongsTo(Shop, { foreignKey: 'destination_shop_id', as: 'destinationShop' });
InventoryTransfer.belongsTo(User, { foreignKey: 'initiated_by_user_id', as: 'initiatedBy' });

TransferItem.belongsTo(InventoryTransfer, { foreignKey: 'transfer_id' });
InventoryTransfer.hasMany(TransferItem, { foreignKey: 'transfer_id' });

TransferItem.belongsTo(Product, { foreignKey: 'product_id' });

Customer.hasMany(Invoice, { foreignKey: 'customer_id' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id' });

Invoice.belongsTo(Shop, { foreignKey: 'shop_id' });
Shop.hasMany(Invoice, { foreignKey: 'shop_id' });

Invoice.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Invoice, { foreignKey: 'user_id' });

InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });

InvoiceItem.belongsTo(Product, { foreignKey: 'product_id' });
Product.hasMany(InvoiceItem, { foreignKey: 'product_id' });

Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });
Invoice.hasMany(Payment, { foreignKey: 'invoice_id' });

AuditLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(AuditLog, { foreignKey: 'user_id' });

Notification.belongsTo(User, { foreignKey: 'target_user_id', as: 'targetUser' });
User.hasMany(Notification, { foreignKey: 'target_user_id', as: 'notifications' });

// Many-to-many relationship between Role and Permission
const RolePermission = sequelize.define('role_permission', {}, { timestamps: false });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id' });

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
    RolePermission,
    Supplier,
    PurchaseInvoice,
    PurchaseInvoiceItem,
    Quotation,
    QuotationItem
}; 