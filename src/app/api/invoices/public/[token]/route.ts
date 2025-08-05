import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    // Update view count and last viewed timestamp
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        publicViewCount: (invoice.publicViewCount || 0) + 1,
        publicLastViewedAt: new Date(),
      },
    });

    // Return invoice data without sensitive information
    const publicInvoiceData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      discountType: invoice.discountType,
      discountValue: invoice.discountValue,
      status: invoice.status,
      createdAt: invoice.createdAt,
      paymentMethod: invoice.paymentMethod,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      customer: invoice.customer ? {
        name: invoice.customer.name,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
        address: invoice.customer.address,
      } : null,
      shop: invoice.shop ? {
        name: invoice.shop.name,
        location: invoice.shop.location,
        address_line1: invoice.shop.address_line1,
        address_line2: invoice.shop.address_line2,
        city: invoice.shop.city,
        postal_code: invoice.shop.postal_code,
        phone: invoice.shop.phone,
        email: invoice.shop.email,
      } : null,
      items: invoice.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        product: {
          name: item.product.name,
          description: item.product.description,
        },
      })),
      createdBy: invoice.createdByUser?.name,
    };

    return NextResponse.json(publicInvoiceData);
  } catch (error) {
    console.error('Error fetching public invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}