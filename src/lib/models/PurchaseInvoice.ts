import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import Supplier from './Supplier';

interface PurchaseInvoiceAttributes {
    id: string;
    invoiceNumber: string;
    supplierId: string;
    date: Date;
    dueDate: Date;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    notes?: string;
    status: 'paid' | 'partial' | 'unpaid';
    paymentMethod?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface PurchaseInvoiceCreationAttributes extends Optional<PurchaseInvoiceAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

class PurchaseInvoice extends Model<PurchaseInvoiceAttributes, PurchaseInvoiceCreationAttributes> implements PurchaseInvoiceAttributes {
    public id!: string;
    public invoiceNumber!: string;
    public supplierId!: string;
    public date!: Date;
    public dueDate!: Date;
    public subtotal!: number;
    public tax!: number;
    public discount!: number;
    public total!: number;
    public notes!: string;
    public status!: 'paid' | 'partial' | 'unpaid';
    public paymentMethod!: string;
    public createdAt!: Date;
    public updatedAt!: Date;
}

PurchaseInvoice.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => `PI${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    },
    invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    supplierId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'suppliers',
            key: 'id'
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    subtotal: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    tax: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    discount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('paid', 'partial', 'unpaid'),
        allowNull: false,
        defaultValue: 'unpaid'
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'PurchaseInvoice',
    tableName: 'purchase_invoices',
    timestamps: true,
    underscored: true
});

// Define association with Supplier
PurchaseInvoice.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(PurchaseInvoice, { foreignKey: 'supplier_id', as: 'purchaseInvoices' });

export default PurchaseInvoice; 