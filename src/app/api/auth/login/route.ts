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
        const { email, password } = body;

        console.log('Login attempt for email:', email);

        // Validate request body
        if (!email || !password) {
            console.log('Missing email or password');
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user by email with related role and permissions
        const user = await prisma.user.findFirst({
            where: {
                email: email,
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
            console.log('User not found with email:', email);
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        console.log('User found:', user.id, user.name, user.email);
        console.log('Stored password hash:', user.password);

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', passwordMatch);

        if (!passwordMatch) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Extract permissions
        const permissions = user.role.permissions.map(p => p.name);
        console.log('User permissions:', permissions);

        // Generate JWT token
        const token = jwt.sign({
            sub: user.id, // Standard JWT claim for subject (user ID)
            username: user.name,
            email: user.email,
            roleId: user.roleId,
            permissions,
            shopId: user.shopId
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        console.log('Login successful for user:', user.name);

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