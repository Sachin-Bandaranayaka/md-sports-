'use client';

import { useEffect, useState } from 'react';
import { setupFetchInterceptor } from '@/utils/api';

/**
 * Component that initializes API-related utilities
 * This includes setting up the fetch interceptor for CSRF tokens
 */
export default function ApiInitializer() {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Delay initialization to prioritize page rendering
        const initializeApi = () => {
            if (!isInitialized) {
                try {
                    // Initialize fetch interceptor to handle CSRF tokens
                    setupFetchInterceptor();
                    setIsInitialized(true);
                } catch (error) {
                    console.error('Failed to initialize API utilities:', error);
                }
            }
        };

        // Initialize after a short delay to not block page rendering
        const timer = setTimeout(initializeApi, 200);

        // Clean up timer if component unmounts
        return () => clearTimeout(timer);
    }, [isInitialized]);

    // This component doesn't render anything
    return null;
} 