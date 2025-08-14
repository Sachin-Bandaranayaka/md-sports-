import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

// Get business context from settings
async function getBusinessContext() {
    try {
        const contextSetting = await prisma.systemSettings.findUnique({
            where: { key: 'ai_business_context' }
        });
        return contextSetting?.value || 'You are an AI assistant for MS Sports.'; // Simplified default
    } catch (error) {
        console.error('[Chatbot API] Error fetching business context:', error);
        return 'You are an AI assistant for MS Sports.'; // Fallback default
    }
}

// Check if chatbot is enabled
async function isChatbotEnabled() {
    try {
        const enabledSetting = await prisma.systemSettings.findUnique({
            where: { key: 'ai_chatbot_enabled' }
        });
        return enabledSetting ? enabledSetting.value === 'true' : true;
    } catch (error) {
        console.error('[Chatbot API] Error checking if chatbot is enabled:', error);
        return true;
    }
}

export async function POST(req: NextRequest) {
    console.log('[Chatbot API] Received POST request');
    try {
        const enabled = await isChatbotEnabled();
        if (!enabled) {
            console.log('[Chatbot API] Chatbot is disabled in settings.');
            return NextResponse.json(
                { error: 'AI chatbot is currently disabled. Please enable it in the AI Assistant settings.' },
                { status: 403 }
            );
        }

        const { messages } = await req.json();
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.log('[Chatbot API] Invalid messages format or empty messages array.');
            return NextResponse.json(
                { error: 'Messages are required, must be a non-empty array.' },
                { status: 400 }
            );
        }

        // Fetch API Key directly within the POST handler for each request
        console.log('[Chatbot API] Fetching Deepseek API key from database for this request...');
        const apiKeySetting = await prisma.systemSettings.findUnique({
            where: { key: 'deepseek_api_key' }
        });

        if (!apiKeySetting) {
            console.error('[Chatbot API] Deepseek API key setting not found in database for this request.');
            throw new Error('Deepseek API key setting not found. Please configure it in the AI Assistant settings.');
        }
        const apiKey = apiKeySetting.value;
        if (!apiKey || apiKey.trim() === '') {
            console.error('[Chatbot API] Deepseek API key is empty in database settings for this request.');
            throw new Error('Deepseek API key is empty. Please set a valid key in the AI Assistant settings.');
        }
        console.log(`[Chatbot API] API key for this request. Length: ${apiKey.length}.`);

        // Detect if the provided key is an OpenRouter key and set provider-specific configs
        const isOpenRouterKey = apiKey.startsWith('sk-or-');
        const baseURL = isOpenRouterKey ? 'https://openrouter.ai/api/v1' : 'https://api.deepseek.com';
        const model = isOpenRouterKey ? 'deepseek/deepseek-chat' : 'deepseek-chat';
        const defaultHeaders = isOpenRouterKey
            ? {
                  'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                  'X-Title': 'MS Sports'
              }
            : undefined;

        // Instantiate OpenAI client for this specific request
        const deepseekClient = new OpenAI({
            apiKey,
            baseURL,
            dangerouslyAllowBrowser: false,
            ...(defaultHeaders ? { defaultHeaders } as any : {}),
        });

        const businessContextContent = await getBusinessContext();
        const businessContext = { role: 'system', content: businessContextContent } as const;
        const finalMessages = [businessContext, ...messages];

        console.log(`[Chatbot API] Sending ${finalMessages.length} messages to ${isOpenRouterKey ? 'OpenRouter (Deepseek model)' : 'Deepseek'} .`);

        const response = await deepseekClient.chat.completions.create({
            model,
            messages: finalMessages,
            temperature: 0.7,
            max_tokens: 500,
        });

        console.log('[Chatbot API] Successfully received response from AI provider.');
        return NextResponse.json(response.choices[0].message);

    } catch (error: any) {
        console.error('[Chatbot API] Error processing request:', error.message);
        // Provide a clearer hint if an OpenRouter key is used against Deepseek endpoint
        if (typeof error.message === 'string' && error.message.includes('Authentication') && error.message.includes('invalid')) {
            console.error('[Chatbot API] Hint: If you are using an OpenRouter key (starts with "sk-or-"), ensure the request is sent to OpenRouter baseURL.');
        }
        if (error.message.includes('API key') || error.message.includes('configure')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json(
            { error: `Failed to process chatbot request: ${error.message}` },
            { status: 500 }
        );
    }
}