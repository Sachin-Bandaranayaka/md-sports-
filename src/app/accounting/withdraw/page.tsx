'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Calendar, FileText, Hash, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authPost } from '@/utils/api';
import { Account } from '@/types';

interface WithdrawalFormData {
  date: string;
  description: string;
  accountId: string;
  amount: string;
  reference: string;
}

export default function PersonalWithdrawal() {
  const router = useRouter();
  const [formData, setFormData] = useState<WithdrawalFormData>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    accountId: '',
    amount: '',
    reference: ''
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const response = await fetch('/api/accounting/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      
      // Filter for active income and asset accounts
      const incomeAccounts = data.filter((account: Account) => 
        (account.type === 'income' || account.type === 'asset') && account.isActive
      );
      setAccounts(incomeAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('Failed to load accounts');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.accountId) {
      setError('Please select an account');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }

    // Check if account has sufficient balance
    const selectedAccount = accounts.find(acc => acc.id === formData.accountId);
    if (selectedAccount && Number(selectedAccount.balance) < parseFloat(formData.amount)) {
      setError('Insufficient balance in the selected account');
      return;
    }

    try {
      setLoading(true);
      
      // Create withdrawal transaction
      const transactionData = {
        date: formData.date,
        description: `Personal Withdrawal: ${formData.description}`,
        accountId: formData.accountId,
        type: 'withdrawal',
        amount: parseFloat(formData.amount),
        reference: formData.reference || undefined,
        category: 'Personal Withdrawal'
      };

      await authPost('/api/accounting/transactions', transactionData);
      
      // Redirect back to accounting page
      router.push('/accounting');
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      setError('Failed to process withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAccounts) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Accounts Available</h2>
          <p className="text-gray-600 mb-6">You need at least one active income or asset account to make withdrawals.</p>
          <Button onClick={() => router.push('/accounting')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounting
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/accounting')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounting
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Personal Withdrawal</h1>
          <p className="text-gray-600 mt-2">
            Withdraw funds from income and asset accounts for personal use
          </p>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Withdrawal Details
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Account Selection */}
            <div>
              <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                From Account
              </label>
              <select
                id="accountId"
                name="accountId"
                value={formData.accountId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (Balance: ${Number(account.balance).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Amount
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter withdrawal description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Reference */}
            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="h-4 w-4 inline mr-1" />
                Reference (Optional)
              </label>
              <input
                type="text"
                id="reference"
                name="reference"
                value={formData.reference}
                onChange={handleInputChange}
                placeholder="Enter reference number..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/accounting')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Process Withdrawal
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}