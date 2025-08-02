import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || !decoded.sub) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { ids } = await request.json();
        
        if (!Array.isArray(ids)) {
            return NextResponse.json({ error: 'Invalid input: ids must be an array' }, { status: 400 });
        }

        const customers = await prisma.customer.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            select: {
                id: true,
                name: true
            }
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error('Error fetching customer names by IDs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}