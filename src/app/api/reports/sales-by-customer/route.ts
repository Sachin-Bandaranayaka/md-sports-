import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status'); // 'all', 'paid', 'pending', 'partial'
    const shopId = searchParams.get('shopId');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Build where clause
    const whereClause: any = {};
    
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (shopId) {
      whereClause.shopId = shopId;
    }

    // Get invoices grouped by customer
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
        shop: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by customer and calculate totals
    const customerSummary = new Map();
    let grandTotal = 0;
    let totalInvoices = 0;

    invoices.forEach(invoice => {
      const customerId = invoice.customer?.id || 'walk-in';
      const customerName = invoice.customer?.name || 'Walk-in Customer';
      const customerEmail = invoice.customer?.email || '';
      const customerPhone = invoice.customer?.phone || '';

      if (!customerSummary.has(customerId)) {
        customerSummary.set(customerId, {
          customerId,
          customerName,
          customerEmail,
          customerPhone,
          totalAmount: 0,
          invoiceCount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          partialAmount: 0,
          invoices: [],
        });
      }

      const summary = customerSummary.get(customerId);
      summary.totalAmount += invoice.total;
      summary.invoiceCount += 1;
      
      // Track amounts by status
      if (invoice.status === 'paid') {
        summary.paidAmount += invoice.total;
      } else if (invoice.status === 'pending') {
        summary.pendingAmount += invoice.total;
      } else if (invoice.status === 'partial') {
        summary.partialAmount += invoice.total;
      }

      summary.invoices.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.createdAt,
        amount: invoice.total,
        status: invoice.status,
        shopName: invoice.shop?.name || 'Unknown Shop',
        itemCount: invoice.items.length,
      });

      grandTotal += invoice.total;
      totalInvoices += 1;
    });

    // Convert to array and sort by total amount
    const customerData = Array.from(customerSummary.values())
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Calculate additional metrics
    const averagePerCustomer = customerData.length > 0 ? grandTotal / customerData.length : 0;
    const averagePerInvoice = totalInvoices > 0 ? grandTotal / totalInvoices : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalCustomers: customerData.length,
        totalInvoices,
        grandTotal,
        averagePerCustomer,
        averagePerInvoice,
        dateRange: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time',
        },
        statusFilter: status || 'all',
      },
      customers: customerData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating sales by customer report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate sales by customer report' },
      { status: 500 }
    );
  }
}