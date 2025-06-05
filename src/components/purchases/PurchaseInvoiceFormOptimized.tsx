'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Plus, Minus, Save, X, Search, Calculator, Upload, Download } from 'lucide-react';
import { PurchaseInvoice, Supplier, Product, Category, Shop } from '@/types';
import {
  useCreatePurchaseInvoiceOptimized,
  useUpdatePurchaseInvoiceOptimized
} from '@/hooks/usePurchaseInvoicesOptimized';
import { useSuppliersOptimized, useProducts, useCategories, useShops } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { z } from 'zod';

// Validation schema
const purchaseInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  supplierId: z.number().min(1, 'Supplier is required'),
  date: z.string().min(1, 'Date is required'),
  items: z.array(z.object({
    productId: z.number().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  })).min(1, 'At least one item is required'),
  status: z.enum(['paid', 'partial', 'unpaid']),
  notes: z.string().optional(),
});

interface PurchaseInvoiceItem {
  id?: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  shopDistributions?: Array<{
    shopId: number;
    quantity: number;
  }>;
}

interface PurchaseInvoiceFormOptimizedProps {
  invoice?: PurchaseInvoice;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

// Memoized item row component
const ItemRow = React.memo(({
  item,
  index,
  products,
  onUpdate,
  onRemove,
  errors
}: {
  item: PurchaseInvoiceItem;
  index: number;
  products: Product[];
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  errors?: any;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products.slice(0, 10);
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [products, searchTerm]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === item.productId);
  }, [products, item.productId]);

  const handleProductSelect = useCallback((product: Product) => {
    onUpdate(index, 'productId', product.id);
    onUpdate(index, 'product', product);
    onUpdate(index, 'unitPrice', product.price || 0);
    setShowProductSearch(false);
    setSearchTerm('');
  }, [index, onUpdate]);

  const handleQuantityChange = useCallback((quantity: number) => {
    onUpdate(index, 'quantity', quantity);
    onUpdate(index, 'totalPrice', quantity * item.unitPrice);
  }, [index, item.unitPrice, onUpdate]);

  const handleUnitPriceChange = useCallback((unitPrice: number) => {
    onUpdate(index, 'unitPrice', unitPrice);
    onUpdate(index, 'totalPrice', item.quantity * unitPrice);
  }, [index, item.quantity, onUpdate]);

  return (
    <div className="grid grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      {/* Product Selection */}
      <div className="col-span-4 relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product *
        </label>
        <div className="relative">
          <input
            type="text"
            value={selectedProduct ? selectedProduct.name : searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowProductSearch(true);
            }}
            onFocus={() => setShowProductSearch(true)}
            placeholder="Search products..."
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors?.items?.[index]?.productId ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        </div>

        {/* Product dropdown */}
        {showProductSearch && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    SKU: {product.sku} | Price: ${product.price?.toFixed(2) || '0.00'}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">No products found</div>
            )}
          </div>
        )}

        {errors?.items?.[index]?.productId && (
          <p className="text-red-500 text-xs mt-1">{errors.items[index].productId}</p>
        )}
      </div>

      {/* Quantity */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantity *
        </label>
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors?.items?.[index]?.quantity ? 'border-red-500' : 'border-gray-300'
            }`}
        />
        {errors?.items?.[index]?.quantity && (
          <p className="text-red-500 text-xs mt-1">{errors.items[index].quantity}</p>
        )}
      </div>

      {/* Unit Price */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Unit Price *
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors?.items?.[index]?.unitPrice ? 'border-red-500' : 'border-gray-300'
            }`}
        />
        {errors?.items?.[index]?.unitPrice && (
          <p className="text-red-500 text-xs mt-1">{errors.items[index].unitPrice}</p>
        )}
      </div>

      {/* Total Price */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Total Price
        </label>
        <input
          type="text"
          value={`$${item.totalPrice.toFixed(2)}`}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
        />
      </div>

      {/* Remove Button */}
      <div className="col-span-2 flex items-end">
        <Button
          type="button"
          onClick={() => onRemove(index)}
          variant="outline"
          size="sm"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

ItemRow.displayName = 'ItemRow';

export default function PurchaseInvoiceFormOptimized({
  invoice,
  onSuccess,
  onCancel,
  mode = 'create'
}: PurchaseInvoiceFormOptimizedProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || '',
    supplierId: invoice?.supplierId || 0,
    date: invoice?.date ? new Date(invoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    status: invoice?.status || 'unpaid',
    notes: invoice?.notes || '',
  });

  const [items, setItems] = useState<PurchaseInvoiceItem[]>(
    invoice?.items?.map(item => ({
      id: item.id,
      productId: item.productId,
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice || (item.quantity * item.unitPrice),
    })) || [
      {
        productId: 0,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      }
    ]
  );

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  // Data fetching
  const { data: suppliers = [] } = useSuppliersOptimized();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: shops = [] } = useShops();

  // Mutations
  const createMutation = useCreatePurchaseInvoiceOptimized();
  const updateMutation = useUpdatePurchaseInvoiceOptimized();

  // Computed values
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // Auto-save draft functionality
  const saveDraft = useCallback(
    debounce(() => {
      const draft = {
        formData,
        items,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`purchase-invoice-draft-${mode}`, JSON.stringify(draft));
    }, 1000),
    [formData, items, mode]
  );

  // Load draft on mount
  useEffect(() => {
    if (mode === 'create') {
      const savedDraft = localStorage.getItem('purchase-invoice-draft-create');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          const draftAge = Date.now() - new Date(draft.timestamp).getTime();

          // Only load draft if it's less than 1 hour old
          if (draftAge < 3600000) {
            setFormData(draft.formData);
            setItems(draft.items);
            toast.info('Draft loaded from previous session');
          }
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [mode]);

  // Auto-save effect
  useEffect(() => {
    if (mode === 'create') {
      saveDraft();
    }
  }, [formData, items, saveDraft, mode]);

  // Form handlers
  const handleFormDataChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleItemUpdate = useCallback((index: number, field: string, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });

    // Clear item error when user makes changes
    if (errors.items?.[index]?.[field]) {
      setErrors(prev => ({
        ...prev,
        items: {
          ...prev.items,
          [index]: {
            ...prev.items[index],
            [field]: undefined
          }
        }
      }));
    }
  }, [errors]);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, {
      productId: 0,
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  }, [items.length]);

  // Validation
  const validateForm = useCallback(() => {
    try {
      const validationData = {
        ...formData,
        supplierId: parseInt(formData.supplierId.toString()) || 0,
        items: items.map(item => ({
          productId: parseInt(item.productId.toString()) || 0,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      };

      purchaseInvoiceSchema.parse(validationData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: any = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          formattedErrors[path] = err.message;
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  }, [formData, items]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        supplierId: parseInt(formData.supplierId.toString()),
        items: items.map(item => ({
          productId: parseInt(item.productId.toString()),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      };

      if (mode === 'create') {
        await createMutation.mutateAsync(submitData);
        toast.success('Purchase invoice created successfully');

        // Clear draft
        localStorage.removeItem('purchase-invoice-draft-create');
      } else {
        await updateMutation.mutateAsync({
          id: invoice!.id.toString(),
          data: submitData
        });
        toast.success('Purchase invoice updated successfully');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/purchases');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(mode === 'create' ? 'Failed to create purchase invoice' : 'Failed to update purchase invoice');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, items, mode, createMutation, updateMutation, invoice, onSuccess, router]);

  // Import from CSV functionality
  const handleImportCSV = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const importedItems: PurchaseInvoiceItem[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length < 3) continue;

          const productName = values[headers.indexOf('product') || 0]?.trim();
          const quantity = parseInt(values[headers.indexOf('quantity') || 1]) || 1;
          const unitPrice = parseFloat(values[headers.indexOf('price') || 2]) || 0;

          const product = products.find(p =>
            p.name.toLowerCase().includes(productName.toLowerCase()) ||
            p.sku?.toLowerCase().includes(productName.toLowerCase())
          );

          if (product) {
            importedItems.push({
              productId: product.id,
              product,
              quantity,
              unitPrice,
              totalPrice: quantity * unitPrice
            });
          }
        }

        if (importedItems.length > 0) {
          setItems(importedItems);
          toast.success(`Imported ${importedItems.length} items from CSV`);
        } else {
          toast.error('No valid items found in CSV');
        }
      } catch (error) {
        toast.error('Failed to parse CSV file');
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  }, [products]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create Purchase Invoice' : 'Edit Purchase Invoice'}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === 'create' ? 'Add a new purchase invoice to your records' : 'Update purchase invoice details'}
          </p>
        </div>

        <div className="flex space-x-3">
          {mode === 'create' && (
            <>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
                id="csv-import"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('csv-import')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCalculator(!showCalculator)}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculator
          </Button>

          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-700">Total Amount</div>
          <div className="text-2xl font-bold text-blue-900">${totalAmount.toFixed(2)}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-700">Total Items</div>
          <div className="text-2xl font-bold text-green-900">{totalItems}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-700">Line Items</div>
          <div className="text-2xl font-bold text-purple-900">{items.length}</div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => handleFormDataChange('invoiceNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="INV-001"
              />
              {errors.invoiceNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.invoiceNumber}</p>
              )}
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => handleFormDataChange('supplierId', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.supplierId ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value={0}>Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="text-red-500 text-xs mt-1">{errors.supplierId}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleFormDataChange('date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFormDataChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleFormDataChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes or comments..."
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
            <Button type="button" onClick={addItem} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <ItemRow
                key={index}
                item={item}
                index={index}
                products={products}
                onUpdate={handleItemUpdate}
                onRemove={removeItem}
                errors={errors}
              />
            ))}
          </div>

          {errors.items && typeof errors.items === 'string' && (
            <p className="text-red-500 text-sm mt-2">{errors.items}</p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === 'create' ? 'Create Invoice' : 'Update Invoice'}
          </Button>
        </div>
      </form>

      {/* Simple Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Calculator</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCalculator(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                Total: ${totalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                {totalItems} items across {items.length} line items
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}