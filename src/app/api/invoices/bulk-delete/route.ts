import { NextRequest, NextResponse } from 'next/server';
import { validateTokenPermission } from '@/lib/auth';
import { deleteInvoice } from '@/services/invoiceService';

export async function POST(request: NextRequest) {
  try {
    const authDelete = await validateTokenPermission(request, 'sales:delete');
    const authManage = await validateTokenPermission(request, 'invoice:manage');

    if (!authDelete.isValid && !authManage.isValid) {
      return NextResponse.json({
        success: false,
        message: "Permission denied. Requires 'sales:delete' or 'invoice:manage'.",
      }, { status: 403 });
    }

    const body = await request.json();
    const ids: unknown = body?.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ids[] array is required' },
        { status: 400 },
      );
    }

    const numericIds: number[] = ids
      .map((id: any) => parseInt(id, 10))
      .filter((n) => !isNaN(n));

    if (numericIds.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid numeric IDs provided' }, { status: 400 });
    }

    const results: { id: number; success: boolean; error?: string }[] = [];

    for (const id of numericIds) {
      try {
        await deleteInvoice(id);
        results.push({ id, success: true });
      } catch (err: any) {
        console.error(`Bulk delete error for invoice ${id}:`, err);
        results.push({ id, success: false, error: err.message || 'unknown error' });
      }
    }

    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      success: failed.length === 0,
      deleted: results.filter((r) => r.success).map((r) => r.id),
      failed,
    });
  } catch (error) {
    console.error('Bulk invoice delete error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error: String(error) }, { status: 500 });
  }
} 