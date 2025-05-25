"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import {
    Loader2,
    Save,
    XCircle,
    Plus,
    Minus,
    Search,
    FileText,
    DollarSign,
    Calendar,
    ArrowLeft,
    Trash,
    Store,
    Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PurchaseInvoice, Supplier, Product } from "@/types";
import { prepareItemsForSubmission } from '../fix';

// Animation variants
const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.1,
            duration: 0.3,
        },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut",
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3 },
    },
};

export default function EditPurchaseInvoice() {
    const router = useRouter();
    const params = useParams();
    const invoiceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [showNewProductModal, setShowNewProductModal] = useState(false);
    const [newProductData, setNewProductData] = useState({
        name: "",
        sku: "",
        description: "",
        retailPrice: 0,
        basePrice: 0,
        categoryId: "",
    });
    const [categories, setCategories] = useState<any[]>([]);
    const [shops, setShops] = useState<any[]>([]);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
        null,
    );
    const [showDistributionModal, setShowDistributionModal] = useState(false);
    const [distribution, setDistribution] = useState<{ [key: number]: number }[]>(
        [],
    );

    // Form data
    const [formData, setFormData] = useState<Partial<PurchaseInvoice>>({
        invoiceNumber: "",
        date: new Date().toISOString().split("T")[0],
        dueDate: "",
        supplierId: "",
        status: "unpaid",
        notes: "",
        items: [],
        totalAmount: 0,
        paidAmount: 0,
    });

    // Load invoice data, suppliers and products
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch the invoice data
                const invoiceResponse = await fetch(`/api/purchases/${invoiceId}`);
                if (!invoiceResponse.ok) {
                    throw new Error("Failed to fetch invoice data");
                }
                const invoiceData = await invoiceResponse.json();

                // Fetch suppliers
                const suppliersResponse = await fetch("/api/suppliers");
                if (!suppliersResponse.ok) {
                    throw new Error("Failed to fetch suppliers");
                }
                const suppliersData = await suppliersResponse.json();
                setSuppliers(suppliersData);

                // Fetch products
                const productsResponse = await fetch("/api/products");
                if (!productsResponse.ok) {
                    throw new Error("Failed to fetch products");
                }
                const productsData = await productsResponse.json();
                // Ensure products is an array
                const productsArray = Array.isArray(productsData)
                    ? productsData
                    : productsData.data && Array.isArray(productsData.data)
                        ? productsData.data
                        : [];
                setProducts(productsArray);
                setFilteredProducts(productsArray);

                // Initialize form data with the invoice data
                setFormData(invoiceData);

                // Initialize distribution array
                if (invoiceData.items && invoiceData.items.length > 0) {
                    const initialDistribution = invoiceData.items.map((item: any) => {
                        return item.distribution || {};
                    });
                    setDistribution(initialDistribution);
                }

                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [invoiceId]);

    // Calculate total amount
    useEffect(() => {
        if (formData.items && formData.items.length > 0) {
            const total = formData.items.reduce((sum, item) => {
                return sum + item.quantity * item.unitPrice;
            }, 0);

            setFormData((prev) => ({
                ...prev,
                totalAmount: total,
            }));
        }
    }, [formData.items]);

    // Load shops and categories
    useEffect(() => {
        const fetchAdditionalData = async () => {
            try {
                // Fetch categories
                const categoriesResponse = await fetch("/api/products/categories");
                if (categoriesResponse.ok) {
                    const categoriesData = await categoriesResponse.json();
                    setCategories(categoriesData.data || []);
                }

                // Fetch shops
                const shopsResponse = await fetch("/api/shops");
                if (shopsResponse.ok) {
                    const shopsData = await shopsResponse.json();
                    // Ensure shops is always an array
                    const shopsArray = Array.isArray(shopsData)
                        ? shopsData
                        : shopsData?.data && Array.isArray(shopsData.data)
                            ? shopsData.data
                            : [];
                    setShops(shopsArray);
                } else {
                    console.error("Failed to fetch shops:", shopsResponse.statusText);
                    setShops([]);
                }
            } catch (err) {
                console.error("Error fetching additional data:", err);
                // Initialize with empty arrays on error
                setShops([]);
            }
        };

        fetchAdditionalData();
    }, []);

    // Handle form field changes
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle adding a new item to the invoice
    const handleAddItem = () => {
        setFormData((prev) => {
            const newItems = [
                ...(prev.items || []),
                {
                    productId: "",
                    productName: "",
                    quantity: "",
                    unitPrice: "",
                    subtotal: 0,
                },
            ];

            // Initialize distribution for the new item
            const newDistribution = [...distribution];
            newDistribution.push({});
            setDistribution(newDistribution);

            return {
                ...prev,
                items: newItems,
            };
        });
    };

    // Handle changes to item fields
    const handleItemChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        index: number,
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const newItems = [...(prev.items || [])];

            if (name === "productId" && value) {
                // Check if products is an array before using find
                const selectedProduct = Array.isArray(products)
                    ? products.find((p) => p.id.toString() === value)
                    : null;

                if (selectedProduct) {
                    newItems[index] = {
                        ...newItems[index],
                        productId: value,
                        productName: selectedProduct.name,
                        unitPrice: selectedProduct.weightedAverageCost || "",
                    };

                    // Recalculate subtotal
                    const qty =
                        newItems[index].quantity === ""
                            ? 0
                            : Number(newItems[index].quantity);
                    const price =
                        newItems[index].unitPrice === ""
                            ? 0
                            : Number(newItems[index].unitPrice);
                    newItems[index].subtotal = qty * price;
                }
            } else {
                newItems[index] = {
                    ...newItems[index],
                    [name]: value,
                };

                // Recalculate subtotal if quantity or unitPrice changed
                if (name === "quantity" || name === "unitPrice") {
                    const qty =
                        newItems[index].quantity === ""
                            ? 0
                            : Number(newItems[index].quantity);
                    const price =
                        newItems[index].unitPrice === ""
                            ? 0
                            : Number(newItems[index].unitPrice);
                    newItems[index].subtotal = qty * price;
                }
            }

            return {
                ...prev,
                items: newItems,
            };
        });
    };

    // Handle removing an item from the invoice
    const handleRemoveItem = (index: number) => {
        setFormData((prev) => {
            const newItems = [...(prev.items || [])];
            newItems.splice(index, 1);

            // Also remove the distribution for this item
            const newDistribution = [...distribution];
            newDistribution.splice(index, 1);
            setDistribution(newDistribution);

            return {
                ...prev,
                items: newItems,
            };
        });
    };

    // Handle opening the distribution modal for an item
    const handleOpenDistributionModal = (index: number) => {
        setSelectedItemIndex(index);
        setShowDistributionModal(true);
    };

    // Handle changes to the distribution of an item across shops
    const handleDistributionChange = (shopId: number, quantity: number) => {
        if (selectedItemIndex === null) return;

        const newDistribution = [...distribution];
        newDistribution[selectedItemIndex] = {
            ...newDistribution[selectedItemIndex],
            [shopId]: quantity,
        };
        setDistribution(newDistribution);
    };

    // Calculate the total distributed quantity for an item
    const getTotalDistributed = (index: number) => {
        if (!distribution[index]) return 0;
        return Object.values(distribution[index]).reduce(
            (sum, qty) => sum + qty,
            0,
        );
    };

    // Handle creating a new product
    const handleCreateProduct = async () => {
        try {
            // Validate product data
            if (!newProductData.name || !newProductData.basePrice) {
                alert("Please enter product name and base price");
                return;
            }

            setSubmitting(true);

            // Create the product
            const response = await fetch("/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newProductData),
            });

            if (!response.ok) {
                throw new Error("Failed to create product");
            }

            const createdProduct = await response.json();

            // Add the new product to the products list
            setProducts((prev) => [...prev, createdProduct.data]);
            setFilteredProducts((prev) => [...prev, createdProduct.data]);

            // Close the modal and reset form
            setShowNewProductModal(false);
            setNewProductData({
                name: "",
                sku: "",
                description: "",
                retailPrice: 0,
                basePrice: 0,
                categoryId: "",
            });

            alert("Product created successfully");
        } catch (err) {
            console.error("Error creating product:", err);
            alert("Failed to create product");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Validate form data
            if (!formData.supplierId) {
                alert("Please select a supplier");
                return;
            }

            if (!formData.items || formData.items.length === 0) {
                alert("Please add at least one item");
                return;
            }

            for (const item of formData.items) {
                if (!item.productId || !item.quantity || !item.unitPrice) {
                    alert("Please fill in all item details");
                    return;
                }
            }

            setSubmitting(true);

            // Create a copy of the form data to avoid mutating the state directly
            const formattedData = { ...formData };

            // Convert date to ISO string if it exists (YYYY-MM-DD -> YYYY-MM-DDT00:00:00.000Z)
            if (formattedData.date) {
                const dateObj = new Date(formattedData.date);
                formattedData.date = dateObj.toISOString();
            }

            // Convert dueDate to ISO string if it exists
            if (formattedData.dueDate) {
                const dueDateObj = new Date(formattedData.dueDate);
                formattedData.dueDate = dueDateObj.toISOString();
            }

            // Prepare items with proper data types
            const processedItems = prepareItemsForSubmission(formattedData.items || []);

            // Set the distributions data
            const distributions = [...distribution];

            const dataToSubmit = {
                invoiceNumber: formattedData.invoiceNumber,
                supplierId: Number(formattedData.supplierId),
                status: formattedData.status,
                date: formattedData.date,
                dueDate: formattedData.dueDate || null,
                total: Number(formattedData.totalAmount),
                distributions,
                items: processedItems,
            };

            console.log("Submitting data:", JSON.stringify(dataToSubmit, null, 2));

            // Update the purchase invoice
            const response = await fetch(`/api/purchases/${invoiceId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToSubmit),
            });

            let errorMessage = "Failed to update purchase invoice";

            if (!response.ok) {
                // Try to parse error response
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                    console.error("API Error Details:", errorData);
                } catch (parseError) {
                    console.error("Failed to parse error response:", parseError);
                }
                throw new Error(errorMessage);
            }

            // Navigate back to purchases list
            router.push("/purchases");
        } catch (err) {
            console.error("Error updating purchase invoice:", err);
            setError("Failed to update purchase invoice. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Filter products when searching
    const handleProductSearch = (query: string) => {
        if (!query) {
            setFilteredProducts(products);
            return;
        }

        const filtered = products.filter(
            (product) =>
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                (product.sku &&
                    product.sku.toLowerCase().includes(query.toLowerCase())),
        );
        setFilteredProducts(filtered);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={pageVariants}
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 hover:bg-transparent"
                                onClick={() => router.push("/purchases")}
                            >
                                <ArrowLeft className="h-5 w-5 text-black" />
                            </Button>
                            <h1 className="text-2xl font-bold text-black">
                                Edit Purchase Invoice
                            </h1>
                        </div>
                        <p className="text-black">
                            Update purchase invoice details and items
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
                    )}

                    <motion.div
                        variants={cardVariants}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {/* Invoice Details Card */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-primary" />
                                Invoice Details
                            </h2>
                            <div className="space-y-4">
                                {/* Invoice Number */}
                                <div>
                                    <label
                                        htmlFor="invoiceNumber"
                                        className="block text-sm font-medium text-black"
                                    >
                                        Invoice Number
                                    </label>
                                    <input
                                        type="text"
                                        id="invoiceNumber"
                                        name="invoiceNumber"
                                        value={formData.invoiceNumber || ""}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                        required
                                    />
                                </div>

                                {/* Supplier */}
                                <div>
                                    <label
                                        htmlFor="supplierId"
                                        className="block text-sm font-medium text-black"
                                    >
                                        Supplier
                                    </label>
                                    <select
                                        id="supplierId"
                                        name="supplierId"
                                        value={formData.supplierId || ""}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                        required
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map((supplier) => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date and Due Date */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="date"
                                            className="block text-sm font-medium text-black"
                                        >
                                            Date
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Calendar className="h-4 w-4 text-black" />
                                            </div>
                                            <input
                                                type="date"
                                                id="date"
                                                name="date"
                                                value={formData.date || ""}
                                                onChange={handleChange}
                                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="dueDate"
                                            className="block text-sm font-medium text-black"
                                        >
                                            Due Date
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Calendar className="h-4 w-4 text-black" />
                                            </div>
                                            <input
                                                type="date"
                                                id="dueDate"
                                                name="dueDate"
                                                value={formData.dueDate || ""}
                                                onChange={handleChange}
                                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label
                                        htmlFor="status"
                                        className="block text-sm font-medium text-black"
                                    >
                                        Status
                                    </label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status || "unpaid"}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="partial">Partially Paid</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>

                                {/* Paid Amount (if status is partial or paid) */}
                                {(formData.status === "partial" ||
                                    formData.status === "paid") && (
                                        <div>
                                            <label
                                                htmlFor="paidAmount"
                                                className="block text-sm font-medium text-black"
                                            >
                                                Paid Amount
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <DollarSign className="h-4 w-4 text-black" />
                                                </div>
                                                <input
                                                    type="number"
                                                    id="paidAmount"
                                                    name="paidAmount"
                                                    value={formData.paidAmount || 0}
                                                    onChange={handleChange}
                                                    min="0"
                                                    step="0.01"
                                                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                />
                                            </div>
                                        </div>
                                    )}

                                {/* Notes */}
                                <div>
                                    <label
                                        htmlFor="notes"
                                        className="block text-sm font-medium text-black"
                                    >
                                        Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={formData.notes || ""}
                                        onChange={handleChange}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <DollarSign className="h-5 w-5 mr-2 text-primary" />
                                Invoice Summary
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="font-medium">Total Items:</span>
                                    <span>{formData.items?.length || 0}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="font-medium">Total Amount:</span>
                                    <span className="font-bold">
                                        Rs. {(formData.totalAmount || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="font-medium">Status:</span>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${formData.status === "paid"
                                                ? "bg-green-100 text-green-800"
                                                : formData.status === "partial"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {formData.status === "paid"
                                            ? "Paid"
                                            : formData.status === "partial"
                                                ? "Partially Paid"
                                                : "Unpaid"}
                                    </span>
                                </div>
                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full flex justify-center items-center"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        ) : (
                                            <Save className="h-5 w-5 mr-2" />
                                        )}
                                        Save Invoice
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full mt-2"
                                        onClick={() => router.push("/purchases")}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Items Section */}
                    <motion.div
                        variants={cardVariants}
                        className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold flex items-center">
                                <Package className="h-5 w-5 mr-2 text-primary" />
                                Invoice Items
                            </h2>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowNewProductModal(true)}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    New Product
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleAddItem}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Item
                                </Button>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Product
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Quantity
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Unit Price
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Subtotal
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Distribution
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {formData.items && formData.items.length > 0 ? (
                                        formData.items.map((item, index) => (
                                            <motion.tr
                                                key={index}
                                                variants={itemVariants}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <select
                                                        name="productId"
                                                        value={item.productId || ""}
                                                        onChange={(e) => handleItemChange(e, index)}
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                        required
                                                    >
                                                        <option value="">Select Product</option>
                                                        {products.map((product) => (
                                                            <option key={product.id} value={product.id}>
                                                                {product.name} ({product.sku || "No SKU"})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <input
                                                        type="number"
                                                        name="quantity"
                                                        value={item.quantity || ""}
                                                        onChange={(e) => handleItemChange(e, index)}
                                                        min="1"
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                        required
                                                    />
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <span className="text-black">Rs.</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            name="unitPrice"
                                                            value={item.unitPrice || ""}
                                                            onChange={(e) => handleItemChange(e, index)}
                                                            min="0"
                                                            step="0.01"
                                                            className="pl-12 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                            required
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap font-medium">
                                                    Rs.{" "}
                                                    {item.subtotal ? item.subtotal.toLocaleString() : "0"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenDistributionModal(index)}
                                                        disabled={!item.productId || !item.quantity}
                                                    >
                                                        <Store className="h-4 w-4 mr-1" />
                                                        {getTotalDistributed(index) > 0
                                                            ? `${getTotalDistributed(index)} Distributed`
                                                            : "Distribute"}
                                                    </Button>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-6 text-center text-black"
                                            >
                                                No items added yet. Click "Add Item" to add products to
                                                this invoice.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </form>

                {/* New Product Modal */}
                {showNewProductModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                            <div className="flex justify-between items-center border-b p-4">
                                <h2 className="text-xl font-bold">Add New Product</h2>
                                <button
                                    onClick={() => setShowNewProductModal(false)}
                                    className="text-black hover:text-gray-900"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-black"
                                    >
                                        Product Name*
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={newProductData.name}
                                        onChange={(e) =>
                                            setNewProductData({
                                                ...newProductData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="sku"
                                        className="block text-sm font-medium text-black"
                                    >
                                        SKU
                                    </label>
                                    <input
                                        type="text"
                                        id="sku"
                                        value={newProductData.sku}
                                        onChange={(e) =>
                                            setNewProductData({
                                                ...newProductData,
                                                sku: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="description"
                                        className="block text-sm font-medium text-black"
                                    >
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={newProductData.description}
                                        onChange={(e) =>
                                            setNewProductData({
                                                ...newProductData,
                                                description: e.target.value,
                                            })
                                        }
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="basePrice"
                                            className="block text-sm font-medium text-black"
                                        >
                                            Base Price*
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-black">Rs.</span>
                                            </div>
                                            <input
                                                type="number"
                                                id="basePrice"
                                                value={newProductData.basePrice}
                                                onChange={(e) =>
                                                    setNewProductData({
                                                        ...newProductData,
                                                        basePrice: parseFloat(e.target.value) || 0,
                                                    })
                                                }
                                                min="0"
                                                step="0.01"
                                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="retailPrice"
                                            className="block text-sm font-medium text-black"
                                        >
                                            Retail Price
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-black">Rs.</span>
                                            </div>
                                            <input
                                                type="number"
                                                id="retailPrice"
                                                value={newProductData.retailPrice}
                                                onChange={(e) =>
                                                    setNewProductData({
                                                        ...newProductData,
                                                        retailPrice: parseFloat(e.target.value) || 0,
                                                    })
                                                }
                                                min="0"
                                                step="0.01"
                                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label
                                        htmlFor="categoryId"
                                        className="block text-sm font-medium text-black"
                                    >
                                        Category
                                    </label>
                                    <select
                                        id="categoryId"
                                        value={newProductData.categoryId}
                                        onChange={(e) =>
                                            setNewProductData({
                                                ...newProductData,
                                                categoryId: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="border-t p-4 flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowNewProductModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleCreateProduct}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Plus className="h-4 w-4 mr-2" />
                                    )}
                                    Create Product
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Distribution Modal */}
                {showDistributionModal &&
                    selectedItemIndex !== null &&
                    formData.items && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                                <div className="flex justify-between items-center border-b p-4">
                                    <h2 className="text-xl font-bold">
                                        Distribute {formData.items[selectedItemIndex].productName}
                                    </h2>
                                    <button
                                        onClick={() => setShowDistributionModal(false)}
                                        className="text-black hover:text-gray-900"
                                    >
                                        <XCircle className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="p-4">
                                    <p className="mb-4">
                                        Total Quantity:{" "}
                                        <span className="font-bold">
                                            {formData.items[selectedItemIndex].quantity}
                                        </span>
                                    </p>
                                    <p className="mb-4">
                                        Distributed:{" "}
                                        <span className="font-bold">
                                            {getTotalDistributed(selectedItemIndex)}
                                        </span>
                                    </p>
                                    <p className="mb-4 text-sm text-black">
                                        Distribute this product quantity across your shops:
                                    </p>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {shops.map((shop) => (
                                            <div
                                                key={shop.id}
                                                className="flex items-center justify-between border-b pb-2"
                                            >
                                                <span className="font-medium">{shop.name}</span>
                                                <input
                                                    type="number"
                                                    value={
                                                        distribution[selectedItemIndex]?.[shop.id] !==
                                                            undefined
                                                            ? distribution[selectedItemIndex][shop.id]
                                                            : ""
                                                    }
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value === ""
                                                                ? 0
                                                                : parseInt(e.target.value);
                                                        handleDistributionChange(shop.id, value);
                                                    }}
                                                    min="0"
                                                    max={
                                                        formData.items?.[selectedItemIndex]?.quantity || 0
                                                    }
                                                    className="w-24 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="border-t p-4 flex justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowDistributionModal(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
            </motion.div>
        </MainLayout>
    );
}
