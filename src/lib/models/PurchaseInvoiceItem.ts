import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import PurchaseInvoice from './PurchaseInvoice';
import Product from './Product';

interface PurchaseInvoiceItemAttributes {
    id: string;
    purchase_invoice_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total: number;
    created_at: Date;
    updated_at: Date;
}

interface PurchaseInvoiceItemCreationAttributes extends Optional<PurchaseInvoiceItemAttributes, 'id' | 'created_at' | 'updated_at'> { }

class PurchaseInvoiceItem extends Model<PurchaseInvoiceItemAttributes, PurchaseInvoiceItemCreationAttributes> implements PurchaseInvoiceItemAttributes {
    public id!: string;
    public purchase_invoice_id!: string;
    public product_id!: string;
    public quantity!: number;
    public unit_price!: number;
    public total!: number;
    public created_at!: Date;
    public updated_at!: Date;
}

PurchaseInvoiceItem.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => `PII${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    },
    purchase_invoice_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'purchase_invoices',
            key: 'id'
        }
    },
    product_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    unit_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'PurchaseInvoiceItem',
    tableName: 'purchase_invoice_items',
    timestamps: true,
    underscored: true
});

// Define associations
PurchaseInvoiceItem.belongsTo(PurchaseInvoice, { foreignKey: 'purchase_invoice_id', as: 'purchaseInvoice' });
PurchaseInvoice.hasMany(PurchaseInvoiceItem, { foreignKey: 'purchase_invoice_id', as: 'items' });

PurchaseInvoiceItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(PurchaseInvoiceItem, { foreignKey: 'product_id', as: 'purchaseItems' });

export default PurchaseInvoiceItem; 