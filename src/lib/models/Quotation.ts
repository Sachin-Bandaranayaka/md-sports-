import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import Customer from './Customer';

interface QuotationAttributes {
    id: string;
    quotationNumber: string;
    customerId: string;
    date: Date;
    expiryDate: Date;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface QuotationCreationAttributes extends Optional<QuotationAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

class Quotation extends Model<QuotationAttributes, QuotationCreationAttributes> implements QuotationAttributes {
    public id!: string;
    public quotationNumber!: string;
    public customerId!: string;
    public date!: Date;
    public expiryDate!: Date;
    public subtotal!: number;
    public tax!: number;
    public discount!: number;
    public total!: number;
    public notes!: string;
    public createdAt!: Date;
    public updatedAt!: Date;
}

Quotation.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => `QUO${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    },
    quotationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    customerId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'customers',
            key: 'id'
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    expiryDate: {
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
    modelName: 'Quotation',
    tableName: 'quotations',
    timestamps: true,
    underscored: true
});

// Define association with Customer
Quotation.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Quotation, { foreignKey: 'customer_id', as: 'quotations' });

export default Quotation;