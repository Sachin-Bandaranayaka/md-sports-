import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatters';

// Interface definitions
interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
}

interface InvoiceItem {
    id: number;
    productId: number;
    invoiceId: number;
    quantity: number;
    price: number;
    total: number;
    product: Product;
}

interface Customer {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    contactPerson?: string | null;
    contactPersonPhone?: string | null;
}

interface Payment {
    id: number;
    invoiceId: number;
    customerId: number;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string | null;
    createdAt: string;
}

interface Shop {
    id: string;
    name: string;
    location: string;
    contact_person?: string | null;
    phone?: string | null;
    email?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
}

interface User {
    name: string;
}

interface Invoice {
    id: number;
    invoiceNumber: string;
    customerId: number;
    shopId?: string | null;
    total: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    publicViewCount?: number | null;
    publicLastViewedAt?: Date | null;
    customer: Customer;
    shop?: Shop | null;
    items: InvoiceItem[];
    payments?: Payment[];
    createdByUser?: User | null;
}

/**
 * Format date for display
 */
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Generate PDF for an invoice
 */
export const generateInvoicePDF = (invoice: Invoice): Buffer => {
    // Create a new PDF document
    const doc = new jsPDF();

    // Calculate totals
    const paidAmount = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const remainingBalance = invoice.total - paidAmount;

    // Generate due date (30 days after creation)
    const createdDate = new Date(invoice.createdAt);
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Set company info at the top
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${invoice.invoiceNumber}`, 20, 27);

    // Shop/Company details on the right
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const shopName = invoice.shop?.name || 'MD Sports';
    doc.text(shopName, 150, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    let shopYPos = 27;
    if (invoice.shop?.email) {
        doc.text(invoice.shop.email, 150, shopYPos, { align: 'right' });
        shopYPos += 7;
    }
    
    // Shop address
    if (invoice.shop?.address_line1) {
        doc.text(invoice.shop.address_line1, 150, shopYPos, { align: 'right' });
        shopYPos += 7;
    }
    
    if (invoice.shop?.address_line2) {
        doc.text(invoice.shop.address_line2, 150, shopYPos, { align: 'right' });
        shopYPos += 7;
    }
    
    if (invoice.shop?.city || invoice.shop?.postal_code) {
        const cityPostal = [invoice.shop?.city, invoice.shop?.postal_code].filter(Boolean).join(', ');
        if (cityPostal) {
            doc.text(cityPostal, 150, shopYPos, { align: 'right' });
            shopYPos += 7;
        }
    }
    
    if (invoice.shop?.state) {
        doc.text(invoice.shop.state, 150, shopYPos, { align: 'right' });
        shopYPos += 7;
    }
    
    if (invoice.shop?.phone) {
        doc.text(`Phone: ${invoice.shop.phone}`, 150, shopYPos, { align: 'right' });
        shopYPos += 7;
    }
    
    if (invoice.shop?.contact_person) {
        doc.text(`Contact: ${invoice.shop.contact_person}`, 150, shopYPos, { align: 'right' });
    }

    // Add a line separator
    doc.line(20, 48, 190, 48);

    // Add billing information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 60);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.customer.name, 20, 67);

    let billingYPos = 67;
    if (invoice.customer.address) {
        billingYPos += 7;
        doc.text(invoice.customer.address, 20, billingYPos);
    }

    if (invoice.customer.city && invoice.customer.postalCode) {
        billingYPos += 7;
        doc.text(`${invoice.customer.city}, ${invoice.customer.postalCode}`, 20, billingYPos);
    }

    if (invoice.customer.phone) {
        billingYPos += 7;
        doc.text(`Phone: ${invoice.customer.phone}`, 20, billingYPos);
    }

    if (invoice.customer.email) {
        billingYPos += 7;
        doc.text(`Email: ${invoice.customer.email}`, 20, billingYPos);
    }

    // Add invoice details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details:', 120, 60);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text('Invoice Number:', 120, 67);
    doc.text(invoice.invoiceNumber, 175, 67, { align: 'right' });

    doc.text('Invoice Date:', 120, 74);
    doc.text(formatDate(invoice.createdAt), 175, 74, { align: 'right' });

    doc.text('Due Date:', 120, 81);
    doc.text(formatDate(dueDate.toISOString()), 175, 81, { align: 'right' });

    doc.text('Status:', 120, 88);
    doc.text(invoice.status, 175, 88, { align: 'right' });

    // Add another line separator
    doc.line(20, 100, 190, 100);

    // Add invoice items table
    const tableColumn = ["Item", "Qty", "Price", "Total"];
    const tableRows: (string | number)[][] = [];

    // Add invoice items
    invoice.items.forEach(item => {
        const itemData = [
            item.product.name,
            item.quantity,
            formatCurrency(item.price),
            formatCurrency(item.total)
        ];
        tableRows.push(itemData);
    });

    // Generate the table
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 110,
        theme: 'grid',
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [50, 50, 50],
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 40, halign: 'right' },
        },
    });

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Add totals
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text('Subtotal:', 120, finalY);
    doc.text(formatCurrency(invoice.total), 175, finalY, { align: 'right' });

    doc.text('Tax (0%):', 120, finalY + 7);
    doc.text(formatCurrency(0), 175, finalY + 7, { align: 'right' });

    // Add a line before the total
    doc.line(120, finalY + 10, 175, finalY + 10);

    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 120, finalY + 17);
    doc.text(formatCurrency(invoice.total), 175, finalY + 17, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Amount Paid:', 120, finalY + 24);
    doc.text(formatCurrency(paidAmount), 175, finalY + 24, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due:', 120, finalY + 31);
    doc.text(formatCurrency(remainingBalance), 175, finalY + 31, { align: 'right' });

    // Add notes and terms if there's space
    if (finalY + 50 < 270) {
        doc.line(20, finalY + 40, 190, finalY + 40);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 20, finalY + 50);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Thank you for your business.', 20, finalY + 57);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions:', 120, finalY + 50);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Payment is due within 30 days.', 120, finalY + 57);
    }

    // Add payment records if available and there's space
    if (invoice.payments && invoice.payments.length > 0) {
        let paymentY = finalY + 70;

        // Add a new page if there's not enough space
        if (paymentY > 240) {
            doc.addPage();
            paymentY = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment History:', 20, paymentY);

        paymentY += 10;

        // Create a payment table
        const paymentColumns = ["Date", "Method", "Reference", "Amount"];
        const paymentRows: (string | number)[][] = [];

        invoice.payments.forEach(payment => {
            const paymentData = [
                formatDate(payment.createdAt),
                payment.paymentMethod,
                payment.referenceNumber || '-',
                formatCurrency(payment.amount)
            ];
            paymentRows.push(paymentData);
        });

        // Generate the payment table
        autoTable(doc, {
            head: [paymentColumns],
            body: paymentRows,
            startY: paymentY,
            theme: 'grid',
            headStyles: {
                fillColor: [220, 220, 220],
                textColor: [50, 50, 50],
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 40 },
                2: { cellWidth: 60 },
                3: { cellWidth: 30, halign: 'right' },
            },
        });
    }

    // Return the PDF as a buffer
    return Buffer.from(doc.output('arraybuffer'));
};