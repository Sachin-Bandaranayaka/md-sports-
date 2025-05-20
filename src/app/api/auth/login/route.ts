import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

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

        // Find user by username with related role and permissions
        const user = await prisma.user.findFirst({
            where: {
                username: username,
                isActive: true
            },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                },
                shop: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Invalid username or password' },
                { status: 401 }
            );
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return NextResponse.json(
                { success: false, message: 'Invalid username or password' },
                { status: 401 }
            );
        }

        // Extract permissions
        const permissions = user.role.permissions.map(p => p.name);

        // Generate JWT token
        const token = jwt.sign({
            userId: user.id,
            username: user.name,
            roleId: user.roleId,
            permissions
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Return token and user data
        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.name,
                fullName: user.name,
                email: user.email,
                roleId: user.roleId,
                roleName: user.role.name,
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