'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import UsersList from '@/components/settings/UsersList';
import { saveAs } from 'file-saver';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsContainer() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { accessToken } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [testSmsStatus, setTestSmsStatus] = useState<{ success?: boolean; message?: string } | null>(null);
    const [testSmsPhone, setTestSmsPhone] = useState('');
    const [testAiStatus, setTestAiStatus] = useState<{ success?: boolean; message?: string } | null>(null);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backupStatus, setBackupStatus] = useState<{ success?: boolean; message?: string } | null>(null);

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

    const handleBackup = async () => {
        setIsBackingUp(true);
        setBackupStatus({ message: 'Generating backup...' });

        console.log('Initiating backup request with accessToken:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null');

        try {
            const response = await fetch('/api/backup', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to generate backup');
            }
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            saveAs(blob, 'mssports-backup.json');
            setBackupStatus({ success: true, message: 'Backup generated and downloaded successfully!' });
        } catch (error) {
            console.error('Backup error:', error);
            setBackupStatus({ success: false, message: 'Failed to generate backup. Please try again.' });
        } finally {
            setIsBackingUp(false);
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

            {activeTab === 'users' && (
                <UsersList onAddUser={() => router.push('/settings/users/add')} />
            )}

            {activeTab === 'shops' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Shop Management</h3>
                    <p className="text-gray-500">
                        Configure shop locations and inventory settings.
                    </p>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-md font-medium text-gray-900">Shop Locations</h4>
                            <button
                                onClick={() => router.push('/shops')}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                            >
                                Manage Shops
                            </button>
                        </div>
                        <p className="text-gray-600">View and manage all shop locations, inventory transfers, and shop-specific settings.</p>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                    <p className="text-gray-500">
                        Configure system-wide settings and maintenance options.
                    </p>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Database Backup Schedule</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={settings['db_backup_schedule'] || 'Daily'}
                                onChange={(e) => handleInputChange('db_backup_schedule', e.target.value)}
                            >
                                <option value="Hourly">Hourly</option>
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
                                <option value="Debug">Debug</option>
                                <option value="Info">Info</option>
                                <option value="Warning">Warning</option>
                                <option value="Error">Error</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={settings['maintenance_mode'] === 'true'}
                                    onChange={(e) => handleCheckboxChange('maintenance_mode', e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
                            </label>
                            <p className="text-xs text-gray-500">Enable maintenance mode to restrict system access</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900">Database Backup</h3>
                        <p className="text-gray-500">
                            Generate a backup of your database data.
                        </p>

                        <div className="flex justify-start">
                            <button
                                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${isBackingUp ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleBackup}
                                disabled={isBackingUp}
                            >
                                {isBackingUp ? 'Generating...' : 'Generate Backup'}
                            </button>
                        </div>

                        {backupStatus && (
                            <div className={`p-3 rounded-md ${backupStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                {backupStatus.message}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleSaveSystemSettings}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save System Settings'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                    <p className="text-gray-500">
                        Configure SMS and email notification settings.
                    </p>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={settings['sms_enabled'] === 'true'}
                                    onChange={(e) => handleCheckboxChange('sms_enabled', e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Enable SMS Notifications</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">SMS API Key</label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={settings['sms_api_key'] || ''}
                                    onChange={(e) => handleInputChange('sms_api_key', e.target.value)}
                                    placeholder="Enter notify.lk API key"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">SMS User ID</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={settings['sms_user_id'] || ''}
                                    onChange={(e) => handleInputChange('sms_user_id', e.target.value)}
                                    placeholder="Enter notify.lk User ID"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">SMS Sender ID</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={settings['sms_sender_id'] || 'NotifyDEMO'}
                                    onChange={(e) => handleInputChange('sms_sender_id', e.target.value)}
                                    placeholder="Enter sender ID"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Test SMS Configuration</h4>
                            <div className="flex space-x-3">
                                <input
                                    type="tel"
                                    className="flex-1 p-2 border border-gray-300 rounded-md"
                                    value={testSmsPhone}
                                    onChange={(e) => setTestSmsPhone(e.target.value)}
                                    placeholder="Enter phone number (e.g., +94771234567)"
                                />
                                <button
                                    onClick={handleTestSms}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Send Test SMS
                                </button>
                            </div>
                            {testSmsStatus && (
                                <div className={`mt-3 p-3 rounded-md ${testSmsStatus.success === true ? 'bg-green-50 text-green-800' :
                                    testSmsStatus.success === false ? 'bg-red-50 text-red-800' :
                                        'bg-blue-50 text-blue-800'
                                    }`}>
                                    {testSmsStatus.message}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleSaveNotificationSettings}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Notification Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ai' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">AI Assistant Settings</h3>
                    <p className="text-gray-500">
                        Configure AI chatbot and assistant features.
                    </p>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={settings['ai_chatbot_enabled'] === 'true'}
                                    onChange={(e) => handleCheckboxChange('ai_chatbot_enabled', e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Enable AI Chatbot</span>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Deepseek API Key</label>
                            <input
                                type="password"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={settings['deepseek_api_key'] || ''}
                                onChange={(e) => handleInputChange('deepseek_api_key', e.target.value)}
                                placeholder="Enter Deepseek API key"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Business Context</label>
                            <textarea
                                className="w-full p-2 border border-gray-300 rounded-md h-32"
                                value={settings['ai_business_context'] || 'You are an AI assistant for MS Sports, an inventory management system. You can help with questions about inventory management, sales tracking, customer information, supplier relationships, product information, business performance, and system features and usage.'}
                                onChange={(e) => handleInputChange('ai_business_context', e.target.value)}
                                placeholder="Describe your business context for the AI assistant"
                            />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Test AI Configuration</h4>
                            <button
                                onClick={testAiConnection}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Test AI Connection
                            </button>
                            {testAiStatus && (
                                <div className={`mt-3 p-3 rounded-md ${testAiStatus.success === true ? 'bg-green-50 text-green-800' :
                                    testAiStatus.success === false ? 'bg-red-50 text-red-800' :
                                        'bg-blue-50 text-blue-800'
                                    }`}>
                                    {testAiStatus.message}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleSaveAISettings}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save AI Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}