import { authGet, authPost, getCsrfToken } from '@/utils/api';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatResponse {
    role: string;
    content: string;
}

// Helper function to get a cookie by name
function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') {
        return undefined; // Cookies are not available in non-browser environments
    }
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
}

export const chatbotService = {
    /**
     * Send a message to the chatbot API
     */
    async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
        console.log('[ChatbotService] Attempting to send message...');
        try {
            console.log('[ChatbotService] Step 1: Checking API key configuration via /api/test-settings...');
            try {
                const configResponse = await authGet('/api/test-settings');
                const configData = await configResponse.json();
                console.log('[ChatbotService] /api/test-settings response:', configData);

                if (!configData.success || configData.isEmpty || configData.valueLength === 0) {
                    console.error('[ChatbotService] API key not configured per /api/test-settings.', configData);
                    throw new Error('Deepseek API key is not configured. Please set it in the AI Assistant settings page.');
                }
                console.log('[ChatbotService] API key seems configured according to /api/test-settings.');
            } catch (configError: any) {
                console.error('[ChatbotService] Error during /api/test-settings check:', configError);
                const message = (configError instanceof Error ? configError.message : undefined) || 'Failed to verify API key configuration. Please check AI Assistant settings.';
                throw new Error(message);
            }

            // Get CSRF token from cookie (for logging purposes only; headers are added by authPost)
            const csrfToken = getCookie('csrfToken') || getCsrfToken();
            if (!csrfToken) {
                console.warn('[ChatbotService] CSRF token cookie not found. POST request might fail.');
            }
            console.log(`[ChatbotService] CSRF Token from cookie: ${csrfToken ? 'found' : 'not found'}`);

            console.log('[ChatbotService] Step 2: API key configured, proceeding to POST /api/chatbot...');
            const response = await authPost('/api/chatbot', { messages });

            if (!response.ok) {
                let errorMessage = `Chatbot service request failed with status ${response.status}.`;
                try {
                    const errData = await response.json();
                    if (errData && (errData.error || errData.message)) {
                        errorMessage = errData.error || errData.message || errorMessage;
                    } else if (response.status === 403) {
                        errorMessage = 'Access to the chatbot service was denied (403). Please check API key and configuration in AI Assistant settings, or a CSRF token issue might exist.';
                    } else if (response.status === 401) {
                        errorMessage = 'Authentication required to use the chatbot.';
                    }
                } catch {
                    // ignore JSON parse error and use default message
                }
                console.error('[ChatbotService] Throwing error with message:', errorMessage);
                throw new Error(errorMessage);
            }

            console.log('[ChatbotService] Successfully received response from /api/chatbot.');
            return await response.json();

        } catch (error: any) {
            console.error('[ChatbotService] Error sending message:', error);

            // Fallback for non-Fetch specific errors
            console.error('[ChatbotService] Non-Axios/FETCH error, throwing original or generic message.');
            throw new Error(error?.message || 'An unexpected error occurred with the chatbot service.');
        }
    },

    /**
     * Get business-specific information for the chatbot
     * This function can be expanded to fetch real data from your database
     */
    async getBusinessInfo(): Promise<Record<string, any>> {
        // This could be expanded to fetch real data from your database
        return {
            businessName: 'MS Sports',
            inventoryCount: 'Over 1,000 items',
            topSellingProducts: ['Sports Shoes', 'Jerseys', 'Training Equipment'],
            customerCount: 'Over 500 registered customers',
            supplierCount: '50+ active suppliers',
            // Add more business-specific information
        };
    },

    /**
     * Check if the chatbot is properly configured
     */
    async checkConfiguration(): Promise<{ isConfigured: boolean; message?: string }> {
        try {
            const csrfToken = getCookie('csrfToken') || getCsrfToken();
            const response = await authGet('/api/test-settings');
            const data = await response.json();

            if (!data.success || !data.exists) {
                return {
                    isConfigured: false,
                    message: 'API key setting not found in database'
                };
            }

            if (data.isEmpty) {
                return {
                    isConfigured: false,
                    message: 'API key is empty. Please configure it in settings.'
                };
            }

            return { isConfigured: true };
        } catch (error) {
            console.error('Error checking chatbot configuration:', error);
            return {
                isConfigured: false,
                message: 'Failed to check configuration. Please try again.'
            };
        }
    }
};