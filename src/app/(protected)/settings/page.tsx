'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SettingsPage() {
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
        <div className="space-y-6">
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

                {activeTab === 'users' && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Users & Permissions</h3>
                        <p className="text-gray-500 mb-6">Manage system users and their access permissions.</p>

                        <div className="bg-tertiary rounded-lg shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                                <h4 className="text-md font-medium text-gray-900">System Users</h4>
                                <button
                                    onClick={() => router.push('/settings/users/add')}
                                    className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary-dark">
                                    Add User
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-tertiary divide-y divide-gray-200">
                                        <tr>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">MS Sport Admin</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">admin@mssport.lk</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Administrator</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">All Shops</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right space-x-2">
                                                <button className="text-blue-600 hover:text-blue-800">Edit</button>
                                                <button className="text-red-600 hover:text-red-800">Disable</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Store Manager</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">manager@mssport.lk</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Manager</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Main Store</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right space-x-2">
                                                <button className="text-blue-600 hover:text-blue-800">Edit</button>
                                                <button className="text-red-600 hover:text-red-800">Disable</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'shops' && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Shop Management</h3>
                        <p className="text-gray-500 mb-6">Configure shops and locations in your system.</p>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                            <div className="bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">Main Store</h4>
                                <p className="text-sm text-gray-500 mb-2">Location: Colombo</p>
                                <p className="text-sm text-gray-500">Manager: Store Manager</p>
                                <div className="mt-4 flex justify-end space-x-2">
                                    <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md">Edit</button>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">Warehouse</h4>
                                <p className="text-sm text-gray-500 mb-2">Location: Gampaha</p>
                                <p className="text-sm text-gray-500">Manager: Warehouse Manager</p>
                                <div className="mt-4 flex justify-end space-x-2">
                                    <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md">Edit</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button className="px-4 py-2 bg-primary text-white rounded-md">
                                Add New Shop
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                        <p className="text-gray-500 mb-6">Configure technical aspects of the application.</p>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Database Backup Schedule</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={settings['db_backup_schedule'] || 'Daily'}
                                    onChange={(e) => handleInputChange('db_backup_schedule', e.target.value)}
                                >
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Log Level</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={settings['log_level'] || 'Info'}
                                    onChange={(e) => handleInputChange('log_level', e.target.value)}
                                >
                                    <option value="Info">Info</option>
                                    <option value="Warning">Warning</option>
                                    <option value="Error">Error</option>
                                    <option value="Debug">Debug</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="maintenance"
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    checked={settings['maintenance_mode'] === 'true'}
                                    onChange={(e) => handleCheckboxChange('maintenance_mode', e.target.checked)}
                                />
                                <label htmlFor="maintenance" className="ml-2 text-sm font-medium text-gray-700">Enable Maintenance Mode</label>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={handleSaveSystemSettings}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                        <p className="text-gray-500 mb-6">Configure SMS notifications via notify.lk</p>

                        <div className="space-y-6">
                            <div className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    id="sms_enabled"
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    checked={settings['sms_enabled'] === 'true'}
                                    onChange={(e) => handleCheckboxChange('sms_enabled', e.target.checked)}
                                />
                                <label htmlFor="sms_enabled" className="ml-2 text-sm font-medium text-gray-700">Enable SMS Notifications</label>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">notify.lk User ID</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={settings['sms_user_id'] || ''}
                                    onChange={(e) => handleInputChange('sms_user_id', e.target.value)}
                                    placeholder="Your notify.lk User ID"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">notify.lk API Key</label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={settings['sms_api_key'] || ''}
                                    onChange={(e) => handleInputChange('sms_api_key', e.target.value)}
                                    placeholder="Your notify.lk API Key"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Sender ID</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={settings['sms_sender_id'] || 'NotifyDEMO'}
                                    onChange={(e) => handleInputChange('sms_sender_id', e.target.value)}
                                    placeholder="Sender ID (e.g., NotifyDEMO)"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Default is 'NotifyDEMO'. For a custom sender ID, please contact notify.lk.
                                </p>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={handleSaveNotificationSettings}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h4 className="text-md font-medium text-gray-900 mb-4">Test SMS Notification</h4>
                                <div className="flex flex-col space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            value={testSmsPhone}
                                            onChange={(e) => setTestSmsPhone(e.target.value)}
                                            placeholder="Enter phone number (e.g., 0771234567)"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <button
                                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                            onClick={handleTestSms}
                                            disabled={!settings['sms_enabled'] || settings['sms_enabled'] === 'false'}
                                        >
                                            Send Test SMS
                                        </button>

                                        {settings['sms_enabled'] !== 'true' && (
                                            <span className="text-sm text-red-500">
                                                SMS notifications are disabled. Enable them to send test messages.
                                            </span>
                                        )}
                                    </div>

                                    {testSmsStatus && (
                                        <div className={`p-3 rounded-md ${testSmsStatus.success === undefined
                                            ? 'bg-gray-100 text-gray-700'
                                            : testSmsStatus.success
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {testSmsStatus.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h4 className="text-md font-medium text-gray-900 mb-4">Payment Reminders</h4>
                                <p className="text-sm text-gray-500 mb-4">
                                    Send payment reminders to customers with overdue invoices.
                                </p>

                                <button
                                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to send payment reminders to all customers with overdue invoices?')) {
                                            try {
                                                setTestSmsStatus({
                                                    success: undefined,
                                                    message: 'Sending payment reminders...'
                                                });

                                                const response = await fetch('/api/sms/send-reminders', {
                                                    method: 'POST'
                                                });

                                                const data = await response.json();

                                                setTestSmsStatus({
                                                    success: data.success,
                                                    message: data.message + (data.data ? ` (Success: ${data.data.successCount}, Failed: ${data.data.failedCount})` : '')
                                                });
                                            } catch (error) {
                                                console.error('Error sending payment reminders:', error);
                                                setTestSmsStatus({
                                                    success: false,
                                                    message: 'Failed to send payment reminders. Please try again.'
                                                });
                                            }
                                        }
                                    }}
                                    disabled={!settings['sms_enabled'] || settings['sms_enabled'] === 'false'}
                                >
                                    Send Payment Reminders
                                </button>

                                {settings['sms_enabled'] !== 'true' && (
                                    <p className="text-sm text-red-500 mt-2">
                                        SMS notifications are disabled. Enable them to send payment reminders.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900">AI Assistant Settings</h3>
                        <p className="text-gray-500">
                            Configure your AI assistant settings. The AI assistant helps users with inquiries about inventory, sales, customers, and more.
                            <br />
                            <span className="text-primary font-medium">
                                This page is only accessible to users with the settings:manage permission.
                            </span>
                        </p>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="block text-sm font-medium text-gray-700">Enable AI Chatbot</label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-primary border-gray-300 rounded"
                                        checked={settings['ai_chatbot_enabled'] === 'true'}
                                        onChange={(e) => handleCheckboxChange('ai_chatbot_enabled', e.target.checked)}
                                    />
                                    <label className="ml-2 block text-sm text-gray-700">
                                        Enable or disable the AI chatbot
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Deepseek API Key</label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={settings['deepseek_api_key'] || ''}
                                    onChange={(e) => handleInputChange('deepseek_api_key', e.target.value)}
                                    placeholder="Enter your Deepseek API key"
                                />
                                <p className="text-xs text-gray-500">
                                    Get your API key from <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Deepseek Platform</a>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Business Context</label>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-md h-32"
                                    placeholder="Enter AI business context here"
                                    value={settings['ai_business_context'] || 'You are an AI assistant for MS Sports, an inventory management system. You can help with questions about inventory management, sales tracking, customer information, supplier relationships, product information, business performance, and system features and usage.'}
                                    onChange={(e) => handleInputChange('ai_business_context', e.target.value)}
                                />
                                <p className="text-xs text-gray-500">
                                    This context helps the AI understand your business and answer questions more accurately.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 space-x-3">
                            <button
                                onClick={testAiConnection}
                                disabled={isSaving || !settings['deepseek_api_key']}
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                            >
                                Test Connection
                            </button>
                            <button
                                onClick={handleSaveAISettings}
                                disabled={isSaving}
                                className="bg-primary text-tertiary px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save AI Settings'}
                            </button>
                        </div>

                        {testAiStatus && (
                            <div className={`p-4 mt-4 rounded-md ${testAiStatus.success === undefined
                                ? 'bg-gray-100 text-gray-700'
                                : testAiStatus.success
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                {testAiStatus.message}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 