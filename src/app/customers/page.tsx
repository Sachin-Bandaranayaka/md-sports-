// @ts-nocheck
import MainLayout from '@/components/layout/MainLayout';
import { prisma } from '@/lib/prisma';
import CustomerClientWrapper from './components/CustomerClientWrapper';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Add revalidation - cache customers page for 60 seconds
export const revalidate = 60;

// Interface for Customer (can be shared or defined in a common types file)
interface Customer {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    due?: number;
    customerType: 'wholesale' | 'retail';
    creditLimit?: number | null;
    creditPeriod?: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastPurchaseDate?: Date | null;
    latestInvoicePaymentStatus?: string | null;
    balance?: number;
    contactPerson?: string;
}

const ITEMS_PER_PAGE = 15;

async function fetchCustomersData(
    pageParam: string | undefined,
    searchTermParam: string | undefined,
    customerTypeParam: string | undefined,
    customerStatusParam: string | undefined,
    balanceMinParam: string | undefined,
    balanceMaxParam: string | undefined,
    lastPurchaseFromParam: string | undefined,
    lastPurchaseToParam: string | undefined
) {
    const page = parseInt(pageParam || '1', 10);
    const searchTerm = searchTermParam || '';
    const customerType = customerTypeParam || '';
    const customerStatus = customerStatusParam || '';
    const balanceMin = parseFloat(balanceMinParam as string); // parseFloat handles undefined/empty as NaN
    const balanceMax = parseFloat(balanceMaxParam as string);
    const lastPurchaseFrom = lastPurchaseFromParam || '';
    const lastPurchaseTo = lastPurchaseToParam || '';

    let whereClause: any = {
        OR: searchTerm ? [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
        ] : undefined,
    };

    if (searchTerm && searchTerm.toLowerCase().startsWith('cus-')) {
        const numericId = parseInt(searchTerm.substring(4), 10);
        if (!isNaN(numericId)) {
            if (whereClause.OR) {
                whereClause.OR.push({ id: numericId });
            } else {
                whereClause.OR = [{ id: numericId }];
            }
        }
    }

    try {
        // Add soft delete filter to where clause
        whereClause.isDeleted = false;

        const customersFromDB = await prisma.customer.findMany({
            where: whereClause,
            include: {
                invoices: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1,
                    select: {
                        createdAt: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * ITEMS_PER_PAGE,
            take: ITEMS_PER_PAGE,
        });

        const totalCustomers = await prisma.customer.count({ where: whereClause });

        // Calculate due amounts per customer
        const customerIds = customersFromDB.map(c => c.id);

        const invoicesWithPayments = await prisma.invoice.findMany({
            where: {
                customerId: { in: customerIds },
                status: { in: ['unpaid', 'partial', 'pending'] }
            },
            select: {
                customerId: true,
                total: true,
                payments: {
                    select: {
                        amount: true
                    }
                }
            }
        });

        const dueMap: Record<number, number> = {};
        invoicesWithPayments.forEach(inv => {
            const cid = inv.customerId as number;
            const paid = inv.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const due = (inv.total || 0) - paid;
            dueMap[cid] = (dueMap[cid] || 0) + due;
        });

        const formattedCustomers = customersFromDB.map(customer => {
            let displayAddress = 'N/A';
            if (customer.address) {
                try {
                    const parsedAddress = JSON.parse(customer.address);
                    // Check if it's the old structure with mainAddress
                    if (parsedAddress && typeof parsedAddress === 'object' && parsedAddress.mainAddress) {
                        displayAddress = parsedAddress.mainAddress;
                        if (parsedAddress.city) {
                            displayAddress += `, ${parsedAddress.city}`;
                        }
                    } else if (typeof parsedAddress === 'string') {
                        // If parsing results in a string, use that (e.g. if db stores "'Some Address String'" including quotes)
                        displayAddress = parsedAddress;
                    } else {
                        // It was parsable JSON but not the expected old structure, and not a simple string post-parsing.
                        // Fallback to the raw string if it doesn't look like typical JSON, otherwise mark as needing review or use a generic placeholder.
                        displayAddress = customer.address.trim().startsWith('{') && customer.address.trim().endsWith('}') ? 'Address data needs review' : customer.address;
                    }
                } catch (e) {
                    // Parsing failed, assume it's a plain text address (new records or already migrated)
                    displayAddress = customer.address;
                }
            }

            const latestInvoice = customer.invoices && customer.invoices[0];

            const uiCustomer: Customer = {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: displayAddress,
                customerType: customer.customerType as 'wholesale' | 'retail',
                creditLimit: customer.creditLimit,
                creditPeriod: customer.creditPeriod,
                isActive: customer.isActive,
                createdAt: customer.createdAt,
                updatedAt: customer.updatedAt,
                lastPurchaseDate: latestInvoice ? latestInvoice.createdAt : null,
                latestInvoicePaymentStatus: latestInvoice ? latestInvoice.status : null,
                balance: customer.customerType === 'wholesale' ? customer.creditLimit || 0 : undefined,
                contactPerson: customer.name,
                due: dueMap[customer.id] || 0,
            };
            return uiCustomer;
        });

        let postFilteredCustomers = formattedCustomers;
        if (customerType) {
            postFilteredCustomers = postFilteredCustomers.filter(c => c.customerType.toLowerCase() === customerType.toLowerCase());
        }
        if (customerStatus) {
            if (customerStatus.toLowerCase() === 'paid' || customerStatus.toLowerCase() === 'unpaid' || customerStatus.toLowerCase() === 'pending' || customerStatus.toLowerCase() === 'partial') {
                postFilteredCustomers = postFilteredCustomers.filter(c => c.latestInvoicePaymentStatus?.toLowerCase() === customerStatus.toLowerCase());
            } else if (customerStatus === 'Active' || customerStatus === 'Inactive') {
                postFilteredCustomers = postFilteredCustomers.filter(c => c.isActive === (customerStatus === 'Active'));
            }
        }
        if (!isNaN(balanceMin)) {
            postFilteredCustomers = postFilteredCustomers.filter(c => c.customerType === 'wholesale' && (c.balance || 0) >= balanceMin);
        }
        if (!isNaN(balanceMax)) {
            postFilteredCustomers = postFilteredCustomers.filter(c => c.customerType === 'wholesale' && (c.balance || 0) <= balanceMax);
        }
        if (lastPurchaseFrom) {
            postFilteredCustomers = postFilteredCustomers.filter(c => c.lastPurchaseDate && new Date(c.lastPurchaseDate) >= new Date(lastPurchaseFrom));
        }
        if (lastPurchaseTo) {
            postFilteredCustomers = postFilteredCustomers.filter(c => c.lastPurchaseDate && new Date(c.lastPurchaseDate) <= new Date(lastPurchaseTo));
        }

        return {
            customers: postFilteredCustomers,
            totalPages: Math.ceil(totalCustomers / ITEMS_PER_PAGE),
            currentPage: page,
        };

    } catch (error) {
        console.error('Error fetching customers:', error);
        return {
            customers: [],
            totalPages: 0,
            currentPage: 1,
            error: 'Failed to fetch customers'
        };
    }
}

export default async function CustomersPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
    const page = searchParams?.page as string | undefined;
    const search = searchParams?.search as string | undefined;
    const customerType = searchParams?.type as string | undefined;
    const status = searchParams?.status as string | undefined;
    const balanceMin = searchParams?.balanceMin as string | undefined;
    const balanceMax = searchParams?.balanceMax as string | undefined;
    const lastPurchaseFrom = searchParams?.lastPurchaseFrom as string | undefined;
    const lastPurchaseTo = searchParams?.lastPurchaseTo as string | undefined;

    const { customers, totalPages, currentPage, error } = await fetchCustomersData(
        page,
        search,
        customerType,
        status,
        balanceMin,
        balanceMax,
        lastPurchaseFrom,
        lastPurchaseTo
    );

    if (error) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-8">
                    <p className="text-red-500">{error}</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-indigo-600" size={48} />
                        <p className="ml-3 text-lg text-gray-600">Loading customers...</p>
                    </div>
                }>
                    <CustomerClientWrapper
                        initialCustomers={customers}
                        initialTotalPages={totalPages}
                        initialCurrentPage={currentPage}
                    />
                </Suspense>
            </div>
        </MainLayout>
    );
}