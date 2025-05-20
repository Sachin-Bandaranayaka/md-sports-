import { NextRequest, NextResponse } from 'next/server';
import { PurchaseInvoice, Supplier, PurchaseInvoiceItem, Product } from '@/lib/models';
import { Op } from 'sequelize';

// GET /api/purchases - Get all purchase invoices
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const supplierId = searchParams.get('supplierId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build the where clause
        const whereClause: any = {};

        if (search) {
            whereClause.invoiceNumber = { [Op.iLike]: `%${search}%` };
        }

        if (status) {
            whereClause.status = status;
        }

        if (supplierId) {
            whereClause.supplierId = supplierId;
        }

        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [startDate, endDate]
            };
        } else if (startDate) {
            whereClause.date = {
                [Op.gte]: startDate
            };
        } else if (endDate) {
            whereClause.date = {
                [Op.lte]: endDate
            };
        }

        const purchases = await PurchaseInvoice.findAll({
            where: whereClause,
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['id', 'name', 'contactPerson', 'email', 'phone']
                },
                {
                    model: PurchaseInvoiceItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'name', 'sku']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return NextResponse.json(purchases);
    } catch (error) {
        console.error('Error fetching purchase invoices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch purchase invoices' },
            { status: 500 }
        );
    }
}

// POST /api/purchases - Create a new purchase invoice
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Generate an ID if not provided
        if (!body.id) {
            body.id = `PI${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        }

        // Extract items from the request
        const { items, ...invoiceData } = body;

        // Create the purchase invoice
        const purchase = await PurchaseInvoice.create(invoiceData);

        // Create the purchase invoice items
        if (items && Array.isArray(items)) {
            for (const item of items) {
                await PurchaseInvoiceItem.create({
                    ...item,
                    purchaseInvoiceId: purchase.id
                });
            }
        }

        // Fetch the complete purchase with items
        const completeInvoice = await PurchaseInvoice.findByPk(purchase.id, {
            include: [
                {
                    model: Supplier,
                    as: 'supplier'
                },
                {
                    model: PurchaseInvoiceItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                }
            ]
        });

        // Update supplier's totalPurchases
        const supplier = await Supplier.findByPk(purchase.supplierId);
        if (supplier) {
            await supplier.update({
                totalPurchases: supplier.totalPurchases + purchase.total
            });
        }

        return NextResponse.json(completeInvoice, { status: 201 });
    } catch (error) {
        console.error('Error creating purchase invoice:', error);
        return NextResponse.json(
            { error: 'Failed to create purchase invoice' },
            { status: 500 }
        );
    }
} 