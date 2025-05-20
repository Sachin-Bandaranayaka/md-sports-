import { NextRequest, NextResponse } from 'next/server';
import { Quotation, Customer, QuotationItem, Product } from '@/lib/models';
import { Op } from 'sequelize';

// GET /api/quotations - Get all quotations
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const customerId = searchParams.get('customerId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build the where clause
        const whereClause: any = {};

        if (search) {
            whereClause.quotationNumber = { [Op.iLike]: `%${search}%` };
        }

        if (status) {
            whereClause.status = status;
        }

        if (customerId) {
            whereClause.customerId = customerId;
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

        const quotations = await Quotation.findAll({
            where: whereClause,
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: QuotationItem,
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

        return NextResponse.json(quotations);
    } catch (error) {
        console.error('Error fetching quotations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quotations' },
            { status: 500 }
        );
    }
}

// POST /api/quotations - Create a new quotation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Generate an ID if not provided
        if (!body.id) {
            body.id = `QUO${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        }

        // Extract items from the request
        const { items, ...quotationData } = body;

        // Create the quotation
        const quotation = await Quotation.create(quotationData);

        // Create the quotation items
        if (items && Array.isArray(items)) {
            for (const item of items) {
                await QuotationItem.create({
                    ...item,
                    quotationId: quotation.id
                });
            }
        }

        // Fetch the complete quotation with items
        const completeQuotation = await Quotation.findByPk(quotation.id, {
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: QuotationItem,
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

        return NextResponse.json(completeQuotation, { status: 201 });
    } catch (error) {
        console.error('Error creating quotation:', error);
        return NextResponse.json(
            { error: 'Failed to create quotation' },
            { status: 500 }
        );
    }
} 