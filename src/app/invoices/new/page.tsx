'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp, Search, Bell } from 'lucide-react';

// Interface for Customer in dropdown
interface Customer {
    id: number; // Changed to number
    name: string;
    email?: string | null;
    phone?: string | null;
    customerType: 'wholesale' | 'retail'; // Changed from type to customerType
    creditLimit?: number | null;
    creditPeriod?: number | null;
}

// Interface for Product in dropdown
interface Product {
    id: number;
    name: string;
    price: number;
    description?: string;
    sku?: string;
    stock?: number;
}

// Interface for Shop in dropdown (NEW)
interface Shop {
    id: number;
    name: string;
}

// Interface for Invoice Line Item
interface InvoiceItem {
    id: string; // Temporary ID for UI
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

// Interface for Invoice Form Data
interface InvoiceFormData {
    customerId: number; // Changed to number
    customerName: string;
    invoiceDate: string;
    dueDate: string;
    notes: string;
    status: 'Draft' | 'Pending' | 'Paid' | 'Overdue';
    paymentMethod: 'Cash' | 'Credit' | 'Card' | 'Bank';
    items: InvoiceItem[];
    shopId: number | null; // Added shopId
}

export default function CreateInvoice() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [shops, setShops] = useState<Shop[]>([]); // Added shops state
    const [customerSearch, setCustomerSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [productStock, setProductStock] = useState<number | null>(null);

    const [formData, setFormData] = useState<InvoiceFormData>({
        customerId: 0, // Changed to 0 (number)
        customerName: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '', // Will be calculated based on customer
        notes: '',
        status: 'Pending', // Will be determined based on customer
        paymentMethod: 'Cash',
        items: [],
        shopId: null, // Initialize shopId
    });

    // Generate a unique invoice number based on current date
    const invoiceNumber = useMemo(() => {
        const now = new Date();
        return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }, []);

    // Calculate invoice total based on line items
    const invoiceTotal = useMemo(() => {
        return formData.items.reduce((sum, item) => sum + item.total, 0);
    }, [formData.items]);

    // Fetch customers and products on component mount
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch customers
                const customerResponse = await fetch('/api/customers');
                if (customerResponse.ok) {
                    const customerData = await customerResponse.json();
                    // Assuming customerData is the array of customers directly from the API
                    setCustomers(Array.isArray(customerData) ? customerData : []);
                } else {
                    console.error('Failed to fetch customers:', await customerResponse.text());
                    setCustomers([]); // Set to empty array on failure
                }

                // Fetch products
                const productResponse = await fetch('/api/products');
                if (productResponse.ok) {
                    const productData = await productResponse.json();
                    setProducts(Array.isArray(productData.data) ? productData.data : []);
                } else {
                    setProducts([
                        { id: 1, name: 'Cricket Bat', price: 12500, description: 'Professional cricket bat', sku: 'CB-001' },
                        { id: 2, name: 'Cricket Ball', price: 1800, description: 'Match quality cricket ball', sku: 'CBL-002' },
                        { id: 3, name: 'Basketball', price: 4500, description: 'Official size basketball', sku: 'BB-003' },
                        { id: 4, name: 'Football', price: 3200, description: 'Professional football', sku: 'FB-004' },
                        { id: 5, name: 'Tennis Racket', price: 8500, description: 'Professional tennis racket', sku: 'TR-005' },
                    ]);
                }

                // Fetch shops (NEW)
                const shopResponse = await fetch('/api/shops?simple=true');
                if (shopResponse.ok) {
                    const shopData = await shopResponse.json();
                    if (shopData.success && Array.isArray(shopData.data)) {
                        setShops(shopData.data);
                        // Optionally, set a default shop if desired
                        // if (shopData.data.length > 0) {
                        //     setFormData(prev => ({ ...prev, shopId: shopData.data[0].id }));
                        // }
                    } else {
                        console.error('Failed to fetch shops or data format incorrect:', shopData);
                        setShops([]); // Set to empty array on failure
                    }
                } else {
                    console.error('Shop API request failed:', shopResponse.status);
                    setShops([]); // Set to empty array on API error
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                setCustomers([
                    { id: 1, name: 'Colombo Cricket Club', email: 'info@colombocricket.lk', phone: '+94 112 345 123', customerType: 'wholesale', creditPeriod: 30 },
                    { id: 2, name: 'Kandy Sports Association', email: 'info@kandysports.lk', phone: '+94 812 345 456', customerType: 'retail', creditPeriod: null },
                    { id: 3, name: 'Galle School District', email: 'sports@galleschools.lk', phone: '+94 912 345 789', customerType: 'wholesale', creditPeriod: 15 },
                ]);
                setShops([]); // Also set shops to empty on general catch
            }
        }

        fetchData();
    }, []);

    // Filter customers based on search term
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customers;
        if (!Array.isArray(customers)) return [];
        return customers.filter(customer =>
            customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            (customer.email && customer.email.toLowerCase().includes(customerSearch.toLowerCase())) ||
            (customer.phone && customer.phone.includes(customerSearch))
        );
    }, [customers, customerSearch]);

    // Filter products based on search term
    const filteredProducts = useMemo(() => {
        if (!productSearch) return products;
        if (!Array.isArray(products)) return [];
        return products.filter(product =>
            product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            (product.sku && product.sku.toLowerCase().includes(productSearch.toLowerCase()))
        );
    }, [products, productSearch]);

    // Handle form input changes
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle customer selection
    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);

        const today = new Date();
        const invoiceDate = today.toISOString().split('T')[0];
        let dueDate = invoiceDate; // Default due date

        if (customer.customerType === 'wholesale' && customer.creditPeriod) {
            const dueDateObj = new Date(today);
            dueDateObj.setDate(today.getDate() + customer.creditPeriod);
            dueDate = dueDateObj.toISOString().split('T')[0];
        }

        setFormData({
            ...formData,
            customerId: customer.id, // customer.id is now number
            customerName: customer.name,
            invoiceDate: invoiceDate,
            dueDate: dueDate,
            status: 'Pending' // Or determine based on type/credit status
        });

        setCustomerSearch('');
        setShowCustomerDropdown(false);
    };

    // Handle product selection for adding to line items
    const handleSelectProduct = async (product: Product) => {
        setSelectedProduct(product);
        setProductSearch('');
        setShowProductDropdown(false);

        // Fetch stock information for the selected product
        try {
            const response = await fetch(`/api/products/${product.id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    // Calculate total stock across all locations
                    const totalStock = data.data.inventory?.reduce(
                        (sum: number, item: any) => sum + item.quantity,
                        0
                    ) || 0;
                    setProductStock(totalStock);
                }
            }
        } catch (error) {
            console.error('Error fetching product stock:', error);
            setProductStock(null);
        }
    };

    // Handle adding a line item to the invoice
    const handleAddLineItem = () => {
        if (!selectedProduct || quantity <= 0) {
            alert('Please select a product and enter a valid quantity.');
            return;
        }

        const newItemTotal = selectedProduct.price * quantity;

        // Check credit limit for wholesale customers
        if (selectedCustomer && selectedCustomer.customerType === 'wholesale' && selectedCustomer.creditLimit) {
            const currentTotal = formData.items.reduce((sum, item) => sum + item.total, 0);
            if (currentTotal + newItemTotal > selectedCustomer.creditLimit) {
                alert(`Adding this item exceeds the customer\'s credit limit of ${selectedCustomer.creditLimit}.`);
                return;
            }
        }

        const newLineItem: InvoiceItem = {
            id: Date.now().toString(), // Temporary ID for UI
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: quantity,
            price: selectedProduct.price,
            total: newItemTotal
        };

        setFormData({
            ...formData,
            items: [...formData.items, newLineItem]
        });

        // Reset selection
        setSelectedProduct(null);
        setProductStock(null);
        setQuantity(1);
    };

    // Remove line item from invoice
    const handleRemoveLineItem = (itemId: string) => {
        setFormData({
            ...formData,
            items: formData.items.filter(item => item.id !== itemId)
        });
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final credit limit check for wholesale customers
        if (selectedCustomer && selectedCustomer.customerType === 'wholesale' && selectedCustomer.creditLimit) {
            const finalTotal = formData.items.reduce((sum, item) => sum + item.total, 0);
            if (finalTotal > selectedCustomer.creditLimit) {
                alert(`The total invoice amount of ${finalTotal} exceeds the customer\'s credit limit of ${selectedCustomer.creditLimit}. Please remove items or save as draft.`);
                // Optionally, allow saving as draft or prevent submission entirely
                // For now, we prevent submission by returning.
                return;
            }
        }

        setIsSubmitting(true);

        try {
            // Transform data for API
            const invoiceData = {
                invoiceNumber,
                customerId: formData.customerId,
                total: invoiceTotal,
                status: formData.status,
                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
                invoiceDate: formData.invoiceDate,
                dueDate: formData.dueDate,
                items: formData.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                })),
                shopId: formData.shopId,
            };

            // Create invoice via API
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(invoiceData),
            });

            if (!response.ok) {
                throw new Error('Failed to create invoice');
            }

            // Redirect to invoices list page
            router.push('/invoices');
            router.refresh();
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6 pb-24">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
                        <p className="text-gray-500">Create an invoice for your customer</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Invoices
                        </Button>
                    </div>
                </div>

                {/* Invoice Form */}
                <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Invoice Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Invoice Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Invoice Number
                                        </label>
                                        <input
                                            type="text"
                                            value={invoiceNumber}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900 bg-gray-100"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.status}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900 bg-gray-100"
                                            disabled
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            All new invoices are created with Pending status
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Invoice Date
                                        </label>
                                        <input
                                            type="date"
                                            name="invoiceDate"
                                            value={formData.invoiceDate}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900 bg-gray-100"
                                            disabled
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Due date is calculated based on customer's credit period
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Shop <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="shopId"
                                            value={formData.shopId || ''} // Handle null state for placeholder
                                            onChange={(e) => setFormData({ ...formData, shopId: parseInt(e.target.value) || null })}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                            required
                                        >
                                            <option value="" disabled>Select a shop</option>
                                            {shops.map((shop) => (
                                                <option key={shop.id} value={shop.id}>
                                                    {shop.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Method
                                        </label>
                                        <select
                                            name="paymentMethod"
                                            value={formData.paymentMethod}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Credit">Credit</option>
                                            <option value="Card">Card</option>
                                            <option value="Bank">Bank</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Customer Information</h2>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Customer <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search for a customer..."
                                                value={formData.customerName || customerSearch}
                                                onChange={(e) => {
                                                    if (!formData.customerId) {
                                                        setCustomerSearch(e.target.value);
                                                        setShowCustomerDropdown(true);
                                                    }
                                                }}
                                                onFocus={() => setShowCustomerDropdown(true)}
                                                className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                                required
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                {formData.customerId ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                customerId: 0, // Reset to 0 (number)
                                                                customerName: '',
                                                                status: 'Pending', // Reset status
                                                                dueDate: '' // Reset due date
                                                            });
                                                            setSelectedCustomer(null);
                                                            setCustomerSearch('');
                                                        }}
                                                        className="text-gray-400 hover:text-gray-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                                                        className="text-gray-400 hover:text-gray-500"
                                                    >
                                                        {showCustomerDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {showCustomerDropdown && !formData.customerId && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {filteredCustomers.length > 0 ? (
                                                    <ul className="py-1 text-sm text-gray-700">
                                                        {filteredCustomers.map((customer) => (
                                                            <li
                                                                key={customer.id}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => handleSelectCustomer(customer)}
                                                            >
                                                                <div className="font-medium">{customer.name}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    {customer.email} {customer.phone && `• ${customer.phone}`}
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="px-4 py-2 text-sm text-gray-500">No customers found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {selectedCustomer && (
                                        <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                            <h3 className="font-medium text-sm text-blue-700">Customer Details</h3>
                                            <div className="text-xs text-blue-600 mt-1">
                                                <p>Customer Type: {selectedCustomer.customerType === 'wholesale' ? 'Wholesale' : 'Retail'}</p>
                                                {selectedCustomer.customerType === 'wholesale' && (
                                                    <p>Credit Period: {selectedCustomer.creditPeriod || 0} days</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4">
                                        <div className="bg-gray-50 p-4 rounded-md">
                                            <h3 className="font-semibold text-sm text-gray-900 mb-2">Invoice Summary</h3>
                                            <div className="flex justify-between text-sm text-gray-900">
                                                <span>Subtotal:</span>
                                                <span>Rs. {invoiceTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-900 mt-1">
                                                <span>Tax (0%):</span>
                                                <span>Rs. 0.00</span>
                                            </div>
                                            <div className="border-t mt-2 pt-2 flex justify-between font-semibold text-gray-900">
                                                <span>Total:</span>
                                                <span>Rs. {invoiceTotal.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Invoice Items</h2>

                            {/* Add new line item */}
                            <div className="bg-gray-50 p-4 rounded-md mb-4">
                                <h3 className="font-medium text-sm text-gray-700 mb-3">Add Item</h3>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                    <div className="md:col-span-3 relative">
                                        <input
                                            type="text"
                                            id="productSearchInput"
                                            placeholder="Search for a product..."
                                            value={selectedProduct ? selectedProduct.name : productSearch}
                                            onChange={(e) => {
                                                const newSearchTerm = e.target.value;
                                                if (selectedProduct && selectedProduct.name !== newSearchTerm) {
                                                    setSelectedProduct(null);
                                                    setProductStock(null);
                                                }
                                                setProductSearch(newSearchTerm);
                                                setShowProductDropdown(true);
                                            }}
                                            onFocus={() => {
                                                setShowProductDropdown(true);
                                            }}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900 pr-10"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            {selectedProduct ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedProduct(null);
                                                        setProductStock(null);
                                                        setProductSearch('');
                                                        setShowProductDropdown(true);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowProductDropdown(!showProductDropdown)}
                                                    className="text-gray-400 hover:text-gray-500"
                                                >
                                                    {showProductDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                        {showProductDropdown && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {filteredProducts.length > 0 ? (
                                                    <ul className="py-1 text-sm text-gray-700">
                                                        {filteredProducts.map((product) => (
                                                            <li
                                                                key={product.id}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => handleSelectProduct(product)}
                                                            >
                                                                <div className="font-medium">{product.name}</div>
                                                                <div className="text-xs flex justify-between">
                                                                    <span className="text-gray-500">{product.sku}</span>
                                                                    <span>Rs. {product.price.toLocaleString()}</span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="px-4 py-2 text-sm text-gray-500">No products found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-1 relative">
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            min="1"
                                            value={quantity === 0 ? '' : quantity}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setQuantity(val === '' ? 0 : parseInt(val) || 0);
                                            }}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        />
                                        {productStock !== null && selectedProduct && (
                                            <div className="absolute text-xs mt-1 text-gray-500">
                                                Available: {productStock}
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-1">
                                        <input
                                            type="text"
                                            placeholder="Price"
                                            value={selectedProduct ? selectedProduct.price.toLocaleString() : ''}
                                            disabled
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900 bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <Button
                                            type="button"
                                            onClick={handleAddLineItem}
                                            disabled={!selectedProduct}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Line items table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-gray-900">Item</th>
                                            <th className="px-4 py-3 text-center text-gray-900">Quantity</th>
                                            <th className="px-4 py-3 text-right text-gray-900">Price</th>
                                            <th className="px-4 py-3 text-right text-gray-900">Total</th>
                                            <th className="px-4 py-3 text-center text-gray-900">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.length > 0 ? (
                                            formData.items.map((item) => (
                                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900">
                                                        {item.productName}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right">Rs. {item.price.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right">Rs. {item.total.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveLineItem(item.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                                                    No items added yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-semibold text-gray-900">
                                            <td colSpan={3} className="px-4 py-3 text-right">
                                                Grand Total:
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                Rs. {invoiceTotal.toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Additional Information</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="Add any additional notes or payment instructions..."
                                    className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                ></textarea>
                            </div>
                        </div>
                        {/* Add a div for the buttons at the end of the form */}
                        <div className="flex justify-end gap-3 pt-8">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                size="sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={isSubmitting}
                                disabled={formData.items.length === 0 || !formData.customerId}
                                size="sm"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Invoice
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}