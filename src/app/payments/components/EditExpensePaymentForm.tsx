'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
}

interface ExpensePayment {
    id: number;
    amount: number;
    description: string;
    reference?: string;
    date: string;
    createdAt: string;
    account: {
        id: number;
        name: string;
        type: string;
    };
    toAccount: {
        id: number;
        name: string;
        type: string;
    };
    paymentMethod?: string;
    referenceNumber?: string;
}

interface EditExpensePaymentFormProps {
    expense: ExpensePayment;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditExpensePaymentForm({ expense, onClose, onSuccess }: EditExpensePaymentFormProps) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    const [formData, setFormData] = useState({
        amount: expense.amount.toString(),
        description: expense.description || '',
        paymentMethod: expense.paymentMethod || 'cash',
        expenseAccountId: expense.account.id.toString(),
        fromAccountId: expense.toAccount.id.toString(),
        referenceNumber: expense.referenceNumber || expense.reference || ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/accounting/accounts');
            if (response.ok) {
                const result = await response.json();
                setAccounts(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }
        
        if (!formData.expenseAccountId) {
            newErrors.expenseAccountId = 'Please select an expense account';
        }
        
        if (!formData.fromAccountId) {
            newErrors.fromAccountId = 'Please select a source account';
        }
        
        if (formData.expenseAccountId === formData.fromAccountId) {
            newErrors.fromAccountId = 'Source account must be different from expense account';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setSubmitting(true);
        setErrors({});
        
        try {
            const response = await fetch(`/api/payments/expenses?id=${expense.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: parseFloat(formData.amount),
                    description: formData.description,
                    paymentMethod: formData.paymentMethod,
                    expenseAccountId: formData.expenseAccountId,
                    fromAccountId: formData.fromAccountId,
                    referenceNumber: formData.referenceNumber || undefined
                }),
            });
            
            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const errorData = await response.json();
                setErrors({ submit: errorData.message || 'Failed to update expense payment' });
            }
        } catch (error) {
            console.error('Error updating expense payment:', error);
            setErrors({ submit: 'An error occurred while updating the expense payment' });
        } finally {
            setSubmitting(false);
        }
    };

    // Filter accounts for dropdowns
    const expenseAccounts = accounts.filter(account => 
        account.type === 'expense' || account.name.toLowerCase().includes('expense')
    );
    
    const sourceAccounts = accounts.filter(account => 
        account.type === 'asset' || account.type === 'liability' || 
        account.name.toLowerCase().includes('cash') || 
        account.name.toLowerCase().includes('bank')
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold">Edit Expense Payment</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-6 w-6 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount *
                            </label>
                            <Input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0.01"
                                placeholder="Enter amount"
                                className={errors.amount ? 'border-red-500' : ''}
                            />
                            {errors.amount && (
                                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <Input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter description (optional)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expense Account *
                            </label>
                            <select
                                name="expenseAccountId"
                                value={formData.expenseAccountId}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                                    errors.expenseAccountId ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Select expense account</option>
                                {expenseAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} ({account.type})
                                    </option>
                                ))}
                            </select>
                            {errors.expenseAccountId && (
                                <p className="text-red-500 text-xs mt-1">{errors.expenseAccountId}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pay From Account *
                            </label>
                            <select
                                name="fromAccountId"
                                value={formData.fromAccountId}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                                    errors.fromAccountId ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Select source account</option>
                                {sourceAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} - Balance: ${typeof account.balance === 'number' ? account.balance.toFixed(2) : parseFloat(account.balance || '0').toFixed(2)}
                                    </option>
                                ))}
                            </select>
                            {errors.fromAccountId && (
                                <p className="text-red-500 text-xs mt-1">{errors.fromAccountId}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method
                            </label>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="check">Check</option>
                                <option value="card">Card</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reference Number
                            </label>
                            <Input
                                type="text"
                                name="referenceNumber"
                                value={formData.referenceNumber}
                                onChange={handleInputChange}
                                placeholder="Enter reference number (optional)"
                            />
                        </div>

                        {errors.submit && (
                            <div className="text-red-500 text-sm">{errors.submit}</div>
                        )}

                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || loading}
                                className="flex-1"
                            >
                                {submitting ? 'Updating...' : 'Update Payment'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}