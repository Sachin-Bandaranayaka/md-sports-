import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbConnection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT configuration - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password } = body;

        // Validate request body
        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Find user by username
        const userResult = await query(
            'SELECT u.id, u.username, u."passwordHash", u."fullName", u.email, u."isActive", u."roleId", u."shopId", r.name as "roleName" ' +
            'FROM users u ' +
            'JOIN roles r ON u."roleId" = r.id ' +
            'WHERE u.username = $1 AND u."isActive" = true',
            [username]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid username or password' },
                { status: 401 }
            );
        }

        const user = userResult.rows[0];

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return NextResponse.json(
                { success: false, message: 'Invalid username or password' },
                { status: 401 }
            );
        }

        // Get permissions from role
        const permissionsResult = await query(
            'SELECT p.name ' +
            'FROM permissions p ' +
            'JOIN role_permissions rp ON p.id = rp."permissionId" ' +
            'WHERE rp."roleId" = $1',
            [user.roleId]
        );

        const permissions = permissionsResult.rows.map(p => p.name);

        // Generate JWT token
        const token = jwt.sign({
            userId: user.id,
            username: user.username,
            roleId: user.roleId,
            permissions
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Return token and user data
        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                roleId: user.roleId,
                roleName: user.roleName,
                shopId: user.shopId,
                permissions
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication failed' },
            { status: 500 }
        );
    }
} 