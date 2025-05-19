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
        // This will be implemented using a Role-Permission association
        const RolePermission = sequelize.model('role_permission');
        await RolePermission.create({
            roleId: this.id,
            permissionId
        });
    }

    public async removePermissionManually(permissionId: number): Promise<void> {
        // This will be implemented using a Role-Permission association
        const RolePermission = sequelize.model('role_permission');
        await RolePermission.destroy({
            where: {
                roleId: this.id,
                permissionId
            }
        });
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