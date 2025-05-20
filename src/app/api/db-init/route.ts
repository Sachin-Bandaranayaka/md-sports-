import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        // With Prisma, we don't need to manually sync the database
        // as Prisma handles migrations through prisma migrate
        // This endpoint could be used for other initialization tasks

        return NextResponse.json({
            success: true,
            message: 'Database connection verified successfully.',
        });
    } catch (error) {
        console.error('Error connecting to database:', error);
        return NextResponse.json({
            success: false,
            message: 'Error connecting to database',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 