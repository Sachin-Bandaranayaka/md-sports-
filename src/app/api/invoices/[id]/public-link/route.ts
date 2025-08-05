import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { randomBytes } from 'crypto';

// Extended Invoice type with public link fields
interface InvoiceWithPublicFields {
  id: number;
  publicToken?: string | null;
  publicTokenExpiresAt?: Date | null;
  publicViewCount?: number | null;
  publicLastViewedAt?: Date | null;
}

// Generate a secure random token
function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

// Generate public link for an invoice
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = parseInt(params.id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Check if invoice exists and user has permission
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        OR: [
          { createdBy: session.user.id },
          { customer: { createdBy: session.user.id } },
        ],
      },
    }) as any; // Type assertion to handle missing fields

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Generate new token and set expiry (60 days from now)
    const newToken = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    // Update invoice with new public token
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        publicToken: newToken,
        publicTokenExpiresAt: expiresAt,
        publicViewCount: 0, // Reset view count
        publicLastViewedAt: null, // Reset last viewed
      } as any, // Type assertion to handle missing fields
    });

    // Generate the public URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3001';
    const publicUrl = `${baseUrl}/public/invoice/${newToken}`;

    return NextResponse.json({
      success: true,
      publicUrl,
      token: newToken,
      expiresAt: expiresAt.toISOString(),
      message: invoice?.publicToken 
        ? 'Public link regenerated successfully. Previous link has been invalidated.'
        : 'Public link generated successfully.',
    });
  } catch (error) {
    console.error('Error generating public link:', error);
    return NextResponse.json(
      { error: 'Failed to generate public link' },
      { status: 500 }
    );
  }
}

// Get existing public link info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = parseInt(params.id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Check if invoice exists and user has permission
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        OR: [
          { createdBy: session.user.id },
          { customer: { createdBy: session.user.id } },
        ],
      },
    }) as any; // Type assertion to handle missing fields

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (!invoice?.publicToken) {
      return NextResponse.json({
        hasPublicLink: false,
        message: 'No public link exists for this invoice',
      });
    }

    // Check if token has expired
    const isExpired = invoice.publicTokenExpiresAt && new Date() > invoice.publicTokenExpiresAt;
    
    if (isExpired) {
      return NextResponse.json({
        hasPublicLink: false,
        isExpired: true,
        message: 'Public link has expired',
      });
    }

    // Generate the public URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3001';
    const publicUrl = `${baseUrl}/public/invoice/${invoice.publicToken}`;

    return NextResponse.json({
      hasPublicLink: true,
      publicUrl,
      token: invoice.publicToken,
      expiresAt: invoice.publicTokenExpiresAt?.toISOString(),
      viewCount: invoice.publicViewCount || 0,
      lastViewedAt: invoice.publicLastViewedAt?.toISOString(),
      isExpired: false,
    });
  } catch (error) {
    console.error('Error fetching public link info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public link info' },
      { status: 500 }
    );
  }
}

// Delete/revoke public link
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = parseInt(params.id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Check if invoice exists and user has permission
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        OR: [
          { createdBy: session.user.id },
          { customer: { createdBy: session.user.id } },
        ],
      },
    }) as any; // Type assertion to handle missing fields

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (!invoice?.publicToken) {
      return NextResponse.json(
        { error: 'No public link exists for this invoice' },
        { status: 400 }
      );
    }

    // Remove public token and related fields
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        publicToken: null,
        publicTokenExpiresAt: null,
        publicViewCount: 0,
        publicLastViewedAt: null,
      } as any, // Type assertion to handle missing fields
    });

    return NextResponse.json({
      success: true,
      message: 'Public link revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking public link:', error);
    return NextResponse.json(
      { error: 'Failed to revoke public link' },
      { status: 500 }
    );
  }
}