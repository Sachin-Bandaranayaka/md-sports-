import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postalCode: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            location: true,
            phone: true,
            email: true,
            address_line1: true,
            address_line2: true,
            city: true,
            state: true,
            postal_code: true,
            country: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                sku: true,
              },
            },
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
        { error: 'Invoice link has expired' },
        { status: 410 }
      );
    }

    // Update view count and last viewed timestamp
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        publicViewCount: {
          increment: 1,
        },
        publicLastViewedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postalCode: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            location: true,
            phone: true,
            email: true,
            address_line1: true,
            address_line2: true,
            city: true,
            state: true,
            postal_code: true,
            country: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    // Return invoice data
    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error fetching public invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}