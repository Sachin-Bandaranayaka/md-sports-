import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

class Payment extends Model {
    public id!: number;
    public invoiceId!: number;
    public amount!: number;
    public method!: string;
    public reference!: string;
    public paymentDate!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Payment.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    method: {
        type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'cheque', 'other'),
        allowNull: false,
        defaultValue: 'cash'
    },
    reference: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Reference number for non-cash payments'
    },
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'payment',
    tableName: 'payments',
    timestamps: true,
    hooks: {
        afterCreate: async (payment: Payment) => {
            // Update invoice payment status
            const Invoice = sequelize.model('invoice');
            const invoice = await Invoice.findByPk(payment.invoiceId);

            if (invoice) {
                // Get all payments for this invoice
                const payments = await Payment.findAll({
                    where: { invoiceId: payment.invoiceId },
                    attributes: [
                        [sequelize.fn('SUM', sequelize.col('amount')), 'totalPaid']
                    ],
                    raw: true
                });

                const totalPaid = parseFloat((payments[0] as any).totalPaid || 0);
                const invoiceTotal = parseFloat(invoice.get('total') as string);

                // Determine payment status
                let paymentStatus = 'unpaid';
                if (totalPaid >= invoiceTotal) {
                    paymentStatus = 'paid';
                } else if (totalPaid > 0) {
                    paymentStatus = 'partial';
                }

                // Update invoice
                await invoice.update({ paymentStatus });
            }
        }
    }
});

export default Payment; 