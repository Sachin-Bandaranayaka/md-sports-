import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

class Notification extends Model {
    public id!: number;
    public type!: string;
    public message!: string;
    public targetUserId!: number;
    public isRead!: boolean;
    public link!: string;
    public readonly createdAt!: Date;

    // Custom instance methods
    public async markAsRead(): Promise<void> {
        await this.update({ isRead: true });
    }
}

Notification.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Type of notification (e.g., inventory, invoice, system)'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    targetUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'User who should receive this notification'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    link: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Optional URL link related to the notification'
    }
}, {
    sequelize,
    modelName: 'notification',
    tableName: 'notifications',
    timestamps: true,
    updatedAt: false
});

export default Notification; 