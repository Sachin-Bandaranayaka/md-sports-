import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

class InvoiceItem extends Model {
    public id!: number;
    public invoiceId!: number;
    public productId!: number;
    public quantity!: number;
    public unitPrice!: number;
    public discount!: number;
    public subtotal!: number;

    // Custom instance methods
    public calculateSubtotal(): number {
        const discountAmount = this.unitPrice * (this.discount / 100);
        const netPrice = this.unitPrice - discountAmount;
        return this.quantity * netPrice;
    }
}

InvoiceItem.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    invoiceId: {
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
    unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    discount: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0,
            max: 100
        }
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'invoice_item',
    tableName: 'invoice_items',
    timestamps: false,
    hooks: {
        beforeValidate: (item: InvoiceItem) => {
            // Calculate subtotal before saving
            item.subtotal = item.calculateSubtotal();
        }
    }
});

export default InvoiceItem; 