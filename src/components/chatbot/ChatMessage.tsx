'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { ChatMessage as ChatMessageType } from '@/services/chatbotService';

interface ChatMessageProps {
    message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    // Function to format the message content with markdown-like styling
    const formatContent = (content: string) => {
        if (isUser) return content; // Don't format user messages

        // Process content for formatting
        let formattedContent = content;

        // Find sections separated by ### headers
        const sections = formattedContent.split(/###\s+([^#\n]+)/);
        if (sections.length > 1) {
            let result = '';
            for (let i = 0; i < sections.length; i++) {
                if (i % 2 === 0) {
                    // Even indexes are content between headers
                    if (sections[i]) {
                        result += `<div>${formatSection(sections[i])}</div>`;
                    }
                } else {
                    // Odd indexes are headers
                    result += `<h3 class="font-bold text-base mt-3 mb-2">${sections[i]}</h3>`;
                }
            }
            return result;
        }

        return formatSection(formattedContent);
    };

    // Helper function to format a section of content
    const formatSection = (text: string) => {
        let formatted = text;

        // Extract numbered lists (1. Item, 2. Item, etc.)
        const numberedListPattern = /(\d+\.\s+[^\n]+\n?)+/g;
        formatted = formatted.replace(numberedListPattern, (match) => {
            const items = match.split(/\d+\.\s+/).filter(Boolean);
            return `<ol class="list-decimal pl-5 my-2">${items.map(item =>
                `<li>${item.trim()}</li>`).join('')}</ol>`;
        });

        // Extract bullet lists (• Item, * Item)
        const bulletListPattern = /((?:\*\s+|\•\s+)[^\n]+\n?)+/g;
        formatted = formatted.replace(bulletListPattern, (match) => {
            const items = match.split(/(?:\*\s+|\•\s+)/).filter(Boolean);
            return `<ul class="list-disc pl-5 my-2">${items.map(item =>
                `<li>${item.trim()}</li>`).join('')}</ul>`;
        });

        // Handle bold text with ** markers
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Handle paragraphs
        const paragraphs = formatted.split(/\n\n+/);
        if (paragraphs.length > 1) {
            return paragraphs.map(p => {
                if (p.trim() && !p.includes('<ol') && !p.includes('<ul')) {
                    return `<p class="my-2">${p.trim()}</p>`;
                }
                return p;
            }).join('');
        }

        // If no paragraphs were found, and it's not a list, wrap in a paragraph
        if (!formatted.includes('<ol') && !formatted.includes('<ul')) {
            formatted = `<p>${formatted}</p>`;
        }

        return formatted;
    };

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
                {isUser ? (
                    <p className="text-sm">{message.content}</p>
                ) : (
                    <div
                        className="text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                    />
                )}
            </div>
        </div>
    );
} 