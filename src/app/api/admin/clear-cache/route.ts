import { NextRequest, NextResponse } from 'next/server';
import { validateTokenPermission } from '@/lib/auth';
import { cacheService } from '@/lib/cache';

export async function POST(request: NextRequest) {
    try {
        // Validate admin permissions
        const authResult = await validateTokenPermission(request, 'admin:all');
        if (!authResult.isValid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Clear invoice cache
        await cacheService.invalidateInvoices();
        
        // Also clear general cache patterns
        await cacheService.clear();
        
        console.log('✅ Cache cleared successfully via API');
        
        return NextResponse.json({ 
            success: true, 
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error clearing cache:', error);
        return NextResponse.json({ 
            error: 'Failed to clear cache',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}