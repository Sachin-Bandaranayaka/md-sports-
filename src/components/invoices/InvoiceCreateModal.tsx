'use client';

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Combobox } from '@/components/ui/Combobox';
import { Textarea } from '@/components/ui/Textarea';
import { Plus, Trash2, Save, X } from 'lucide-react';
// Removed framer-motion for better performance and simplicity
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';

interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    customerType: 'wholesale' | 'retail';
    creditLimit?: number;
    creditPeriod?: number;
}

interface Product {
    id: number;
    name: string;
    price: number;
    description?: string;
    sku?: string;
    stock?: number;
    weightedAverageCost?: number;
    inventoryItems?: Array<{
        shopId: string;
        quantity: number;
    }>;
}

interface Shop {
    id: string;
    name: string;
}

interface InvoiceItem {
    id: string;
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    costPrice: number;
    total: number;
    productSearch?: string;
    showProductDropdown?: boolean;
}

interface InvoiceFormData {
    customerId: number;
    customerName: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    paymentMethod: string;
    notes: string;
    shopId: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
}

interface InvoiceCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (invoice: any) => void;
    onSuccess?: () => void;
    onCustomerCreated?: (customer: Customer) => void;
    customers: Customer[];
    products: Product[];
    shops: Shop[];
    isLoading?: boolean;
    onCustomersUpdate?: (customers: Customer[]) => void;
}

const InvoiceCreateModal: React.FC<InvoiceCreateModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onSuccess,
    onCustomerCreated,
    customers = [],
    products = [],
    shops = [],
    isLoading = false,
    onCustomersUpdate
}) => {
    const { accessToken } = useAuth();
    const [formData, setFormData] = useState<InvoiceFormData>({
        customerId: 0,
        customerName: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        paymentMethod: 'Cash',
        notes: '',
        shopId: '',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    
    // Debug: Track selectedCustomer changes
    useEffect(() => {
        console.log('selectedCustomer state changed to:', selectedCustomer);
    }, [selectedCustomer]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const customerDropdownRef = useRef<HTMLDivElement>(null);
    const [itemProductDropdownRefs, setItemProductDropdownRefs] = useState<Record<string, React.RefObject<HTMLDivElement>>>({});
    
    // Debounced search values for better performance
    const debouncedCustomerSearch = useDebounce(customerSearch, 300);
    const debouncedProductSearch = useDebounce(productSearch, 300);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [customPrice, setCustomPrice] = useState<number>(0);
    const [productStock, setProductStock] = useState<number | null>(null);
    const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
    const [quickCustomerData, setQuickCustomerData] = useState({
        name: '',
        phone: '',
        address: '',
        customerType: 'retail' as 'retail' | 'wholesale',
        creditLimit: 0,
        creditPeriod: 0
    });
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);

    // Generate invoice number function
    const generateInvoiceNumber = useCallback(() => {
        const now = new Date();
        const year = now.getFullYear().toString().slice(2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `INV-${year}${month}${day}-${random}`;
    }, []);

    // Generate invoice number on modal open
    useEffect(() => {
        if (isOpen && !formData.invoiceNumber) {
            const invoiceNumber = generateInvoiceNumber();
            const defaultDueDate = new Date();
            defaultDueDate.setDate(defaultDueDate.getDate() + 30);

            setFormData(prev => ({
                ...prev,
                invoiceNumber,
                dueDate: defaultDueDate.toISOString().split('T')[0]
            }));
        }
    }, [isOpen, generateInvoiceNumber]);

    // Initialize local customers from props only once
    useEffect(() => {
        if (customers.length > 0 && localCustomers.length === 0) {
            console.log('Loading initial customers:', customers);
            setLocalCustomers(customers);
        }
    }, [customers]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
                setShowCustomerDropdown(false);
            }
            
            // Close product dropdowns when clicking outside
            Object.entries(itemProductDropdownRefs).forEach(([itemId, ref]) => {
                if (ref.current && !ref.current.contains(event.target as Node)) {
                    setFormData(prev => ({
                        ...prev,
                        items: prev.items.map(item => 
                            item.id === itemId 
                                ? { ...item, showProductDropdown: false }
                                : item
                        )
                    }));
                }
            });
        };

        if (showCustomerDropdown || Object.values(itemProductDropdownRefs).some(ref => ref.current)) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCustomerDropdown, itemProductDropdownRefs]);

    // Calculate totals when items change
    useEffect(() => {
        const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
        const total = subtotal; // No tax

        setFormData(prev => ({
            ...prev,
            subtotal,
            tax: 0,
            total
        }));
    }, [formData.items]);

    const handleCustomerSelect = useCallback((customerId: string) => {
        const customer = localCustomers.find(c => c && c.id != null && c.id.toString() === customerId);
        if (customer) {
            setSelectedCustomer(customer);
            
            // Calculate due date based on customer type and credit period
            const today = new Date();
            let dueDate = formData.invoiceDate; // Default due date
            
            if (customer.customerType === 'wholesale' && customer.creditPeriod) {
                const dueDateObj = new Date(today);
                dueDateObj.setDate(today.getDate() + customer.creditPeriod);
                dueDate = dueDateObj.toISOString().split('T')[0];
            }
            
            setFormData(prev => ({
                ...prev,
                customerId: customer.id,
                customerName: customer.name,
                dueDate: dueDate
            }));
            
            setCustomerSearch('');
            setShowCustomerDropdown(false);
        }
        setErrors(prev => ({ ...prev, customerId: '' }));
    }, [localCustomers, formData.invoiceDate]);

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
        const costPrice = selectedProduct.weightedAverageCost || 0;
        const itemTotal = finalPrice * quantity;

        // Check credit limit for wholesale customers
        if (selectedCustomer && selectedCustomer.customerType === 'wholesale' && selectedCustomer.creditLimit) {
            const currentTotal = formData.items.reduce((sum, item) => sum + item.total, 0);
            if (currentTotal + itemTotal > selectedCustomer.creditLimit) {
                alert(`Adding this item exceeds the customer's credit limit of ${selectedCustomer.creditLimit}.`);
                return;
            }
        }

        const newLineItem: InvoiceItem = {
            id: Date.now().toString(),
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: quantity,
            price: finalPrice,
            costPrice: costPrice,
            total: itemTotal,
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newLineItem]
        }));

        // Reset selection
        setSelectedProduct(null);
        setProductStock(null);
        setQuantity(1);
        setCustomPrice(0);
        setProductSearch('');
    };

    const addItem = useCallback(() => {
        const newItemId = Date.now().toString();
        const newItem: InvoiceItem = {
            id: newItemId,
            productId: 0,
            productName: '',
            quantity: 0,
            price: 0,
            costPrice: 0,
            total: 0,
            productSearch: '',
            showProductDropdown: false
        };

        // Create ref for new item's product dropdown
        const newRef = React.createRef<HTMLDivElement>();
        setItemProductDropdownRefs(prev => ({
            ...prev,
            [newItemId]: newRef
        }));

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    }, []);

    const removeItem = useCallback((itemId: string) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== itemId)
        }));
        
        // Remove ref for deleted item
        setItemProductDropdownRefs(prev => {
            const newRefs = { ...prev };
            delete newRefs[itemId];
            return newRefs;
        });
    }, []);

    const handleProductSelect = useCallback(async (product: Product) => {
        setSelectedProduct(product);
        setProductSearch(product.name);
        setShowProductDropdown(false);
        
        // Fetch stock for the selected product in the selected shop
        if (formData.shopId) {
            try {
                const response = await fetch(`/api/products/${product.id}/stock?shopId=${formData.shopId}`);
                if (response.ok) {
                    const stockData = await response.json();
                    setProductStock(stockData.stock || 0);
                } else {
                    setProductStock(0);
                }
            } catch (error) {
                console.error('Error fetching product stock:', error);
                setProductStock(0);
            }
        }
    }, [formData.shopId]);

    const handleQuickCustomerCreate = async () => {
        if (!quickCustomerData.name.trim()) {
            alert('Customer name is required.');
            return;
        }

        setIsCreatingCustomer(true);
        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(quickCustomerData),
            });

            if (response.ok) {
                const apiResponse = await response.json();
                console.log('API response:', apiResponse);
                
                // Extract the actual customer data from the API response
                const newCustomer = apiResponse.data || apiResponse;
                console.log('Extracted customer data:', newCustomer);
                
                // Add to local customers list and select it immediately
                const updatedCustomers = [...localCustomers, newCustomer];
                setLocalCustomers(updatedCustomers);
                setSelectedCustomer(newCustomer);
                setFormData(prev => ({
                    ...prev,
                    customerId: newCustomer.id,
                    customerName: newCustomer.name
                }));
                
                console.log('Selected customer set to:', newCustomer);
                console.log('Form data updated with customer:', { id: newCustomer.id, name: newCustomer.name });
                
                // Reset quick customer form
                setQuickCustomerData({
                    name: '',
                    phone: '',
                    address: '',
                    customerType: 'retail',
                    creditLimit: 0,
                    creditPeriod: 0
                });
                setShowQuickCustomerModal(false);
                
                // Update parent's customers list if callback is provided
                if (onCustomersUpdate) {
                    onCustomersUpdate(updatedCustomers);
                }
                
                // Notify parent component to update customers list (do this last to avoid state conflicts)
                if (onCustomerCreated) {
                    onCustomerCreated(newCustomer);
                }
            } else {
                const errorData = await response.json();
                if (errorData.error === 'Duplicate mobile number') {
                    alert('A customer with this mobile number already exists. Please use a different mobile number.');
                } else {
                    alert(errorData.message || 'Failed to create customer.');
                }
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Error creating customer.');
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    const updateItem = useCallback((itemId: string, field: keyof InvoiceItem, value: any) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item, [field]: value };

                    // Handle product selection
                    if (field === 'productId') {
                        const product = products.find(p => p.id.toString() === value);
                        if (product) {
                            updatedItem.productName = product.name;
                            updatedItem.price = product.price;
                        }
                    }

                    // Recalculate total
                    updatedItem.total = updatedItem.quantity * updatedItem.price;

                    return updatedItem;
                }
                return item;
            })
        }));
    }, [products]);

    // Memoized filtered customers based on debounced search
    const filteredCustomers = useMemo(() => {
        const validCustomers = localCustomers.filter(customer => customer && customer.id != null);
        
        if (!debouncedCustomerSearch.trim()) return validCustomers.slice(0, 50); // Limit initial results
        
        const searchTerm = debouncedCustomerSearch.toLowerCase();
        return validCustomers.filter(customer =>
            customer.name?.toLowerCase().includes(searchTerm) ||
            customer.phone?.toLowerCase().includes(searchTerm) ||
            customer.address?.toLowerCase().includes(searchTerm)
        ).slice(0, 50); // Limit search results for performance
    }, [localCustomers, debouncedCustomerSearch]);

    // Enhanced search function that supports multiple words in any order
    const enhancedProductSearch = useCallback((products: Product[], searchTerm: string) => {
        if (!searchTerm.trim()) return products;
        
        // Enhanced search - supports multiple words in any order
        const searchWords = searchTerm.toLowerCase().trim().split(/\s+/);
        
        return products.filter(product => {
            const productName = product.name.toLowerCase();
            const productSku = (product.sku || '').toLowerCase();
            
            // Each word must appear somewhere in the product name or SKU
            return searchWords.every(word => 
                productName.includes(word) || productSku.includes(word)
            );
        });
    }, []);

    // Memoized filtered products based on debounced search and selected shop
    const filteredProducts = useMemo(() => {
        // Ensure products is always an array
        const safeProducts = Array.isArray(products) ? products : [];
        
        // Filter products that have inventory in the selected shop
        let shopFilteredProducts = safeProducts;
        if (formData.shopId) {
            shopFilteredProducts = safeProducts.filter(product => {
                if (!product.inventoryItems || !Array.isArray(product.inventoryItems)) {
                    // If no inventory items, show product but with warning
                    return true;
                }
                return product.inventoryItems.some(inv => 
                    inv.shopId === formData.shopId && inv.quantity > 0
                );
            });
        }
        
        if (!debouncedProductSearch.trim()) {
            return shopFilteredProducts.slice(0, 50); // Limit initial results
        }
        
        return enhancedProductSearch(shopFilteredProducts, debouncedProductSearch).slice(0, 50);
    }, [products, debouncedProductSearch, formData.shopId, enhancedProductSearch]);

    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.customerId) {
            newErrors.customerId = 'Customer is required';
        }

        if (!formData.invoiceNumber) {
            newErrors.invoiceNumber = 'Invoice number is required';
        }

        if (!formData.dueDate) {
            newErrors.dueDate = 'Due date is required';
        }

        if (formData.items.length === 0) {
            newErrors.items = 'At least one item is required';
        }

        // Shop is required for sales invoices
        if (!formData.shopId) {
            newErrors.shopId = 'Shop selection is required';
        }

        formData.items.forEach((item, index) => {
            if (!item.productId) {
                newErrors[`item-${index}-product`] = 'Product is required';
            }
            if (item.quantity <= 0) {
                newErrors[`item-${index}-quantity`] = 'Quantity must be greater than 0';
            }
            if (item.price <= 0) {
                newErrors[`item-${index}-price`] = 'Price must be greater than 0';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = async (event?: React.MouseEvent) => {
        // Prevent any default form submission behavior
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        // Prevent double-click submissions using both state and ref
        if (submitting || isSubmittingRef.current) {
            console.log('Already submitting, preventing duplicate submission');
            return;
        }

        console.log('Starting invoice submission...');
        
        // Set both submission locks
        isSubmittingRef.current = true;
        
        // Ensure invoiceNumber is generated before validation
        const currentInvoiceNumber = formData.invoiceNumber || generateInvoiceNumber();
        
        // Update form data with invoice number if missing
        if (!formData.invoiceNumber) {
            setFormData(prev => ({ ...prev, invoiceNumber: currentInvoiceNumber }));
        }
        
        if (!validateForm()) {
            isSubmittingRef.current = false;
            return;
        }
        
        // Final credit limit check for wholesale customers
        if (selectedCustomer && selectedCustomer.customerType === 'wholesale' && selectedCustomer.creditLimit) {
            const finalTotal = formData.items.reduce((sum, item) => sum + item.total, 0);
            if (finalTotal > selectedCustomer.creditLimit) {
                alert(`The total invoice amount of LKR ${finalTotal.toLocaleString()} exceeds the customer's credit limit of LKR ${selectedCustomer.creditLimit.toLocaleString()}. Please remove some items or reduce quantities.`);
                isSubmittingRef.current = false;
                return;
            }
        }

        setSubmitting(true);
        try {
            console.log('Form data shopId before processing:', formData.shopId);
            console.log('Form data shopId type:', typeof formData.shopId);
            console.log('Form data shopId length:', formData.shopId?.length);
            
            const invoiceData: any = {
                invoiceNumber: currentInvoiceNumber,
                invoiceDate: formData.invoiceDate,
                dueDate: formData.dueDate,
                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
                subtotal: formData.subtotal,
                tax: formData.tax,
                total: formData.total,
                customerId: formData.customerId || undefined, // Ensure it's undefined if 0
                items: formData.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                }))
            };
            
            // Only include shopId if it's not empty
            if (formData.shopId && formData.shopId.trim() !== '') {
                invoiceData.shopId = formData.shopId;
                console.log('Including shopId in request:', formData.shopId);
            } else {
                console.log('Excluding shopId from request (empty or not selected)');
            }
            
            console.log('Invoice data being sent:', JSON.stringify(invoiceData, null, 2));
            console.log('Invoice number:', currentInvoiceNumber);
            console.log('Customer ID:', formData.customerId);

            // Get authentication token from useAuth hook
            const token = accessToken;
            
            console.log('Auth token found:', token ? `${token.substring(0, 10)}...` : 'none');
            
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            
            console.log('Request headers:', headers);
            
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers,
                body: JSON.stringify(invoiceData),
            });

            const result = await response.json();

            console.log('Invoice creation response:', { status: response.status, result });
            
            if (!response.ok) {
                console.error('Invoice creation failed:', { status: response.status, result });
                throw new Error(result.message || result.error || 'Failed to create invoice');
            }

            // Check if the response explicitly indicates failure
            if (result.success === false) {
                console.error('Invoice creation failed:', { status: response.status, result });
                throw new Error(result.message || result.error || 'Failed to create invoice');
            }

            console.log('Invoice created successfully:', result.data);

            if (onSave) {
                onSave(result);
            }

            if (onSuccess) {
                onSuccess();
            }

            handleClose();
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice. Please try again.');
        } finally {
            setSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    const handleClose = () => {
        // Reset submission locks
        setSubmitting(false);
        isSubmittingRef.current = false;
        
        // Generate a new invoice number for the next time the modal opens
        const newInvoiceNumber = generateInvoiceNumber();
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 30);
        
        setFormData({
            customerId: 0,
            customerName: '',
            invoiceNumber: newInvoiceNumber,
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: defaultDueDate.toISOString().split('T')[0],
            paymentMethod: 'Cash',
            notes: '',
            shopId: '',
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0
        });
        setErrors({});
        setSelectedCustomer(null);
        setCustomerSearch('');
        setProductSearch('');
        setSelectedProduct(null);
        setQuantity(1);
        setCustomPrice(0);
        setProductStock(null);

        onClose();
    };

    // Memoized options for better performance
    const customerOptions = useMemo(() => 
        Array.isArray(localCustomers) ? localCustomers
            .filter(customer => customer && customer.id != null)
            .map(customer => ({
                value: customer.id.toString(),
                label: customer.name
            })) : [], [localCustomers]
    );

    const productOptions = useMemo(() => 
        Array.isArray(filteredProducts) ? filteredProducts.map(product => ({
            value: product.id.toString(),
            label: `${product.name} - LKR ${product.price.toFixed(2)}`
        })) : [], [filteredProducts]
    );

    const footer = (
        <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-black">
                Total: LKR {formData.total.toFixed(2)}
            </div>
            <div className="flex space-x-3">
                <Button variant="outline" onClick={handleClose} disabled={submitting}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={submitting}
                    disabled={submitting || isLoading}
                >
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? 'Creating...' : 'Create Invoice'}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Create New Invoice"
                size="4xl"
                footer={footer}
            >
                <div className="space-y-6">
                    {/* Shop Selection */}
                    <div>
                        <Label htmlFor="shop" className="text-black font-semibold">Shop *</Label>
                        <select
                            id="shop"
                            value={formData.shopId || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, shopId: e.target.value }))}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white ${
                                errors.shopId ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Select a shop *</option>
                            {Array.isArray(shops) && shops.map(shop => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.name}
                                </option>
                            ))}
                        </select>
                        {errors.shopId && (
                            <p className="text-red-500 text-sm mt-1">{errors.shopId}</p>
                        )}
                    </div>

                    {/* Invoice Header */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Selection with Search */}
                        <div className="relative" ref={customerDropdownRef}>
                            <Label htmlFor="customer" className="text-black font-semibold">Customer *</Label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    {(() => {
                                        console.log('Rendering customer field, selectedCustomer:', selectedCustomer);
                                        return selectedCustomer;
                                    })() ? (
                                        <div className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                                            <div className="text-black">
                                                <div className="font-medium">{selectedCustomer?.name || 'No Name'}</div>
                                                <div className="text-sm text-gray-600">{selectedCustomer?.phone || 'No Phone'} - {selectedCustomer?.customerType || 'No Type'}</div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedCustomer(null);
                                                    setFormData(prev => ({ ...prev, customerId: 0, customerName: '' }));
                                                    setCustomerSearch('');
                                                }}
                                                className="text-red-600 border-red-300 hover:bg-red-50"
                                            >
                                                Change
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Input
                                                value={customerSearch}
                                                onChange={(e) => {
                                                    setCustomerSearch(e.target.value);
                                                    setShowCustomerDropdown(true);
                                                }}
                                                onFocus={() => setShowCustomerDropdown(true)}
                                                placeholder="Search customers..."
                                                className={`text-black ${errors.customerId ? 'border-red-500' : 'border-gray-300'}`}
                                            />
                                            {showCustomerDropdown && filteredCustomers.length > 0 && (
                                                <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {filteredCustomers.map(customer => (
                                                        <div
                                                            key={customer.id}
                                                            onClick={() => handleCustomerSelect(customer.id.toString())}
                                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black border-b border-gray-100 last:border-b-0"
                                                        >
                                                            <div className="font-medium">{customer.name}</div>
                                                            <div className="text-sm text-gray-600">{customer.phone} - {(() => {
                                                                // Parse address if it's a JSON string
                                                                if (customer.address && typeof customer.address === 'string') {
                                                                    try {
                                                                        const addressObj = JSON.parse(customer.address);
                                                                        return addressObj.mainAddress || customer.address;
                                                                    } catch {
                                                                        return customer.address;
                                                                    }
                                                                }
                                                                return customer.address || 'No address';
                                                            })()}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowQuickCustomerModal(true)}
                                    className="text-black border-gray-300"
                                >
                                    Quick Add
                                </Button>
                            </div>
                            {errors.customerId && (
                                <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="invoiceNumber" className="text-black font-semibold">Invoice Number *</Label>
                            <Input
                                id="invoiceNumber"
                                value={formData.invoiceNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                                className={`text-black ${errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.invoiceNumber && (
                                <p className="text-red-500 text-sm mt-1">{errors.invoiceNumber}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="invoiceDate" className="text-black font-semibold">Invoice Date *</Label>
                            <Input
                                id="invoiceDate"
                                type="date"
                                value={formData.invoiceDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                                className="text-black border-gray-300"
                            />
                        </div>

                        <div>
                            <Label htmlFor="dueDate" className="text-black font-semibold">Due Date *</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                className={`text-black ${errors.dueDate ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.dueDate && (
                                <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="paymentMethod" className="text-black font-semibold">Payment Method</Label>
                            <select
                                id="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>
                    </div>



                {/* Invoice Items */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-black">Invoice Items</h3>
                        <Button variant="outline" size="sm" onClick={addItem} className="text-black border-gray-300">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                        </Button>
                    </div>

                    {errors.items && (
                        <p className="text-red-500 text-sm mb-4">{errors.items}</p>
                    )}

                    <div className="space-y-4 max-h-64 overflow-y-auto overflow-x-visible">
                        {formData.items.map((item, index) => (
                            <div
                                key={item.id}
                                className="grid grid-cols-12 gap-3 items-end p-4 border border-gray-200 rounded-lg bg-gray-50 relative"
                            >
                                    <div className="col-span-4">
                                        <Label className="text-black font-medium">Product *</Label>
                                        <div className="relative" ref={itemProductDropdownRefs[item.id]}>
                                            <Input
                                                type="text"
                                                placeholder="Search for a product..."
                                                value={item.productSearch || ''}
                                                onChange={(e) => {
                                                    const searchValue = e.target.value;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        items: prev.items.map(i => 
                                                            i.id === item.id 
                                                                ? { ...i, productSearch: searchValue, showProductDropdown: true }
                                                                : i
                                                        )
                                                    }));
                                                }}
                                                onFocus={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        items: prev.items.map(i => 
                                                            i.id === item.id 
                                                                ? { ...i, showProductDropdown: true }
                                                                : i
                                                        )
                                                    }));
                                                }}
                                                className={`text-black ${
                                                    errors[`item-${index}-product`] ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            
                                            {item.showProductDropdown && (
                                <div className="fixed bg-white border border-gray-300 rounded-md shadow-lg z-[99999] max-h-48 overflow-y-auto min-w-[300px]" 
                                     style={{
                                         top: (itemProductDropdownRefs[item.id]?.current?.getBoundingClientRect()?.bottom || 0) + window.scrollY + 'px',
                                         left: (itemProductDropdownRefs[item.id]?.current?.getBoundingClientRect()?.left || 0) + window.scrollX + 'px',
                                         width: (itemProductDropdownRefs[item.id]?.current?.getBoundingClientRect()?.width || 0) + 'px'
                                     }}>
                                                    {enhancedProductSearch(products, item.productSearch || '')
                                                        .filter(product => {
                                                            // Filter by shop if selected
                                                            if (!formData.shopId) return true;
                                                            if (!product.inventoryItems || !Array.isArray(product.inventoryItems)) return true;
                                                            return product.inventoryItems.some(inv => 
                                                                inv.shopId === formData.shopId && inv.quantity > 0
                                                            );
                                                        })
                                                        .slice(0, 10)
                                                        .map(product => {
                                                            const stockInfo = product.inventoryItems?.find(inv => inv.shopId === formData.shopId);
                                                            const availableStock = stockInfo?.quantity || 0;
                                                            
                                                            return (
                                                                <div
                                                                    key={product.id}
                                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                                    onClick={() => {
                                                                        const selectedProduct = products.find(p => p.id === product.id);
                                                                        if (selectedProduct) {
                                                                            setFormData(prev => ({
                                                                                ...prev,
                                                                                items: prev.items.map(i => 
                                                                                    i.id === item.id 
                                                                                        ? { 
                                                                                            ...i, 
                                                                                            productId: product.id,
                                                                                            productName: product.name,
                                                                                            price: product.price,
                                                                                            costPrice: product.weightedAverageCost || 0,
                                                                                            total: i.quantity * product.price,
                                                                                            productSearch: product.name,
                                                                                            showProductDropdown: false
                                                                                        }
                                                                                        : i
                                                                                )
                                                                            }));
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="flex justify-between items-center">
                                                                        <div>
                                                                            <div className="font-medium text-black">{product.name}</div>
                                                                            {product.sku && (
                                                                                <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="font-medium text-black">LKR {product.price.toFixed(2)}</div>
                                                                            <div className="text-xs text-gray-500">Stock: {availableStock}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                    {enhancedProductSearch(products, item.productSearch || '')
                                                        .filter(product => {
                                                            // Filter by shop if selected
                                                            if (!formData.shopId) return true;
                                                            if (!product.inventoryItems || !Array.isArray(product.inventoryItems)) return true;
                                                            return product.inventoryItems.some(inv => 
                                                                inv.shopId === formData.shopId && inv.quantity > 0
                                                            );
                                                        }).length === 0 && (
                                                        <div className="px-3 py-2 text-gray-500 text-center">
                                                            No products found
                                                            {/* Debug info */}
                                                            <div className="text-xs text-red-500 mt-1">
                                                                Debug: {products.length} total products, Search: "{item.productSearch}", Shop: {formData.shopId || 'none'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {errors[`item-${index}-product`] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[`item-${index}-product`]}</p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <Label className="text-black font-medium">Quantity *</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="0"
                                            value={item.quantity === 0 ? '' : item.quantity.toString()}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                updateItem(item.id, 'quantity', value === '' ? 0 : parseInt(value) || 0);
                                            }}
                                            className={`text-black ${errors[`item-${index}-quantity`] ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors[`item-${index}-quantity`] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[`item-${index}-quantity`]}</p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <Label className="text-black font-medium">Price *</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={item.price === 0 ? '' : item.price.toString()}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                updateItem(item.id, 'price', value === '' ? 0 : parseFloat(value) || 0);
                                            }}
                                            className={`text-black ${errors[`item-${index}-price`] ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors[`item-${index}-price`] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[`item-${index}-price`]}</p>
                                        )}
                                    </div>

                                    <div className="col-span-3">
                                        <Label className="text-black font-medium">Total</Label>
                                        <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-black font-semibold">
                                            LKR {item.total.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="col-span-1">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeItem(item.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                            </div>
                        ))}
                    </div>

                    {formData.items.length === 0 && (
                        <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-gray-400 mb-2">
                                <Plus className="w-8 h-8 mx-auto" />
                            </div>
                            <p className="text-black">No items added yet. Click "Add Item" to get started.</p>
                        </div>
                    )}
                </div>

                {/* Invoice Summary */}
                {formData.items.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="space-y-2">
                            <div className="flex justify-between text-black">
                                <span className="font-medium">Subtotal:</span>
                                <span className="font-semibold">LKR {formData.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t border-blue-300 pt-2 text-black">
                                <span>Total:</span>
                                <span>LKR {formData.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <Label htmlFor="notes" className="text-black font-semibold">Notes</Label>
                    <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes or comments..."
                        rows={3}
                        className="text-black border-gray-300 focus:border-blue-500"
                    />
                </div>
            </div>
        </Modal>

        {/* Quick Customer Creation Modal */}
        <Modal
            isOpen={showQuickCustomerModal}
            onClose={() => setShowQuickCustomerModal(false)}
            title="Quick Add Customer"
            size="md"
        >
            <div className="space-y-4">
                <div>
                    <Label htmlFor="quickName" className="text-black font-semibold">Name *</Label>
                    <Input
                        id="quickName"
                        value={quickCustomerData.name}
                        onChange={(e) => setQuickCustomerData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Customer name"
                        className="text-black border-gray-300"
                    />
                </div>

                <div>
                    <Label htmlFor="quickPhone" className="text-black font-semibold">Phone</Label>
                    <Input
                        id="quickPhone"
                        value={quickCustomerData.phone}
                        onChange={(e) => setQuickCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone number"
                        className="text-black border-gray-300"
                    />
                </div>

                <div>
                    <Label htmlFor="quickAddress" className="text-black font-semibold">Address</Label>
                    <Input
                        id="quickAddress"
                        value={quickCustomerData.address}
                        onChange={(e) => setQuickCustomerData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Address"
                        className="text-black border-gray-300"
                    />
                </div>

                <div>
                    <Label htmlFor="quickCustomerType" className="text-black font-semibold">Customer Type</Label>
                    <select
                        id="quickCustomerType"
                        value={quickCustomerData.customerType}
                        onChange={(e) => setQuickCustomerData(prev => ({ ...prev, customerType: e.target.value as 'retail' | 'wholesale' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                    >
                        <option value="retail">Retail</option>
                        <option value="wholesale">Wholesale</option>
                    </select>
                </div>

                {quickCustomerData.customerType === 'wholesale' && (
                    <>
                        <div>
                            <Label htmlFor="quickCreditLimit" className="text-black font-semibold">Credit Limit</Label>
                            <Input
                                id="quickCreditLimit"
                                type="number"
                                min="0"
                                value={quickCustomerData.creditLimit}
                                onChange={(e) => setQuickCustomerData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                                placeholder="Credit limit"
                                className="text-black border-gray-300"
                            />
                        </div>

                        <div>
                            <Label htmlFor="quickCreditPeriod" className="text-black font-semibold">Credit Period (days)</Label>
                            <Input
                                id="quickCreditPeriod"
                                type="number"
                                min="0"
                                value={quickCustomerData.creditPeriod}
                                onChange={(e) => setQuickCustomerData(prev => ({ ...prev, creditPeriod: parseInt(e.target.value) || 0 }))}
                                placeholder="Credit period in days"
                                className="text-black border-gray-300"
                            />
                        </div>
                    </>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowQuickCustomerModal(false)}
                        disabled={isCreatingCustomer}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleQuickCustomerCreate}
                        isLoading={isCreatingCustomer}
                        disabled={isCreatingCustomer || !quickCustomerData.name.trim()}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        {isCreatingCustomer ? 'Creating...' : 'Create Customer'}
                    </Button>
                </div>
            </div>
        </Modal>
    </>
    );
};

export default InvoiceCreateModal;