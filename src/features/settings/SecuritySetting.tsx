import React, { useState } from 'react';
import { FaLongArrowAltLeft, FaTimes, FaCheckCircle, FaExclamationCircle, FaTrash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { IoMdInformationCircle } from "react-icons/io";

type AlertType = 'success' | 'error' | 'info';

interface Alert {
    message: string;
    type: AlertType;
}

interface TwoFactorRequirements {
    adminPanelAccess: boolean;
    userDeletion: boolean;
    permissionChanges: boolean;
    securitySettingsModification: boolean;
}

interface SessionSettings {
    forceLogoutOnPasswordChange: boolean;
    forceLogoutOnPermissionChange: boolean;
    forceLogoutOnSuspiciousActivity: boolean;
}

interface AlertSettings {
    failedLoginAttempts: boolean;
    newDeviceLogin: boolean;
    permissionEscalation: boolean;
    dataExport: boolean;
}

const SecuritySetting: React.FC = () => {
    const navigate = useNavigate();
    
    // Alert state
    const [alert, setAlert] = useState<Alert | null>(null);

    // Show alert function
    const showAlert = (message: string, type: AlertType = 'success'): void => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000);
    };

    // IP Whitelisting States
    const [ipWhitelistingEnabled, setIpWhitelistingEnabled] = useState<boolean>(false);
    const [whitelistedIPs, setWhitelistedIPs] = useState<string[]>([
        '192.168.1.1',
        '10.0.0.0/24',
        '203.0.113.42'
    ]);
    const [newIP, setNewIP] = useState<string>('');
    const [showAddIPModal, setShowAddIPModal] = useState<boolean>(false);

    // Two-Factor Authentication States
    const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(true);
    const [twoFactorRequirements, setTwoFactorRequirements] = useState<TwoFactorRequirements>({
        adminPanelAccess: true,
        userDeletion: true,
        permissionChanges: true,
        securitySettingsModification: true
    });

    // API Security States
    const [rateLimitingEnabled, setRateLimitingEnabled] = useState<boolean>(true);
    const [maxRequestsPerHour, setMaxRequestsPerHour] = useState<string>('1000');
    const [ipBlockingEnabled, setIpBlockingEnabled] = useState<boolean>(true);
    const [failedAttempts, setFailedAttempts] = useState<string>('5');
    const [blockDuration, setBlockDuration] = useState<string>('1');
    const [requireAPIKey, setRequireAPIKey] = useState<boolean>(true);
    const [logAPIRequests, setLogAPIRequests] = useState<boolean>(true);

    // Session Management States
    const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
        forceLogoutOnPasswordChange: true,
        forceLogoutOnPermissionChange: true,
        forceLogoutOnSuspiciousActivity: true
    });
    const [maxConcurrentSessions, setMaxConcurrentSessions] = useState<string>('3');

    // Security Alerts States
    const [securityAlertsEnabled, setSecurityAlertsEnabled] = useState<boolean>(true);
    const [alertSettings, setAlertSettings] = useState<AlertSettings>({
        failedLoginAttempts: true,
        newDeviceLogin: true,
        permissionEscalation: true,
        dataExport: true
    });

    // Handle Add IP
    const handleAddIP = (): void => {
        if (newIP.trim()) {
            setWhitelistedIPs([...whitelistedIPs, newIP.trim()]);
            setNewIP('');
            setShowAddIPModal(false);
            showAlert('IP address added successfully', 'success');
        }
    };

    // Handle Remove IP
    const handleRemoveIP = (ip: string): void => {
        setWhitelistedIPs(whitelistedIPs.filter(item => item !== ip));
        showAlert('IP address removed successfully', 'success');
    };

    // Handle Two-Factor Requirement Change
    const handleTwoFactorRequirementChange = (requirement: keyof TwoFactorRequirements): void => {
        setTwoFactorRequirements(prev => ({
            ...prev,
            [requirement]: !prev[requirement]
        }));
    };

    // Handle Session Setting Change
    const handleSessionSettingChange = (setting: keyof SessionSettings): void => {
        setSessionSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    // Handle Alert Setting Change
    const handleAlertSettingChange = (setting: keyof AlertSettings): void => {
        setAlertSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    // Handle Save Changes
    const handleSaveChanges = (): void => {
        showAlert('Security settings saved successfully', 'success');
    };

    // Handle View Security Log
    const handleViewSecurityLog = (): void => {
        showAlert('Opening security log...', 'info');
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
                            <h1 className="text-2xl font-semibold mt-1">Security Settings</h1>
                            {/* <p className="text-xs text-gray-600">Configure security policies and access controls</p> */}
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
                    {/* IP Whitelisting */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="text-2xl">🌐</span>
                                    IP Whitelisting
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Restrict access to specific IP addresses</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={ipWhitelistingEnabled}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIpWhitelistingEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">Allowed IP Addresses:</p>
                            <div className="space-y-2">
                                {whitelistedIPs.map((ip, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition">
                                        <span className="text-sm font-mono text-gray-700">{ip}</span>
                                        <button
                                            onClick={() => handleRemoveIP(ip)}
                                            className="text-red-600 hover:text-red-700 transition"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                        
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setShowAddIPModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            + Add IP Address
                        </button>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="text-2xl">🔐</span>
                                    Two-Factor Authentication
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Enhanced security for administrative actions</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={twoFactorEnabled}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwoFactorEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Required for:</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={twoFactorRequirements.adminPanelAccess}
                                        onChange={() => handleTwoFactorRequirementChange('adminPanelAccess')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Admin panel access</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={twoFactorRequirements.userDeletion}
                                        onChange={() => handleTwoFactorRequirementChange('userDeletion')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">User deletion</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={twoFactorRequirements.permissionChanges}
                                        onChange={() => handleTwoFactorRequirementChange('permissionChanges')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Permission changes</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={twoFactorRequirements.securitySettingsModification}
                                        onChange={() => handleTwoFactorRequirementChange('securitySettingsModification')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Security settings modification</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* API Security */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🔌</span>
                            API Security
                        </h2>

                        {/* Rate Limiting */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-700">Rate Limiting</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rateLimitingEnabled}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRateLimitingEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Max Requests per Hour</label>
                                <input
                                    type="number"
                                    value={maxRequestsPerHour}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxRequestsPerHour(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="1000"
                                />
                            </div>
                        </div>

                        {/* IP Blocking */}
                        <div className="mb-6 pb-6 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-700">IP Blocking</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={ipBlockingEnabled}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIpBlockingEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Failed Attempts</label>
                                    <input
                                        type="number"
                                        value={failedAttempts}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFailedAttempts(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        placeholder="5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Block Duration (hours)</label>
                                    <input
                                        type="number"
                                        value={blockDuration}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlockDuration(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        placeholder="1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Additional Settings */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={requireAPIKey}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequireAPIKey(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Require API key for all requests</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={logAPIRequests}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogAPIRequests(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Log all API requests</span>
                            </label>
                        </div>
                    </div>

                    {/* Session Management */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">⏱️</span>
                            Session Management
                        </h2>

                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-700 mb-3">Force logout on:</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={sessionSettings.forceLogoutOnPasswordChange}
                                        onChange={() => handleSessionSettingChange('forceLogoutOnPasswordChange')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Password change</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={sessionSettings.forceLogoutOnPermissionChange}
                                        onChange={() => handleSessionSettingChange('forceLogoutOnPermissionChange')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Permission change</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={sessionSettings.forceLogoutOnSuspiciousActivity}
                                        onChange={() => handleSessionSettingChange('forceLogoutOnSuspiciousActivity')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Suspicious activity detected</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Concurrent Sessions</label>
                            <input
                                type="number"
                                value={maxConcurrentSessions}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxConcurrentSessions(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                placeholder="3"
                            />
                        </div>
                    </div>

                    {/* Security Alerts */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="text-2xl">🚨</span>
                                    Security Alerts
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Get notified of suspicious activity</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={securityAlertsEnabled}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecurityAlertsEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Alert on:</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={alertSettings.failedLoginAttempts}
                                        onChange={() => handleAlertSettingChange('failedLoginAttempts')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Failed login attempts (5+ in 10 min)</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={alertSettings.newDeviceLogin}
                                        onChange={() => handleAlertSettingChange('newDeviceLogin')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">New device login</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={alertSettings.permissionEscalation}
                                        onChange={() => handleAlertSettingChange('permissionEscalation')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Permission escalation</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={alertSettings.dataExport}
                                        onChange={() => handleAlertSettingChange('dataExport')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Data export</span>
                                </label>
                            </div>
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
                        <button
                            onClick={handleViewSecurityLog}
                            className="text-sm font-medium text-gray-700 bg-gray-200 px-6 py-3 rounded-md font-semibold hover:text-gray-900 "
                        >
                            View Security Log
                        </button>
                    </div>
                </div>
            </div>

            {/* Add IP Modal */}
            {showAddIPModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Add IP Address</h2>
                                <button
                                    onClick={() => setShowAddIPModal(false)}
                                    className="text-white hover:bg-white hover:text-red-500 hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">IP Address or Range</label>
                                <input
                                    type="text"
                                    value={newIP}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIP(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="192.168.1.1 or 10.0.0.0/24"
                                />
                                <p className="text-xs text-gray-500 mt-2">Enter a single IP address or CIDR notation</p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={handleAddIP}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Add IP
                            </button>
                            <button
                                onClick={() => setShowAddIPModal(false)}
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

export default SecuritySetting;