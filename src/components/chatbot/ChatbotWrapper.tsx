'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the Chatbot component with client-side only rendering
const DynamicChatbot = dynamic(
    () => import('./Chatbot').then(mod => ({ default: mod.Chatbot })),
    { ssr: false }
);

export function ChatbotWrapper() {
    const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if chatbot is enabled
    useEffect(() => {
        const checkChatbotEnabled = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/settings');
                const data = await response.json();

                if (data.success && data.settings) {
                    // Convert array of settings to key-value object
                    const settingsObj: Record<string, string> = {};
                    data.settings.forEach((setting: { key: string, value: string }) => {
                        settingsObj[setting.key] = setting.value;
                    });

                    // Check if chatbot is enabled
                    setIsEnabled(settingsObj['ai_chatbot_enabled'] === 'true');
                } else {
                    // Default to enabled if can't fetch settings
                    setIsEnabled(true);
                }
            } catch (error) {
                console.error('Failed to check chatbot settings:', error);
                // Default to enabled if there's an error
                setIsEnabled(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkChatbotEnabled();
    }, []);

    // Don't render anything while checking settings
    if (isLoading) {
        return null;
    }

    // Only render the chatbot if it's enabled
    if (isEnabled) {
        return (
            <Suspense fallback={null}>
                <DynamicChatbot />
            </Suspense>
        );
    }

    // Return null if chatbot is disabled
    return null;
} 