import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    roleId: z.number().int().positive(),
    phone: z.string().optional(),
    shopId: z.number().int().positive().optional().nullable(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Product validation schema
export const productSchema = z.object({
    name: z.string().min(2, 'Product name is required'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    sku: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    categoryId: z.number().int().positive().optional().nullable(),
    shopId: z.number().int().positive().optional().nullable(),
});

// Category validation schema
export const categorySchema = z.object({
    name: z.string().min(2, 'Category name is required'),
    description: z.string().optional(),
    parentId: z.number().int().positive().optional().nullable(),
});

// Inventory validation schema
export const inventorySchema = z.object({
    productId: z.number().int().positive('Product ID is required'),
    shopId: z.number().int().positive('Shop ID is required'),
    quantity: z.number().int('Quantity must be an integer'),
    reorderLevel: z.number().int().optional(),
});

// Shop validation schema
export const shopSchema = z.object({
    name: z.string().min(2, 'Shop name is required'),
    location: z.string().optional(),
    contact_person: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    is_active: z.boolean().default(true),
    opening_time: z.string().optional(),
    closing_time: z.string().optional(),
    manager_id: z.number().int().positive().optional().nullable(),
    opening_date: z.string().optional(),
    status: z.enum(['open', 'closed', 'renovating', 'relocating']).default('open'),
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().default('Malaysia'),
    tax_rate: z.number().min(0).optional(),
});

// Customer validation schema
export const customerSchema = z.object({
    name: z.string().min(2, 'Customer name is required'),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPersonPhone: z.string().optional(),
    customerType: z.string().optional(),
    paymentType: z.string().optional(),
    creditLimit: z.number().positive().optional(),
    creditPeriod: z.number().int().positive().optional(),
    taxId: z.string().optional(),
    notes: z.string().optional(),
});

// Supplier validation schema
export const supplierSchema = z.object({
    name: z.string().min(2, 'Supplier name is required'),
    contactPerson: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['active', 'inactive']).default('active'),
});

// Invoice validation schema
export const invoiceSchema = z.object({
    invoiceNumber: z.string(),
    customerId: z.number().int().positive(),
    items: z.array(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
    })).min(1, 'At least one item is required'),
    status: z.enum(['draft', 'pending', 'paid', 'cancelled']),
});

// Payment validation schema
export const paymentSchema = z.object({
    invoiceId: z.number().int().positive(),
    customerId: z.number().int().positive(),
    amount: z.number().positive('Amount must be positive'),
    paymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer', 'cheque', 'online']),
    referenceNumber: z.string().optional(),
});

// Helper validation functions
export const validateInput = <T>(schema: z.ZodType<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: z.ZodError['errors']
} => {
    try {
        const validData = schema.parse(data);
        return { success: true, data: validData };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, errors: error.errors };
        }
        throw error;
    }
};

// Pagination parameters validation
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Search parameters validation
export const searchSchema = z.object({
    query: z.string().optional(),
    fields: z.array(z.string()).optional(),
}).merge(paginationSchema);

// ID parameter validation
export const idSchema = z.object({
    id: z.coerce.number().int().positive('Invalid ID'),
}); 