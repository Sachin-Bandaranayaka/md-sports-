export interface BranchStock {
    branchId: string;
    branchName: string;
    quantity: number;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    stock: number;
    retailPrice: number;
    wholesalePrice: number;
    averageCost: number;
    status: string;
    branchStock: BranchStock[];
}

// Supplier types
export interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
    createdAt: string;
    totalPurchases: number;
    status: 'active' | 'inactive';
}

// Purchase Invoice types
export interface PurchaseItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface PurchaseInvoice {
    id: string;
    invoiceNumber: string;
    supplierId: string;
    supplierName: string;
    date: string;
    dueDate: string;
    items: PurchaseItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    notes: string;
    status: 'paid' | 'partial' | 'unpaid';
    paymentMethod: string;
    createdAt: string;
}

// Sales Quotation types
export interface QuotationItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface SalesQuotation {
    id: string;
    quotationNumber: string;
    customerId: string;
    customerName: string;
    date: string;
    expiryDate: string;
    items: QuotationItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    notes: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    createdAt: string;
}

// Receipt types
export interface ReceiptItem {
    id: string;
    description: string;
    amount: number;
}

export interface Receipt {
    id: string;
    receiptNumber: string;
    date: string;
    customerId?: string;
    customerName?: string;
    items: ReceiptItem[];
    amount: number;
    paymentMethod: string;
    notes: string;
    createdAt: string;
}

// Accounting types
export interface Transaction {
    id: string | number;
    date: string | Date;
    description: string;
    accountId: string | number;
    accountName: string;
    toAccountId?: string | number;
    toAccountName?: string;
    type: 'income' | 'expense' | 'withdrawal' | 'transfer';
    amount: number | string;
    reference: string;
    category: string;
    createdAt: string | Date;
    updatedAt?: string | Date;
}

export interface Account {
    id: string | number;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
    balance: number | string;
    description?: string;
    isActive: boolean;
    createdAt: string | Date;
    updatedAt?: string | Date;
} 