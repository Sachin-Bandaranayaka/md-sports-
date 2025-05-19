import { NextResponse } from 'next/server';
import Permission from '@/lib/models/Permission';
import { performQuery } from '@/lib/db-utils';

/**
 * GET handler for retrieving all permissions
 */
export async function GET() {
    try {
        // Use the safe method that handles errors internally
        const permissions = await Permission.findAllSafe();

        return NextResponse.json({
            success: true,
            message: 'Permissions retrieved successfully',
            data: permissions
        });
    } catch (error) {
        console.error('Error fetching permissions:', error);

        // Last resort fallback to direct SQL
        try {
            const query = `
                SELECT 
                    id, name, description, module
                FROM 
                    permissions
                ORDER BY
                    module ASC, name ASC
            `;

            const result = await performQuery(query);

            return NextResponse.json({
                success: true,
                message: 'Permissions retrieved successfully',
                data: result.rows
            });
        } catch (sqlError) {
            console.error('Final SQL fallback failed:', sqlError);

            return NextResponse.json({
                success: false,
                message: 'Failed to retrieve permissions',
                error: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
        }
    }
} 