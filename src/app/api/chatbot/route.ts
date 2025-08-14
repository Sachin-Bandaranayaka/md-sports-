import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { getUserIdFromToken, validateTokenPermission } from '@/lib/auth';

// Get business context from settings
async function getBusinessContext() {
    try {
        const contextSetting = await prisma.systemSettings.findUnique({
            where: { key: 'ai_business_context' }
        });
        return contextSetting?.value || 'You are an AI assistant for MS Sports.'; // Simplified default
    } catch (error) {
        console.error('[Chatbot API] Error fetching business context:', error);
        return 'You are an AI assistant for MS Sports.'; // Fallback default
    }
}

// Check if chatbot is enabled
async function isChatbotEnabled() {
    try {
        const enabledSetting = await prisma.systemSettings.findUnique({
            where: { key: 'ai_chatbot_enabled' }
        });
        return enabledSetting ? enabledSetting.value === 'true' : true;
    } catch (error) {
        console.error('[Chatbot API] Error checking if chatbot is enabled:', error);
        return true;
    }
}

// Function definitions for the AI to call
const CHATBOT_FUNCTIONS = [
    {
        name: "get_sales_data",
        description: "Get sales data including today's sales, daily/monthly totals, sales by status (paid, pending, partial)",
        parameters: {
            type: "object",
            properties: {
                date: { type: "string", description: "Date in YYYY-MM-DD format (optional, defaults to today)" },
                shop_id: { type: "string", description: "Specific shop ID to filter by (optional)" },
                period: { type: "string", enum: ["today", "week", "month", "year"], description: "Time period to analyze" }
            }
        }
    },
    {
        name: "get_inventory_data",
        description: "Get inventory information including stock levels, low stock items, product details",
        parameters: {
            type: "object",
            properties: {
                shop_id: { type: "string", description: "Specific shop ID to filter by (optional)" },
                low_stock_only: { type: "boolean", description: "Show only low stock items" },
                product_name: { type: "string", description: "Search for specific product by name" }
            }
        }
    },
    {
        name: "get_purchase_data",
        description: "Get purchase invoice data, supplier information, and purchase trends",
        parameters: {
            type: "object",
            properties: {
                date: { type: "string", description: "Date in YYYY-MM-DD format (optional, defaults to today)" },
                supplier_id: { type: "number", description: "Specific supplier ID to filter by (optional)" },
                period: { type: "string", enum: ["today", "week", "month", "year"], description: "Time period to analyze" }
            }
        }
    },
    {
        name: "get_customer_data",
        description: "Get customer information, sales by customer, customer statistics",
        parameters: {
            type: "object",
            properties: {
                customer_id: { type: "number", description: "Specific customer ID (optional)" },
                limit: { type: "number", description: "Number of customers to return (default 10)" }
            }
        }
    },
    {
        name: "get_business_overview",
        description: "Get overall business performance, KPIs, and summary statistics",
        parameters: {
            type: "object",
            properties: {
                period: { type: "string", enum: ["today", "week", "month", "year"], description: "Time period for overview" }
            }
        }
    }
];

// Function implementations
async function executeChatbotFunction(functionName: string, args: any, userId: string, userShopId: string | null) {
    console.log(`[Chatbot] Executing function: ${functionName} with args:`, args);
    
    try {
        switch (functionName) {
            case "get_sales_data":
                return await getSalesData(args, userShopId);
            
            case "get_inventory_data":
                return await getInventoryData(args, userShopId);
            
            case "get_purchase_data":
                return await getPurchaseData(args, userShopId);
            
            case "get_customer_data":
                return await getCustomerData(args, userShopId);
            
            case "get_business_overview":
                return await getBusinessOverview(args, userShopId);
            
            default:
                return { error: `Unknown function: ${functionName}` };
        }
    } catch (error: any) {
        console.error(`[Chatbot] Error executing function ${functionName}:`, error);
        return { error: `Failed to execute ${functionName}: ${error.message}` };
    }
}

async function getSalesData(args: any, userShopId: string | null) {
    const { date, shop_id, period = "today" } = args;
    
    // Determine date range
    const targetDate = date ? new Date(date) : new Date();
    let startDate: Date, endDate: Date;
    
    switch (period) {
        case "week":
            startDate = new Date(targetDate);
            startDate.setDate(targetDate.getDate() - 7);
            endDate = targetDate;
            break;
        case "month":
            startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
            break;
        case "year":
            startDate = new Date(targetDate.getFullYear(), 0, 1);
            endDate = new Date(targetDate.getFullYear(), 11, 31);
            break;
        default: // today
            startDate = new Date(targetDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(targetDate);
            endDate.setHours(23, 59, 59, 999);
    }

    // Build where clause for shop filtering
    const shopFilter = shop_id ? { shopId: shop_id } : userShopId ? { shopId: userShopId } : {};

    // Get sales data
    const salesData = await prisma.invoice.groupBy({
        by: ['status'],
        where: {
            ...shopFilter,
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        _sum: {
            total: true,
            totalProfit: true
        },
        _count: {
            id: true
        }
    });

    // Get total across all statuses
    const totalSales = await prisma.invoice.aggregate({
        where: {
            ...shopFilter,
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        _sum: {
            total: true,
            totalProfit: true
        },
        _count: {
            id: true
        }
    });

    // Get top selling products
    const topProducts = await prisma.invoiceItem.groupBy({
        by: ['productId'],
        where: {
            invoice: {
                ...shopFilter,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        },
        _sum: {
            quantity: true,
            total: true
        },
        orderBy: {
            _sum: {
                total: 'desc'
            }
        },
        take: 5
    });

    // Get product names for top products
    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
    });

    const topProductsWithNames = topProducts.map(p => {
        const product = products.find(prod => prod.id === p.productId);
        return {
            productName: product?.name || 'Unknown',
            quantitySold: p._sum.quantity || 0,
            revenue: p._sum.total || 0
        };
    });

    return {
        period,
        dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        totalSales: totalSales._sum.total || 0,
        totalProfit: totalSales._sum.totalProfit || 0,
        totalInvoices: totalSales._count.id || 0,
        salesByStatus: salesData.map(s => ({
            status: s.status,
            amount: s._sum.total || 0,
            profit: s._sum.totalProfit || 0,
            count: s._count.id || 0
        })),
        topSellingProducts: topProductsWithNames,
        shopId: shop_id || userShopId || 'all'
    };
}

async function getInventoryData(args: any, userShopId: string | null) {
    const { shop_id, low_stock_only, product_name } = args;
    
    const shopFilter = shop_id ? { shopId: shop_id } : userShopId ? { shopId: userShopId } : {};
    
    let whereClause: any = {
        ...shopFilter
    };

    if (product_name) {
        whereClause.product = {
            name: {
                contains: product_name,
                mode: 'insensitive'
            }
        };
    }

    const inventory = await prisma.inventoryItem.findMany({
        where: whereClause,
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    price: true,
                    minStockLevel: true,
                    category: {
                        select: { name: true }
                    }
                }
            },
            shop: {
                select: { name: true, location: true }
            }
        },
        orderBy: { quantity: 'asc' }
    });

    // Filter for low stock if requested
    const filteredInventory = low_stock_only 
        ? inventory.filter(item => item.quantity <= (item.product.minStockLevel || 10))
        : inventory;

    // Calculate summary statistics
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.quantity <= (item.product.minStockLevel || 10)).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
    const outOfStockItems = inventory.filter(item => item.quantity === 0).length;

    return {
        summary: {
            totalItems,
            lowStockItems,
            outOfStockItems,
            totalInventoryValue: totalValue
        },
        items: filteredInventory.slice(0, 20).map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            sku: item.product.sku,
            currentStock: item.quantity,
            minStockLevel: item.product.minStockLevel || 10,
            isLowStock: item.quantity <= (item.product.minStockLevel || 10),
            isOutOfStock: item.quantity === 0,
            unitPrice: item.product.price,
            totalValue: item.quantity * item.product.price,
            category: item.product.category?.name,
            shop: item.shop?.name,
            shopLocation: item.shop?.location
        })),
        shopId: shop_id || userShopId || 'all'
    };
}

async function getPurchaseData(args: any, userShopId: string | null) {
    const { date, supplier_id, period = "today" } = args;
    
    // Determine date range (similar to sales data)
    const targetDate = date ? new Date(date) : new Date();
    let startDate: Date, endDate: Date;
    
    switch (period) {
        case "week":
            startDate = new Date(targetDate);
            startDate.setDate(targetDate.getDate() - 7);
            endDate = targetDate;
            break;
        case "month":
            startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
            break;
        case "year":
            startDate = new Date(targetDate.getFullYear(), 0, 1);
            endDate = new Date(targetDate.getFullYear(), 11, 31);
            break;
        default: // today
            startDate = new Date(targetDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(targetDate);
            endDate.setHours(23, 59, 59, 999);
    }

    let whereClause: any = {
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    };

    if (supplier_id) {
        whereClause.supplierId = supplier_id;
    }

    // Get purchase data
    const purchases = await prisma.purchaseInvoice.findMany({
        where: whereClause,
        include: {
            supplier: {
                select: { name: true }
            },
            items: {
                include: {
                    product: {
                        select: { name: true }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    // Get summary data
    const purchaseSummary = await prisma.purchaseInvoice.aggregate({
        where: whereClause,
        _sum: {
            total: true
        },
        _count: {
            id: true
        }
    });

    // Get supplier statistics
    const supplierStats = await prisma.purchaseInvoice.groupBy({
        by: ['supplierId'],
        where: whereClause,
        _sum: {
            total: true
        },
        _count: {
            id: true
        },
        orderBy: {
            _sum: {
                total: 'desc'
            }
        },
        take: 5
    });

    // Get supplier names
    const supplierIds = supplierStats.map(s => s.supplierId);
    const suppliers = await prisma.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true, name: true }
    });

    const topSuppliers = supplierStats.map(s => {
        const supplier = suppliers.find(sup => sup.id === s.supplierId);
        return {
            supplierName: supplier?.name || 'Unknown',
            totalPurchases: s._sum.total || 0,
            invoiceCount: s._count.id || 0
        };
    });

    return {
        period,
        dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        summary: {
            totalPurchases: purchaseSummary._sum.total || 0,
            totalInvoices: purchaseSummary._count.id || 0
        },
        topSuppliers,
        recentPurchases: purchases.map(p => ({
            invoiceNumber: p.invoiceNumber,
            supplier: p.supplier.name,
            total: p.total,
            status: p.status,
            date: p.createdAt.toISOString().split('T')[0],
            itemCount: p.items.length
        }))
    };
}

async function getCustomerData(args: any, userShopId: string | null) {
    const { customer_id, limit = 10 } = args;
    
    if (customer_id) {
        // Get specific customer details
        const customer = await prisma.customer.findUnique({
            where: { id: customer_id },
            include: {
                invoices: {
                    include: {
                        payments: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!customer) {
            return { error: "Customer not found" };
        }

        // Calculate customer statistics
        const totalSales = customer.invoices.reduce((sum, invoice) => sum + invoice.total, 0);
        const totalPaid = customer.invoices.reduce((sum, invoice) => 
            sum + invoice.payments.reduce((pSum, payment) => pSum + payment.amount, 0), 0);
        const outstandingAmount = totalSales - totalPaid;

        return {
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                creditLimit: customer.creditLimit,
                creditPeriod: customer.creditPeriod
            },
            statistics: {
                totalSales,
                totalPaid,
                outstandingAmount,
                totalInvoices: customer.invoices.length
            },
            recentInvoices: customer.invoices.map(invoice => ({
                invoiceNumber: invoice.invoiceNumber,
                total: invoice.total,
                status: invoice.status,
                date: invoice.createdAt.toISOString().split('T')[0],
                paidAmount: invoice.payments.reduce((sum, p) => sum + p.amount, 0)
            }))
        };
    } else {
        // Get top customers by sales
        const topCustomers = await prisma.customer.findMany({
            where: {
                isDeleted: false
            },
            include: {
                invoices: {
                    select: {
                        total: true
                    }
                }
            },
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        });

        return {
            customers: topCustomers.map(customer => {
                const totalSales = customer.invoices.reduce((sum, invoice) => sum + invoice.total, 0);
                return {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    totalSales,
                    invoiceCount: customer.invoices.length,
                    customerType: customer.customerType,
                    status: customer.status
                };
            })
        };
    }
}

async function getBusinessOverview(args: any, userShopId: string | null) {
    const { period = "today" } = args;
    
    // Determine date range
    const targetDate = new Date();
    let startDate: Date, endDate: Date;
    
    switch (period) {
        case "week":
            startDate = new Date(targetDate);
            startDate.setDate(targetDate.getDate() - 7);
            endDate = targetDate;
            break;
        case "month":
            startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
            break;
        case "year":
            startDate = new Date(targetDate.getFullYear(), 0, 1);
            endDate = new Date(targetDate.getFullYear(), 11, 31);
            break;
        default: // today
            startDate = new Date(targetDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(targetDate);
            endDate.setHours(23, 59, 59, 999);
    }

    const shopFilter = userShopId ? { shopId: userShopId } : {};

    // Get sales overview
    const salesOverview = await prisma.invoice.aggregate({
        where: {
            ...shopFilter,
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        _sum: {
            total: true,
            totalProfit: true
        },
        _count: {
            id: true
        }
    });

    // Get purchase overview
    const purchaseOverview = await prisma.purchaseInvoice.aggregate({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        _sum: {
            total: true
        },
        _count: {
            id: true
        }
    });

    // Get inventory overview
    const inventoryOverview = await prisma.inventoryItem.aggregate({
        where: shopFilter,
        _sum: {
            quantity: true
        },
        _count: {
            id: true
        }
    });

    // Get customer count
    const customerCount = await prisma.customer.count({
        where: {
            isDeleted: false
        }
    });

    // Get supplier count
    const supplierCount = await prisma.supplier.count({
        where: {
            status: 'active'
        }
    });

    // Get shop count (if admin)
    const shopCount = await prisma.shop.count({
        where: {
            is_active: true
        }
    });

    return {
        period,
        dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        sales: {
            totalRevenue: salesOverview._sum.total || 0,
            totalProfit: salesOverview._sum.totalProfit || 0,
            invoiceCount: salesOverview._count.id || 0
        },
        purchases: {
            totalSpent: purchaseOverview._sum.total || 0,
            invoiceCount: purchaseOverview._count.id || 0
        },
        inventory: {
            totalItems: inventoryOverview._count.id || 0,
            totalQuantity: inventoryOverview._sum.quantity || 0
        },
        entities: {
            customerCount,
            supplierCount,
            shopCount
        },
        shopId: userShopId || 'all'
    };
}

export async function POST(req: NextRequest) {
    console.log('[Chatbot API] Received POST request');
    try {
        const enabled = await isChatbotEnabled();
        if (!enabled) {
            console.log('[Chatbot API] Chatbot is disabled in settings.');
            return NextResponse.json(
                { error: 'AI chatbot is currently disabled. Please enable it in the AI Assistant settings.' },
                { status: 403 }
            );
        }

        const { messages } = await req.json();
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.log('[Chatbot API] Invalid messages format or empty messages array.');
            return NextResponse.json(
                { error: 'Messages are required, must be a non-empty array.' },
                { status: 400 }
            );
        }

        // Get user information for permissions and shop access
        const userId = await getUserIdFromToken(req);
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required to use the chatbot.' },
                { status: 401 }
            );
        }

        // Get user details including shop access
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                shopId: true,
                roleName: true,
                permissions: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found.' },
                { status: 401 }
            );
        }

        // Fetch API Key directly within the POST handler for each request
        console.log('[Chatbot API] Fetching Deepseek API key from database for this request...');
        const apiKeySetting = await prisma.systemSettings.findUnique({
            where: { key: 'deepseek_api_key' }
        });

        if (!apiKeySetting) {
            console.error('[Chatbot API] Deepseek API key setting not found in database for this request.');
            throw new Error('Deepseek API key setting not found. Please configure it in the AI Assistant settings.');
        }
        const apiKey = apiKeySetting.value;
        if (!apiKey || apiKey.trim() === '') {
            console.error('[Chatbot API] Deepseek API key is empty in database settings for this request.');
            throw new Error('Deepseek API key is empty. Please set a valid key in the AI Assistant settings.');
        }
        console.log(`[Chatbot API] API key for this request. Length: ${apiKey.length}.`);

        // Detect if the provided key is an OpenRouter key and set provider-specific configs
        const isOpenRouterKey = apiKey.startsWith('sk-or-');
        const baseURL = isOpenRouterKey ? 'https://openrouter.ai/api/v1' : 'https://api.deepseek.com';
        const model = isOpenRouterKey ? 'deepseek/deepseek-chat' : 'deepseek-chat';
        const defaultHeaders = isOpenRouterKey
            ? {
                  'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                  'X-Title': 'MS Sports'
              }
            : undefined;

        // Instantiate OpenAI client for this specific request
        const deepseekClient = new OpenAI({
            apiKey,
            baseURL,
            dangerouslyAllowBrowser: false,
            ...(defaultHeaders ? { defaultHeaders } as any : {}),
        });

        const businessContextContent = await getBusinessContext();
        const enhancedContext = `${businessContextContent}

You are an AI assistant for MS Sports with access to real-time business data. You can access:
- Sales data (invoices, payments, revenue, profit)
- Inventory information (stock levels, products, categories)
- Purchase data (supplier invoices, costs)
- Customer information and analytics
- Business performance metrics

You have access to the following functions to retrieve live data:
- get_sales_data: Get sales information for any time period
- get_inventory_data: Check stock levels and product information
- get_purchase_data: View purchase invoices and supplier data
- get_customer_data: Access customer details and sales history
- get_business_overview: Get comprehensive business performance metrics

User Info:
- User ID: ${user.id}
- Shop Access: ${user.shopId || 'All Shops'}
- Role: ${user.roleName || 'Standard User'}

When users ask about business data, use the appropriate functions to provide accurate, real-time information.`;

        const businessContext = { role: 'system', content: enhancedContext } as const;
        const finalMessages = [businessContext, ...messages];

        // Prepare tools for OpenRouter (tools/tool_choice) while keeping legacy functions for Deepseek direct
        const tools = CHATBOT_FUNCTIONS.map((fn) => ({
            type: 'function' as const,
            function: fn,
        }));

        console.log(`[Chatbot API] Sending ${finalMessages.length} messages to ${isOpenRouterKey ? 'OpenRouter (Deepseek model)' : 'Deepseek'} with function/tool calling enabled.`);

        const response = isOpenRouterKey
            ? await deepseekClient.chat.completions.create({
                  model,
                  messages: finalMessages as any,
                  temperature: 0.7,
                  max_tokens: 1000,
                  tools,
                  tool_choice: 'auto',
              })
            : await deepseekClient.chat.completions.create({
                  model,
                  messages: finalMessages as any,
                  temperature: 0.7,
                  max_tokens: 1000,
                  functions: CHATBOT_FUNCTIONS as any,
                  function_call: 'auto' as any,
              });

        const assistantMessage = response.choices[0].message as any;

        // Handle tool-based calls for OpenRouter
        if (isOpenRouterKey && assistantMessage?.tool_calls?.length) {
            const toolCalls = assistantMessage.tool_calls as Array<{
                id: string;
                type: 'function';
                function: { name: string; arguments: string };
            }>;

            console.log(`[Chatbot API] AI requested ${toolCalls.length} tool call(s).`);

            const toolResultsMessages = [] as Array<{
                role: 'tool';
                tool_call_id: string;
                content: string;
            }>;

            for (const toolCall of toolCalls) {
                const { id: toolCallId, function: fn } = toolCall;
                const functionName = fn.name;
                const functionArgs = (() => {
                    try {
                        return JSON.parse(fn.arguments || '{}');
                    } catch {
                        return {};
                    }
                })();

                const functionResult = await executeChatbotFunction(
                    functionName,
                    functionArgs,
                    user.id,
                    user.shopId
                );

                toolResultsMessages.push({
                    role: 'tool',
                    tool_call_id: toolCallId,
                    content: JSON.stringify(functionResult),
                });
            }

            const finalMessagesWithTools = [
                ...finalMessages,
                assistantMessage,
                ...toolResultsMessages,
            ];

            const finalResponse = await deepseekClient.chat.completions.create({
                model,
                messages: finalMessagesWithTools as any,
                temperature: 0.7,
                max_tokens: 1000,
            });

            console.log('[Chatbot API] Successfully received response from AI provider after tool call(s).');
            return NextResponse.json(finalResponse.choices[0].message);
        }

        // Legacy function_call path for Deepseek direct API
        if (!isOpenRouterKey && assistantMessage.function_call) {
            const functionName = assistantMessage.function_call.name;
            const functionArgs = JSON.parse(assistantMessage.function_call.arguments || '{}');
            
            console.log(`[Chatbot API] AI requested function call: ${functionName}`);
            
            // Execute the function
            const functionResult = await executeChatbotFunction(
                functionName,
                functionArgs,
                user.id,
                user.shopId
            );

            // Send the function result back to the AI (legacy role: 'function')
            const functionMessage = {
                role: 'function' as const,
                name: functionName,
                content: JSON.stringify(functionResult)
            };

            const finalMessagesWithFunction = [
                ...finalMessages,
                assistantMessage,
                functionMessage
            ];

            // Get the AI's response after processing the function result
            const finalResponse = await deepseekClient.chat.completions.create({
                model,
                messages: finalMessagesWithFunction as any,
                temperature: 0.7,
                max_tokens: 1000
            });

            console.log('[Chatbot API] Successfully received response from AI provider after function call.');
            return NextResponse.json(finalResponse.choices[0].message);
        }

        console.log('[Chatbot API] Successfully received response from AI provider.');
        return NextResponse.json(assistantMessage);

    } catch (error: any) {
        console.error('[Chatbot API] Error processing request:', error.message);
        // Provide a clearer hint if an OpenRouter key is used against Deepseek endpoint
        if (typeof error.message === 'string' && error.message.includes('Authentication') && error.message.includes('invalid')) {
            console.error('[Chatbot API] Hint: If you are using an OpenRouter key (starts with "sk-or-"), ensure the request is sent to OpenRouter baseURL.');
        }
        if (error.message.includes('API key') || error.message.includes('configure')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json(
            { error: `Failed to process chatbot request: ${error.message}` },
            { status: 500 }
        );
    }
}