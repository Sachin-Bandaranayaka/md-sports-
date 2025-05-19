import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET: Fetch all shops
export async function GET() {
    try {
        // Query to get all active shops with their inventory counts
        const result = await db.query(`
            SELECT 
                s.id,
                s.name,
                s.location,
                s.contact_person,
                s.phone,
                s.email,
                COALESCE(SUM(i.quantity), 0) as total_inventory
            FROM 
                shops s
            LEFT JOIN 
                inventory_items i ON s.id = i.shop_id
            WHERE 
                s.is_active = true
            GROUP BY 
                s.id, s.name, s.location, s.contact_person, s.phone, s.email
            ORDER BY 
                s.name
        `);

        return NextResponse.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching shops:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching shops',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// POST: Create a new shop
export async function POST(request: Request) {
    try {
        const { name, location, contactPerson, phone, email } = await request.json();

        // Validate required fields
        if (!name || !location) {
            return NextResponse.json({
                success: false,
                message: 'Shop name and location are required'
            }, { status: 400 });
        }

        // Insert new shop into database
        const result = await db.query(`
            INSERT INTO shops (
                name, 
                location, 
                contact_person, 
                phone, 
                email
            ) VALUES (
                $1, $2, $3, $4, $5
            ) RETURNING *
        `, [name, location, contactPerson || null, phone || null, email || null]);

        return NextResponse.json({
            success: true,
            message: 'Shop created successfully',
            data: result.rows[0]
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating shop:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creating shop',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 