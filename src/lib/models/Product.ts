import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface ProductAttributes {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    description?: string;
    basePrice: number;
    retailPrice: number;
    categoryId?: number;
    imageUrl?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> { }

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
    public id!: number;
    public name!: string;
    public sku!: string;
    public barcode!: string;
    public description!: string;
    public basePrice!: number;
    public retailPrice!: number;
    public categoryId!: number;
    public imageUrl!: string;
    public isActive!: boolean;

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Methods defined in the design document
    public async getInventoryLevels(): Promise<Map<number, number>> {
        // This will be implemented to query the InventoryItem table
        // to get inventory levels across all shops
        return new Map<number, number>();
    }

    public async getTotalStock(): Promise<number> {
        // This will sum up all inventory across all shops
        return 0;
    }
}

Product.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    barcode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    basePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    retailPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
});

export default Product;