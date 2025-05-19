import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

class Invoice extends Model {
    public id!: number;
    public shopId!: number;
    public customerId!: number;
    public userId!: number;
    public invoiceNumber!: string;
    public date!: Date;
    public subtotal!: number;
    public tax!: number;
    public discount!: number;
    public total!: number;
    public status!: string;
    public paymentStatus!: string;
    public dueDate!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Custom instance methods
    public async addItem(productId: number, quantity: number, price: number): Promise<void> {
        const InvoiceItem = sequelize.model('invoice_item');
        const item = await InvoiceItem.create({
            invoiceId: this.id,
            productId,
            quantity,
            unitPrice: price,
            subtotal: quantity * price
        });

        // Recalculate invoice totals
        await this.calculateTotals();
    }

    public async removeItem(lineItemId: number): Promise<void> {
        const InvoiceItem = sequelize.model('invoice_item');
        await InvoiceItem.destroy({
            where: { id: lineItemId, invoiceId: this.id }
        });

        // Recalculate invoice totals
        await this.calculateTotals();
    }

    public async calculateTotals(): Promise<void> {
        const InvoiceItem = sequelize.model('invoice_item');
        const items = await InvoiceItem.findAll({
            where: { invoiceId: this.id }
        });

        // Calculate subtotal
        const subtotal = items.reduce((sum, item) =>
            sum + (item.get('subtotal') as number), 0);

        // Apply tax and discount
        const taxAmount = subtotal * (this.tax / 100);
        const discountAmount = subtotal * (this.discount / 100);
        const total = subtotal + taxAmount - discountAmount;

        // Update invoice
        await this.update({
            subtotal,
            total
        });
    }

    public async markAsPaid(): Promise<void> {
        await this.update({
            paymentStatus: 'paid'
        });
    }
}

Invoice.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    shopId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'User who created the invoice'
    },
    invoiceNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    tax: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    discount: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    status: {
        type: DataTypes.ENUM('draft', 'issued', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
    },
    paymentStatus: {
        type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
        allowNull: false,
        defaultValue: 'unpaid'
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'invoice',
    tableName: 'invoices',
    timestamps: true
});

export default Invoice; 