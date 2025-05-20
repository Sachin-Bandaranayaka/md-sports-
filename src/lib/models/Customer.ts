import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

// Define attributes interface
interface CustomerAttributes {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    type: 'cash' | 'credit';
    creditLimit: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define creation attributes (making id optional as it has a default)
interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt' | 'email' | 'phone' | 'address'> { }

class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
    public id!: string;
    public name!: string;
    public email!: string;
    public phone!: string;
    public address!: string;
    public type!: 'cash' | 'credit';
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
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
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
        defaultValue: 'cash',
        validate: {
            isIn: [['cash', 'credit']]
        }
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
    timestamps: true,
    underscored: true
});

export default Customer; 