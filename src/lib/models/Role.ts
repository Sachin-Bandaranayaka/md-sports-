import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

class Role extends Model {
    public id!: number;
    public name!: string;
    public description!: string;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Add declaration for the method that Sequelize will add
    public addPermission!: (permissionId: number | any) => Promise<void>;
    public removePermission!: (permissionId: number | any) => Promise<void>;

    // Custom instance methods
    public async assignPermission(permissionId: number): Promise<void> {
        try {
            // This will be implemented using a Role-Permission association
            const RolePermission = sequelize.model('role_permission');
            await RolePermission.create({
                roleId: this.id,
                permissionId
            });
        } catch (error) {
            console.error('Error assigning permission:', error);
            // Try direct SQL if model approach fails
            const { performQuery } = require('../db-utils');
            await performQuery(
                'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [this.id, permissionId]
            );
        }
    }

    public async removePermissionManually(permissionId: number): Promise<void> {
        try {
            // This will be implemented using a Role-Permission association
            const RolePermission = sequelize.model('role_permission');
            await RolePermission.destroy({
                where: {
                    roleId: this.id,
                    permissionId
                }
            });
        } catch (error) {
            console.error('Error removing permission:', error);
            // Try direct SQL if model approach fails
            const { performQuery } = require('../db-utils');
            await performQuery(
                'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
                [this.id, permissionId]
            );
        }
    }
}

Role.init({
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
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: 'role',
    tableName: 'roles',
    timestamps: true
});

export default Role; 