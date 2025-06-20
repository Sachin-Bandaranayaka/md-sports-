import { Suspense } from 'react';
import SettingsContainer from './components/SettingsContainer';
import { Loader2 } from 'lucide-react';

// Server Component for Settings Page
export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <Suspense fallback={
                <div className="h-full flex items-center justify-center p-20">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-500">Loading settings...</p>
                    </div>
                </div>
            }>
                <SettingsContainer />
            </Suspense>
        </div>
    );
}