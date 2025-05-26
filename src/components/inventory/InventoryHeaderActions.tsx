'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, ArrowUpDown, ShoppingBag, PlusCircle, Package, Store, Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AddInventoryModal from '@/components/inventory/AddInventoryModal';
import React from 'react';

export default function InventoryHeaderActions() {
    const router = useRouter();
    const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ id: number, name: string } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Toggle filter panel
    const toggleFilterPanel = () => {
        // This is now handled in the InventoryClientWrapper
        const event = new CustomEvent('toggle-filter-panel');
        window.dispatchEvent(event);
    };

    // Add Product handler
    const handleAddProduct = () => {
        router.push('/purchases');
    };

    // Add Direct Inventory handler
    const handleAddInventory = () => {
        setSelectedProduct(null);
        setShowAddInventoryModal(true);
    };

    // Handle successful inventory addition
    const handleInventoryAdded = () => {
        router.refresh();
    };

    const handleImportButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click(); // Trigger click on hidden file input
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/products/bulk-import', {
                method: 'POST',
                body: formData,
            });

            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.error('Failed to parse API response as JSON:', jsonError);
                const responseText = await response.text(); // Try to get raw text
                console.error('Raw API response text:', responseText);
                throw new Error('Failed to parse server response. Raw text: ' + (responseText || 'Empty response'));
            }

            if (!response.ok || !result || !result.success) {
                console.error('Bulk import failed. API Response:', result);
                throw new Error(result?.message || 'Bulk import failed. Please check the file and try again.');
            }
            setUploadSuccess(result.message || 'Products imported successfully!');
            router.refresh(); // Refresh inventory list
        } catch (err: any) {
            console.error('Error uploading file:', err);
            setUploadError(err.message || 'An unexpected error occurred during upload.');
        } finally {
            setIsUploading(false);
            // Reset file input to allow re-uploading the same file if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            {uploadError && (
                <div className="my-2 p-3 bg-red-100 text-red-700 border border-red-400 rounded-md">
                    Error: {uploadError}
                    <button onClick={() => setUploadError(null)} className="ml-4 text-red-700 font-bold">X</button>
                </div>
            )}
            {uploadSuccess && (
                <div className="my-2 p-3 bg-green-100 text-green-700 border border-green-400 rounded-md">
                    Success: {uploadSuccess}
                    <button onClick={() => setUploadSuccess(null)} className="ml-4 text-green-700 font-bold">X</button>
                </div>
            )}
            <div className="flex flex-wrap gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFilterPanel}
                >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/inventory/categories')}
                >
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Manage Categories
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/inventory/new')}
                >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    New Product
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddInventory}
                >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add to Inventory
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddProduct}
                >
                    <Package className="w-4 h-4 mr-2" />
                    Add Stock via Purchase
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/inventory/distribution')}
                    className="text-black"
                >
                    <Store className="h-4 w-4 mr-2" />
                    Shop Distribution
                </Button>
                <Button
                    variant="info"
                    size="sm"
                    onClick={() => window.location.href = '/api/products/template'}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                </Button>
                <Button
                    variant="success"
                    size="sm"
                    onClick={handleImportButtonClick}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4 mr-2" />
                    )}
                    Import Products
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    style={{ display: 'none' }}
                />
            </div>

            {/* Add Inventory Modal */}
            <AddInventoryModal
                isOpen={showAddInventoryModal}
                onClose={() => setShowAddInventoryModal(false)}
                onSuccess={handleInventoryAdded}
                preselectedProduct={selectedProduct}
            />
        </>
    );
} 