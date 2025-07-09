'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp, Search, Bell } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

// Interface for Customer in dropdown
interface Customer {
    id: number; // Changed to number
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    customerType: 'wholesale' | 'retail'; // Changed from type to customerType
    creditLimit?: number | null;
    creditPeriod?: number | null;
}

// Interface for Product in dropdown
interface Product {
    id: number;
    name: string;
    price: number; // Retail price
    description?: string;
    sku?: string;
    stock?: number; // Available stock (may need to be specific to selected shop)
    weightedAverageCost?: number; // Added for profit calculation
}

// Interface for Shop in dropdown (NEW)
interface Shop {
    id: string;
    name: string;
}

// Interface for Invoice Line Item
interface InvoiceItem {
    id: string; // Temporary ID for UI
    productId: number;
    productName: string;
    quantity: number;
    price: number; // Selling price for this item
    costPrice: number; // Cost price at the time of adding
    total: number; // quantity * price
}

// Interface for Invoice Form Data
interface InvoiceFormData {
    customerId: number; // Changed to number
    customerName: string;
    invoiceDate: string;
    dueDate: string;
    notes: string;
    status: 'draft' | 'pending' | 'paid' | 'overdue';
    paymentMethod: 'Cash' | 'Credit' | 'Card' | 'Bank';
    items: InvoiceItem[];
    shopId: string | null; // Changed to string to match Shop model
}

export default function CreateInvoice() {
    const router = useRouter();
    const { accessToken } = useAuth();
    const { canCreateInvoices } = usePermission();

    // Redirect if user doesn't have create permissions
    useEffect(() => {
        if (!canCreateInvoices()) {
            router.push('/invoices');
        }
    }, [canCreateInvoices, router]);
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
    const [currentProductCost, setCurrentProductCost] = useState<number>(0); // To store cost of selected product
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [productStock, setProductStock] = useState<number | null>(null);
    const [customPrice, setCustomPrice] = useState<number>(0);
    const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
    const [quickCustomerData, setQuickCustomerData] = useState({
        name: '',
        phone: '',
        address: '',
        customerType: 'Retail' as 'Retail' | 'Wholesale',
        creditLimit: 0,
        creditPeriod: 0
    });
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    const [formData, setFormData] = useState<InvoiceFormData>({
        customerId: 0, // Changed to 0 (number)
        customerName: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '', // Will be calculated based on customer
        notes: '',
        status: 'pending', // Will be determined based on customer
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

    // Fetch customers and shops on component mount
    useEffect(() => {
        if (!accessToken) return; // Don't fetch if no token available
        
        async function fetchData() {
            try {
                // Get auth token from useAuth hook
                const headers = {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                };

                // Fetch customers
                const customerResponse = await fetch('/api/customers', { headers });
                if (customerResponse.ok) {
                    const customerData = await customerResponse.json();
                    // Assuming customerData is the array of customers directly from the API
                    setCustomers(Array.isArray(customerData) ? customerData : []);
                } else {
                    console.error('Failed to fetch customers:', await customerResponse.text());
                    setCustomers([]); // Set to empty array on failure
                }

                // Fetch shops (NEW)
                const shopResponse = await fetch('/api/shops?simple=true', { headers });
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
    }, [accessToken]);

    // Fetch products when shop is selected
    useEffect(() => {
        async function fetchProducts() {
            console.log('fetchProducts called with shopId:', formData.shopId);
            if (!formData.shopId) {
                console.log('No shopId, clearing products');
                setProducts([]);
                return;
            }

            if (!accessToken) {
                console.log('No access token available');
                return;
            }

            try {
                // Get auth token from useAuth hook
                const headers = {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                };

                // Fetch products that have inventory in the selected shop
                const url = `/api/products?shopId=${formData.shopId}&limit=10000`;
                console.log('Fetching products from:', url);
                const productResponse = await fetch(url, { headers });
                if (productResponse.ok) {
                    const productData = await productResponse.json();
                    console.log('Products API response:', productData);
                    setProducts(Array.isArray(productData.data) ? productData.data : []);
                    console.log('Products set to:', Array.isArray(productData.data) ? productData.data : []);
                } else {
                    console.error('Failed to fetch products for shop:', await productResponse.text());
                    setProducts([]);
                }
            } catch (error) {
                console.error('Error fetching products for shop:', error);
                setProducts([]);
            }
        }

        fetchProducts();
    }, [formData.shopId, accessToken]);

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

    // Filter products based on search term - enhanced search with multiple words support
    const filteredProducts = useMemo(() => {
        if (!productSearch) return products;
        if (!Array.isArray(products)) return [];
        
        // Enhanced search - supports multiple words in any order
        const searchWords = productSearch.toLowerCase().trim().split(/\s+/);
        
        return products.filter(product => {
            const productName = product.name.toLowerCase();
            const productSku = (product.sku || '').toLowerCase();
            
            // Each word must appear somewhere in the product name or SKU
            return searchWords.every(word => 
                productName.includes(word) || productSku.includes(word)
            );
        });
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
            status: 'pending' // Or determine based on type/credit status
        });

        setCustomerSearch('');
        setShowCustomerDropdown(false);
    };

    // Handle product selection for adding to line items
    const handleSelectProduct = async (product: Product) => {
        // Fetch full product details to get weightedAverageCost
        if (!formData.shopId) {
            // This check is important, but already exists later. Re-iterate for clarity.
            alert('Please select a shop first before adding products.');
            return;
        }
        try {
            const response = await fetch(`/api/products/${product.id}`);
            if (response.ok) {
                const detailedProductData = await response.json();
                if (detailedProductData.success && detailedProductData.data) {
                    // Update selectedProduct with full data, including weightedAverageCost
                    setSelectedProduct(detailedProductData.data);
                    setCurrentProductCost(detailedProductData.data.weightedAverageCost || 0);

                    // Calculate stock only for the selected shop
                    const shopStock = detailedProductData.data.inventory?.find(
                        (item: any) => item.shop_id === formData.shopId // Ensure this shopId comparison is correct (string vs number)
                    )?.quantity || 0;
                    setProductStock(shopStock);
                    setCustomPrice(detailedProductData.data.price); // Reset custom price to product's default
                } else {
                    // Fallback if detailed data fetch fails but we have basic product info
                    setSelectedProduct(product); // Use the basic product info
                    setCurrentProductCost(product.weightedAverageCost || 0); // Use WAC from list if available
                    setCustomPrice(product.price);
                    setProductStock(null); // Can't determine shop-specific stock
                    console.error('Failed to fetch detailed product data or data format incorrect.');
                }
            } else {
                setSelectedProduct(product); // Use the basic product info on API error
                setCurrentProductCost(product.weightedAverageCost || 0);
                setCustomPrice(product.price);
                setProductStock(null);
                console.error('Error fetching product details for stock and cost:', await response.text());
            }
        } catch (error) {
            setSelectedProduct(product); // Use the basic product info on general error
            setCurrentProductCost(product.weightedAverageCost || 0);
            setCustomPrice(product.price);
            setProductStock(null);
            console.error('Error fetching product stock and cost:', error);
        }
        setProductSearch(''); // Clear search
        setShowProductDropdown(false); // Close dropdown
    };

    // Handle adding a line item to the invoice
    const handleAddLineItem = () => {
        if (!selectedProduct || quantity <= 0) {
            alert('Please select a product and enter a valid quantity.');
            return;
        }

        // Check if shop is selected
        if (!formData.shopId) {
            alert('Please select a shop first.');
            return;
        }

        // Check if sufficient stock is available in the selected shop
        if (productStock !== null && quantity > productStock) {
            alert(`Insufficient stock in the selected shop. Available: ${productStock}, Requested: ${quantity}`);
            return;
        }

        // Use custom price if set, otherwise use product's default price
        const finalPrice = customPrice > 0 ? customPrice : (selectedProduct.price || 0);
        const costPrice = currentProductCost; // Use the fetched cost for the selected product
        const itemTotal = finalPrice * quantity;

        // Check credit limit for wholesale customers
        if (selectedCustomer && selectedCustomer.customerType === 'wholesale' && selectedCustomer.creditLimit) {
            const currentTotal = formData.items.reduce((sum, item) => sum + item.total, 0);
            if (currentTotal + itemTotal > selectedCustomer.creditLimit) {
                alert(`Adding this item exceeds the customer\'s credit limit of ${selectedCustomer.creditLimit}.`);
                return;
            }
        }

        const newLineItem: InvoiceItem = {
            id: Date.now().toString(), // Temporary ID for UI
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: quantity,
            price: finalPrice,
            costPrice: costPrice, // Store cost price
            total: itemTotal,
        };

        setFormData({
            ...formData,
            items: [...formData.items, newLineItem]
        });

        // Reset selection
        setSelectedProduct(null);
        setProductStock(null);
        setCurrentProductCost(0); // Reset current product cost
        setQuantity(1);
        setCustomPrice(0);
    };

    // Remove line item from invoice
    const handleRemoveLineItem = (itemId: string) => {
        setFormData({
            ...formData,
            items: formData.items.filter(item => item.id !== itemId)
        });
    };

    // Handle changes to quantity or price of an existing line item
    const handleItemDetailChange = (itemId: string, field: 'quantity' | 'price', value: string) => {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) && value !== '') return;

        setFormData(prevFormData => {
            const updatedItems = prevFormData.items.map(item => {
                if (item.id === itemId) {
                    const newQuantity = field === 'quantity' ? (numericValue >= 0 ? numericValue : item.quantity) : item.quantity;
                    const newPrice = field === 'price' ? (numericValue >= 0 ? numericValue : item.price) : item.price;
                    // item.costPrice is already set and should not change when user edits qty/price
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

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final credit limit check for wholesale customers
        if (selectedCustomer && selectedCustomer.customerType === 'wholesale' && selectedCustomer.creditLimit) {
            const finalTotal = formData.items.reduce((sum, item) => sum + item.total, 0);
            if (finalTotal > selectedCustomer.creditLimit) {
                alert(`The total invoice amount of Rs. ${finalTotal.toLocaleString()} exceeds the customer\'s credit limit of Rs. ${selectedCustomer.creditLimit.toLocaleString()}. Please remove items or reduce quantities.`);
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
                    'Authorization': accessToken ? `Bearer ${accessToken}` : '',
                },
                body: JSON.stringify(invoiceData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || 'Failed to create invoice');
            }

            // Check if the response explicitly indicates failure
            if (responseData.success === false) {
                throw new Error(responseData.message || responseData.error || 'Failed to create invoice');
            }

            // If we get here, the invoice was created successfully
            router.push('/invoices');
            router.refresh();
        } catch (error) {
            console.error('Error creating invoice:', error);
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert('Failed to create invoice. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingCustomer(true);

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: quickCustomerData.name,
                    phone: quickCustomerData.phone,
                    address: quickCustomerData.address,
                    customerType: quickCustomerData.customerType,
                    creditLimit: quickCustomerData.customerType === 'Wholesale' ? quickCustomerData.creditLimit : null,
                    creditPeriod: quickCustomerData.customerType === 'Wholesale' ? quickCustomerData.creditPeriod : null,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                const newCustomer: Customer = {
                    id: result.data.id,
                    name: result.data.name,
                    email: result.data.email,
                    phone: result.data.phone,
                    customerType: result.data.customerType.toLowerCase() as 'wholesale' | 'retail',
                    creditLimit: result.data.creditLimit,
                    creditPeriod: result.data.creditPeriod
                };

                // Add to customers list and select it
                setCustomers(prev => [...prev, newCustomer]);
                handleSelectCustomer(newCustomer);

                // Reset modal
                setShowQuickCustomerModal(false);
                setQuickCustomerData({
                    name: '',
                    phone: '',
                    address: '',
                    customerType: 'Retail',
                    creditLimit: 0,
                    creditPeriod: 0
                });
            } else {
                const errorData = await response.json();
                alert(`Failed to create customer: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('An error occurred while creating the customer.');
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    const handleQuickCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setQuickCustomerData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
        }));
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
                                            onChange={(e) => {
                                                const newShopId = e.target.value || null;
                                                console.log('Shop selection changed to:', newShopId);
                                                setFormData({ ...formData, shopId: newShopId });
                                            }}
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
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Customer <span className="text-red-500">*</span>
                                            </label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowQuickCustomerModal(true)}
                                                className="text-xs px-2 py-1 h-6"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Quick Add
                                            </Button>
                                        </div>
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
                                                                    {(() => {
                                                                        // Parse address if it's a JSON string
                                                                        if (customer.address && typeof customer.address === 'string') {
                                                                            try {
                                                                                const addressObj = JSON.parse(customer.address);
                                                                                return ` • ${addressObj.mainAddress || customer.address}`;
                                                                            } catch {
                                                                                return ` • ${customer.address}`;
                                                                            }
                                                                        }
                                                                        return customer.address ? ` • ${customer.address}` : '';
                                                                    })()}
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
                                                                onClick={() => {
                                                                    handleSelectProduct(product);
                                                                    setCustomPrice(0); // Reset custom price when new product is selected
                                                                }}
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
                                            type="number"
                                            placeholder="Price"
                                            value={customPrice || (selectedProduct ? selectedProduct.price : '')}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value) || 0;
                                                setCustomPrice(value);
                                            }}
                                            className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
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

                {/* Quick Customer Modal */}
                {showQuickCustomerModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Add Customer</h3>
                            <form onSubmit={handleQuickCustomerSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={quickCustomerData.name}
                                        onChange={handleQuickCustomerInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={quickCustomerData.phone}
                                        onChange={handleQuickCustomerInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={quickCustomerData.address}
                                        onChange={handleQuickCustomerInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Customer Type
                                    </label>
                                    <select
                                        name="customerType"
                                        value={quickCustomerData.customerType}
                                        onChange={handleQuickCustomerInputChange}
                                        className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                    >
                                        <option value="Retail">Retail</option>
                                        <option value="Wholesale">Wholesale</option>
                                    </select>
                                </div>
                                {quickCustomerData.customerType === 'Wholesale' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Credit Limit
                                            </label>
                                            <input
                                                type="number"
                                                name="creditLimit"
                                                value={quickCustomerData.creditLimit}
                                                onChange={handleQuickCustomerInputChange}
                                                className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Credit Period (days)
                                            </label>
                                            <input
                                                type="number"
                                                name="creditPeriod"
                                                value={quickCustomerData.creditPeriod}
                                                onChange={handleQuickCustomerInputChange}
                                                className="w-full rounded-md border border-gray-300 p-2.5 text-sm text-gray-900"
                                                min="0"
                                            />
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowQuickCustomerModal(false);
                                            setQuickCustomerData({
                                                name: '',
                                                phone: '',
                                                address: '',
                                                customerType: 'Retail',
                                                creditLimit: 0,
                                                creditPeriod: 0
                                            });
                                        }}
                                        size="sm"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        isLoading={isCreatingCustomer}
                                        disabled={!quickCustomerData.name.trim()}
                                        size="sm"
                                    >
                                        Create Customer
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}