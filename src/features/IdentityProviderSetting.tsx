import React, { useState } from 'react';
import { FaLongArrowAltLeft, FaCircle, FaTimes, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { IoMdInformationCircle } from "react-icons/io";

// Type Definitions
interface AlertState {
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ProviderConfig {
    environmentId?: string;
    workerAppId?: string;
    clientSecret?: string;
    region?: string;
    syncFrequency?: string;
    lastSync?: string;
    domain?: string;
    apiToken?: string;
    providerName?: string;
    metadataUrl?: string;
    entityId?: string;
    ssoUrl?: string;
    workspaceDomain?: string;
    serviceAccountEmail?: string;
    privateKey?: string;
    adminEmail?: string;
}

interface Provider {
    id: number;
    icon: string;
    title: string;
    status: string;
    description: string;
    config?: ProviderConfig;
}

type ModalMode = 'configure' | 'connect' | '';

const IdentityProviderSetting: React.FC = () => {
    const navigate = useNavigate();
    
    // Alert state
    const [alert, setAlert] = useState<AlertState | null>(null);

    // Show alert function
    const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000); // Auto hide after 5 seconds
    };

    // Provider data
    const [connectedProviders, setConnectedProviders] = useState<Provider[]>([
        {
            id: 1,
            icon: "PF",
            title: "Ping Federate",
            status: "Connected",
            description: "Cloud identity platform for SSO and user management",
            config: {
                environmentId: "a1b2c3d4-e5f6-7890",
                workerAppId: "worker_app_123",
                clientSecret: "••••••••••••",
                region: "North America",
                syncFrequency: "Every 1 hour",
                lastSync: "2 hours ago"
            }
        },
        {
            id: 2,
            icon: "Okta",
            title: "Okta",
            status: "Connected",
            description: "Enterprise identity and access management platform",
            config: {
                domain: "yourcompany.okta.com",
                apiToken: "••••••••••••",
                syncFrequency: "Every 6 hours",
                lastSync: "4 hours ago"
            }
        }
    ]);

    const [notConnectedProviders, setNotConnectedProviders] = useState<Provider[]>([
        {
            id: 3,
            icon: "SA",
            title: "SAML/OIDC",
            status: "Not Connected",
            description: "Generic SAML or OpenID Connect configuration"
        },
        {
            id: 4,
            icon: "GW",
            title: "Google Workspace",
            status: "Not Connected",
            description: "Google's cloud identity and workspace management"
        }
    ]);

    // State for which provider config to show
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<ModalMode>(''); // 'configure' or 'connect'
    const [showAddNewModal, setShowAddNewModal] = useState<boolean>(false);
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<boolean>(false);
    const [providerToDisconnect, setProviderToDisconnect] = useState<Provider | null>(null);

    // Form states for configuration
    const [configForm, setConfigForm] = useState<ProviderConfig>({});

    // Handle Configure button click
    const handleConfigure = (provider: Provider): void => {
        setSelectedProvider(provider);
        setConfigForm(provider.config || {});
        setModalMode('configure');
        setShowModal(true);
    };

    // Handle Connect button click
    const handleConnect = (provider: Provider): void => {
        setSelectedProvider(provider);
        setConfigForm({});
        setModalMode('connect');
        setShowModal(true);
    };

    // Handle Disconnect button click
    const handleDisconnect = (provider: Provider): void => {
        setProviderToDisconnect(provider);
        setShowDisconnectConfirm(true);
    };

    // Confirm disconnect
    const confirmDisconnect = (): void => {
        if (!providerToDisconnect) return;
        
        // Move from connected to not connected
        setConnectedProviders(prev => prev.filter(p => p.id !== providerToDisconnect.id));
        setNotConnectedProviders(prev => [...prev, { ...providerToDisconnect, status: "Not Connected", config: undefined }]);
        showAlert(`${providerToDisconnect.title} disconnected successfully`, 'success');
        setShowDisconnectConfirm(false);
        setProviderToDisconnect(null);
    };

    // Handle form input changes
    const handleInputChange = (field: string, value: string): void => {
        setConfigForm(prev => ({ ...prev, [field]: value }));
    };

    // Handle Save Configuration
    const handleSaveConfig = (): void => {
        if (!selectedProvider) return;
        
        if (modalMode === 'configure') {
            // Update existing provider config
            setConnectedProviders(prev => prev.map(p =>
                p.id === selectedProvider.id
                    ? { ...p, config: configForm }
                    : p
            ));
            showAlert('Configuration updated successfully', 'success');
        } else if (modalMode === 'connect') {
            // Connect new provider
            const newProvider: Provider = {
                ...selectedProvider,
                status: "Connected",
                config: configForm
            };
            setConnectedProviders(prev => [...prev, newProvider]);
            setNotConnectedProviders(prev => prev.filter(p => p.id !== selectedProvider.id));
            showAlert(`${selectedProvider.title} connected successfully`, 'success');
        }
        setShowModal(false);
        setSelectedProvider(null);
    };

    // Handle Test Connection
    const handleTestConnection = (): void => {
        showAlert('Connection test successful!', 'success');
    };

    // Handle Sync Now
    const handleSyncNow = (): void => {
        if (!selectedProvider) return;
        
        showAlert('Sync completed successfully', 'success');
        // Update last sync time
        setConnectedProviders(prev => prev.map(p =>
            p.id === selectedProvider.id
                ? { ...p, config: { ...p.config, lastSync: "Just now" } }
                : p
        ));
    };

    // Render configuration form based on provider
    const renderConfigForm = () => {
        if (!selectedProvider) return null;

        // Different forms for different providers
        if (selectedProvider.title === "Ping Federate") {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Environment ID</label>
                        <input
                            type="text"
                            value={configForm.environmentId || ''}
                            onChange={(e) => handleInputChange('environmentId', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="a1b2c3d4-e5f6-7890"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Worker App ID</label>
                        <input
                            type="text"
                            value={configForm.workerAppId || ''}
                            onChange={(e) => handleInputChange('workerAppId', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="worker_app_123"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Client Secret</label>
                        <input
                            type="password"
                            value={configForm.clientSecret || ''}
                            onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Enter client secret"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                        <select
                            value={configForm.region || 'North America'}
                            onChange={(e) => handleInputChange('region', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                            <option>North America</option>
                            <option>Europe</option>
                            <option>Asia Pacific</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sync Frequency</label>
                        <select
                            value={configForm.syncFrequency || 'Every 1 hour'}
                            onChange={(e) => handleInputChange('syncFrequency', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                            <option>Every 15 minutes</option>
                            <option>Every 30 minutes</option>
                            <option>Every 1 hour</option>
                            <option>Every 6 hours</option>
                            <option>Daily</option>
                        </select>
                    </div>

                    {modalMode === 'configure' && configForm.lastSync && (
                        <div className="pt-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-sm text-gray-600 font-medium">
                                <span className="text-gray-700">Last Sync:</span> {configForm.lastSync}
                            </p>
                        </div>
                    )}
                </div>
            );
        } else if (selectedProvider.title === "Okta") {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Okta Domain</label>
                        <input
                            type="text"
                            value={configForm.domain || ''}
                            onChange={(e) => handleInputChange('domain', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="yourcompany.okta.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Token</label>
                        <input
                            type="password"
                            value={configForm.apiToken || ''}
                            onChange={(e) => handleInputChange('apiToken', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Enter API token"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sync Frequency</label>
                        <select
                            value={configForm.syncFrequency || 'Every 6 hours'}
                            onChange={(e) => handleInputChange('syncFrequency', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                            <option>Every 15 minutes</option>
                            <option>Every 30 minutes</option>
                            <option>Every 1 hour</option>
                            <option>Every 6 hours</option>
                            <option>Daily</option>
                        </select>
                    </div>

                    {modalMode === 'configure' && configForm.lastSync && (
                        <div className="pt-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-sm text-gray-600 font-medium">
                                <span className="text-gray-700">Last Sync:</span> {configForm.lastSync}
                            </p>
                        </div>
                    )}
                </div>
            );
        } else if (selectedProvider.title === "SAML/OIDC") {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Provider Name</label>
                        <input
                            type="text"
                            value={configForm.providerName || ''}
                            onChange={(e) => handleInputChange('providerName', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Custom SAML Provider"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Metadata URL</label>
                        <input
                            type="text"
                            value={configForm.metadataUrl || ''}
                            onChange={(e) => handleInputChange('metadataUrl', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="https://provider.com/metadata"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Entity ID</label>
                        <input
                            type="text"
                            value={configForm.entityId || ''}
                            onChange={(e) => handleInputChange('entityId', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="https://yourapp.com/saml"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SSO URL</label>
                        <input
                            type="text"
                            value={configForm.ssoUrl || ''}
                            onChange={(e) => handleInputChange('ssoUrl', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="https://provider.com/sso"
                        />
                    </div>
                </div>
            );
        } else if (selectedProvider.title === "Google Workspace") {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Domain</label>
                        <input
                            type="text"
                            value={configForm.workspaceDomain || ''}
                            onChange={(e) => handleInputChange('workspaceDomain', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="yourcompany.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Account Email</label>
                        <input
                            type="email"
                            value={configForm.serviceAccountEmail || ''}
                            onChange={(e) => handleInputChange('serviceAccountEmail', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="service-account@project.iam.gserviceaccount.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Private Key</label>
                        <textarea
                            value={configForm.privateKey || ''}
                            onChange={(e) => handleInputChange('privateKey', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="-----BEGIN PRIVATE KEY-----"
                            rows={4}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                        <input
                            type="email"
                            value={configForm.adminEmail || ''}
                            onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                            className="w-full px-4 py-2.5 border outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="admin@yourcompany.com"
                        />
                    </div>
                </div>
            );
        }
        
        return null;
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3 p-6 cursor-pointer">
                        <span className="text-gray-500 relative left-6 pb-8" onClick={() => navigate('/settings')}>
                            <FaLongArrowAltLeft size={16} />
                        </span>
                        <div>
                            <p className="text-sm text-gray-600 pl-6">Back to Settings</p>
                            <h1 className="text-2xl font-semibold mt-1">Identity Provider Settings</h1>
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
                            <button onClick={() => setAlert(null)} className="ml-4">
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
                <div className="p-6 max-w-7xl mx-auto">
                    

                    {/* Connected Providers */}
                    <div>
                        <h1 className="text-xl font-semibold mb-4">Connected Providers</h1>
                        <div className="flex items-center flex-wrap gap-6">
                            {connectedProviders.map((provider, index) => (
                                <div className="w-80 bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300" key={index}>
                                    <div className="top flex items-center gap-4 p-5">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                                            {provider.icon}
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-gray-800 text-lg">{provider.title}</h2>
                                            <p className="text-green-600 flex items-center gap-2 text-sm font-medium">
                                                <FaCircle size={8} />
                                                {provider.status}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mid px-5 pb-4">
                                        <p className="text-sm text-gray-600 leading-relaxed">{provider.description}</p>
                                    </div>
                                    <div className="bottom flex items-center gap-3 p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                                        <button
                                            onClick={() => handleConfigure(provider)}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 text-sm font-medium px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            Configure
                                        </button>
                                        <button
                                            onClick={() => handleDisconnect(provider)}
                                            className="px-5 border border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Not Connected Providers */}
                    <div className="mt-10">
                        <h1 className="text-xl font-semibold mb-4">Available Providers</h1>
                        <div className="flex items-center flex-wrap gap-6">
                            {notConnectedProviders.map((provider, index) => (
                                <div className="w-80 bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300" key={index}>
                                    <div className="top flex items-center gap-4 p-5">
                                        <div className="w-14 h-14 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-lg">
                                            {provider.icon}
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-gray-800 text-lg">{provider.title}</h2>
                                            <p className="text-gray-500 flex items-center gap-2 text-sm font-medium">
                                                <FaCircle size={8} />
                                                {provider.status}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mid px-5 pb-4">
                                        <p className="text-sm text-gray-600 leading-relaxed">{provider.description}</p>
                                    </div>
                                    <div className="bottom p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                                        <button
                                            onClick={() => handleConnect(provider)}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            Connect
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add New Provider Button */}
                    <div className="text-center mt-10">
                        <button
                            onClick={() => setShowAddNewModal(true)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Provider
                        </button>
                    </div>
                </div>
            </div>

            {/* Configuration Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 rounded-t-2xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {modalMode === 'configure' ? 'Configure' : 'Connect'} {selectedProvider?.title}
                                    </h2>
                                    <p className="text-blue-100 text-sm mt-2">
                                        {modalMode === 'configure' 
                                            ? 'Update your provider configuration settings' 
                                            : 'Enter your credentials to connect this provider'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-white hover:bg-white hover:text-red-500 hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {renderConfigForm()}
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            {modalMode === 'configure' && (
                                <>
                                    <button
                                        onClick={handleTestConnection}
                                        className="px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md bg-gray-200 text-gray-500 border-2 hover:border-gray-400 border-gray-300 hover:text-gray-600 hover:bg-gray-300"
                                    >
                                        Test Connection
                                    </button>
                                    <button
                                        onClick={handleSyncNow}
                                        className="bg-blue-200 text-blue-500 border-2 hover:border-blue-400 border-blue-300 hover:text-blue-600 hover:bg-blue-300 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        Sync Now
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleSaveConfig}
                                className="flex-1 border-2 border-green-300 bg-green-100 text-green-500 hover:border-green-400 hover:bg-green-200 hover:text-green-600 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                {modalMode === 'configure' ? 'Save Changes' : 'Connect Provider'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Disconnect Confirmation Modal */}
            {showDisconnectConfirm && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <FaExclamationCircle className="text-red-600 text-2xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Disconnect Provider</h2>
                                    <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-700 leading-relaxed">
                                Are you sure you want to disconnect <strong>{providerToDisconnect?.title}</strong>? 
                                <br /><br />
                                Users synced from {providerToDisconnect?.title} will no longer be able to authenticate.
                            </p>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={confirmDisconnect}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Yes, Disconnect
                            </button>
                            <button
                                onClick={() => {
                                    setShowDisconnectConfirm(false);
                                    setProviderToDisconnect(null);
                                }}
                                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Provider Modal */}
            {showAddNewModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-scale-in">

                        {/* ===== Header ===== */}
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Add New Provider</h2>
                                <button
                                    onClick={() => setShowAddNewModal(false)}
                                    className="text-white hover:bg-white/20 rounded-full p-2 transition"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        {/* ===== Scrollable Body ===== */}
                        <div className="p-6 overflow-y-auto flex-1 scroll-smooth">
                            <div className="space-y-4">

                                {/* Select Provider */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Provider Type
                                    </label>
                                    <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                        <option>Custom SAML Provider</option>
                                        <option>Custom OIDC Provider</option>
                                        <option>Custom OAuth 2.0</option>
                                        <option>Custom LDAP</option>
                                    </select>
                                </div>

                                {/* OR Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500 font-medium">
                                            OR
                                        </span>
                                    </div>
                                </div>

                                {/* Radio Options */}
                                <div className="space-y-2">
                                    {["SAML 2.0", "OpenID Connect (OIDC)", "OAuth 2.0", "LDAP"].map(
                                        (type) => (
                                            <label
                                                key={type}
                                                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 cursor-pointer transition"
                                            >
                                                <input
                                                    type="radio"
                                                    name="providerType"
                                                    className="w-4 h-4 text-indigo-600"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {type}
                                                </span>
                                            </label>
                                        )
                                    )}
                                </div>

                                {/* Provider Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Provider Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Enter provider name"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ===== Footer ===== */}
                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => {
                                    showAlert(
                                        "Custom provider configuration wizard will open",
                                        "info"
                                    );
                                    setShowAddNewModal(false);
                                }}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-md hover:shadow-lg"
                            >
                                Next
                            </button>

                            <button
                                onClick={() => setShowAddNewModal(false)}
                                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition"
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}


            <style>{`
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

export default IdentityProviderSetting;