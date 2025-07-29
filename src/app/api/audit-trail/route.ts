import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { auditService } from '@/services/auditService';
import { revalidateTag } from 'next/cache';

// GET /api/audit-trail - Get audit trail entries
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || undefined;
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') || 'all'; // 'all', 'deleted', 'history'
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (type === 'deleted') {
      // Get recycle bin items
      const result = await auditService.getRecycleBinItems(
        entity,
        limit,
        offset,
        dateFrom,
        dateTo
      );
      return NextResponse.json(result);
    } else if (type === 'history' && entity && entityId) {
        // Get entity history
        const history = await auditService.getEntityHistory(
          entity,
          parseInt(entityId),
          limit,
          dateFrom,
          dateTo
        );
        return NextResponse.json({ items: history, total: history.length });
    } else {
        // Get all audit entries
        const result = await auditService.getAuditEntries(
          entity,
          limit,
          offset,
          dateFrom,
          dateTo
        );
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