import { prisma } from '@/lib/prisma';
import axios from 'axios';

interface SMSOptions {
    to: string;
    message: string;
}

interface NotifyLKResponse {
    status: number;
    message: string;
    data?: any;
}

/**
 * SMS Service for sending notifications via notify.lk
 */
export class SMSService {
    private apiKey: string | null = null;
    private userId: string | null = null;
    private baseUrl = 'https://app.notify.lk/api/v1/send';
    private isEnabled = false;

    /**
     * Initialize the SMS service with settings from the database
     */
    async init(): Promise<void> {
        try {
            // Get settings from database
            const apiKeySetting = await prisma.systemSettings.findUnique({
                where: { key: 'sms_api_key' }
            });

            const userIdSetting = await prisma.systemSettings.findUnique({
                where: { key: 'sms_user_id' }
            });

            const enabledSetting = await prisma.systemSettings.findUnique({
                where: { key: 'sms_enabled' }
            });

            this.apiKey = apiKeySetting?.value || null;
            this.userId = userIdSetting?.value || null;
            this.isEnabled = enabledSetting?.value === 'true';
        } catch (error) {
            console.error('Failed to initialize SMS service:', error);
        }
    }

    /**
     * Check if the SMS service is properly configured
     */
    isConfigured(): boolean {
        return !!(this.apiKey && this.userId && this.isEnabled);
    }

    /**
     * Send an SMS message
     * @param options SMS options including recipient and message
     * @returns Response from notify.lk API
     */
    async sendSMS(options: SMSOptions): Promise<NotifyLKResponse> {
        // Initialize if not already initialized
        if (!this.apiKey || !this.userId) {
            await this.init();
        }

        // Check if service is configured and enabled
        if (!this.isConfigured()) {
            return {
                status: 400,
                message: 'SMS service is not configured or disabled'
            };
        }

        // Format phone number (remove spaces, ensure it starts with 94 for Sri Lanka)
        let phoneNumber = options.to.replace(/\s+/g, '');
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '94' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('94')) {
            phoneNumber = '94' + phoneNumber;
        }

        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    user_id: this.userId,
                    api_key: this.apiKey,
                    sender_id: 'NotifyDEMO',
                    to: phoneNumber,
                    message: options.message
                }
            });

            return {
                status: response.status,
                message: 'SMS sent successfully',
                data: response.data
            };
        } catch (error) {
            console.error('Failed to send SMS:', error);
            return {
                status: 500,
                message: error instanceof Error ? error.message : 'Failed to send SMS'
            };
        }
    }

    /**
     * Send invoice notification to customer
     * @param invoiceId Invoice ID
     * @returns Response from notify.lk API
     */
    async sendInvoiceNotification(invoiceId: number): Promise<NotifyLKResponse> {
        try {
            // Get invoice with customer details
            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
                include: {
                    customer: true
                }
            });

            if (!invoice) {
                return {
                    status: 404,
                    message: 'Invoice not found'
                };
            }

            if (!invoice.customer.phone) {
                return {
                    status: 400,
                    message: 'Customer phone number not available'
                };
            }

            // Prepare message
            const message = `Dear ${invoice.customer.name}, your invoice #${invoice.invoiceNumber} for LKR ${invoice.total.toFixed(2)} has been created. Thank you for your business with MS Sport.`;

            // Send SMS
            return this.sendSMS({
                to: invoice.customer.phone,
                message
            });
        } catch (error) {
            console.error('Failed to send invoice notification:', error);
            return {
                status: 500,
                message: error instanceof Error ? error.message : 'Failed to send invoice notification'
            };
        }
    }

    /**
     * Send payment reminder for overdue invoices
     * @param invoiceId Invoice ID
     * @returns Response from notify.lk API
     */
    async sendPaymentReminder(invoiceId: number): Promise<NotifyLKResponse> {
        try {
            // Get invoice with customer details
            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
                include: {
                    customer: true
                }
            });

            if (!invoice) {
                return {
                    status: 404,
                    message: 'Invoice not found'
                };
            }

            if (!invoice.customer.phone) {
                return {
                    status: 400,
                    message: 'Customer phone number not available'
                };
            }

            // Prepare message
            const message = `Dear ${invoice.customer.name}, this is a reminder that invoice #${invoice.invoiceNumber} for LKR ${invoice.total.toFixed(2)} is overdue. Please make payment at your earliest convenience.`;

            // Send SMS
            return this.sendSMS({
                to: invoice.customer.phone,
                message
            });
        } catch (error) {
            console.error('Failed to send payment reminder:', error);
            return {
                status: 500,
                message: error instanceof Error ? error.message : 'Failed to send payment reminder'
            };
        }
    }
}

// Export singleton instance
export const smsService = new SMSService(); 