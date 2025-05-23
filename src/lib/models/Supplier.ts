import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface SupplierAttributes {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    totalPurchases: number;
    status: 'active' | 'inactive';
}

interface SupplierCreationAttributes extends Optional<SupplierAttributes, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchases'> { }

class Supplier extends Model<SupplierAttributes, SupplierCreationAttributes> implements SupplierAttributes {
    public id!: string;
    public name!: string;
    public contactPerson!: string;
    public email!: string;
    public phone!: string;
    public address!: string;
    public city!: string;
    public notes!: string;
    public createdAt!: Date;
    public updatedAt!: Date;
    public totalPurchases!: number;
    public status!: 'active' | 'inactive';
}

Supplier.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => `SUP${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contactPerson: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    totalPurchases: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
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
    modelName: 'Supplier',
    tableName: 'suppliers',
    timestamps: true,
    underscored: true
});

export default Supplier; 