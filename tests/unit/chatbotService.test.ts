import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import axios, { AxiosError } from 'axios';
import { chatbotService, ChatMessage, ChatResponse } from '@/services/chatbotService';

// Mock axios
jest.mock('axios');
const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  isAxiosError: jest.fn(),
};
(axios as any).get = mockAxios.get;
(axios as any).post = mockAxios.post;
(axios as any).isAxiosError = mockAxios.isAxiosError;

// Mock document.cookie for getCookie function
Object.defineProperty(global, 'document', {
  value: {
    cookie: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  writable: true,
});

describe('ChatbotService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset document.cookie
    (global.document as any).cookie = '';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('sendMessage', () => {
    const mockMessages: ChatMessage[] = [
      { role: 'user', content: 'Hello, how can I help?' },
      { role: 'assistant', content: 'I can help you with your sports equipment needs.' }
    ];

    const mockResponse: ChatResponse = {
      role: 'assistant',
      content: 'Thank you for your message. How can I assist you today?'
    };

    it('should send message successfully when API key is configured', async () => {
      // Mock successful API key check
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          isEmpty: false,
          valueLength: 32
        }
      });

      // Mock successful chatbot response
      mockAxios.post.mockResolvedValue({
        data: mockResponse
      });

      const result = await chatbotService.sendMessage(mockMessages);

      expect(result).toEqual(mockResponse);
      expect(mockAxios.get).toHaveBeenCalledWith('/api/test-settings');
      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/chatbot',
        { messages: mockMessages },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    });

    it('should include CSRF token when available', async () => {
      // Set CSRF token in cookie
      (global.document as any).cookie = 'csrfToken=test-csrf-token; other=value';

      // Mock successful API key check
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          isEmpty: false,
          valueLength: 32
        }
      });

      // Mock successful chatbot response
      mockAxios.post.mockResolvedValue({
        data: mockResponse
      });

      await chatbotService.sendMessage(mockMessages);

      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/chatbot',
        { messages: mockMessages },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'test-csrf-token'
          }
        }
      );
    });

    it('should throw error when API key is not configured', async () => {
      // Mock API key check failure
      mockAxios.get.mockResolvedValue({
        data: {
          success: false,
          isEmpty: true,
          valueLength: 0
        }
      });

      await expect(chatbotService.sendMessage(mockMessages))
        .rejects
        .toThrow('Deepseek API key is not configured. Please set it in the AI Assistant settings page.');

      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should throw error when API key is empty', async () => {
      // Mock API key check with empty key
      mockAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          isEmpty: true,
          valueLength: 0
        }
      });

      await expect(chatbotService.sendMessage(mockMessages))
        .rejects
        .toThrow('Deepseek API key is not configured. Please set it in the AI Assistant settings page.');
    });

    it('should handle API key check errors', async () => {
      // Mock API key check error
      const configError = new Error('Configuration check failed');
      mockAxios.get.mockRejectedValueOnce(configError);

      await expect(chatbotService.sendMessage(mockMessages))
        .rejects
        .toThrow('Configuration check failed');
    });

    it('should handle axios error with response data', async () => {
      // Mock successful API key check
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          isEmpty: false,
          valueLength: 32
        }
      });

      // Mock axios error with response
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            error: 'Invalid request format'
          }
        },
        toJSON: () => ({ message: 'Request failed' })
      } as AxiosError;

      mockAxios.post.mockRejectedValueOnce(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(chatbotService.sendMessage(mockMessages))
        .rejects
        .toThrow('Invalid request format');
    });

    it('should handle 403 forbidden error', async () => {
      // Mock successful API key check
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          isEmpty: false,
          valueLength: 32
        }
      });

      // Mock 403 error
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: {}
        },
        toJSON: () => ({ message: 'Forbidden' })
      } as AxiosError;

      mockAxios.post.mockRejectedValueOnce(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(chatbotService.sendMessage(mockMessages))
        .rejects
        .toThrow('Access to the chatbot service was denied (403). Please check API key and configuration in AI Assistant settings, or a CSRF token issue might exist.');
    });

    it('should handle network errors', async () => {
      // Mock successful API key check
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          isEmpty: false,
          valueLength: 32
        }
      });

      // Mock network error (no response)
      const axiosError = {
        isAxiosError: true,
        request: {},
        response: undefined,
        toJSON: () => ({ message: 'Network Error' })
      } as AxiosError;

      mockAxios.post.mockRejectedValueOnce(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(chatbotService.sendMessage(mockMessages))
        .rejects
        .toThrow('No response received from the chatbot service. Please check your network connection and server status.');
    });

    it('should handle request setup errors', async () => {
      // Mock successful API key check
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          isEmpty: false,
          valueLength: 32
        }
      });

      // Mock request setup error
      const axiosError = {
        isAxiosError: true,
        message: 'Request setup failed',
        request: undefined,
        response: undefined,
        toJSON: () => ({ message: 'Request setup failed' })
      } as AxiosError;

      mockAxios.post.mockRejectedValueOnce(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(chatbotService.sendMessage(mockMessages))
        .rejects
        .toThrow('Error setting up chatbot request: Request setup failed');
    });

    it('should handle non-axios errors', async () => {
      // Mock successful API key check
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          isEmpty: false,
          valueLength: 32
        }
      });

      // Mock non-axios error
      const genericError = new Error('Generic error');
      mockAxios.post.mockRejectedValueOnce(genericError);
      mockAxios.isAxiosError.mockReturnValue(false);

      await expect(chatbotService.sendMessage(mockMessages))
        .rejects
        .toThrow('Generic error');
    });

    it('should handle errors without message', async () => {
      // Mock successful API key check
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          isEmpty: false,
          valueLength: 32
        }
      });

      // Mock error without message
      const errorWithoutMessage = {};
      mockAxios.post.mockRejectedValueOnce(errorWithoutMessage);
      mockAxios.isAxiosError.mockReturnValue(false);

      await expect(chatbotService.sendMessage(mockMessages))
        .rejects
        .toThrow('An unexpected error occurred with the chatbot service.');
    });

    it('should handle API key check axios error with response data', async () => {
      // Mock API key check axios error
      const configAxiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Settings API error'
          }
        }
      } as AxiosError;

      mockAxios.get.mockRejectedValueOnce(configAxiosError);

      await expect(chatbotService.sendMessage(mockMessages))
        .rejects
        .toThrow('Settings API error');
    });
  });

  describe('getBusinessInfo', () => {
    it('should return business information', async () => {
      const businessInfo = await chatbotService.getBusinessInfo();

      expect(businessInfo).toEqual({
        businessName: 'MS Sports',
        inventoryCount: 'Over 1,000 items',
        topSellingProducts: ['Sports Shoes', 'Jerseys', 'Training Equipment'],
        customerCount: 'Over 500 registered customers',
        supplierCount: '50+ active suppliers',
      });
    });

    it('should return consistent data structure', async () => {
      const businessInfo = await chatbotService.getBusinessInfo();

      expect(businessInfo).toHaveProperty('businessName');
      expect(businessInfo).toHaveProperty('inventoryCount');
      expect(businessInfo).toHaveProperty('topSellingProducts');
      expect(businessInfo).toHaveProperty('customerCount');
      expect(businessInfo).toHaveProperty('supplierCount');
      expect(Array.isArray(businessInfo.topSellingProducts)).toBe(true);
    });
  });

  describe('checkConfiguration', () => {
    it('should return configured when API key exists and is not empty', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          exists: true,
          isEmpty: false
        }
      });

      const result = await chatbotService.checkConfiguration();

      expect(result).toEqual({ isConfigured: true });
      expect(mockAxios.get).toHaveBeenCalledWith('/api/test-settings', {
        headers: {}
      });
    });

    it('should include CSRF token in configuration check', async () => {
      // Set CSRF token in cookie
      (global.document as any).cookie = 'csrfToken=config-csrf-token; other=value';

      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          exists: true,
          isEmpty: false
        }
      });

      await chatbotService.checkConfiguration();

      expect(mockAxios.get).toHaveBeenCalledWith('/api/test-settings', {
        headers: {
          'X-CSRF-Token': 'config-csrf-token'
        }
      });
    });

    it('should return not configured when setting not found', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          success: false,
          exists: false
        }
      });

      const result = await chatbotService.checkConfiguration();

      expect(result).toEqual({
        isConfigured: false,
        message: 'API key setting not found in database'
      });
    });

    it('should return not configured when API key is empty', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          exists: true,
          isEmpty: true
        }
      });

      const result = await chatbotService.checkConfiguration();

      expect(result).toEqual({
        isConfigured: false,
        message: 'API key is empty. Please configure it in settings.'
      });
    });

    it('should handle configuration check errors', async () => {
      const error = new Error('Network error');
      mockAxios.get.mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await chatbotService.checkConfiguration();

      expect(result).toEqual({
        isConfigured: false,
        message: 'Failed to check configuration. Please try again.'
      });
      expect(consoleSpy).toHaveBeenCalledWith('Error checking chatbot configuration:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('getCookie function (via sendMessage)', () => {
    it('should extract CSRF token from cookie string', async () => {
      // Set multiple cookies including CSRF token
      (global.document as any).cookie = 'sessionId=abc123; csrfToken=test-token; userId=456';

      // Mock successful API key check
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          isEmpty: false,
          valueLength: 32
        }
      });

      // Mock successful chatbot response
      mockAxios.post.mockResolvedValue({
        data: { role: 'assistant', content: 'Response' }
      });

      await chatbotService.sendMessage([{ role: 'user', content: 'test' }]);

      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/chatbot',
        { messages: [{ role: 'user', content: 'test' }] },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'test-token'
          }
        }
      );
    });

    it('should handle missing CSRF token gracefully', async () => {
      // Set cookies without CSRF token
      (global.document as any).cookie = 'sessionId=abc123; userId=456';

      // Mock successful API key check
      mockAxios.get.mockResolvedValue({
        data: {
          success: true,
          isEmpty: false,
          valueLength: 32
        }
      });

      // Mock successful chatbot response
      mockAxios.post.mockResolvedValue({
        data: { role: 'assistant', content: 'Response' }
      });

      await chatbotService.sendMessage([{ role: 'user', content: 'test' }]);

      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/chatbot',
        { messages: [{ role: 'user', content: 'test' }] },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    });
  });
});