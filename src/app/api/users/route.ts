import { NextRequest, NextResponse } from 'next/server';
import { User, Role } from '@/lib/models';
import { requirePermission } from '@/lib/utils/middleware';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

// GET: List all users
export async function GET(req: NextRequest) {
    // Check for 'user:manage' permission
    const permissionError = await requirePermission('user:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const users = await User.findAll({
            attributes: { exclude: ['passwordHash'] },
            include: [
                {
                    model: Role,
                    attributes: ['id', 'name']
                }
            ]
        });

        return NextResponse.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// POST: Create a new user
export async function POST(req: NextRequest) {
    // Check for 'user:manage' permission
    const permissionError = await requirePermission('user:manage')(req);
    if (permissionError) {
        return permissionError;
    }

    try {
        const body = await req.json();
        const {
            username,
            password,
            fullName,
            email,
            phone,
            roleId,
            shopId,
            isActive = true
        } = body;

        // Validate required fields
        if (!username || !password || !fullName || !email || !roleId) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: 'Username or email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const user = await User.create({
            username,
            passwordHash,
            fullName,
            email,
            phone,
            roleId,
            shopId: shopId || null,
            isActive
        });

        // Return created user without password
        const userData = user.toJSON();
        delete userData.passwordHash;

        return NextResponse.json({
            success: true,
            user: userData
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create user' },
            { status: 500 }
        );
    }
} 