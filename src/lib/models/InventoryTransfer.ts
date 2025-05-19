import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

class InventoryTransfer extends Model {
    public id!: number;
    public sourceShopId!: number;
    public destinationShopId!: number;
    public initiatedByUserId!: number;
    public status!: string;
    public readonly createdAt!: Date;
    public completedAt!: Date | null;

    // Custom instance methods
    public async addTransferItem(productId: number, quantity: number, notes: string = ''): Promise<void> {
        const TransferItem = sequelize.model('transfer_item');
        await TransferItem.create({
            transferId: this.id,
            productId,
            quantity,
            notes
        });
    }

    public async completeTransfer(): Promise<boolean> {
        // Check if transfer is in pending status
        if (this.status !== 'pending') {
            return false;
        }

        // Start transaction
        const transaction = await sequelize.transaction();

        try {
            const TransferItem = sequelize.model('transfer_item');
            const InventoryItem = sequelize.model('inventory_item');

            // Get all transfer items
            const items = await TransferItem.findAll({
                where: { transferId: this.id }
            });

            // Process each item in the transfer
            for (const item of items) {
                const productId = item.get('productId');
                const quantity = item.get('quantity');

                // Decrement source inventory
                const sourceInventory = await InventoryItem.findOne({
                    where: {
                        shopId: this.sourceShopId,
                        productId
                    },
                    transaction
                });

                if (!sourceInventory || sourceInventory.get('quantity') < quantity) {
                    throw new Error(`Insufficient inventory for product ${productId} in source shop`);
                }

                await sourceInventory.decrement('quantity', {
                    by: quantity,
                    transaction
                });

                // Increment destination inventory (or create if not exists)
                const [destInventory, created] = await InventoryItem.findOrCreate({
                    where: {
                        shopId: this.destinationShopId,
                        productId
                    },
                    defaults: {
                        shopId: this.destinationShopId,
                        productId,
                        quantity: 0,
                        reorderLevel: sourceInventory.get('reorderLevel')
                    },
                    transaction
                });

                await destInventory.increment('quantity', {
                    by: quantity,
                    transaction
                });
            }

            // Update transfer status
            await this.update({
                status: 'completed',
                completedAt: new Date()
            }, { transaction });

            // Commit transaction
            await transaction.commit();
            return true;
        } catch (error) {
            // Rollback transaction on error
            await transaction.rollback();
            console.error('Transfer completion failed:', error);
            return false;
        }
    }

    public async cancelTransfer(): Promise<boolean> {
        // Only pending transfers can be cancelled
        if (this.status !== 'pending') {
            return false;
        }

        // Update transfer status
        await this.update({
            status: 'cancelled'
        });

        return true;
    }
}

InventoryTransfer.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    sourceShopId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    destinationShopId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    initiatedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'inventory_transfer',
    tableName: 'inventory_transfers',
    timestamps: true,
    validate: {
        differentShops() {
            if (this.sourceShopId === this.destinationShopId) {
                throw new Error('Source and destination shops must be different');
            }
        }
    }
});

export default InventoryTransfer; 