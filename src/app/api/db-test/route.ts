import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET() {
    try {
        const result = await db.testConnection();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Database connection successful!',
                data: result.data
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'Database connection failed.',
                error: result.error instanceof Error ? result.error.message : String(result.error)
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error testing database connection:', error);
        return NextResponse.json({
            success: false,
            message: 'Error testing database connection',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 