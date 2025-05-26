import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
    try {
        // Define the headers for the Excel template
        const headers = [
            'Name',
            'SKU',
            'Description',
            'RetailPrice',
            'CostPrice',
            'Barcode',
            'CategoryName',
            'InitialQuantity',
            'ShopName'
        ];

        // Create a new workbook and a worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]); // array_of_arrays_to_sheet

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'ProductsTemplate');

        // Generate the Excel file buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Return the buffer as a downloadable file
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Disposition': 'attachment; filename="product_import_template.xlsx"',
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

    } catch (error) {
        console.error('Error generating product import template:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error generating product import template',
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
} 