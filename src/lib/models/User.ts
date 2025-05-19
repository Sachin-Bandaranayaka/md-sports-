import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';
import bcrypt from 'bcryptjs';
import Role from './Role';

class User extends Model {
    public id!: number;
    public username!: string;
    public passwordHash!: string;
    public fullName!: string;
    public email!: string;
    public phone!: string;
    public isActive!: boolean;
    public roleId!: number;
    public shopId!: number | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Custom instance methods
    public async authenticate(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.passwordHash);
    }

    public async hasPermission(permissionName: string): Promise<boolean> {
        const role = await Role.findByPk(this.roleId, {
            include: ['permissions']
        });

        if (!role) return false;

        const permissions = role.get('permissions') as any[];
        return permissions.some(p => p.name === permissionName);
    }
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fullName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    shopId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'The shop this user is assigned to, if applicable'
    }
}, {
    sequelize,
    modelName: 'user',
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user: User) => {
            if (user.changed('passwordHash')) {
                user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
            }
        },
        beforeUpdate: async (user: User) => {
            if (user.changed('passwordHash')) {
                user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
            }
        }
    }
});

export default User; 