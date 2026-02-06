import React, { useState } from 'react';
import { FaLongArrowAltLeft, FaTimes, FaCheckCircle, FaExclamationCircle, FaUpload, FaEdit, FaDownload, FaFileExport } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { IoMdInformationCircle } from "react-icons/io";
import { MdColorLens, MdLanguage } from "react-icons/md";

const GeneralSetting = () => {
    const navigate = useNavigate();
    
    // Alert state
    const [alert, setAlert] = useState(null);

    // Show alert function
    const showAlert = (message, type = 'success') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000);
    };

    // Organization Profile States
    const [organizationName, setOrganizationName] = useState('Vega AI Corp');
    const [displayName, setDisplayName] = useState('Vega.ai');
    const [website, setWebsite] = useState('https://vega.ai');
    const [supportEmail, setSupportEmail] = useState('support@vega.ai');
    const [organizationLogo, setOrganizationLogo] = useState(null);

    // Regional Settings States
    const [timezone, setTimezone] = useState('UTC-8 (PST)');
    const [language, setLanguage] = useState('English');
    const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
    const [timeFormat, setTimeFormat] = useState('12-hour');
    const [firstDayOfWeek, setFirstDayOfWeek] = useState('Sunday');

    // Branding States
    const [primaryColor, setPrimaryColor] = useState('#667EEA');
    const [secondaryColor, setSecondaryColor] = useState('#764BA2');
    const [theme, setTheme] = useState('Dark');
    const [customDomain, setCustomDomain] = useState('app.vega.ai');
    const [enableCustomDomain, setEnableCustomDomain] = useState(true);

    // Data Management States
    const [lastBackup, setLastBackup] = useState('January 20, 2026');

    // Email Templates States
    const [emailTemplates] = useState([
        { id: 1, name: 'Welcome Email', description: 'Sent when a new user joins' },
        { id: 2, name: 'Password Reset', description: 'Sent when user requests password reset' },
        { id: 3, name: 'Account Verification', description: 'Sent to verify email address' },
        { id: 4, name: 'Security Alert', description: 'Sent for security notifications' }
    ]);

    // Advanced Settings States
    const [debugMode, setDebugMode] = useState(true);
    const [showSystemNotifications, setShowSystemNotifications] = useState(true);
    const [enableBetaFeatures, setEnableBetaFeatures] = useState(false);

    // Modal States
    const [showLogoUploadModal, setShowLogoUploadModal] = useState(false);
    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
    const [showBackupModal, setShowBackupModal] = useState(false);

    // Handle Logo Upload
    const handleLogoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setOrganizationLogo(reader.result);
                setShowLogoUploadModal(false);
                showAlert('Logo uploaded successfully', 'success');
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle Save Changes
    const handleSaveChanges = () => {
        showAlert('General settings saved successfully', 'success');
    };

    // Handle Export Data
    const handleExportData = () => {
        showAlert('Exporting all data... Download will start shortly', 'info');
    };

    // Handle Backup Settings
    const handleBackupSettings = () => {
        setShowBackupModal(false);
        showAlert('Backup created successfully', 'success');
    };

    // Handle Create Backup
    const handleCreateBackup = () => {
        setLastBackup(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
        showAlert('Backup created successfully', 'success');
    };

    // Handle Reset All Settings
    const handleResetAllSettings = () => {
        setShowResetConfirmModal(false);
        showAlert('All settings have been reset to default', 'success');
    };

    // Handle Edit Email Template
    const handleEditTemplate = (templateName) => {
        showAlert(`Opening ${templateName} editor...`, 'info');
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3 p-6 cursor-pointer">
                        <span className="text-gray-500 relative left-6 pb-8" onClick={() => navigate('/settings')}>
                            <FaLongArrowAltLeft size={16} className=" hover:text-gray-700 transition" />
                        </span>
                        <div>
                            <p className="text-sm text-gray-600 pl-6 hover:text-indigo-600 transition" onClick={() => navigate('/settings')}>
                                Back to Settings
                            </p>
                            <h1 className="text-2xl font-semibold mt-1">General Settings</h1>
                            {/* <p className="text-xs text-gray-600">Configure organization profile, branding, and preferences</p> */}
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
                    {/* Organization Profile */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🏢</span>
                            Organization Profile
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                                <input
                                    type="text"
                                    value={organizationName}
                                    onChange={(e) => setOrganizationName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="Vega AI Corp"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="Vega.ai"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="https://vega.ai"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                                <input
                                    type="email"
                                    value={supportEmail}
                                    onChange={(e) => setSupportEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="support@vega.ai"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Organization Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-md">
                                    {organizationLogo ? (
                                        <img src={organizationLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        '🧠'
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowLogoUploadModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                                >
                                    <FaUpload size={14} />
                                    Upload New Logo
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Regional Settings */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MdLanguage className="text-2xl text-blue-600" />
                            Regional Settings
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                                <select
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>UTC-8 (PST)</option>
                                    <option>UTC-5 (EST)</option>
                                    <option>UTC+0 (GMT)</option>
                                    <option>UTC+1 (CET)</option>
                                    <option>UTC+5:30 (IST)</option>
                                    <option>UTC+8 (CST)</option>
                                </select>
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
                                    <option>Japanese</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                                <select
                                    value={dateFormat}
                                    onChange={(e) => setDateFormat(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>MM/DD/YYYY</option>
                                    <option>DD/MM/YYYY</option>
                                    <option>YYYY-MM-DD</option>
                                    <option>DD.MM.YYYY</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                                <select
                                    value={timeFormat}
                                    onChange={(e) => setTimeFormat(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>12-hour</option>
                                    <option>24-hour</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">First Day of Week</label>
                                <select
                                    value={firstDayOfWeek}
                                    onChange={(e) => setFirstDayOfWeek(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>Sunday</option>
                                    <option>Monday</option>
                                    <option>Saturday</option>
                                </select>
                            </div>
                        </div>  
                    </div>

                    {/* Branding & Customization
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MdColorLens className="text-2xl text-purple-600" />
                            Branding & Customization
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="theme"
                                        value="Light"
                                        checked={theme === 'Light'}
                                        onChange={(e) => setTheme(e.target.value)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Light</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="theme"
                                        value="Dark"
                                        checked={theme === 'Dark'}
                                        onChange={(e) => setTheme(e.target.value)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Dark</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="theme"
                                        value="Auto"
                                        checked={theme === 'Auto'}
                                        onChange={(e) => setTheme(e.target.value)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Auto</span>
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Domain</label>
                            <input
                                type="text"
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                placeholder="app.vega.ai"
                            />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group mb-4">
                            <input
                                type="checkbox"
                                checked={enableCustomDomain}
                                onChange={(e) => setEnableCustomDomain(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Enable custom domain</span>
                        </label>

                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                            Preview Branding
                        </button>
                    </div> */}

                    {/* Data Management */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">💾</span>
                            Data Management
                        </h2>

                        <div className="space-y-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Export All Data</h3>
                                        <p className="text-sm text-gray-600 mt-1">Export your organization's data in JSON format</p>
                                    </div>
                                    <button
                                        onClick={handleExportData}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                                    >
                                        <FaDownload size={14} />
                                        Export
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Backup Settings</h3>
                                        <p className="text-sm text-gray-600 mt-1">Create a backup of all configurations</p>
                                        <p className="text-xs text-gray-500 mt-1">Last Backup: {lastBackup}</p>
                                    </div>
                                    <button
                                        onClick={handleCreateBackup}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                                    >
                                        Create Backup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Email Templates */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">📧</span>
                            Email Templates
                        </h2>

                        <p className="text-sm text-gray-600 mb-4">Customize email templates:</p>

                        <div className="space-y-3">
                            {emailTemplates.map((template) => (
                                <div key={template.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition">
                                    <div>
                                        <h3 className="font-medium text-gray-800">{template.name}</h3>
                                        <p className="text-sm text-gray-600">{template.description}</p>
                                    </div>
                                    <button
                                        onClick={() => handleEditTemplate(template.name)}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium transition flex items-center gap-1"
                                    >
                                        <FaEdit size={14} />
                                        Edit
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">⚙️</span>
                            Advanced Settings
                        </h2>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={debugMode}
                                    onChange={(e) => setDebugMode(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Enable debug mode</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={showSystemNotifications}
                                    onChange={(e) => setShowSystemNotifications(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Show system notifications</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={enableBetaFeatures}
                                    onChange={(e) => setEnableBetaFeatures(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Enable beta features</span>
                            </label>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowResetConfirmModal(true)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                            >
                                Reset All Settings to Default
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
                        <button
                            onClick={() => navigate('/settings')}
                            className="text-sm font-medium text-gray-700 bg-gray-200 px-6 py-3 rounded-md font-semibold hover:text-gray-900 "
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* Logo Upload Modal */}
            {showLogoUploadModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Upload Organization Logo</h2>
                                <button
                                    onClick={() => setShowLogoUploadModal(false)}
                                    className="text-white hover:text-red-500 hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
                                <p className="text-sm text-gray-600 mb-4">Click to upload or drag and drop</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    id="logo-upload"
                                />
                                <label
                                    htmlFor="logo-upload"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer inline-blocktransition-all duration-200"
>
Choose File
</label>
<p className="text-xs text-gray-500 mt-3">PNG, JPG up to 2MB</p>
</div>
</div>

<div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <button
                            onClick={() => setShowLogoUploadModal(false)}
                            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirmModal && (
            <div className="fixed inset-0 bg-white/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <FaExclamationCircle className="text-red-600 text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Reset All Settings</h2>
                                <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-gray-700 leading-relaxed">
                            Are you sure you want to reset all settings to their default values?
                            <br /><br />
                            This will affect:
                            <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                                <li>Organization profile</li>
                                <li>Regional preferences</li>
                                <li>Branding and theme</li>
                                <li>All advanced settings</li>
                            </ul>
                        </p>
                    </div>

                    <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <button
                            onClick={handleResetAllSettings}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            Yes, Reset All
                        </button>
                        <button
                            onClick={() => setShowResetConfirmModal(false)}
                            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
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

export default GeneralSetting;