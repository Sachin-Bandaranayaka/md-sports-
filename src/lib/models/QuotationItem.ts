import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import Quotation from './Quotation';
import Product from './Product';

interface QuotationItemAttributes {
    id: string;
    quotation_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total: number;
    created_at: Date;
    updated_at: Date;
}

interface QuotationItemCreationAttributes extends Optional<QuotationItemAttributes, 'id' | 'created_at' | 'updated_at'> { }

class QuotationItem extends Model<QuotationItemAttributes, QuotationItemCreationAttributes> implements QuotationItemAttributes {
    public id!: string;
    public quotation_id!: string;
    public product_id!: string;
    public quantity!: number;
    public unit_price!: number;
    public total!: number;
    public created_at!: Date;
    public updated_at!: Date;
}

QuotationItem.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => `QI${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    },
    quotation_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'quotations',
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
    modelName: 'QuotationItem',
    tableName: 'quotation_items',
    timestamps: true,
    underscored: true
});

// Define associations
QuotationItem.belongsTo(Quotation, { foreignKey: 'quotation_id', as: 'quotation' });
Quotation.hasMany(QuotationItem, { foreignKey: 'quotation_id', as: 'items' });

QuotationItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(QuotationItem, { foreignKey: 'product_id', as: 'quotationItems' });

export default QuotationItem; 