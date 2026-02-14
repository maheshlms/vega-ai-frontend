import React, { useState } from 'react';
import { FaLongArrowAltLeft, FaTimes, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { IoMdInformationCircle } from "react-icons/io";

// Type definitions
interface Alert {
    message: string;
    type: 'success' | 'error' | 'info';
}

interface Permissions {
    viewUsers: boolean;
    createUsers: boolean;
    modifyUserAttributes: boolean;
    deleteUsers: boolean;
    resetPasswords: boolean;
    viewPermissions: boolean;
    grantPermissions: boolean;
    revokeAdminPermissions: boolean;
    generateReports: boolean;
    viewAuditLogs: boolean;
    modifySystemSettings: boolean;
}

const AiAgentsSetting: React.FC = () => {
    const navigate = useNavigate();
    
    // Alert state
    const [alert, setAlert] = useState<Alert | null>(null);

    // Show alert function
    const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000);
    };

    // General Configuration States
    const [defaultAgent, setDefaultAgent] = useState<string>('Orion');
    const [responseTime, setResponseTime] = useState<string>('3');
    const [language, setLanguage] = useState<string>('English');
    const [tone, setTone] = useState<string>('Professional');
    const [enableAISuggestions, setEnableAISuggestions] = useState<boolean>(true);
    const [autoCompleteQueries, setAutoCompleteQueries] = useState<boolean>(true);

    // Agent Permissions States
    const [permissions, setPermissions] = useState<Permissions>({
        viewUsers: true,
        createUsers: true,
        modifyUserAttributes: true,
        deleteUsers: false,
        resetPasswords: true,
        viewPermissions: true,
        grantPermissions: true,
        revokeAdminPermissions: false,
        generateReports: true,
        viewAuditLogs: true,
        modifySystemSettings: false
    });

    // Expert Mode States
    const [expertModeEnabled, setExpertModeEnabled] = useState<boolean>(false);
    const [requireMFAForExpertMode, setRequireMFAForExpertMode] = useState<boolean>(false);

    // Default Behaviors States
    const [confirmDestructiveActions, setConfirmDestructiveActions] = useState<boolean>(true);
    const [logAllActivities, setLogAllActivities] = useState<boolean>(true);
    const [showConfidenceScores, setShowConfidenceScores] = useState<boolean>(true);
    const [enableAutoExecution, setEnableAutoExecution] = useState<boolean>(false);

    // Handle permission change
    const handlePermissionChange = (permission: keyof Permissions): void => {
        setPermissions(prev => ({
            ...prev,
            [permission]: !prev[permission]
        }));
    };

    // Handle Save Changes
    const handleSaveChanges = (): void => {
        showAlert('AI Agent settings saved successfully', 'success');
    };

    // Handle Test Agent
    const handleTestAgent = (): void => {
        showAlert('AI Agent test completed successfully', 'success');
    };

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
                            <h1 className="text-2xl font-semibold mt-1">AI Agent Settings</h1>
                            {/* <p className="text-xs text-gray-600">Configure AI agent behaviors and capabilities</p> */}
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
                <div className="p-6 max-w-5xl mx-auto">
                    {/* General Agent Configuration */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">⚙️</span>
                            General Agent Configuration
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Default Agent</label>
                                <select
                                    value={defaultAgent}
                                    onChange={(e) => setDefaultAgent(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>Astra</option>
                                    <option>Nexa</option>
                                    <option>Orion</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Response Time (seconds)</label>
                                <input
                                    type="number"
                                    value={responseTime}
                                    onChange={(e) => setResponseTime(e.target.value)}
                                    min="1"
                                    max="10"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>English</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                    <option>German</option>
                                    <option>Chinese</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                                <select
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>Professional</option>
                                    <option>Friendly</option>
                                    <option>Casual</option>
                                    <option>Formal</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={enableAISuggestions}
                                    onChange={(e) => setEnableAISuggestions(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Enable AI suggestions</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={autoCompleteQueries}
                                    onChange={(e) => setAutoCompleteQueries(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Auto-complete user queries</span>
                            </label>
                        </div>
                    </div>

                    {/* Agent Permissions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <span className="text-2xl">🔐</span>
                            Agent Permissions
                        </h2>
                        <p className="text-sm text-gray-600 mb-6">Control what actions agents can perform</p>
                        
                        <div className="space-y-6">
                            {/* User Management */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <span>👤</span> User Management
                                </h3>
                                <div className="space-y-2 ml-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={permissions.viewUsers}
                                            onChange={() => handlePermissionChange('viewUsers')}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">View users</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={permissions.createUsers}
                                            onChange={() => handlePermissionChange('createUsers')}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Create users</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={permissions.modifyUserAttributes}
                                            onChange={() => handlePermissionChange('modifyUserAttributes')}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Modify user attributes</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={permissions.deleteUsers}
                                            onChange={() => handlePermissionChange('deleteUsers')}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Delete users</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={permissions.resetPasswords}
                                            onChange={() => handlePermissionChange('resetPasswords')}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Reset passwords</span>
                                    </label>
                                </div>
                            </div>

                            {/* Access Management */}
                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <span>🔑</span> Access Management
                                </h3>
                                <div className="space-y-2 ml-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={permissions.viewPermissions}
                                            onChange={() => handlePermissionChange('viewPermissions')}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">View permissions</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={permissions.grantPermissions}
                                            onChange={() => handlePermissionChange('grantPermissions')}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Grant permissions</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={permissions.revokeAdminPermissions}
                                            onChange={() => handlePermissionChange('revokeAdminPermissions')}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Revoke admin permissions</span>
                                    </label>
                                </div>
                            </div>

                            {/* System Actions */}
                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <span>⚡</span> System Actions
                                </h3>
                                <div className="space-y-2 ml-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={permissions.generateReports}
                                            onChange={() => handlePermissionChange('generateReports')}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Generate reports</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={permissions.viewAuditLogs}
                                            onChange={() => handlePermissionChange('viewAuditLogs')}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">View audit logs</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={permissions.modifySystemSettings}
                                            onChange={() => handlePermissionChange('modifySystemSettings')}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Modify system settings</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expert Mode */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="text-2xl">🎯</span>
                                    Expert Mode
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Advanced AI with elevated permissions</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={expertModeEnabled}
                                    onChange={(e) => setExpertModeEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex gap-3">
                            <FaExclamationCircle className="text-amber-600 text-xl flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                Expert mode grants additional capabilities. Requires additional authentication for security purposes.
                            </p>
                        </div>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
                            <span className="text-sm font-medium text-gray-700">Require MFA for Expert Mode</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={requireMFAForExpertMode}
                                    onChange={(e) => setRequireMFAForExpertMode(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </label>
                    </div>

                    {/* Default Behaviors */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🎨</span>
                            Default Behaviors
                        </h2>
                        
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={confirmDestructiveActions}
                                    onChange={(e) => setConfirmDestructiveActions(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Always confirm destructive actions</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={logAllActivities}
                                    onChange={(e) => setLogAllActivities(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Log all agent activities</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={showConfidenceScores}
                                    onChange={(e) => setShowConfidenceScores(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Show confidence scores</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={enableAutoExecution}
                                    onChange={(e) => setEnableAutoExecution(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Enable auto-execution (no confirmation)</span>
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSaveChanges}
                            className="rounded-md bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={handleTestAgent}
                            className="text-sm font-medium text-gray-700 bg-gray-200 px-6 py-3 rounded-md font-semibold hover:text-gray-900"
                        >
                            Test Agent
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
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

                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </>
    );
}

export default AiAgentsSetting;