'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Plus, Trash, Search } from 'lucide-react';
import { SalesQuotation, QuotationItem, Product } from '@/types';

export default function EditQuotation() {
    const router = useRouter();
    const params = useParams();
    const quotationId = params.id as string;

    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Add state for product search functionality
    const [productSearches, setProductSearches] = useState<string[]>([]);
    const [showProductDropdowns, setShowProductDropdowns] = useState<boolean[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[][]>([]);
    const productDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Initialize form with empty quotation
    const [formData, setFormData] = useState<Partial<SalesQuotation>>({
        customerId: '',
        customerName: '',
        date: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        notes: ''
    });

    // Initialize items state
    const [items, setItems] = useState<Partial<QuotationItem>[]>([]);

    // Initialize product search arrays when items change
    useEffect(() => {
        const newProductSearches = items.map((item, index) => {
            const existingSearch = productSearches[index];
            if (existingSearch && existingSearch !== '') {
                return existingSearch;
            }
            return item.productName || '';
        });
        
        const newShowProductDropdowns = new Array(items.length).fill(false);
        const newFilteredProducts = new Array(items.length).fill([]);
        
        setProductSearches(newProductSearches);
        setShowProductDropdowns(newShowProductDropdowns);
        setFilteredProducts(newFilteredProducts);
    }, [items.length]);

    // Handle click outside to close product dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            productDropdownRefs.current.forEach((ref, index) => {
                if (ref && !ref.contains(event.target as Node)) {
                    const newShowProductDropdowns = [...showProductDropdowns];
                    newShowProductDropdowns[index] = false;
                    setShowProductDropdowns(newShowProductDropdowns);
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProductDropdowns]);

    // Fetch quotation, customers and products
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch the quotation
                const quotationResponse = await fetch(`/api/quotations/${quotationId}`);
                if (!quotationResponse.ok) {
                    throw new Error('Failed to fetch quotation');
                }
                const quotationData = await quotationResponse.json();
                setFormData(quotationData);
                setItems(quotationData.items || []);

                // Fetch customers for the form
                const customersResponse = await fetch('/api/customers');
                if (!customersResponse.ok) {
                    throw new Error('Failed to fetch customers');
                }
                const customersData = await customersResponse.json();
                setCustomers(customersData);

                // Fetch products for the form
                const productsResponse = await fetch('/api/products');
                if (!productsResponse.ok) {
                    throw new Error('Failed to fetch products');
                }
                const productsData = await productsResponse.json();
                setProducts(productsData.data || []);

                setError(null);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [quotationId]);

    // Handle form field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'customerId') {
            const selectedCustomer = customers.find(customer => customer.id === value);
            setFormData({
                ...formData,
                customerId: value,
                customerName: selectedCustomer?.name || ''
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Handle product search input change
    const handleProductSearchChange = (index: number, value: string) => {
        const newProductSearches = [...productSearches];
        newProductSearches[index] = value;
        setProductSearches(newProductSearches);
        
        // Filter products based on search
        const filtered = products.filter(product => 
            product.name.toLowerCase().includes(value.toLowerCase()) ||
            product.sku?.toLowerCase().includes(value.toLowerCase())
        );
        
        const newFilteredProducts = [...filteredProducts];
        newFilteredProducts[index] = filtered;
        setFilteredProducts(newFilteredProducts);
        
        // Show dropdown if there's input
        const newShowProductDropdowns = [...showProductDropdowns];
        newShowProductDropdowns[index] = value.length > 0;
        setShowProductDropdowns(newShowProductDropdowns);
    };

    // Handle product selection from dropdown
    const handleProductSelect = (index: number, product: Product) => {
        const newProductSearches = [...productSearches];
        newProductSearches[index] = product.name;
        setProductSearches(newProductSearches);
        
        const newShowProductDropdowns = [...showProductDropdowns];
        newShowProductDropdowns[index] = false;
        setShowProductDropdowns(newShowProductDropdowns);
        
        // Update the item with selected product
        const updatedItems = [...items];
        updatedItems[index] = {
            ...updatedItems[index],
            productId: product.id.toString(),
            productName: product.name,
            unitPrice: product.price || 0
        };
        
        // Recalculate total for this item
        const quantity = updatedItems[index].quantity || 0;
        const unitPrice = Number(updatedItems[index].unitPrice) || 0;
        updatedItems[index].total = quantity * unitPrice;
        
        setItems(updatedItems);
        updateTotals(updatedItems);
    };

    // Handle item field changes
    const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updatedItems = [...items];

        updatedItems[index] = {
            ...updatedItems[index],
            [name]: value
        };

        // Recalculate total for this item
        if (name === 'quantity' || name === 'unitPrice') {
            const quantity = Number(updatedItems[index].quantity) || 0;
            const unitPrice = Number(updatedItems[index].unitPrice) || 0;
            updatedItems[index].total = quantity * unitPrice;
        }

        setItems(updatedItems);

        // Update form subtotal, tax, and total
        updateTotals(updatedItems);
    };

    // Add a new item row
    const addItem = () => {
        setItems([
            ...items,
            {
                productId: '',
                productName: '',
                quantity: 1,
                unitPrice: 0,
                total: 0
            }
        ]);
    };

    // Remove an item row
    const removeItem = (index: number) => {
        if (items.length === 1) {
            // Don't remove the last item, just reset it
            const resetItems = [{
                productId: '',
                productName: '',
                quantity: 1,
                unitPrice: 0,
                total: 0
            }];
            setItems(resetItems);
            updateTotals(resetItems);
            return;
        }

        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
        updateTotals(updatedItems);
    };

    // Update totals based on items
    const updateTotals = (currentItems: Partial<QuotationItem>[]) => {
        const subtotal = currentItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        const tax = Math.round(subtotal * 0.17); // 17% tax
        const discount = Number(formData.discount) || 0;
        const total = subtotal + tax - discount;

        setFormData(prev => ({
            ...prev,
            subtotal,
            tax,
            total
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Validate form
            if (!formData.customerId) {
                alert('Please select a customer');
                return;
            }

            if (items.length === 0 || !items[0].productId) {
                alert('Please add at least one item');
                return;
            }

            // Prepare the quotation data
            const quotationData: Partial<SalesQuotation> = {
                ...formData,
                items: items as QuotationItem[]
            };

            // Send the data to the API
            const response = await fetch(`/api/quotations/${quotationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(quotationData)
            });

            if (!response.ok) {
                throw new Error('Failed to update quotation');
            }

            // Redirect to the quotations list
            router.push('/quotations');
        } catch (err) {
            console.error('Error updating quotation:', err);
            alert('Failed to update quotation. Please try again.');
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header with actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-black">Edit Quotation</h1>
                        <p className="text-black">Update the details of this sales quotation</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/quotations')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Quotations
                        </Button>
                    </div>
                </div>

                {/* Loading and error states */}
                {loading ? (
                    <div className="text-center py-4">
                        <p className="text-black">Loading data...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-4">
                        <p className="text-red-500">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="mt-2"
                        >
                            Retry
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Customer*
                                </label>
                                <select
                                    name="customerId"
                                    value={formData.customerId || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="">Select a customer</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Date*
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Expiry Date*
                                </label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={formData.expiryDate || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Discount Amount
                                </label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={formData.discount || 0}
                                    onChange={(e) => {
                                        handleChange(e);
                                        updateTotals(items);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    min="0"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-black mb-1">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes || ''}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Add any additional information or terms..."
                                ></textarea>
                            </div>
                        </div>

                        {/* Item Management */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-black">Items</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-3 text-left text-black font-medium">Product</th>
                                            <th className="p-3 text-left text-black font-medium">Quantity</th>
                                            <th className="p-3 text-left text-black font-medium">Unit Price</th>
                                            <th className="p-3 text-left text-black font-medium">Total</th>
                                            <th className="p-3 text-left text-black font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="p-3">
                                                    <div className="relative" ref={el => { productDropdownRefs.current[index] = el; }}>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={productSearches[index] || ''}
                                                                onChange={(e) => handleProductSearchChange(index, e.target.value)}
                                                                placeholder="Search products..."
                                                                className="w-full px-2 py-1 pr-8 border border-gray-300 rounded-md"
                                                                required
                                                            />
                                                            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        </div>
                                                        {showProductDropdowns[index] && filteredProducts[index] && filteredProducts[index].length > 0 && (
                                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                                {filteredProducts[index].map((product) => (
                                                                    <div
                                                                        key={product.id}
                                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                                        onClick={() => handleProductSelect(index, product)}
                                                                    >
                                                                        <div className="font-medium">{product.name}</div>
                                                                        {product.sku && (
                                                                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                                                        )}
                                                                        <div className="text-sm text-gray-600">
                                                                            ${(product.price || 0).toFixed(2)}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        name="quantity"
                                                        value={item.quantity || 1}
                                                        onChange={(e) => handleItemChange(index, e)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                                        min="1"
                                                        required
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        name="unitPrice"
                                                        value={item.unitPrice || 0}
                                                        onChange={(e) => handleItemChange(index, e)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                                        min="0"
                                                        required
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-black font-medium">
                                                        {(item.total || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex flex-col items-end mb-8">
                            <div className="w-full md:w-1/3 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-black">Subtotal:</span>
                                    <span className="text-black font-medium">{(formData.subtotal || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-black">Tax (17%):</span>
                                    <span className="text-black font-medium">{(formData.tax || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-black">Discount:</span>
                                    <span className="text-black font-medium">{(formData.discount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="text-black font-bold">Total:</span>
                                    <span className="text-black font-bold">{(formData.total || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => router.push('/quotations')}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                Update Quotation
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </MainLayout>
    );
}