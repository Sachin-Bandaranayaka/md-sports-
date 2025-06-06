import { Suspense } from 'react';
import { headers } from 'next/headers';
import MainLayout from '@/components/layout/MainLayout';
import PurchaseListClient from '@/components/purchases/PurchaseListClient';
import { PurchaseInvoice, Supplier } from '@/types'; // Ensure types are available

// Reduce revalidation time from 60 to 10 seconds for faster updates
export const revalidate = 10;

const ITEMS_PER_PAGE = 10; // Define how many items per page

async function fetchPurchaseInvoices(baseUrl: string, page: number, limit: number, search?: string, status?: string, supplierId?: string, startDate?: string, endDate?: string): Promise<{ invoices: PurchaseInvoice[], totalPages: number, currentPage: number }> {
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    if (supplierId) queryParams.append('supplierId', supplierId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    try {
        // Add timestamp to bust cache and ensure fresh data
        queryParams.append('_t', Date.now().toString());

        const response = await fetch(`${baseUrl}/api/purchases?${queryParams.toString()}`, {
            cache: 'no-store', // Never cache this request
            next: { revalidate: 0 } // Force revalidation on each request
        });

        if (!response.ok) {
            console.error('Failed to fetch purchase invoices:', response.status, await response.text());
            return { invoices: [], totalPages: 0, currentPage: page };
        }
        const responseData = await response.json(); // Renamed to responseData to avoid conflict

        // Assuming API returns { data: PurchaseInvoice[], pagination: { total: number, page: number, limit: number, totalPages: number } }
        const invoices = responseData.data || [];
        const pagination = responseData.pagination || { total: 0, page: page, limit: limit, totalPages: 0 };

        return {
            invoices: invoices,
            totalPages: pagination.totalPages,
            currentPage: pagination.page
        };

    } catch (error) {
        console.error('Error fetching purchase invoices:', error);
        return { invoices: [], totalPages: 0, currentPage: page };
    }
}

async function fetchSuppliers(baseUrl: string): Promise<Supplier[]> {
    try {
        const response = await fetch(`${baseUrl}/api/suppliers`, {
            next: { revalidate: 60, tags: ['suppliers'] }, // Cache suppliers for 1 minute with tags
            cache: 'force-cache'
        });
        if (!response.ok) {
            console.error('Failed to fetch suppliers:', response.status, await response.text());
            return [];
        }
        const data = await response.json();
        return data.success ? data.data : (Array.isArray(data) ? data : []); // API might return array directly or { success: true, data: [] }
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return [];
    }
}

export default async function PurchasesPage({
    searchParams: passedSearchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const searchParams = await passedSearchParams;

    const page = parseInt(searchParams?.page as string || '1');
    const limit = ITEMS_PER_PAGE;
    const searchTerm = searchParams?.search as string || '';
    const statusFilter = searchParams?.status as string || '';
    const supplierFilter = searchParams?.supplierId as string || '';
    const startDateFilter = searchParams?.startDate as string || '';
    const endDateFilter = searchParams?.endDate as string || '';

    // Fetch data in parallel
    const [invoicesData, suppliers] = await Promise.all([
        fetchPurchaseInvoices(baseUrl, page, limit, searchTerm, statusFilter, supplierFilter, startDateFilter, endDateFilter),
        fetchSuppliers(baseUrl)
    ]);

    return (
        <MainLayout>
            <Suspense fallback={<div className="text-center p-8">Loading purchase invoices...</div>}>
                <PurchaseListClient
                    initialPurchaseInvoices={invoicesData.invoices}
                    initialSuppliers={suppliers}
                    initialTotalPages={invoicesData.totalPages}
                    initialCurrentPage={invoicesData.currentPage}
                />
            </Suspense>
        </MainLayout>
    );
}