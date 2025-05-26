import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import PermissionsDebugContent from './components/PermissionsDebugContent';

export default function PermissionsDebugPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">User Permissions Debug</h1>

            <Suspense fallback={
                <div className="h-full flex items-center justify-center p-20">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-500">Loading permissions data...</p>
                    </div>
                </div>
            }>
                <PermissionsDebugContent />
            </Suspense>
        </div>
    );
} 