import axios, { AxiosError } from 'axios';

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
                const configResponse = await axios.get('/api/test-settings');
                const configData = configResponse.data;
                console.log('[ChatbotService] /api/test-settings response:', configData);

                if (!configData.success || configData.isEmpty || configData.valueLength === 0) {
                    console.error('[ChatbotService] API key not configured per /api/test-settings.', configData);
                    throw new Error('Deepseek API key is not configured. Please set it in the AI Assistant settings page.');
                }
                console.log('[ChatbotService] API key seems configured according to /api/test-settings.');
            } catch (configError: any) {
                console.error('[ChatbotService] Error during /api/test-settings check:', configError.response?.data || configError.message);
                throw new Error(configError.response?.data?.message || configError.message || 'Failed to verify API key configuration. Please check AI Assistant settings.');
            }

            // Get CSRF token from cookie
            const csrfToken = getCookie('csrfToken');
            if (!csrfToken) {
                console.warn('[ChatbotService] CSRF token cookie not found. POST request might fail.');
            }
            console.log(`[ChatbotService] CSRF Token from cookie: ${csrfToken ? 'found' : 'not found'}`);

            console.log('[ChatbotService] Step 2: API key configured, proceeding to POST /api/chatbot...');
            const response = await axios.post('/api/chatbot',
                { messages },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(csrfToken && { 'X-CSRF-Token': csrfToken }), // Include CSRF token if found
                    }
                }
            );
            console.log('[ChatbotService] Successfully received response from /api/chatbot.');
            return response.data;

        } catch (error: any) {
            console.error('[ChatbotService] Error sending message:', error.isAxiosError ? error.toJSON() : error);

            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<{ error?: string, message?: string }>;
                console.error('[ChatbotService] Axios error details. Status:', axiosError.response?.status, 'Data:', axiosError.response?.data);

                let serviceErrorMessage = 'Failed to communicate with the chatbot service.';

                if (axiosError.response) {
                    const responseData = axiosError.response.data;
                    if (responseData && (responseData.error || responseData.message)) {
                        serviceErrorMessage = responseData.error || responseData.message || serviceErrorMessage;
                    } else if (axiosError.response.status === 403) {
                        serviceErrorMessage = 'Access to the chatbot service was denied (403). Please check API key and configuration in AI Assistant settings, or a CSRF token issue might exist.';
                    } else {
                        serviceErrorMessage = `Chatbot service request failed with status ${axiosError.response.status}.`;
                    }
                } else if (axiosError.request) {
                    serviceErrorMessage = 'No response received from the chatbot service. Please check your network connection and server status.';
                } else {
                    serviceErrorMessage = `Error setting up chatbot request: ${axiosError.message}`;
                }
                console.error('[ChatbotService] Throwing error with message:', serviceErrorMessage);
                throw new Error(serviceErrorMessage);
            }

            // Fallback for non-Axios errors or errors from the initial config check that weren't AxiosErrors
            console.error('[ChatbotService] Non-Axios error, throwing original or generic message.');
            throw new Error(error.message || 'An unexpected error occurred with the chatbot service.');
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
            const csrfToken = getCookie('csrfToken');
            const response = await axios.get('/api/test-settings', {
                headers: {
                    ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
                }
            });
            const data = response.data;

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