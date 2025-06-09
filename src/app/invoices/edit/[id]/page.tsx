'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp, Search, Bell } from 'lucide-react';

// Interface for Customer in dropdown
interface Customer {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    paymentType?: string | null;
    creditPeriod?: number | null;
}

// Interface for Product in dropdown
interface Product {
    id: number;
    name: string;
    price: number; // Retail price
    description?: string;
    sku?: string;
    stock?: number;
    weightedAverageCost?: number; // Added
}

// Interface for Invoice Line Item
interface InvoiceItem {
    id: string | number;
    productId: number;
    productName: string;
    quantity: number;
    price: number; // Selling price
    costPrice: number; // Added: Cost price at the time of sale
    total: number;
}

// Interface for Shop in dropdown
interface Shop {
    id: string;
    name: string;
    address?: string;
}

// Interface for Invoice Form Data
interface InvoiceFormData {
    customerId: number;
    customerName: string;
    invoiceDate: string;
    dueDate: string;
    notes: string;
    status: 'draft' | 'pending' | 'paid' | 'overdue';
    paymentMethod: 'Cash' | 'Credit' | 'Card' | 'Bank';
    shopId: string | null;
    items: InvoiceItem[];
}

// Interface for Invoice from API
interface ApiInvoice {
    id: number;
    invoiceNumber: string;
    customerId: number;
    total: number;
    totalProfit?: number; // Added, as backend provides this
    profitMargin?: number; // Added, as backend provides this
    status: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
    customer: Customer;
    items: Array<{
        id: number;
        productId: number;
        invoiceId: number;
        quantity: number;
        price: number;
        costPrice: number; // Added: Expect from API
        total: number;
        profit: number;  // Added: Expect from API
        product: Product; // Product might also have weightedAverageCost for newly added items
    }>;
    shopId?: string; // Ensure shopId is string here too
}

export default function EditInvoice() {
    const router = useRouter();
    const params = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [currentProductCost, setCurrentProductCost] = useState<number>(0); // Added
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [productStock, setProductStock] = useState<number | null>(null);
    const [invoiceNumber, setInvoiceNumber] = useState<string>('');
    const [sendSms, setSendSms] = useState<boolean>(false);
    const [customPrice, setCustomPrice] = useState<number>(0);

    // Handle changes to quantity or price of an existing line item
    const handleItemDetailChange = (itemId: string | number, field: 'quantity' | 'price', value: string) => {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) && value !== '') return;

        setFormData(prevFormData => {
            const updatedItems = prevFormData.items.map(item => {
                if (item.id === itemId) {
                    const newQuantity = field === 'quantity' ? (numericValue >= 0 ? numericValue : item.quantity) : item.quantity;
                    const newPrice = field === 'price' ? (numericValue >= 0 ? numericValue : item.price) : item.price;
                    // item.costPrice is already set from DB or when item was added, should not change here.
                    const newTotal = newQuantity * newPrice;
                    return {
                        ...item,
                        quantity: newQuantity,
                        price: newPrice,
                        total: newTotal,
                    };
                }
                return item;
            });
            return { ...prevFormData, items: updatedItems };
        });
    };

    const [formData, setFormData] = useState<InvoiceFormData>({
        customerId: 0,
        customerName: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '', // Will be calculated based on customer
        notes: '',
        status: 'pending',
        paymentMethod: 'Cash',
        shopId: null,
        items: []
    });

    // Calculate invoice total based on line items
    const invoiceTotal = useMemo(() => {
        return formData.items.reduce((sum, item) => sum + item.total, 0);
    }, [formData.items]);

    // Fetch invoice data when component mounts
    useEffect(() => {
        if (!params.id) return;

        const fetchInvoiceData = async () => {
            try {
                setIsLoading(true);
                // Fetch the invoice data
                const response = await fetch(`/api/invoices/${params.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch invoice');
                }

                const invoiceData: ApiInvoice = await response.json();

                // Set invoice number
                setInvoiceNumber(invoiceData.invoiceNumber);

                // Transform API data to form data
                const items = invoiceData.items.map(item => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    costPrice: item.costPrice || 0, // Populate from API
                    total: item.total,
                    profit: item.profit || 0    // Populate from API
                }));

                // Calculate due date (30 days from creation date or based on customer credit period)
                const createdDate = new Date(invoiceData.createdAt);
                const dueDate = new Date(createdDate);
                dueDate.setDate(dueDate.getDate() + 30); // Default to 30 days

                setFormData({
                    customerId: invoiceData.customerId,
                    customerName: invoiceData.customer.name,
                    invoiceDate: createdDate.toISOString().split('T')[0],
                    dueDate: dueDate.toISOString().split('T')[0],
                    notes: '', // Assuming notes might be added later
                    status: invoiceData.status as any,
                    paymentMethod: invoiceData.paymentMethod as any,
                    shopId: invoiceData.shopId || null, // Will be string if present
                    items
                });

                setSelectedCustomer(invoiceData.customer);
            } catch (error) {
                console.error('Error fetching invoice:', error);
                alert('Failed to load invoice data. Please try again.');
                router.push('/invoices');
            } finally {
                setIsLoading(false);
            }
        };

        // Fetch customers and products
        const fetchMasterData = async () => {
            try {
                // Fetch customers
                const customerResponse = await fetch('/api/customers');
                if (customerResponse.ok) {
                    const customerData = await customerResponse.json();
                    // Handle both direct array and wrapped object formats
                    setCustomers(Array.isArray(customerData) ? customerData :
                        (customerData.data && Array.isArray(customerData.data) ? customerData.data : []));
                }

                // Fetch products
                const productResponse = await fetch('/api/products');
                if (productResponse.ok) {
                    const productData = await productResponse.json();
                    setProducts(Array.isArray(productData.data) ? productData.data : []);
                } else {
                    // If API not available, set some sample products
                    setProducts([
                        { id: 1, name: 'Cricket Bat', price: 12500, description: 'Professional cricket bat', sku: 'CB-001' },
                        { id: 2, name: 'Cricket Ball', price: 1800, description: 'Match quality cricket ball', sku: 'CBL-002' },
                        { id: 3, name: 'Basketball', price: 4500, description: 'Official size basketball', sku: 'BB-003' },
                        { id: 4, name: 'Football', price: 3200, description: 'Professional football', sku: 'FB-004' },
                        { id: 5, name: 'Tennis Racket', price: 8500, description: 'Professional tennis racket', sku: 'TR-005' },
                    ]);
                }

                // Fetch shops
                const shopResponse = await fetch('/api/shops?simple=true');
                if (shopResponse.ok) {
                    const shopData = await shopResponse.json();
                    setShops(Array.isArray(shopData.data) ? shopData.data : []);
                }
            } catch (error) {
                console.error('Error fetching master data:', error);
                // Set sample data if API fails
                setCustomers([
                    { id: 1, name: 'Colombo Cricket Club', email: 'info@colombocricket.lk', phone: '+94 112 345 123', paymentType: 'Credit', creditPeriod: 30 },
                    { id: 2, name: 'Kandy Sports Association', email: 'info@kandysports.lk', phone: '+94 812 345 456', paymentType: 'Cash', creditPeriod: null },
                    { id: 3, name: 'Galle School District', email: 'sports@galleschools.lk', phone: '+94 912 345 789', paymentType: 'Credit', creditPeriod: 15 },
                ]);
            }
        };

        fetchInvoiceData();
        fetchMasterData();
    }, [params.id, router]);

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
    const handleSelectCustomer = async (customer: Customer) => {
        setSelectedCustomer(customer);

        // Get today's date
        const today = new Date();
        const invoiceDate = today.toISOString().split('T')[0];

        // Calculate due date based on customer's credit period
        let dueDate = invoiceDate;
        let status = 'paid'; // Default for cash customers

        // If customer has a credit period, calculate due date and set status to pending
        if (customer.paymentType === 'Credit' && customer.creditPeriod) {
            const dueDateObj = new Date(today);
            dueDateObj.setDate(today.getDate() + customer.creditPeriod);
            dueDate = dueDateObj.toISOString().split('T')[0];
            status = 'pending';
        }

        // Fetch detailed customer info if needed
        try {
            const customerResponse = await fetch(`/api/customers/${customer.id}`);
            if (customerResponse.ok) {
                const customerData = await customerResponse.json();
                // Update customer with additional details if available
                if (customerData.paymentType || customerData.creditPeriod) {
                    customer = {
                        ...customer,
                        paymentType: customerData.paymentType || customer.paymentType,
                        creditPeriod: customerData.creditPeriod || customer.creditPeriod
                    };

                    // Recalculate due date with updated information
                    if (customer.paymentType === 'Credit' && customer.creditPeriod) {
                        const dueDateObj = new Date(today);
                        dueDateObj.setDate(today.getDate() + customer.creditPeriod);
                        dueDate = dueDateObj.toISOString().split('T')[0];
                        status = 'pending';
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);
        }

        // Update form data with customer info and calculated dates/status
        setFormData({
            ...formData,
            customerId: customer.id,
            customerName: customer.name,
            invoiceDate: invoiceDate,
            dueDate: dueDate,
            status: status as 'draft' | 'pending' | 'paid' | 'overdue'
        });

        setCustomerSearch('');
        setShowCustomerDropdown(false);
    };

    // Handle product selection for adding to line items
    const handleSelectProduct = async (product: Product) => {
        // Fetch full product details to get weightedAverageCost for newly added items
        if (!formData.shopId) {
            alert('Please select a shop first before adding products.');
            return;
        }
        try {
            const response = await fetch(`/api/products/${product.id}`);
            if (response.ok) {
                const detailedProductData = await response.json();
                if (detailedProductData.success && detailedProductData.data) {
                    setSelectedProduct(detailedProductData.data);
                    setCurrentProductCost(detailedProductData.data.weightedAverageCost || 0);
                    const shopStock = detailedProductData.data.inventory?.find(
                        (invItem: any) => invItem.shop_id === formData.shopId // Assuming shopId on inventoryItem is number
                    )?.quantity || 0;
                    setProductStock(shopStock);
                    setCustomPrice(0); // Reset custom price when product is selected
                } else {
                    setSelectedProduct(product);
                    setCurrentProductCost(product.weightedAverageCost || 0);
                    setProductStock(null);
                    setCustomPrice(0); // Reset custom price when product is selected
                }
            } else {
                setSelectedProduct(product);
                setCurrentProductCost(product.weightedAverageCost || 0);
                setProductStock(null);
                setCustomPrice(0); // Reset custom price when product is selected
            }
        } catch (error) {
            setSelectedProduct(product);
            setCurrentProductCost(product.weightedAverageCost || 0);
            setProductStock(null);
            setCustomPrice(0); // Reset custom price when product is selected
            console.error('Error fetching product stock and cost for new item:', error);
        }
        setProductSearch('');
        setShowProductDropdown(false);
    };

    // Add line item to invoice
    const handleAddLineItem = () => {
        if (!selectedProduct) return;

        if (!formData.shopId) {
            alert('Please select a shop first');
            return;
        }
        if (quantity <= 0) {
            setQuantity(1);
            return;
        }
        if (productStock !== null && quantity > productStock) {
            alert(`Not enough stock in selected shop. Available: ${productStock}`);
            return;
        }

        const sellingPrice = customPrice > 0 ? customPrice : selectedProduct.price; // Use custom price if set, otherwise default price
        const costPrice = currentProductCost;       // Cost for the new item
        const itemTotal = sellingPrice * quantity;

        const newItem: InvoiceItem = {
            id: Date.now().toString(), // Temporary ID for UI
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: quantity,
            price: sellingPrice,
            costPrice: costPrice,
            total: itemTotal,
        };

        setFormData({
            ...formData,
            items: [...formData.items, newItem]
        });

        // Reset selection
        setSelectedProduct(null);
        setProductStock(null);
        setQuantity(1);
        setCustomPrice(0);
    };

    // Remove line item from invoice
    const handleRemoveLineItem = (itemId: string | number) => {
        setFormData({
            ...formData,
            items: formData.items.filter(item => item.id !== itemId)
        });
    };

    // Update item quantity
    const handleUpdateItemQuantity = (itemId: string | number, newQuantity: number) => {
        console.log('Updating quantity:', itemId, newQuantity);
        if (newQuantity <= 0) {
            // If new quantity is invalid, find the item and revert its input to the current quantity
            setFormData(prevData => {
                const currentItem = prevData.items.find(item => item.id === itemId);
                if (currentItem) {
                    // Trigger a re-render with the existing quantity to reset the input
                    const updatedItems = prevData.items.map(item => {
                        if (item.id === itemId) {
                            return { ...item, quantity: currentItem.quantity };
                        }
                        return item;
                    });
                    return { ...prevData, items: updatedItems };
                }
                return prevData;
            });
            return;
        }

        setFormData(prevData => {
            console.log('Previous formData:', prevData);
            const updatedItems = prevData.items.map(item => {
                if (item.id === itemId) {
                    console.log('Updating item:', item.id, 'from', item.quantity, 'to', newQuantity);
                    return {
                        ...item,
                        quantity: newQuantity,
                        total: item.price * newQuantity
                    };
                }
                return item;
            });
            console.log('Updated items:', updatedItems);
            return {
                ...prevData,
                items: updatedItems
            };
        });
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Transform data for API
            const invoiceData = {
                customerId: formData.customerId,
                total: invoiceTotal,
                status: formData.status,
                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
                invoiceDate: formData.invoiceDate,
                dueDate: formData.dueDate,
                shopId: formData.shopId,
                items: formData.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                })),
                // Include the sendSms flag
                sendSms: sendSms
            };

            console.log('Submitting invoice data:', invoiceData);

            // Update invoice via API
            const response = await fetch(`/api/invoices/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(invoiceData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API error response:', errorData);
                throw new Error(errorData.error || 'Failed to update invoice');
            }

            // Redirect to invoice detail page
            router.push(`/invoices/${params.id}`);
            router.refresh();
        } catch (error) {
            console.error('Error updating invoice:', error);
            alert('Failed to update invoice. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="space-y-6 animate-pulse">
                    <div className="h-10 bg-gray-200 rounded w-64 mb-6"></div>
                    <div className="bg-tertiary p-8 rounded-xl border border-gray-200">
                        <div className="space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                                </div>
                            </div>
                            <div className="h-px bg-gray-200 my-6"></div>
                            <div className="h-64 bg-gray-200 rounded w-full"></div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
                        <p className="text-gray-500">Edit invoice #{invoiceNumber}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
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
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        >
                                            <option value="Draft">Draft</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Overdue">Overdue</option>
                                        </select>
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
                                            name="dueDate"
                                            value={formData.dueDate}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        />
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Shop <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="shopId"
                                            value={formData.shopId || ''}
                                            onChange={(e) => setFormData({ ...formData, shopId: e.target.value || null })}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                            required
                                        >
                                            <option value="">Select a shop</option>
                                            {shops.map((shop) => (
                                                <option key={shop.id} value={shop.id}>
                                                    {shop.name}
                                                </option>
                                            ))}
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
                                                                customerId: 0,
                                                                customerName: '',
                                                                status: 'pending', // Reset status
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
                                                <p>Payment Type: {selectedCustomer.paymentType || 'Cash'}</p>
                                                {selectedCustomer.paymentType === 'Credit' && (
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
                                    <div className="md:col-span-1 relative">
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={customPrice > 0 ? customPrice : (selectedProduct ? selectedProduct.price : '')}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value) || 0;
                                                setCustomPrice(value);
                                            }}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                            min="0"
                                            step="0.01"
                                        />
                                        {selectedProduct && (
                                            <div className="absolute text-xs mt-1 text-gray-500">
                                                Retail: Rs. {selectedProduct.price.toLocaleString()}
                                            </div>
                                        )}
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
                                            <th className="py-2 px-3 text-left text-sm font-semibold text-gray-700">Product</th>
                                            <th className="py-2 px-3 text-center text-sm font-semibold text-gray-700">Qty</th>
                                            <th className="py-2 px-3 text-right text-sm font-semibold text-gray-700">Price (Rs.)</th>

                                            <th className="py-2 px-3 text-right text-sm font-semibold text-gray-700">Total (Rs.)</th>
                                            <th className="py-2 px-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.length > 0 ? (
                                            formData.items.map((item, index) => (
                                                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="py-2 px-3 border-b border-gray-200 text-sm text-gray-700">
                                                        {item.productName}
                                                        <span className="text-xs text-gray-500 block">ID: {item.productId}</span>
                                                    </td>
                                                    <td className="py-2 px-3 border-b border-gray-200 text-sm text-gray-700 text-center">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemDetailChange(item.id, 'quantity', e.target.value)}
                                                            className="w-20 p-1 border border-gray-300 rounded-md text-center text-sm"
                                                            min="1"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3 border-b border-gray-200 text-sm text-gray-700 text-right">
                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => handleItemDetailChange(item.id, 'price', e.target.value)}
                                                            className="w-24 p-1 border border-gray-300 rounded-md text-right text-sm"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </td>

                                                    <td className="py-2 px-3 border-b border-gray-200 text-sm text-gray-700 text-right">
                                                        {item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-2 px-3 border-b border-gray-200 text-center">
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

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <div className="flex items-center mr-auto">
                                <input
                                    type="checkbox"
                                    id="sendSms"
                                    checked={sendSms}
                                    onChange={(e) => setSendSms(e.target.checked)}
                                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="sendSms" className="flex items-center text-sm text-gray-700">
                                    <Bell className="w-4 h-4 mr-1 text-gray-500" />
                                    Send SMS notification to customer
                                </label>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={isSubmitting}
                                disabled={formData.items.length === 0 || !formData.customerId}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Update Invoice
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}