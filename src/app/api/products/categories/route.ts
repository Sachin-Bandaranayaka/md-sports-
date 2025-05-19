import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET: Fetch all product categories
export async function GET() {
    try {
        // Query to get all active categories with their parent names
        const result = await db.query(`
            SELECT 
                c.id,
                c.name,
                c.description,
                c.parent_id,
                p.name as parent_name
            FROM 
                categories c
            LEFT JOIN 
                categories p ON c.parent_id = p.id
            WHERE 
                c.is_active = true
            ORDER BY 
                c.name
        `);

        return NextResponse.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching product categories:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching product categories',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 