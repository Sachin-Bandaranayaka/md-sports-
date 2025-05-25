'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { ChatMessage as ChatMessageType } from '@/services/chatbotService';

interface ChatMessageProps {
    message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    return (
        <div
            className={cn(
                'flex w-full mb-4',
                isUser ? 'justify-end' : 'justify-start'
            )}
        >
            <div
                className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    isUser
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-gray-100 text-black rounded-bl-none'
                )}
            >
                <p className="text-sm">{message.content}</p>
            </div>
        </div>
    );
} 