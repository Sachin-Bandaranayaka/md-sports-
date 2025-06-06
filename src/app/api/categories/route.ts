import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token: signature verification failed' }, { status: 401 });
        }

        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        return NextResponse.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch categories',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}