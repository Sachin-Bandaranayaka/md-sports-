import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface ProductRow {
    Name?: string;
    SKU?: string;
    Description?: string;
    RetailPrice?: number | string; // Can be string from Excel, needs parsing
    CostPrice?: number | string;   // Can be string from Excel, needs parsing
    Barcode?: string;
    CategoryName?: string;
    InitialQuantity?: number | string; // Can be string from Excel, needs parsing
    ShopName?: string;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ProductRow>(worksheet);

        if (!jsonData || jsonData.length === 0) {
            return NextResponse.json({ success: false, message: 'Excel file is empty or data could not be read.' }, { status: 400 });
        }

        const results: { row: number; success: boolean; message: string; productName?: string }[] = [];
        let successfullyImportedCount = 0;

        // Prepare a list of operations for the transaction
        const operations: any[] = [];
        const createdProductSKUs = new Set<string>(); // To track SKUs within the current batch for uniqueness

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowIndex = i + 2; // Excel row number (1-based, +1 for header)

            // --- Data Validation and Transformation ---
            const name = row.Name?.trim();
            if (!name) {
                results.push({ row: rowIndex, success: false, message: 'Product Name is required.' });
                continue;
            }

            let retailPrice = parseFloat(String(row.RetailPrice));
            if (isNaN(retailPrice) || retailPrice < 0) {
                results.push({ row: rowIndex, success: false, productName: name, message: 'Invalid or missing Retail Price. It must be a non-negative number.' });
                continue;
            }

            const sku = row.SKU?.trim() || null;
            if (sku) {
                if (createdProductSKUs.has(sku)) {
                    results.push({ row: rowIndex, success: false, productName: name, message: `SKU '${sku}' is duplicated within the import file.` });
                    continue;
                }
                const existingProductBySKU = await prisma.product.findUnique({ where: { sku } });
                if (existingProductBySKU) {
                    results.push({ row: rowIndex, success: false, productName: name, message: `SKU '${sku}' already exists in the database.` });
                    continue;
                }
                createdProductSKUs.add(sku);
            }


            const description = row.Description?.trim() || null;
            const costPrice = row.CostPrice !== undefined && String(row.CostPrice).trim() !== '' ? parseFloat(String(row.CostPrice)) : null;
            if (costPrice !== null && (isNaN(costPrice) || costPrice < 0)) {
                results.push({ row: rowIndex, success: false, productName: name, message: 'Cost Price, if provided, must be a non-negative number.' });
                continue;
            }
            const barcode = row.Barcode?.trim() || null;

            let categoryId: number | null = null;
            if (row.CategoryName?.trim()) {
                const category = await prisma.category.findFirst({ where: { name: row.CategoryName.trim() } });
                if (!category) {
                    results.push({ row: rowIndex, success: false, productName: name, message: `Category '${row.CategoryName.trim()}' not found.` });
                    continue;
                }
                categoryId = category.id;
            }

            const initialQuantity = row.InitialQuantity !== undefined && String(row.InitialQuantity).trim() !== '' ? parseInt(String(row.InitialQuantity), 10) : 0;
            if (isNaN(initialQuantity) || initialQuantity < 0) {
                results.push({ row: rowIndex, success: false, productName: name, message: 'Initial Quantity, if provided, must be a non-negative integer.' });
                continue;
            }

            let shopId: string | null = null;
            if (initialQuantity > 0) {
                if (!row.ShopName?.trim()) {
                    results.push({ row: rowIndex, success: false, productName: name, message: 'Shop Name is required when Initial Quantity is greater than 0. Either provide a valid shop name or set Initial Quantity to 0.' });
                    continue;
                }
                const shop = await prisma.shop.findFirst({ where: { name: row.ShopName.trim() } });
                if (!shop) {
                    // Get available shop names for better error message
                    const availableShops = await prisma.shop.findMany({ select: { name: true } });
                    const shopNames = availableShops.map(s => s.name).join(', ');
                    results.push({ row: rowIndex, success: false, productName: name, message: `Shop '${row.ShopName.trim()}' not found. Available shops: ${shopNames}` });
                    continue;
                }
                shopId = shop.id;
            }

            // --- Prepare Prisma Operations ---
            // Note: We can't use createMany with nested creates for InventoryItem easily if we need the productId.
            // So, we'll create product first, then inventory item if needed, all within the transaction.
            // This approach processes products one by one within the transaction for clarity.

            try {
                await prisma.$transaction(async (tx) => {
                    const newProduct = await tx.product.create({
                        data: {
                            name,
                            sku,
                            description,
                            price: retailPrice,
                            weightedAverageCost: costPrice,
                            barcode,
                            categoryId,
                            // shopId for Product model is not used here, assuming it's for something else
                        },
                    });

                    if (initialQuantity > 0 && shopId) {
                        await tx.inventoryItem.create({
                            data: {
                                productId: newProduct.id,
                                quantity: initialQuantity,
                                shopId: shopId,
                            },
                        });
                    }
                    results.push({ row: rowIndex, success: true, productName: name, message: 'Product imported successfully.' });
                    successfullyImportedCount++;
                });

            } catch (dbError: any) {
                console.error(`Error processing row ${rowIndex} (${name}):`, dbError);
                let message = 'Database error during import.';
                if (dbError.code === 'P2002' && dbError.meta?.target?.includes('sku')) { // Prisma unique constraint violation for SKU
                    message = `SKU '${sku}' already exists.`;
                }
                results.push({ row: rowIndex, success: false, productName: name, message });
            }
        }

        const totalRows = jsonData.length;
        let summaryMessage = `${successfullyImportedCount} out of ${totalRows} products imported successfully.`;
        if (successfullyImportedCount < totalRows) {
            summaryMessage += ' Please check the details for errors.';
        }

        // Invalidate inventory cache if any products were successfully imported
        if (successfullyImportedCount > 0) {
            const { cacheService } = await import('@/lib/cache');
            await cacheService.invalidateInventory();
        }

        return NextResponse.json({
            success: successfullyImportedCount > 0 || totalRows === 0, // Overall success if at least one or no rows
            message: summaryMessage,
            details: results,
        });

    } catch (error: any) {
        console.error('Bulk product import error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'An unexpected error occurred during bulk import.' },
            { status: 500 }
        );
    }
}