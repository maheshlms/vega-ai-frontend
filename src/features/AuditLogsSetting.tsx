import React, { useState } from 'react';
import { FaLongArrowAltLeft, FaTimes, FaCheckCircle, FaExclamationCircle, FaDownload, FaFileAlt, FaChartBar } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { IoMdInformationCircle } from "react-icons/io";
import { MdStorage } from "react-icons/md";

interface AlertState {
    message: string;
    type: 'success' | 'error' | 'info';
}

interface LogCategories {
    userAuthentication: boolean;
    userProvisioning: boolean;
    permissionChanges: boolean;
    groupModifications: boolean;
    apiRequests: boolean;
    systemConfigChanges: boolean;
    dataExports: boolean;
}

interface StorageState {
    used: number;
    total: number;
}

interface ActivityStats {
    userLogins: number;
    usersCreated: number;
    permissionChanges: number;
    failedLogins: number;
    apiRequests: number;
}

const AuditLogsSetting: React.FC = () => {
    const navigate = useNavigate();
    
    // Alert state
    const [alert, setAlert] = useState<AlertState | null>(null);

    // Show alert function
    const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000);
    };

    // Audit Logging States
    const [auditLoggingEnabled, setAuditLoggingEnabled] = useState<boolean>(true);
    const [logLevel, setLogLevel] = useState<string>('Detailed');
    const [logCategories, setLogCategories] = useState<LogCategories>({
        userAuthentication: true,
        userProvisioning: true,
        permissionChanges: true,
        groupModifications: true,
        apiRequests: true,
        systemConfigChanges: true,
        dataExports: true
    });

    // Log Retention States
    const [retentionPeriod, setRetentionPeriod] = useState<string>('90');
    const [currentStorage, setCurrentStorage] = useState<StorageState>({ used: 2.4, total: 10 });
    const [autoArchive, setAutoArchive] = useState<boolean>(true);
    const [compressArchived, setCompressArchived] = useState<boolean>(true);
    const [archiveLocation, setArchiveLocation] = useState<string>('AWS S3');

    // Activity History Stats
    const [activityStats, setActivityStats] = useState<ActivityStats>({
        userLogins: 1247,
        usersCreated: 23,
        permissionChanges: 47,
        failedLogins: 8,
        apiRequests: 12456
    });

    // Compliance Reports States
    const [automatedReports, setAutomatedReports] = useState<boolean>(true);
    const [reportType, setReportType] = useState<string>('SOC 2');
    const [reportFrequency, setReportFrequency] = useState<string>('Monthly');
    const [reportRecipients, setReportRecipients] = useState<string>('admin@vega.ai');

    // Access Logs States
    const [logAllAccess, setLogAllAccess] = useState<boolean>(true);
    const [includeIPAddresses, setIncludeIPAddresses] = useState<boolean>(true);
    const [includeGeolocation, setIncludeGeolocation] = useState<boolean>(true);
    const [includeDeviceInfo, setIncludeDeviceInfo] = useState<boolean>(true);

    // Modal States
    const [showGenerateReportModal, setShowGenerateReportModal] = useState<boolean>(false);
    const [showScheduleReportModal, setShowScheduleReportModal] = useState<boolean>(false);

    // Handle Log Category Change
    const handleLogCategoryChange = (category: keyof LogCategories) => {
        setLogCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Handle Save Changes
    const handleSaveChanges = () => {
        showAlert('Audit & Logs settings saved successfully', 'success');
    };

    // Handle Export Logs
    const handleExportLogs = () => {
        showAlert('Exporting logs... Download will start shortly', 'info');
    };

    // Handle View Activity Log
    const handleViewActivityLog = () => {
        showAlert('Opening full activity log...', 'info');
    };

    // Handle Generate Report
    const handleGenerateReport = () => {
        setShowGenerateReportModal(false);
        showAlert('Report generated successfully', 'success');
    };

    // Handle Schedule Report
    const handleScheduleReport = () => {
        setShowScheduleReportModal(false);
        showAlert('Report scheduled successfully', 'success');
    };

    // Calculate storage percentage
    const storagePercentage = (currentStorage.used / currentStorage.total) * 100;

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
                            <h1 className="text-2xl font-semibold mt-1">Audit & Logs Settings</h1>
                            {/* <p className="text-xs text-gray-600">Configure logging, retention, and compliance reporting</p> */}
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
                    {/* Audit Logging */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="text-2xl">📝</span>
                                    Audit Logging
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Record all system activities</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={auditLoggingEnabled}
                                    onChange={(e) => setAuditLoggingEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Log Level</label>
                            <select
                                value={logLevel}
                                onChange={(e) => setLogLevel(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option>Basic</option>
                                <option>Standard</option>
                                <option>Detailed</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {logLevel === 'Basic' && 'Logs only critical events'}
                                {logLevel === 'Standard' && 'Logs important events and errors'}
                                {logLevel === 'Detailed' && 'Logs all events with full context'}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Log Categories:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={logCategories.userAuthentication}
                                        onChange={() => handleLogCategoryChange('userAuthentication')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">User authentication</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={logCategories.userProvisioning}
                                        onChange={() => handleLogCategoryChange('userProvisioning')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">User provisioning/deprovisioning</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={logCategories.permissionChanges}
                                        onChange={() => handleLogCategoryChange('permissionChanges')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Permission changes</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={logCategories.groupModifications}
                                        onChange={() => handleLogCategoryChange('groupModifications')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Group modifications</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={logCategories.apiRequests}
                                        onChange={() => handleLogCategoryChange('apiRequests')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">API requests</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={logCategories.systemConfigChanges}
                                        onChange={() => handleLogCategoryChange('systemConfigChanges')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">System configuration changes</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={logCategories.dataExports}
                                        onChange={() => handleLogCategoryChange('dataExports')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Data exports</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Log Retention */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MdStorage className="text-2xl text-blue-600" />
                            Log Retention
                        </h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Retention Period (days)</label>
                            <input
                                type="number"
                                value={retentionPeriod}
                                onChange={(e) => setRetentionPeriod(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                placeholder="90"
                            />
                        </div>

                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-700 mb-2">Current Storage:</p>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-700">{currentStorage.used} GB / {currentStorage.total} GB</span>
                                    <span className="text-sm font-semibold text-blue-600">{Math.round(storagePercentage)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${storagePercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-700 mb-3">Archive Options:</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={autoArchive}
                                        onChange={(e) => setAutoArchive(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Auto-archive logs older than {retentionPeriod} days</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={compressArchived}
                                        onChange={(e) => setCompressArchived(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Compress archived logs</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Archive Location</label>
                            <select
                                value={archiveLocation}
                                onChange={(e) => setArchiveLocation(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option>AWS S3</option>
                                <option>Azure Blob Storage</option>
                                <option>Google Cloud Storage</option>
                                <option>Local Storage</option>
                            </select>
                        </div>
                    </div>

                    {/* Activity History */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <FaChartBar className="text-2xl text-green-600" />
                            Activity History
                        </h2>

                        <p className="text-sm text-gray-600 mb-4">Recent Activities (Last 7 days):</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl">🔐</span>
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Auth</span>
                                </div>
                                <p className="text-sm text-gray-600">User Logins</p>
                                <p className="text-3xl font-bold text-gray-800">{activityStats.userLogins.toLocaleString()}</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl">👤</span>
                                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Users</span>
                                </div>
                                <p className="text-sm text-gray-600">Users Created</p>
                                <p className="text-3xl font-bold text-gray-800">{activityStats.usersCreated}</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl">🔑</span>
                                    <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Permissions</span>
                                </div>
                                <p className="text-sm text-gray-600">Permission Changes</p>
                                <p className="text-3xl font-bold text-gray-800">{activityStats.permissionChanges}</p>
                            </div>

                            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl">⚠️</span>
                                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">Failed</span>
                                </div>
                                <p className="text-sm text-gray-600">Failed Logins</p>
                                <p className="text-3xl font-bold text-gray-800">{activityStats.failedLogins}</p>
                            </div>

                            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl">🔄</span>
                                    <span className="text-xs font-semibold text-cyan-600 bg-cyan-100 px-2 py-1 rounded-full">API</span>
                                </div>
                                <p className="text-sm text-gray-600">API Requests</p>
                                <p className="text-3xl font-bold text-gray-800">{activityStats.apiRequests.toLocaleString()}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleViewActivityLog}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            View Full Activity Log
                        </button>
                    </div>

                    {/* Compliance Reports */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <FaFileAlt className="text-2xl text-indigo-600" />
                            Compliance Reports
                        </h2>

                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-700">Automated Reports</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={automatedReports}
                                    onChange={(e) => setAutomatedReports(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>SOC 2</option>
                                    <option>GDPR</option>
                                    <option>HIPAA</option>
                                    <option>ISO 27001</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                                <select
                                    value={reportFrequency}
                                    onChange={(e) => setReportFrequency(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>Weekly</option>
                                    <option>Monthly</option>
                                    <option>Quarterly</option>
                                    <option>Annually</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                                <input
                                    type="email"
                                    value={reportRecipients}
                                    onChange={(e) => setReportRecipients(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="admin@vega.ai"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-700 mb-3">Available Reports:</p>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        SOC 2 Compliance
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        GDPR Data Access
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                        User Activity Summary
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        Security Incident Report
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowGenerateReportModal(true)}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Generate Report
                            </button>
                            <button
                                onClick={() => setShowScheduleReportModal(true)}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Schedule Report
                            </button>
                        </div>
                    </div>

                    {/* Access Logs */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🔍</span>
                            Access Logs
                        </h2>

                        <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={logAllAccess}
                                    onChange={(e) => setLogAllAccess(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Log all access attempts</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={includeIPAddresses}
                                    onChange={(e) => setIncludeIPAddresses(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Include IP addresses</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={includeGeolocation}
                                    onChange={(e) => setIncludeGeolocation(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Include geolocation data</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={includeDeviceInfo}
                                    onChange={(e) => setIncludeDeviceInfo(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Include device information</span>
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSaveChanges}
                            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={handleExportLogs}
                            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            <FaDownload />
                            Export Logs
                        </button>
                    </div>
                </div>
            </div>

            {/* Generate Report Modal */}
            {showGenerateReportModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Generate Report</h2>
                                <button
                                    onClick={() => setShowGenerateReportModal(false)}
                                    className="text-white hover:text-red-500 hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition">
                                    <option>SOC 2 Compliance</option>
                                    <option>GDPR Data Access</option>
                                    <option>User Activity Summary</option>
                                    <option>Security Incident Report</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition">
                                    <option>Last 7 days</option>
                                    <option>Last 30 days</option>
                                    <option>Last 90 days</option>
                                    <option>Custom Range</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition">
                                    <option>PDF</option>
                                    <option>Excel</option>
                                    <option>CSV</option>
                                    <option>JSON</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={handleGenerateReport}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Generate
                            </button>
                            <button
                                onClick={() => setShowGenerateReportModal(false)}
                                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Report Modal */}
            {showScheduleReportModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Schedule Report</h2>
                                <button
                                    onClick={() => setShowScheduleReportModal(false)}
                                    className="text-white hover:text-red-500 hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                    <option>SOC 2 Compliance</option>
                                    <option>GDPR Data Access</option>
                                    <option>User Activity Summary</option>
                                    <option>Security Incident Report</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                    <option>Monthly</option>
                                    <option>Quarterly</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="admin@vega.ai"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                    <option>PDF</option>
                                    <option>Excel</option>
                                    <option>CSV</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={handleScheduleReport}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Schedule
                            </button>
                            <button
                                onClick={() => setShowScheduleReportModal(false)}
                                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

export default AuditLogsSetting;