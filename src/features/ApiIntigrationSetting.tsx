import React, { useState } from 'react';
import { FaLongArrowAltLeft, FaTimes, FaCheckCircle, FaExclamationCircle, FaKey, FaCopy, FaSync, FaTrash, FaPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { IoMdInformationCircle } from "react-icons/io";
import { MdWebhook } from "react-icons/md";

type AlertType = 'success' | 'error' | 'info';

interface Alert {
    message: string;
    type: AlertType;
}

interface APIKey {
    id: number;
    name: string;
    key: string;
    created: string;
    lastUsed: string;
    visible: boolean;
}

interface CurrentUsage {
    used: number;
    total: number;
}

interface Webhook {
    id: number;
    name: string;
    url: string;
    events: string[];
    status: string;
}

interface ConnectedApp {
    id: number;
    name: string;
    icon: string;
    status: string;
}

interface NewWebhookForm {
    name: string;
    url: string;
    events: string[];
}

const ApiIntegrationSetting: React.FC = () => {
    const navigate = useNavigate();
    
    // Alert state
    const [alert, setAlert] = useState<Alert | null>(null);

    // Show alert function
    const showAlert = (message: string, type: AlertType = 'success'): void => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000);
    };

    // API Keys States
    const [apiKeys, setApiKeys] = useState<APIKey[]>([
        {
            id: 1,
            name: 'Production API Key',
            key: 'vega_pk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456',
            created: 'Jan 15, 2026',
            lastUsed: '2 hours ago',
            visible: false
        },
        {
            id: 2,
            name: 'Development API Key',
            key: 'vega_pk_test_ZyXwVuTsRqPoNmLkJiHgFeDcBa654321',
            created: 'Dec 20, 2025',
            lastUsed: '5 days ago',
            visible: false
        }
    ]);

    // Rate Limiting States
    const [rateLimitingEnabled, setRateLimitingEnabled] = useState<boolean>(true);
    const [requestsPerHour, setRequestsPerHour] = useState<string>('1000');
    const [requestsPerMinute, setRequestsPerMinute] = useState<string>('100');
    const [currentUsage, setCurrentUsage] = useState<CurrentUsage>({ used: 247, total: 1000 });
    const [alertAt80Percent, setAlertAt80Percent] = useState<boolean>(true);

    // Webhooks States
    const [webhooks, setWebhooks] = useState<Webhook[]>([
        {
            id: 1,
            name: 'User Provisioning',
            url: 'https://api.yourapp.com/webhook/provision',
            events: ['user.created', 'user.updated'],
            status: 'Active'
        },
        {
            id: 2,
            name: 'Security Alerts',
            url: 'https://api.yourapp.com/webhook/security',
            events: ['security.alert', 'security.breach'],
            status: 'Active'
        }
    ]);

    // Connected Apps States
    const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([
        { id: 1, name: 'Slack', icon: '💬', status: 'Connected' },
        { id: 2, name: 'Gmail', icon: '📧', status: 'Connected' },
        { id: 3, name: 'Salesforce', icon: '☁️', status: 'Not Connected' },
        { id: 4, name: 'PagerDuty', icon: '🔔', status: 'Connected' }
    ]);

    // Modal States
    const [showCreateKeyModal, setShowCreateKeyModal] = useState<boolean>(false);
    const [showRegenerateModal, setShowRegenerateModal] = useState<boolean>(false);
    const [showDeleteKeyModal, setShowDeleteKeyModal] = useState<boolean>(false);
    const [showAddWebhookModal, setShowAddWebhookModal] = useState<boolean>(false);
    const [showTestWebhookModal, setShowTestWebhookModal] = useState<boolean>(false);
    const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
    const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

    // New API Key Form
    const [newKeyName, setNewKeyName] = useState<string>('');
    const [newKeyType, setNewKeyType] = useState<string>('Production');

    // New Webhook Form
    const [newWebhook, setNewWebhook] = useState<NewWebhookForm>({
        name: '',
        url: '',
        events: []
    });

    // Toggle API Key Visibility
    const toggleKeyVisibility = (id: number): void => {
        setApiKeys(apiKeys.map(key => 
            key.id === id ? { ...key, visible: !key.visible } : key
        ));
    };

    // Copy API Key
    const copyToClipboard = (key: string): void => {
        navigator.clipboard.writeText(key);
        showAlert('API key copied to clipboard', 'success');
    };

    // Handle Create API Key
    const handleCreateAPIKey = (): void => {
        const newKey: APIKey = {
            id: apiKeys.length + 1,
            name: newKeyName,
            key: `vega_pk_${newKeyType === 'Production' ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 15)}`,
            created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            lastUsed: 'Never',
            visible: false
        };
        setApiKeys([...apiKeys, newKey]);
        setNewKeyName('');
        setShowCreateKeyModal(false);
        showAlert('API key created successfully', 'success');
    };

    // Handle Regenerate API Key
    const handleRegenerateKey = (): void => {
        setApiKeys(apiKeys.map(key => 
            key.id === selectedKey?.id 
                ? { ...key, key: `vega_pk_live_${Math.random().toString(36).substring(2, 15)}`, created: new Date().toLocaleDateString() }
                : key
        ));
        setShowRegenerateModal(false);
        showAlert('API key regenerated successfully', 'success');
    };

    // Handle Delete API Key
    const handleDeleteKey = (): void => {
        setApiKeys(apiKeys.filter(key => key.id !== selectedKey?.id));
        setShowDeleteKeyModal(false);
        showAlert('API key deleted successfully', 'success');
    };

    // Handle Add Webhook
    const handleAddWebhook = (): void => {
        if (newWebhook.name && newWebhook.url) {
            const webhook: Webhook = {
                id: webhooks.length + 1,
                ...newWebhook,
                status: 'Active'
            };
            setWebhooks([...webhooks, webhook]);
            setNewWebhook({ name: '', url: '', events: [] });
            setShowAddWebhookModal(false);
            showAlert('Webhook added successfully', 'success');
        }
    };

    // Handle Test Webhook
    const handleTestWebhook = (): void => {
        setShowTestWebhookModal(false);
        showAlert('Test webhook sent successfully', 'success');
    };

    // Handle Delete Webhook
    const handleDeleteWebhook = (id: number): void => {
        setWebhooks(webhooks.filter(webhook => webhook.id !== id));
        showAlert('Webhook deleted successfully', 'success');
    };

    // Handle Save Changes
    const handleSaveChanges = (): void => {
        showAlert('API & Integration settings saved successfully', 'success');
    };

    // Calculate usage percentage
    const usagePercentage = (currentUsage.used / currentUsage.total) * 100;

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3 p-6 cursor-pointer">
                        <span className="text-gray-500 relative left-6 pb-9" onClick={() => navigate('/settings')}>
                            <FaLongArrowAltLeft size={16} className=" hover:text-gray-700 transition" />
                        </span>
                        <div>
                            <p className="text-sm text-gray-600 pl-6 hover:text-indigo-600 transition" onClick={() => navigate('/settings')}>
                                Back to Settings
                            </p>
                            <h1 className="text-2xl font-semibold mt-1">API & Integration Settings</h1>
                        </div>
                    </div>
                </div>

                {/* Alert Notification */}
                {alert && (
                    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
                        <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
                            alert.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
                            alert.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
                            'bg-blue-50 border-l-4 border-blue-500'
                        }`}>
                            {alert.type === 'success' && <FaCheckCircle className="text-green-600 text-xl" />}
                            {alert.type === 'error' && <FaExclamationCircle className="text-red-600 text-xl" />}
                            {alert.type === 'info' && <IoMdInformationCircle className="text-blue-600 text-xl" />}
                            <p className={`font-medium ${
                                alert.type === 'success' ? 'text-green-800' :
                                alert.type === 'error' ? 'text-red-800' :
                                'text-blue-800'
                            }`}>
                                {alert.message}
                            </p>
                            <button onClick={() => setAlert(null)} className="ml-4 hover:opacity-70 transition">
                                <FaTimes className={`${
                                    alert.type === 'success' ? 'text-green-600' :
                                    alert.type === 'error' ? 'text-red-600' :
                                    'text-blue-600'
                                }`} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="p-6 max-w-6xl mx-auto">
                    {/* API Keys */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <FaKey className="text-2xl text-indigo-600" />
                                    API Keys
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Manage your API authentication keys</p>
                            </div>
                            <button
                                onClick={() => setShowCreateKeyModal(true)}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                            >
                                <FaPlus size={14} />
                                Generate New Key
                            </button>
                        </div>

                        <div className="space-y-4">
                            {apiKeys.map((apiKey) => (
                                <div key={apiKey.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{apiKey.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <code className="text-xs bg-white px-2 py-1 rounded border border-gray-300 font-mono">
                                                    {apiKey.visible ? apiKey.key : '••••••••••••••••••••••••••••••••••••'}
                                                </code>
                                                <button
                                                    onClick={() => toggleKeyVisibility(apiKey.id)}
                                                    className="text-gray-600 hover:text-gray-800 transition"
                                                >
                                                    {apiKey.visible ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => copyToClipboard(apiKey.key)}
                                                    className="text-blue-600 hover:text-blue-700 transition"
                                                >
                                                    <FaCopy size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedKey(apiKey);
                                                    setShowRegenerateModal(true);
                                                }}
                                                className="text-orange-600 hover:text-orange-700 transition p-2"
                                                title="Regenerate"
                                            >
                                                <FaSync size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedKey(apiKey);
                                                    setShowDeleteKeyModal(true);
                                                }}
                                                className="text-red-600 hover:text-red-700 transition p-2"
                                                title="Delete"
                                            >
                                                <FaTrash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 text-xs text-gray-600">
                                        <span>Created: {apiKey.created}</span>
                                        <span>Last Used: {apiKey.lastUsed}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rate Limiting */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="text-2xl">⚡</span>
                                    Rate Limiting
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Control API request limits</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rateLimitingEnabled}
                                    onChange={(e) => setRateLimitingEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Requests per Hour</label>
                                <input
                                    type="number"
                                    value={requestsPerHour}
                                    onChange={(e) => setRequestsPerHour(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="1000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Requests per Minute</label>
                                <input
                                    type="number"
                                    value={requestsPerMinute}
                                    onChange={(e) => setRequestsPerMinute(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="100"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Current Usage:</span>
                                <span className="text-sm text-gray-600">{currentUsage.used} / {currentUsage.total} ({Math.round(usagePercentage)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                    className={`h-3 rounded-full transition-all duration-500 ${
                                        usagePercentage >= 80 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                                        usagePercentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                        'bg-gradient-to-r from-green-500 to-emerald-500'
                                    }`}
                                    style={{ width: `${usagePercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={alertAt80Percent}
                                onChange={(e) => setAlertAt80Percent(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Send alert at 80% usage</span>
                        </label>
                    </div>

                    {/* Webhooks */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <MdWebhook className="text-2xl text-purple-600" />
                                    Webhooks
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Configure webhook endpoints for events</p>
                            </div>
                            <button
                                onClick={() => setShowAddWebhookModal(true)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                            >
                                <FaPlus size={14} />
                                Add Webhook
                            </button>
                        </div>

                        <div className="space-y-4">
                            {webhooks.map((webhook) => (
                                <div key={webhook.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800">{webhook.name}</h3>
                                            <code className="text-xs text-gray-600 block mt-1">{webhook.url}</code>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-gray-600">Events:</span>
                                                {webhook.events.map((event, idx) => (
                                                    <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                                        {event}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    webhook.status === 'Active' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    ● {webhook.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedWebhook(webhook);
                                                    setShowTestWebhookModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition"
                                            >
                                                Test
                                            </button>
                                            <button
                                                onClick={() => handleDeleteWebhook(webhook.id)}
                                                className="text-red-600 hover:text-red-700 transition p-2"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Connected Applications */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🔗</span>
                            Connected Applications
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {connectedApps.map((app) => (
                                <div key={app.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{app.icon}</span>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{app.name}</h3>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                app.status === 'Connected' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition">
                                        {app.status === 'Connected' ? 'Configure' : 'Connect'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 text-center">
                            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition">
                                Manage Integrations →
                            </button>
                        </div>
                    </div>

                    {/* API Documentation */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <span className="text-2xl">📚</span>
                            API Documentation
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">Learn how to integrate with Vega.ai API</p>
                        <div className="flex gap-3">
                            <button className="bg-white border border-indigo-300 hover:bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200">
                                📖 View API Docs
                            </button>
                            <button className="bg-white border border-purple-300 hover:bg-purple-50 text-purple-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200">
                                💻 Developer Portal
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSaveChanges}
                            className=" rounded-md bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* Create API Key Modal */}
            {showCreateKeyModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Generate API Key</h2>
                                <button
                                    onClick={() => setShowCreateKeyModal(false)}
                                    className="text-white hover:text-red-500 hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Key Name</label>
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder="e.g., Production API Key"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                                <select
                                    value={newKeyType}
                                    onChange={(e) => setNewKeyType(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                >
                                    <option>Production</option>
                                    <option>Development</option>
                                    <option>Testing</option>
                                </select>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-sm text-amber-800">
                                    ⚠️ Make sure to copy your API key. You won't be able to see it again!
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={handleCreateAPIKey}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Generate Key
                            </button>
                            <button
                                onClick={() => setShowCreateKeyModal(false)}
                                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Regenerate Key Confirmation Modal */}
            {showRegenerateModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                    <FaSync className="text-orange-600 text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Regenerate API Key</h2>
                                    <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-700 leading-relaxed">
                                Are you sure you want to regenerate <strong>{selectedKey?.name}</strong>?
                                <br /><br />
                                The old key will stop working immediately, and any applications using it will need to be updated.
                            </p>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={handleRegenerateKey}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Yes, Regenerate
                            </button>
                            <button
                                onClick={() => setShowRegenerateModal(false)}
                                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Key Confirmation Modal */}
            {showDeleteKeyModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <FaExclamationCircle className="text-red-600 text-2xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Delete API Key</h2>
                                    <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-700 leading-relaxed">
                                Are you sure you want to delete <strong>{selectedKey?.name}</strong>?
                                <br /><br />
                                Any applications using this key will immediately lose access.
                            </p>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={handleDeleteKey}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteKeyModal(false)}
                                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Webhook Modal */}
            {showAddWebhookModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Add Webhook</h2>
                                <button
                                    onClick={() => setShowAddWebhookModal(false)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Name</label>
                                <input
                                    type="text"
                                    value={newWebhook.name}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                                    placeholder="e.g., User Events"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint URL</label>
                                <input
                                    type="url"
                                    value={newWebhook.url}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                                    placeholder="https://api.yourapp.com/webhook"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                                <div className="space-y-2">
                                    {['user.created', 'user.updated', 'user.deleted', 'security.alert'].map((event) => (
                                        <label key={event} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={newWebhook.events.includes(event)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event] });
                                                    } else {
                                                        setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(e => e !== event) });
                                                    }
                                                }}
                                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-gray-700">{event}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={handleAddWebhook}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Add Webhook
                            </button>
                            <button
                                onClick={() => setShowAddWebhookModal(false)}
                                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Webhook Modal */}
            {showTestWebhookModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">Test Webhook</h2>
                                <button
                                    onClick={() => setShowTestWebhookModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Send a test event to <strong>{selectedWebhook?.name}</strong>?
                            </p>
                            <code className="block bg-gray-50 p-3 rounded text-xs text-gray-600 border border-gray-200">
                                {selectedWebhook?.url}
                            </code>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={handleTestWebhook}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Send Test
                            </button>
                            <button
                                onClick={() => setShowTestWebhookModal(false)}
                                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style >{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes scale-in {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }

                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
            `}</style>
        </>
    );
};

export default ApiIntegrationSetting;