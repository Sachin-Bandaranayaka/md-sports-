import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all accounts or a single account by ID
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            // Fetch a single account by ID
            const account = await prisma.account.findUnique({
                where: { id: parseInt(id, 10) }
            });

            if (!account) {
                return NextResponse.json({
                    success: false,
                    message: 'Account not found'
                }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                data: account
            });
        }

        // Fetch all accounts
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

// PATCH: Update an account
export async function PATCH(request: Request) {
    try {
        const { id, name, type, balance, description, isActive } = await request.json();

        // Validate required fields
        if (!id || !name || !type) {
            return NextResponse.json({
                success: false,
                message: 'Account ID, name and type are required'
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

        // Check if account exists
        const existingAccount = await prisma.account.findUnique({
            where: { id: parseInt(id, 10) }
        });

        if (!existingAccount) {
            return NextResponse.json({
                success: false,
                message: 'Account not found'
            }, { status: 404 });
        }

        // Calculate balance adjustment if the balance was changed
        const originalBalance = existingAccount.balance;
        const newBalance = balance !== undefined ? parseFloat(balance.toString()) : originalBalance;

        // Update the account
        const updatedAccount = await prisma.account.update({
            where: { id: parseInt(id, 10) },
            data: {
                name,
                type,
                balance: newBalance,
                description,
                isActive: isActive !== undefined ? isActive : existingAccount.isActive
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Account updated successfully',
            data: updatedAccount
        });
    } catch (error) {
        console.error('Error updating account:', error);
        return NextResponse.json({
            success: false,
            message: 'Error updating account',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}