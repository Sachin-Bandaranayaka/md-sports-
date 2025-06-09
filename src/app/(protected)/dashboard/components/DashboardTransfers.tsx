'use client';

import { useAuth } from '@/hooks/useAuth';

// Types for our data
interface Transfer {
    id: string;
    source: string;
    destination: string;
    status: string;
    date: string;
    items: number;
}

interface DashboardTransfersProps {
    recentTransfers: Transfer[] | null;
}

export default function DashboardTransfers({ recentTransfers }: DashboardTransfersProps) {
    const { user } = useAuth();

    // Check if user has permission to view transfers
    const hasTransferPermission = () => {
        if (!user?.permissions) return false;
        return user.permissions.some((permission: string) => 
            permission.toLowerCase().includes('transfer') || 
            permission.toLowerCase().includes('inventory')
        );
    };

    // Don't render if user doesn't have permission
    if (!hasTransferPermission()) {
        return null;
    }
    // Use provided data - no fallback to dummy data
    const transfersData = recentTransfers || [];

    return (
        <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Transfers</h3>
                <button className="text-sm text-primary hover:text-primary-dark">View All Transfers</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        </tr>
                    </thead>
                    <tbody className="bg-tertiary divide-y divide-gray-200">
                        {transfersData.length > 0 ? (
                            transfersData.map((transfer) => (
                                <tr key={transfer.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transfer.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transfer.source}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transfer.destination}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${transfer.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'}`}>
                                            {transfer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transfer.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transfer.items}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center">
                                    <div className="text-gray-500">
                                        <p className="text-sm font-medium">No transfers found</p>
                                        <p className="text-xs mt-1">Create your first inventory transfer to see it here</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}