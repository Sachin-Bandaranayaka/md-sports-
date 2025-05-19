import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import Shop from './Shop';
import Product from './Product';

interface InventoryItemAttributes {
    id: number;
    shopId: number;
    productId: number;
    quantity: number;
    reorderLevel?: number;
    lastUpdated: Date;
}

interface InventoryItemCreationAttributes extends Optional<InventoryItemAttributes, 'id' | 'lastUpdated'> { }

class InventoryItem extends Model<InventoryItemAttributes, InventoryItemCreationAttributes> implements InventoryItemAttributes {
    public id!: number;
    public shopId!: number;
    public productId!: number;
    public quantity!: number;
    public reorderLevel!: number;
    public lastUpdated!: Date;

    // Methods defined in the design document
    public async adjustQuantity(amount: number): Promise<void> {
        this.quantity += amount;
        this.lastUpdated = new Date();
        await this.save();
    }

    public isLowStock(): boolean {
        if (!this.reorderLevel) return false;
        return this.quantity <= this.reorderLevel;
    }
}

InventoryItem.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    shopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'shops',
            key: 'id'
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    reorderLevel: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    lastUpdated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'InventoryItem',
    tableName: 'inventory_items',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['shopId', 'productId']
        }
    ]
});

// Set up associations
Shop.hasMany(InventoryItem, {
    sourceKey: 'id',
    foreignKey: 'shopId',
    as: 'inventoryItems'
});

InventoryItem.belongsTo(Shop, {
    foreignKey: 'shopId',
    as: 'shop'
});

Product.hasMany(InventoryItem, {
    sourceKey: 'id',
    foreignKey: 'productId',
    as: 'inventoryItems'
});

InventoryItem.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product'
});

export default InventoryItem; 