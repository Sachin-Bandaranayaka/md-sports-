import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface ShopAttributes {
    id: number;
    name: string;
    location: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface ShopCreationAttributes extends Optional<ShopAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> { }

class Shop extends Model<ShopAttributes, ShopCreationAttributes> implements ShopAttributes {
    public id!: number;
    public name!: string;
    public location!: string;
    public contactPerson!: string;
    public phone!: string;
    public email!: string;
    public isActive!: boolean;

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Methods defined in the design document
    public async getInventory() {
        // This will be implemented to query the InventoryItem table
        // to get all inventory items for this shop
        return [];
    }

    public async getInventoryItem(productId: number) {
        // This will be implemented to query the InventoryItem table
        // to get a specific inventory item for this shop and product
        return null;
    }

    public async updateInventory(productId: number, quantity: number) {
        // This will be implemented to update inventory levels
        return true;
    }
}

Shop.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contactPerson: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
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
    modelName: 'Shop',
    tableName: 'shops',
    timestamps: true,
});

export default Shop; 