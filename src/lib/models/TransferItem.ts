import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

class TransferItem extends Model {
    public id!: number;
    public transferId!: number;
    public productId!: number;
    public quantity!: number;
    public notes!: string;
}

TransferItem.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    transferId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    notes: {
        type: DataTypes.STRING(200),
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'transfer_item',
    tableName: 'transfer_items',
    timestamps: false
});

export default TransferItem; 