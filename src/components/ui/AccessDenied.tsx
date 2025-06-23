import { Shield } from 'lucide-react';

export function AccessDenied({ message = "Access Denied" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 h-full">
      <Shield className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
      <p className="text-gray-600">{message}</p>
      <p className="text-sm text-gray-500 mt-4">
        You do not have the necessary permissions to view this page. 
        If you believe this is an error, please contact your system administrator.
      </p>
    </div>
  );
} 