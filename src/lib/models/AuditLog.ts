import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

class AuditLog extends Model {
    public id!: number;
    public userId!: number;
    public action!: string;
    public module!: string;
    public details!: string;
    public ipAddress!: string;
    public readonly timestamp!: Date;
}

AuditLog.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    action: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    module: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'audit_log',
    tableName: 'audit_logs',
    timestamps: false
});

export default AuditLog; 