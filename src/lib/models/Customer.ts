import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

class Customer extends Model {
    public id!: number;
    public name!: string;
    public email!: string;
    public phone!: string;
    public address!: string;
    public type!: string; // 'cash' or 'credit'
    public creditLimit!: number;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Custom instance methods
    public async getCurrentBalance(): Promise<number> {
        const Invoice = sequelize.model('invoice');
        const Payment = sequelize.model('payment');

        // Calculate total invoice amount
        const invoices = await Invoice.findAll({
            where: { customerId: this.id }
        });

        const totalInvoiced = invoices.reduce((sum, invoice) =>
            sum + (invoice.get('total') as number), 0);

        // Calculate total payments
        const payments = await Payment.findAll({
            include: [{
                model: Invoice,
                where: { customerId: this.id }
            }]
        });

        const totalPaid = payments.reduce((sum, payment) =>
            sum + (payment.get('amount') as number), 0);

        // Return balance (invoiced - paid)
        return totalInvoiced - totalPaid;
    }
}

Customer.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('cash', 'credit'),
        allowNull: false,
        defaultValue: 'cash'
    },
    creditLimit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: 'customer',
    tableName: 'customers',
    timestamps: true
});

export default Customer; 