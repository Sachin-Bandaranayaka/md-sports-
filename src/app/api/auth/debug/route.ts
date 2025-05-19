import { NextRequest, NextResponse } from 'next/server';
import { testConnection, query } from '@/lib/dbConnection';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password } = body;

        // Test database connection
        const connected = await testConnection();
        if (!connected) {
            return NextResponse.json({
                success: false,
                message: 'Database connection failed',
                stage: 'connection'
            });
        }

        // Try to find the user directly with pg
        let user = null;
        try {
            const result = await query(
                'SELECT id, username, "passwordHash", "fullName", "isActive" FROM users WHERE username = $1',
                [username]
            );

            if (result.rows.length > 0) {
                user = result.rows[0];
            }
        } catch (error) {
            return NextResponse.json({
                success: false,
                message: `User query error: ${(error as Error).message}`,
                stage: 'user-query',
                error: (error as Error).toString()
            });
        }

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found',
                stage: 'user-check',
                providedUsername: username
            });
        }

        // Return debug info
        return NextResponse.json({
            success: true,
            message: 'Debug info',
            databaseConnected: connected,
            userExists: !!user,
            userInfo: {
                id: user.id,
                username: user.username,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json({
            success: false,
            message: 'Debug error',
            error: (error as Error).toString()
        }, { status: 500 });
    }
} 