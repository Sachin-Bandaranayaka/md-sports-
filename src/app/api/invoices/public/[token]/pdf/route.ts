import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateInvoicePDF } from '@/utils/pdfGenerator';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find invoice by public token
    const invoice = await prisma.invoice.findUnique({
      where: {
        publicToken: token,
      },
      include: {
        customer: true,
        shop: true,
        items: {
          include: {
            product: true,
          },
        },
        createdByUser: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (invoice.publicTokenExpiresAt && new Date() > invoice.publicTokenExpiresAt) {
      return NextResponse.json(
        { error: 'Public link has expired' },
        { status: 410 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Update view count (for PDF downloads)
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        publicViewCount: (invoice.publicViewCount || 0) + 1,
        publicLastViewedAt: new Date(),
      },
    });

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error generating public invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}