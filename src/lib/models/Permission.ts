import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

class Permission extends Model {
    public id!: number;
    public name!: string;
    public description!: string;
    public module!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Static method to safely find all permissions
    public static async findAllSafe() {
        try {
            return await Permission.findAll({
                order: [['module', 'ASC'], ['name', 'ASC']]
            });
        } catch (error) {
            console.error('Error finding permissions:', error);
            // If Sequelize fails, try direct SQL
            const { performQuery } = require('../db-utils');
            const result = await performQuery(`
                SELECT id, name, description, module
                FROM permissions
                ORDER BY module ASC, name ASC
            `);
            return result.rows;
        }
    }
}

Permission.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    description: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    module: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'The module this permission belongs to (e.g., inventory, user, shop)'
    }
}, {
    sequelize,
    modelName: 'permission',
    tableName: 'permissions',
    timestamps: true
});

export default Permission; 