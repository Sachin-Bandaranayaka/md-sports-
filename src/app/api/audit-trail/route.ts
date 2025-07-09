import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { auditService } from '@/services/auditService';
import { revalidateTag } from 'next/cache';

// GET /api/audit-trail - Get audit trail entries
export async function GET(request: NextRequest) {
  try {
    console.log('=== AUDIT TRAIL API DEBUG ===');
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'none');
    
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      console.log('No token found in Authorization header');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    console.log('Token extracted:', token.substring(0, 20) + '...');
    const decoded = await verifyToken(token);
    console.log('Token verification result:', decoded ? 'SUCCESS' : 'FAILED');
    
    if (!decoded || !decoded.sub) {
      console.log('Token validation failed - decoded:', decoded);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    console.log('Token validated successfully for user:', decoded.sub);

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || undefined;
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') || 'all'; // 'all', 'deleted', 'history'

    if (type === 'deleted') {
      // Get recycle bin items
      const result = await auditService.getRecycleBinItems(entity, limit, offset);
      return NextResponse.json(result);
    } else if (type === 'history' && entity && entityId) {
      // Get entity history
      const history = await auditService.getEntityHistory(
        entity,
        parseInt(entityId),
        limit
      );
      return NextResponse.json({ items: history, total: history.length });
    } else {
      // Get all audit entries
      const result = await auditService.getAuditEntries(entity, limit, offset);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit trail' },
      { status: 500 }
    );
  }
}