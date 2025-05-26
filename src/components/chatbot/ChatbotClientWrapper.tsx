"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the Chatbot component with no SSR
const ChatbotComponent = dynamic(
    () => import('@/components/chatbot/Chatbot'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-black">Loading AI Assistant...</p>
                </div>
            </div>
        )
    }
);

export default function ChatbotClientWrapper() {
    return <ChatbotComponent />;
} 