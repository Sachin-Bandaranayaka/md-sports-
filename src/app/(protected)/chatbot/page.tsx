import React, { Suspense } from 'react';
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
                    <p className="text-gray-500">Loading AI Assistant...</p>
                </div>
            </div>
        )
    }
);

export default function ChatbotPage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">MS Sports AI Assistant</h2>
                <p className="mb-4">
                    Our AI assistant can help you with questions about inventory, sales, customers,
                    suppliers, and other business operations. Just start a conversation below!
                </p>

                <div className="border rounded-lg h-[600px] relative">
                    <ChatbotComponent />
                </div>
            </div>
        </div>
    );
} 