'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, AlertCircle, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from './ChatMessage';
import { chatbotService, ChatMessage as ChatMessageType } from '@/services/chatbotService';
import Link from 'next/link';

interface ChatbotProps {
    onClose: () => void;
}

export function Chatbot({ onClose }: ChatbotProps) {
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [configError, setConfigError] = useState<boolean>(false);
    const [isCheckingConfig, setIsCheckingConfig] = useState(false);
    const [hasValidConfig, setHasValidConfig] = useState<boolean | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Check API key validity when component mounts
    useEffect(() => {
        if (hasValidConfig === null) {
            checkApiKeyValidity();
        }
    }, [hasValidConfig]);

    const checkApiKeyValidity = async () => {
        try {
            setIsCheckingConfig(true);
            const response = await fetch('/api/test-settings');
            const data = await response.json();

            if (data.success && !data.isEmpty && data.valueLength > 0) {
                setHasValidConfig(true);
                setConfigError(false);
            } else {
                setHasValidConfig(false);
                setConfigError(true);
                setError('AI configuration error: API key is not properly set');
            }
        } catch (error) {
            console.error('Error checking API key validity:', error);
            setHasValidConfig(false);
            setConfigError(true);
        } finally {
            setIsCheckingConfig(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        // Check if API key is valid before sending
        if (hasValidConfig === false) {
            setError('Please configure a valid API key in settings before sending messages');
            setConfigError(true);
            return;
        }

        const userMessage: ChatMessageType = {
            role: 'user',
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            // Send message to API
            const newMessages = [...messages, userMessage];
            const response = await chatbotService.sendMessage(newMessages);

            // Add response to messages
            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: response.content,
            }]);

            // Clear any existing errors
            setError(null);
            setConfigError(false);
        } catch (error: any) {
            console.error('Chatbot error:', error);

            // Check if it's a configuration error
            if (error.message && (
                error.message.includes('API key') ||
                error.message.includes('not configured') ||
                error.message.includes('disabled')
            )) {
                setConfigError(true);
                setHasValidConfig(false);
            }

            // Extract error message
            let errorMessage = 'Sorry, I encountered an error. Please try again later.';
            if (error.message) {
                errorMessage = `Error: ${error.message}`;
            } else if (error.response?.data?.error) {
                errorMessage = `Error: ${error.response.data.error}`;
            }

            // Add error message
            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: errorMessage,
            }]);

            // Set error state for potential UI handling
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-medium text-black">MS Sports Assistant</h3>
                <div className="flex items-center space-x-2">
                    {configError && (
                        <Link
                            href="/settings?tab=ai"
                            className="text-gray-500 hover:text-primary"
                            title="Configure AI Settings"
                        >
                            <Settings size={18} />
                        </Link>
                    )}
                    {configError && (
                        <button
                            onClick={checkApiKeyValidity}
                            className="text-gray-500 hover:text-primary"
                            title="Refresh settings"
                            disabled={isCheckingConfig}
                        >
                            <RefreshCw size={18} className={isCheckingConfig ? 'animate-spin' : ''} />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Close chatbot"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 flex items-center">
                    <AlertCircle className="text-red-500 mr-2 flex-shrink-0" size={16} />
                    <div className="text-xs text-red-600">
                        <p>{configError ? 'AI configuration error. Check settings.' : 'An error occurred with the AI service.'}</p>
                        {configError && (
                            <Link href="/settings?tab=ai" className="underline hover:text-red-800">
                                Configure AI Settings
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Config checking state */}
            {isCheckingConfig && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 flex items-center">
                    <RefreshCw className="text-blue-500 mr-2 animate-spin" size={16} />
                    <p className="text-xs text-blue-600">Checking AI configuration...</p>
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                        <MessageSquare size={40} className="mb-2 text-primary" />
                        <p className="text-sm mb-1 text-black">Welcome to MS Sports Assistant!</p>
                        <p className="text-xs">Ask me anything about inventory, sales, or business operations.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <ChatMessage key={index} message={msg} />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t">
                <div className="flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={configError ? "Configure API key in settings first" : "Type your message..."}
                        className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary text-black"
                        disabled={isLoading || configError}
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        className="rounded-l-none"
                        onClick={handleSendMessage}
                        isLoading={isLoading}
                        disabled={!input.trim() || isLoading || configError}
                    >
                        <Send size={18} />
                    </Button>
                </div>
                {configError && (
                    <p className="mt-2 text-xs text-red-500 text-center">
                        Please configure your API key in settings before using the chatbot.
                    </p>
                )}
            </div>
        </div>
    );
} 