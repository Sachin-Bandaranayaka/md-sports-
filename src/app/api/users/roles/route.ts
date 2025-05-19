import { NextResponse } from 'next/server';
import Role from '@/lib/models/Role';
import { performQuery, performTransaction } from '@/lib/db-utils';

/**
 * GET: Fetch all roles
 */
export async function GET() {
    try {
        // First try using Sequelize
        try {
            const roles = await Role.findAll({
                include: ['permissions']
            });

            return NextResponse.json({
                success: true,
                message: 'Roles retrieved successfully',
                data: roles
            });
        } catch (modelError) {
            console.warn('Sequelize model failed, falling back to direct query:', modelError);

            // Fall back to direct SQL
            const query = `
                SELECT r.id, r.name, r.description, r.is_active as "isActive"
                FROM roles r
                WHERE r.is_active = true
                ORDER BY r.name ASC
            `;

            const result = await performQuery(query);
            const roles = result.rows;

            // For each role, get its permissions
            for (const role of roles) {
                const permissionsQuery = `
                    SELECT p.id, p.name, p.description, p.module
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = $1
                `;

                const permissionsResult = await performQuery(permissionsQuery, [role.id]);
                role.permissions = permissionsResult.rows;
            }

            return NextResponse.json({
                success: true,
                message: 'Roles retrieved successfully',
                data: roles
            });
        }
    } catch (error) {
        console.error('Error fetching roles:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to retrieve roles',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/**
 * POST: Create a new role
 */
export async function POST(request: Request) {
    try {
        const { name, description, permissions } = await request.json();

        // Validate required fields
        if (!name) {
            return NextResponse.json({
                success: false,
                message: 'Role name is required'
            }, { status: 400 });
        }

        // Try with Sequelize first
        try {
            // Check if role already exists
            const existingRole = await Role.findOne({
                where: { name }
            });

            if (existingRole) {
                return NextResponse.json({
                    success: false,
                    message: 'Role with this name already exists'
                }, { status: 409 });
            }

            // Create new role
            const role = await Role.create({
                name,
                description,
                isActive: true
            });

            // Assign permissions if provided
            if (permissions && Array.isArray(permissions) && permissions.length > 0) {
                await Promise.all(permissions.map(permId => role.assignPermission(permId)));
            }

            return NextResponse.json({
                success: true,
                message: 'Role created successfully',
                data: role
            }, { status: 201 });
        } catch (modelError) {
            console.warn('Sequelize model failed, falling back to direct query:', modelError);

            // Fall back to direct SQL queries
            return await performTransaction(async (client) => {
                // Check if role already exists
                const checkQuery = `
                    SELECT id FROM roles WHERE name = $1
                `;
                const checkResult = await client.query(checkQuery, [name]);

                if (checkResult.rows.length > 0) {
                    return NextResponse.json({
                        success: false,
                        message: 'Role with this name already exists'
                    }, { status: 409 });
                }

                // Create new role
                const createQuery = `
                    INSERT INTO roles (name, description, is_active, created_at, updated_at)
                    VALUES ($1, $2, true, NOW(), NOW())
                    RETURNING id, name, description, is_active as "isActive"
                `;
                const createResult = await client.query(createQuery, [name, description]);
                const role = createResult.rows[0];

                // Assign permissions if provided
                if (permissions && Array.isArray(permissions) && permissions.length > 0) {
                    const assignPermissionPromises = permissions.map(async (permId) => {
                        const permQuery = `
                            INSERT INTO role_permissions (role_id, permission_id)
                            VALUES ($1, $2)
                            ON CONFLICT DO NOTHING
                        `;
                        return client.query(permQuery, [role.id, permId]);
                    });

                    await Promise.all(assignPermissionPromises);
                }

                return NextResponse.json({
                    success: true,
                    message: 'Role created successfully',
                    data: role
                }, { status: 201 });
            });
        }
    } catch (error) {
        console.error('Error creating role:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating role',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 