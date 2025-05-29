import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

// Define attributes interface
interface CustomerAttributes {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    type: 'wholesale' | 'retail';
    creditLimit?: number;
    creditPeriod?: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define creation attributes (making id optional as it has a default)
interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt' | 'email' | 'phone' | 'address' | 'creditLimit' | 'creditPeriod'> { }

class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
    public id!: number;
    public name!: string;
    public email!: string;
    public phone!: string;
    public address!: string;
    public type!: 'wholesale' | 'retail';
    public creditLimit!: number;
    public creditPeriod!: number;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Custom instance methods
    public async getCurrentBalance(): Promise<number> {
        const Invoice = sequelize.model('invoice');
        const Payment = sequelize.model('payment');

        // Calculate total invoice amount
        const invoices = await Invoice.findAll({
            where: { customer_id: this.id }
        });

        const totalInvoiced = invoices.reduce((sum, invoice) =>
            sum + (invoice.get('total') as number), 0);

        // Calculate total payments
        const payments = await Payment.findAll({
            include: [{
                model: Invoice,
                where: { customer_id: this.id }
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
        primaryKey: true,
        autoIncrement: true
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
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'retail',
        validate: {
            isIn: [['wholesale', 'retail']]
        }
    },
    creditLimit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    creditPeriod: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    timestamps: true,
    underscored: true
});

export default Customer; 