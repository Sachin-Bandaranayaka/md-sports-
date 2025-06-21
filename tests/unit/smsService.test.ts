import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import axios from 'axios';
import { SMSService } from '@/services/smsService';
import { prisma } from '@/lib/prisma';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    setting: {
      findMany: jest.fn(),
    },
    invoice: {
      findUnique: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('SMSService', () => {
  let smsService: SMSService;

  beforeEach(() => {
    smsService = new SMSService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('init', () => {
    it('should initialize SMS service with settings from database', async () => {
      const mockSettings = [
        { key: 'sms_api_key', value: 'test-api-key' },
        { key: 'sms_user_id', value: 'test-user-id' },
        { key: 'sms_enabled', value: 'true' },
      ];

      mockPrisma.setting.findMany.mockResolvedValue(mockSettings as any);

      await smsService.init();

      expect(mockPrisma.setting.findMany).toHaveBeenCalledWith({
        where: {
          key: {
            in: ['sms_api_key', 'sms_user_id', 'sms_enabled'],
          },
        },
      });
      expect(smsService.isConfigured()).toBe(true);
    });

    it('should handle missing settings gracefully', async () => {
      mockPrisma.setting.findMany.mockResolvedValue([]);

      await smsService.init();

      expect(smsService.isConfigured()).toBe(false);
    });

    it('should handle database errors during initialization', async () => {
      mockPrisma.setting.findMany.mockRejectedValue(new Error('Database error'));

      await expect(smsService.init()).rejects.toThrow('Database error');
    });
  });

  describe('isConfigured', () => {
    it('should return true when all required settings are present', async () => {
      const mockSettings = [
        { key: 'sms_api_key', value: 'test-api-key' },
        { key: 'sms_user_id', value: 'test-user-id' },
        { key: 'sms_enabled', value: 'true' },
      ];

      mockPrisma.setting.findMany.mockResolvedValue(mockSettings as any);
      await smsService.init();

      expect(smsService.isConfigured()).toBe(true);
    });

    it('should return false when SMS is disabled', async () => {
      const mockSettings = [
        { key: 'sms_api_key', value: 'test-api-key' },
        { key: 'sms_user_id', value: 'test-user-id' },
        { key: 'sms_enabled', value: 'false' },
      ];

      mockPrisma.setting.findMany.mockResolvedValue(mockSettings as any);
      await smsService.init();

      expect(smsService.isConfigured()).toBe(false);
    });

    it('should return false when API key is missing', async () => {
      const mockSettings = [
        { key: 'sms_user_id', value: 'test-user-id' },
        { key: 'sms_enabled', value: 'true' },
      ];

      mockPrisma.setting.findMany.mockResolvedValue(mockSettings as any);
      await smsService.init();

      expect(smsService.isConfigured()).toBe(false);
    });
  });

  describe('sendSMS', () => {
    beforeEach(async () => {
      const mockSettings = [
        { key: 'sms_api_key', value: 'test-api-key' },
        { key: 'sms_user_id', value: 'test-user-id' },
        { key: 'sms_enabled', value: 'true' },
      ];
      mockPrisma.setting.findMany.mockResolvedValue(mockSettings as any);
      await smsService.init();
    });

    it('should send SMS successfully with valid phone number', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          message: 'SMS sent successfully',
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await smsService.sendSMS('0771234567', 'Test message');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://app.notify.lk/api/v1/send',
        {
          params: {
            user_id: 'test-user-id',
            api_key: 'test-api-key',
            sender_id: 'NotifyDEMO',
            to: '94771234567',
            message: 'Test message',
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should format phone number correctly for different formats', async () => {
      const mockResponse = { data: { status: 'success' } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Test with +94 prefix
      await smsService.sendSMS('+94771234567', 'Test message');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            to: '94771234567',
          }),
        })
      );

      // Test with 94 prefix
      await smsService.sendSMS('94771234567', 'Test message');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            to: '94771234567',
          }),
        })
      );

      // Test with 0 prefix
      await smsService.sendSMS('0771234567', 'Test message');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            to: '94771234567',
          }),
        })
      );
    });

    it('should throw error when service is not configured', async () => {
      const unconfiguredService = new SMSService();
      mockPrisma.setting.findMany.mockResolvedValue([]);
      await unconfiguredService.init();

      await expect(
        unconfiguredService.sendSMS('0771234567', 'Test message')
      ).rejects.toThrow('SMS service is not configured');
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(
        smsService.sendSMS('0771234567', 'Test message')
      ).rejects.toThrow('API Error');
    });

    it('should handle invalid phone numbers', async () => {
      await expect(
        smsService.sendSMS('', 'Test message')
      ).rejects.toThrow();

      await expect(
        smsService.sendSMS('invalid-phone', 'Test message')
      ).rejects.toThrow();
    });
  });

  describe('sendInvoiceNotification', () => {
    beforeEach(async () => {
      const mockSettings = [
        { key: 'sms_api_key', value: 'test-api-key' },
        { key: 'sms_user_id', value: 'test-user-id' },
        { key: 'sms_enabled', value: 'true' },
      ];
      mockPrisma.setting.findMany.mockResolvedValue(mockSettings as any);
      await smsService.init();
    });

    it('should send invoice notification successfully', async () => {
      const mockInvoice = {
        id: 'inv-123',
        invoiceNumber: 'INV-001',
        totalAmount: 1000,
        customerId: 'cust-123',
        customer: {
          id: 'cust-123',
          name: 'John Doe',
          phone: '0771234567',
        },
      };

      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice as any);
      mockedAxios.get.mockResolvedValue({ data: { status: 'success' } });

      const result = await smsService.sendInvoiceNotification('inv-123');

      expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
        where: { id: 'inv-123' },
        include: { customer: true },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            to: '94771234567',
            message: expect.stringContaining('INV-001'),
          }),
        })
      );

      expect(result).toEqual({ status: 'success' });
    });

    it('should throw error when invoice is not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(
        smsService.sendInvoiceNotification('non-existent-id')
      ).rejects.toThrow('Invoice not found');
    });

    it('should throw error when customer phone is missing', async () => {
      const mockInvoice = {
        id: 'inv-123',
        invoiceNumber: 'INV-001',
        totalAmount: 1000,
        customerId: 'cust-123',
        customer: {
          id: 'cust-123',
          name: 'John Doe',
          phone: null,
        },
      };

      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice as any);

      await expect(
        smsService.sendInvoiceNotification('inv-123')
      ).rejects.toThrow('Customer phone number not available');
    });
  });

  describe('sendPaymentReminder', () => {
    beforeEach(async () => {
      const mockSettings = [
        { key: 'sms_api_key', value: 'test-api-key' },
        { key: 'sms_user_id', value: 'test-user-id' },
        { key: 'sms_enabled', value: 'true' },
      ];
      mockPrisma.setting.findMany.mockResolvedValue(mockSettings as any);
      await smsService.init();
    });

    it('should send payment reminder successfully', async () => {
      const mockInvoice = {
        id: 'inv-123',
        invoiceNumber: 'INV-001',
        totalAmount: 1000,
        dueDate: new Date('2024-01-15'),
        customerId: 'cust-123',
        customer: {
          id: 'cust-123',
          name: 'John Doe',
          phone: '0771234567',
        },
      };

      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice as any);
      mockedAxios.get.mockResolvedValue({ data: { status: 'success' } });

      const result = await smsService.sendPaymentReminder('inv-123');

      expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
        where: { id: 'inv-123' },
        include: { customer: true },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            to: '94771234567',
            message: expect.stringContaining('payment reminder'),
          }),
        })
      );

      expect(result).toEqual({ status: 'success' });
    });

    it('should throw error when invoice is not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(
        smsService.sendPaymentReminder('non-existent-id')
      ).rejects.toThrow('Invoice not found');
    });

    it('should throw error when customer phone is missing', async () => {
      const mockInvoice = {
        id: 'inv-123',
        invoiceNumber: 'INV-001',
        totalAmount: 1000,
        dueDate: new Date('2024-01-15'),
        customerId: 'cust-123',
        customer: {
          id: 'cust-123',
          name: 'John Doe',
          phone: null,
        },
      };

      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice as any);

      await expect(
        smsService.sendPaymentReminder('inv-123')
      ).rejects.toThrow('Customer phone number not available');
    });
  });
});