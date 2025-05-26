'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MessageSquare } from 'lucide-react';

// Dynamically import the Chatbot component with client-side only rendering and no preloading
const DynamicChatbot = dynamic(
    () => import('./Chatbot').then(mod => ({ default: mod.Chatbot })),
    {
        ssr: false,
        loading: () => null,
        // Setting suspense to true ensures it doesn't preload
        suspense: true
    }
);

export function ChatbotWrapper() {
    const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showChatbot, setShowChatbot] = useState(false);

    // Check if chatbot is enabled
    useEffect(() => {
        const checkChatbotEnabled = async () => {
            try {
                setIsLoading(true);
                // Use a lightweight check for settings initially
                const response = await fetch('/api/settings?key=ai_chatbot_enabled', {
                    priority: 'low', // Set low priority so it doesn't block other resources
                    cache: 'force-cache' // Try using cached results if available
                });
                const data = await response.json();

                if (data.success && data.settings) {
                    // Handle both array and single key responses
                    if (Array.isArray(data.settings)) {
                        const chatbotSetting = data.settings.find((setting: { key: string }) =>
                            setting.key === 'ai_chatbot_enabled'
                        );
                        setIsEnabled(chatbotSetting?.value === 'true');
                    } else {
                        setIsEnabled(data.settings.value === 'true');
                    }
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

        // Delay the check to prioritize page content loading
        const timer = setTimeout(checkChatbotEnabled, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Don't render anything while checking settings or if disabled
    if (isLoading || !isEnabled) {
        return null;
    }

    // Render only the button if chatbot is not open
    if (!showChatbot) {
        return (
            <button
                onClick={() => setShowChatbot(true)}
                className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
                aria-label="Open chatbot"
            >
                <MessageSquare size={24} />
            </button>
        );
    }

    // Only render the full chatbot when it's needed
    return (
        <DynamicChatbot onClose={() => setShowChatbot(false)} />
    );
} 