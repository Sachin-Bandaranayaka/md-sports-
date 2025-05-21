import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all accounts
export async function GET() {
    try {
        const accounts = await prisma.account.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            data: accounts
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching accounts',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// POST: Create a new account
export async function POST(request: Request) {
    try {
        const { name, type, balance, description, isActive } = await request.json();

        // Validate required fields
        if (!name || !type) {
            return NextResponse.json({
                success: false,
                message: 'Account name and type are required'
            }, { status: 400 });
        }

        // Validate account type
        const validTypes = ['asset', 'liability', 'equity', 'income', 'expense'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({
                success: false,
                message: `Account type must be one of: ${validTypes.join(', ')}`
            }, { status: 400 });
        }

        // Create the account
        const newAccount = await prisma.account.create({
            data: {
                name,
                type,
                balance: balance || 0,
                description,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Account created successfully',
            data: newAccount
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating account:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating account',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 