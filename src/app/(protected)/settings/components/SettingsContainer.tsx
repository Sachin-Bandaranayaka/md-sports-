'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SettingsContainer() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [testSmsStatus, setTestSmsStatus] = useState<{ success?: boolean; message?: string } | null>(null);
    const [testSmsPhone, setTestSmsPhone] = useState('');
    const [testAiStatus, setTestAiStatus] = useState<{ success?: boolean; message?: string } | null>(null);

    // Set the active tab from URL query parameter if present
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['general', 'users', 'shops', 'system', 'notifications', 'ai'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Load settings from API
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                const data = await response.json();

                if (data.success && data.settings) {
                    // Convert array of settings to key-value object
                    const settingsObj: Record<string, string> = {};
                    data.settings.forEach((setting: { key: string, value: string }) => {
                        settingsObj[setting.key] = setting.value;
                    });
                    setSettings(settingsObj);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };

        fetchSettings();
    }, []);

    const tabs = [
        { id: 'general', label: 'General Settings' },
        { id: 'users', label: 'Users & Permissions' },
        { id: 'shops', label: 'Shop Management' },
        { id: 'system', label: 'System Settings' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'ai', label: 'AI Assistant' },
    ];

    const handleInputChange = (key: string, value: string) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleCheckboxChange = (key: string, checked: boolean) => {
        setSettings(prev => ({
            ...prev,
            [key]: checked ? 'true' : 'false'
        }));
    };

    const saveSettings = async (settingsToSave: Record<string, string>) => {
        setIsSaving(true);
        try {
            // Save each setting individually
            for (const [key, value] of Object.entries(settingsToSave)) {
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        key,
                        value,
                        description: getSettingDescription(key)
                    }),
                });
            }
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const getSettingDescription = (key: string): string => {
        const descriptions: Record<string, string> = {
            'company_name': 'The name of the company',
            'currency': 'Default currency for the system',
            'date_format': 'Default date format for the system',
            'time_zone': 'Default time zone for the system',
            'sms_enabled': 'Enable or disable SMS notifications',
            'sms_api_key': 'API key for notify.lk SMS service',
            'sms_user_id': 'User ID for notify.lk SMS service',
            'sms_sender_id': 'Sender ID for notify.lk SMS service',
            'db_backup_schedule': 'Database backup schedule',
            'log_level': 'System log level',
            'maintenance_mode': 'Enable or disable maintenance mode',
            'deepseek_api_key': 'API key for Deepseek AI services',
            'ai_chatbot_enabled': 'Enable or disable AI chatbot',
            'ai_business_context': 'Business context provided to the AI chatbot',
        };

        return descriptions[key] || '';
    };

    const handleSaveGeneralSettings = () => {
        const generalSettings = {
            'company_name': settings['company_name'] || 'MS Sport',
            'currency': settings['currency'] || 'LKR',
            'date_format': settings['date_format'] || 'DD/MM/YYYY',
            'time_zone': settings['time_zone'] || 'Asia/Colombo',
        };
        saveSettings(generalSettings);
    };

    const handleSaveSystemSettings = () => {
        const systemSettings = {
            'db_backup_schedule': settings['db_backup_schedule'] || 'Daily',
            'log_level': settings['log_level'] || 'Info',
            'maintenance_mode': settings['maintenance_mode'] || 'false',
        };
        saveSettings(systemSettings);
    };

    const handleSaveAISettings = async () => {
        const aiSettings = {
            'deepseek_api_key': settings['deepseek_api_key'] || '',
            'ai_chatbot_enabled': settings['ai_chatbot_enabled'] || 'true',
            'ai_business_context': settings['ai_business_context'] || 'You are an AI assistant for MS Sports, an inventory management system. You can help with questions about inventory management, sales tracking, customer information, supplier relationships, product information, business performance, and system features and usage.',
        };
        await saveSettings(aiSettings);

        // After saving, check if the settings were applied
        if (settings['deepseek_api_key']) {
            setTestAiStatus({
                success: undefined,
                message: 'Settings saved. Testing API key...'
            });
            await testAiConnection();
        }
    };

    const testAiConnection = async () => {
        try {
            setTestAiStatus({
                success: undefined,
                message: 'Testing API connection...'
            });

            const response = await fetch('/api/test-settings');
            const data = await response.json();

            if (data.success && !data.isEmpty && data.valueLength > 0) {
                // Try making an actual API call to test the key
                const testResponse = await fetch('/api/chatbot', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: 'user', content: 'Hello, this is a test message.' }
                        ]
                    }),
                });

                const testData = await testResponse.json();

                if (testResponse.ok) {
                    setTestAiStatus({
                        success: true,
                        message: 'API key is valid and working correctly!'
                    });
                } else {
                    setTestAiStatus({
                        success: false,
                        message: `API test failed: ${testData.error || 'Unknown error'}`
                    });
                }
            } else {
                setTestAiStatus({
                    success: false,
                    message: 'API key is empty or not set correctly.'
                });
            }
        } catch (error) {
            console.error('Failed to test AI connection:', error);
            setTestAiStatus({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to test AI connection'
            });
        }
    };

    const handleSaveNotificationSettings = () => {
        const notificationSettings = {
            'sms_enabled': settings['sms_enabled'] || 'false',
            'sms_api_key': settings['sms_api_key'] || '',
            'sms_user_id': settings['sms_user_id'] || '',
            'sms_sender_id': settings['sms_sender_id'] || 'NotifyDEMO',
        };
        saveSettings(notificationSettings);
    };

    const handleTestSms = async () => {
        if (!testSmsPhone) {
            setTestSmsStatus({
                success: false,
                message: 'Please enter a phone number'
            });
            return;
        }

        try {
            setTestSmsStatus({
                success: undefined,
                message: 'Sending test SMS...'
            });

            const response = await fetch('/api/sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: testSmsPhone,
                    message: 'This is a test SMS from MS Sport. If you received this message, your SMS notification system is working correctly.'
                }),
            });

            const data = await response.json();

            setTestSmsStatus({
                success: data.success,
                message: data.message
            });
        } catch (error) {
            console.error('Failed to send test SMS:', error);
            setTestSmsStatus({
                success: false,
                message: 'Failed to send test SMS. Please check your settings.'
            });
        }
    };

    return (
        <div className="bg-tertiary p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>

            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'general' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                    <p className="text-gray-500">
                        These settings control the general behavior of your application.
                        <br />
                        <span className="text-primary font-medium">
                            This page is only accessible to users with the settings:manage permission.
                        </span>
                    </p>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Company Name</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={settings['company_name'] || 'MS Sport'}
                                onChange={(e) => handleInputChange('company_name', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Currency</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={settings['currency'] || 'LKR'}
                                onChange={(e) => handleInputChange('currency', e.target.value)}
                            >
                                <option value="LKR">LKR (Rs.)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Date Format</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={settings['date_format'] || 'DD/MM/YYYY'}
                                onChange={(e) => handleInputChange('date_format', e.target.value)}
                            >
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={settings['time_zone'] || 'Asia/Colombo'}
                                onChange={(e) => handleInputChange('time_zone', e.target.value)}
                            >
                                <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
                                <option value="UTC">UTC (GMT+0)</option>
                                <option value="Asia/Singapore">Asia/Singapore (GMT+8:00)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleSaveGeneralSettings}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            )}

            {/* Rest of the tabs code here - omitted for brevity */}
            {/* You would include the other tabs (users, shops, system, notifications, ai) here */}
        </div>
    );
} 