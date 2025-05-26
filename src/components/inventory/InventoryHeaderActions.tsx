'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, ArrowUpDown, ShoppingBag, PlusCircle, Package, Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AddInventoryModal from '@/components/inventory/AddInventoryModal';

export default function InventoryHeaderActions() {
    const router = useRouter();
    const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ id: number, name: string } | null>(null);

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

    return (
        <>
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