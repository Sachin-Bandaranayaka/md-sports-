import { NextResponse } from 'next/server';
import sequelize from '@/lib/db';
import { Product, Category, Shop, InventoryItem } from '@/lib/models';

export async function POST(request: Request) {
    try {
        const { force = false } = await request.json();

        // Sync all models with the database
        // force: true will drop tables if they exist
        // alter: true will alter tables to match models
        await sequelize.sync({ force, alter: !force });

        return NextResponse.json({
            success: true,
            message: 'Database schema initialized successfully.',
            force
        });
    } catch (error) {
        console.error('Error initializing database schema:', error);
        return NextResponse.json({
            success: false,
            message: 'Error initializing database schema',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 