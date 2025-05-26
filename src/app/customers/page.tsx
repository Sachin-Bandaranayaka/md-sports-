import MainLayout from '@/components/layout/MainLayout';
import { prisma } from '@/lib/prisma';
import CustomerClientWrapper from './components/CustomerClientWrapper';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Interface for Customer (can be shared or defined in a common types file)
interface Customer {
    id: string | number;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null; // This will now be the formatted display address
    createdAt: Date;
    updatedAt: Date;
    lastPurchaseDate?: Date | null;
    // Custom fields for UI, derived from address or other logic
    type?: 'Credit' | 'Cash';
    balance?: number; // Only for Credit customers
    lastPurchase?: string | null; // Formatted date string
    status?: 'Active' | 'Inactive'; // Example: derived or default
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
        const customersFromDB = await prisma.customer.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * ITEMS_PER_PAGE,
            take: ITEMS_PER_PAGE,
        });

        const totalCustomers = await prisma.customer.count({ where: whereClause });

        const formattedCustomers = customersFromDB.map(customer => {
            let addressData: any = {};
            try {
                if (customer.address) {
                    addressData = JSON.parse(customer.address);
                }
            } catch (e) {
                console.error('Error parsing customer address data for customer ID ', customer.id, e);
                addressData = { paymentType: 'Cash', creditLimit: 0, contactPerson: null, mainAddress: null, city: null };
            }

            let displayAddress = 'N/A';
            const mainAddr = addressData.mainAddress || (addressData.address && typeof addressData.address === 'string' ? addressData.address : null); // Compatibility with potential 'address' field in JSON
            const cityAddr = addressData.city;

            if (mainAddr && cityAddr) {
                displayAddress = `${mainAddr}, ${cityAddr}`;
            } else if (mainAddr) {
                displayAddress = mainAddr;
            } else if (cityAddr) {
                displayAddress = cityAddr;
            }
            // If customer.address was just an empty JSON string like '{}' or 'null', displayAddress remains 'N/A'
            // If it was non-empty JSON but mainAddress and city are null/undefined, it also remains 'N/A'

            const uiCustomer: Customer = {
                ...customer, // original db fields
                id: customer.id.toString(),
                type: addressData.paymentType || 'Cash',
                balance: addressData.paymentType === 'Credit' ? (addressData.creditLimit || 0) : 0,
                lastPurchase: customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toISOString().split('T')[0] : null,
                status: 'Active', // Placeholder
                contactPerson: addressData.contactPerson || customer.name,
                address: displayAddress, // Override with formatted address
            };
            return uiCustomer;
        });

        let postFilteredCustomers = formattedCustomers;
        if (customerType) {
            postFilteredCustomers = postFilteredCustomers.filter(c => c.type?.toLowerCase() === customerType.toLowerCase());
        }
        if (customerStatus) {
            postFilteredCustomers = postFilteredCustomers.filter(c => c.status?.toLowerCase() === customerStatus.toLowerCase());
        }
        if (!isNaN(balanceMin)) {
            postFilteredCustomers = postFilteredCustomers.filter(c => c.type === 'Credit' && (c.balance || 0) >= balanceMin);
        }
        if (!isNaN(balanceMax)) {
            postFilteredCustomers = postFilteredCustomers.filter(c => c.type === 'Credit' && (c.balance || 0) <= balanceMax);
        }
        if (lastPurchaseFrom) {
            postFilteredCustomers = postFilteredCustomers.filter(c => c.lastPurchase && new Date(c.lastPurchase) >= new Date(lastPurchaseFrom));
        }
        if (lastPurchaseTo) {
            postFilteredCustomers = postFilteredCustomers.filter(c => c.lastPurchase && new Date(c.lastPurchase) <= new Date(lastPurchaseTo));
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
    const type = searchParams?.type as string | undefined;
    const status = searchParams?.status as string | undefined;
    const balanceMin = searchParams?.balanceMin as string | undefined;
    const balanceMax = searchParams?.balanceMax as string | undefined;
    const lastPurchaseFrom = searchParams?.lastPurchaseFrom as string | undefined;
    const lastPurchaseTo = searchParams?.lastPurchaseTo as string | undefined;

    const { customers, totalPages, currentPage, error } = await fetchCustomersData(
        page,
        search,
        type,
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