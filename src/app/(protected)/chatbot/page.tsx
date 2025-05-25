'use client';

import React from 'react';
import { Chatbot } from '@/components/chatbot/Chatbot';

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
                    <Chatbot />
                </div>
            </div>
        </div>
    );
} 