'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MainLayout from '@/components/layout/MainLayout';

export default function BulkImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState<any>(null);
    const [dragActive, setDragActive] = useState(false);
    const [shopNames, setShopNames] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch available shop names
    useEffect(() => {
        const fetchShopNames = async () => {
            try {
                const response = await fetch('/api/shops/names');
                const data = await response.json();
                if (data.success) {
                    setShopNames(data.shopNames);
                }
            } catch (error) {
                console.error('Failed to fetch shop names:', error);
            }
        };
        fetchShopNames();
    }, []);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const downloadTemplate = () => {
        window.open('/api/products/template', '_blank');
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadResults(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/products/bulk-import', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            setUploadResults(result);
            
            if (result.success) {
                setFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (error) {
            setUploadResults({
                success: false,
                message: 'Upload failed. Please try again.',
                details: []
            });
        } finally {
            setIsUploading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setUploadResults(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Bulk Import Products</h1>
                        <p className="text-gray-500">Upload an Excel file to import multiple products at once</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadTemplate}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download Template
                        </Button>
                    </div>
                </div>

                {/* Instructions */}
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Download the Excel template, fill in your product data, and upload it below. 
                        Make sure category names match existing categories in your system.
                    </AlertDescription>
                </Alert>

                {/* Upload Area */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            dragActive 
                                ? 'border-blue-400 bg-blue-50' 
                                : file 
                                    ? 'border-green-400 bg-green-50' 
                                    : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        
                        {file ? (
                            <div className="space-y-4">
                                <FileSpreadsheet className="mx-auto h-12 w-12 text-green-500" />
                                <div>
                                    <p className="text-lg font-medium text-green-700">{file.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <div className="flex gap-2 justify-center">
                                    <Button
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        variant="primary"
                                    >
                                        {isUploading ? 'Uploading...' : 'Upload & Import'}
                                    </Button>
                                    <Button
                                        onClick={clearFile}
                                        variant="outline"
                                        disabled={isUploading}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div>
                                    <p className="text-lg font-medium text-gray-900">
                                        Drop your Excel file here, or click to browse
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Supports .xlsx, .xls, and .csv files
                                    </p>
                                </div>
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                >
                                    Browse Files
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results */}
                {uploadResults && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Import Results</h3>
                        
                        <Alert className={uploadResults.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                            {uploadResults.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <AlertDescription className={uploadResults.success ? "text-green-800" : "text-red-800"}>
                                {uploadResults.message}
                            </AlertDescription>
                        </Alert>

                        {uploadResults.details && uploadResults.details.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-medium mb-2">Detailed Results:</h4>
                                <div className="max-h-60 overflow-y-auto border rounded">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Row</th>
                                                <th className="px-3 py-2 text-left">Product</th>
                                                <th className="px-3 py-2 text-left">Status</th>
                                                <th className="px-3 py-2 text-left">Message</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {uploadResults.details.map((detail: any, index: number) => (
                                                <tr key={index} className="border-t">
                                                    <td className="px-3 py-2">{detail.row}</td>
                                                    <td className="px-3 py-2">{detail.productName || 'N/A'}</td>
                                                    <td className="px-3 py-2">
                                                        {detail.success ? (
                                                            <span className="text-green-600 font-medium">Success</span>
                                                        ) : (
                                                            <span className="text-red-600 font-medium">Error</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">{detail.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Template Guidelines */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Excel Template Guidelines</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium mb-2">Required Columns:</h4>
                            <ul className="text-sm space-y-1 text-gray-600">
                                <li>• <strong>Name</strong> - Product name</li>
                                <li>• <strong>RetailPrice</strong> - Selling price</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Optional Columns:</h4>
                            <ul className="text-sm space-y-1 text-gray-600">
                                <li>• <strong>SKU</strong> - Product code</li>
                                <li>• <strong>Description</strong> - Product details</li>
                                <li>• <strong>CostPrice</strong> - Purchase cost</li>
                                <li>• <strong>Barcode</strong> - Product barcode</li>
                                <li>• <strong>CategoryName</strong> - Category name</li>
                                <li>• <strong>InitialQuantity</strong> - Starting stock (leave blank for no initial stock)</li>
                                <li>• <strong>ShopName</strong> - Shop for initial stock (required if InitialQuantity &gt; 0)</li>
                            </ul>
                            <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> If you set InitialQuantity to a value greater than 0, 
                                    you must also provide a valid ShopName. Otherwise, leave both fields empty.
                                </p>
                                {shopNames.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm text-blue-800 font-medium">Available Shop Names:</p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            {shopNames.join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 