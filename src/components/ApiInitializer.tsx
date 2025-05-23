'use client';

import { useEffect } from 'react';
import { setupFetchInterceptor } from '@/utils/api';

/**
 * Component that initializes API-related utilities
 * This includes setting up the fetch interceptor for CSRF tokens
 */
export default function ApiInitializer() {
    useEffect(() => {
        // Initialize fetch interceptor to handle CSRF tokens
        setupFetchInterceptor();

        console.log('API utilities initialized');
    }, []);

    // This component doesn't render anything
    return null;
} 