import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { auditService } from '@/services/auditService';
import { revalidateTag } from 'next/cache';

// POST /api/audit-trail/recover - Recover a deleted item
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { auditLogId } = await request.json();

    if (!auditLogId) {
      return NextResponse.json(
        { error: 'Audit log ID is required' },
        { status: 400 }
      );
    }

    const userId = decoded.sub as string;
    const result = await auditService.recoverItem(auditLogId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Revalidate relevant caches
    revalidateTag('products');
    revalidateTag('customers');
    revalidateTag('suppliers');
    revalidateTag('categories');
    revalidateTag('audit-trail');

    return NextResponse.json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('Error recovering item:', error);
    return NextResponse.json(
      { error: 'Failed to recover item' },
      { status: 500 }
    );
  }
}

// DELETE /api/audit-trail/recover - Permanently delete items
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { auditLogIds } = await request.json();

    if (!auditLogIds || !Array.isArray(auditLogIds)) {
      return NextResponse.json(
        { error: 'Audit log IDs array is required' },
        { status: 400 }
      );
    }

    await auditService.permanentlyDelete(auditLogIds);

    // Revalidate audit trail cache
    revalidateTag('audit-trail');

    return NextResponse.json({
      message: 'Items permanently deleted',
    });
  } catch (error) {
    console.error('Error permanently deleting items:', error);
    return NextResponse.json(
      { error: 'Failed to permanently delete items' },
      { status: 500 }
    );
  }
}