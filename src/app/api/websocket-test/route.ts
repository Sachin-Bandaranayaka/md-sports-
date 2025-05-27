import { NextRequest, NextResponse } from 'next/server';
import { getSocketIO, WEBSOCKET_EVENTS } from '@/lib/websocket';

export async function GET(req: NextRequest) {
    const io = getSocketIO();

    if (!io) {
        return NextResponse.json({
            success: false,
            message: 'WebSocket server not initialized'
        }, { status: 500 });
    }

    // Get the event type from the query params
    const searchParams = req.nextUrl.searchParams;
    const eventType = searchParams.get('event') || 'dashboard';

    // Create test data based on event type
    let eventName: string;
    let testData: any;

    switch (eventType) {
        case 'inventory':
            eventName = WEBSOCKET_EVENTS.INVENTORY_UPDATE;
            testData = {
                type: 'full_update',
                items: [
                    {
                        id: 1,
                        name: 'Test Product',
                        sku: 'TEST-001',
                        category: 'Test Category',
                        stock: 100,
                        retailPrice: 25.99,
                        weightedAverageCost: 15.50,
                        status: 'In Stock',
                        branchStock: [
                            { shopId: 1, shopName: 'Main Store', quantity: 50 },
                            { shopId: 2, shopName: 'Branch Store', quantity: 50 }
                        ]
                    }
                ],
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            };
            break;

        case 'invoice':
            eventName = WEBSOCKET_EVENTS.INVOICE_UPDATE;
            testData = {
                type: 'full_update',
                invoices: [
                    {
                        id: 1,
                        invoiceNumber: 'INV-001',
                        customerId: 1,
                        customerName: 'Test Customer',
                        total: 500,
                        status: 'Paid',
                        paymentMethod: 'Cash',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        date: new Date().toISOString().split('T')[0],
                        dueDate: new Date().toISOString().split('T')[0],
                        itemCount: 5
                    }
                ]
            };
            break;

        case 'customer':
            eventName = WEBSOCKET_EVENTS.CUSTOMER_UPDATE;
            testData = {
                type: 'full_update',
                customers: [
                    {
                        id: 1,
                        name: 'Test Customer',
                        email: 'test@example.com',
                        phone: '123-456-7890',
                        address: '123 Test St',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        type: 'Credit',
                        balance: 1000,
                        status: 'Active'
                    }
                ]
            };
            break;

        case 'purchase':
            eventName = WEBSOCKET_EVENTS.PURCHASE_UPDATE;
            testData = {
                type: 'full_update',
                purchases: [
                    {
                        id: 1,
                        invoiceNumber: 'PO-001',
                        supplierId: 1,
                        supplierName: 'Test Supplier',
                        total: 1000,
                        status: 'Received',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                ]
            };
            break;

        default:
            eventName = WEBSOCKET_EVENTS.DASHBOARD_UPDATE;
            testData = {
                summaryData: [
                    { title: 'Total Inventory Value', value: 'Rs. 1,500,000', icon: 'Package', trend: '+8%', trendUp: true },
                    { title: 'Pending Transfers', value: '15', icon: 'Truck', trend: '+3', trendUp: true },
                    { title: 'Outstanding Invoices', value: 'Rs. 350,000', icon: 'CreditCard', trend: '-5%', trendUp: false },
                    { title: 'Low Stock Items', value: '22', icon: 'AlertTriangle', trend: '-6', trendUp: true }
                ]
            };
            break;
    }

    // Emit the test event
    io.emit(eventName, testData);

    return NextResponse.json({
        success: true,
        message: `Test ${eventType} event emitted successfully`,
        eventName,
        data: testData
    });
} 