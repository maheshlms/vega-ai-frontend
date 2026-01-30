import {React  , useState} from 'react';
import { FaLongArrowAltLeft, FaTimes, FaCheckCircle, FaExclamationCircle, FaSlack } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { IoMdInformationCircle } from "react-icons/io";
import { PiMicrosoftTeamsLogoFill } from "react-icons/pi";

import { MdEmail } from "react-icons/md";

const NotificationSetting = () => {
    const navigate = useNavigate() ;

    const [alert , setAlert] = useState(null) ;

    const showAlert = (message , type="success") =>{
        setAlert({message , type}) ;
        setTimeout(()=>setAlert(null), 5000) ;
    }

     // Email Notifications States

    const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
    const [emailAddress , setEmailAddress] = useState("admin@gmail.com") ;
     const [emailFrequency, setEmailFrequency] = useState('Real-time');
    const[emailNotifications , setEmailNotifications] =useState({
        newUserRegistration: true,
        failedLoginAttempts: true,
        permissionChanges: true , 
        systemAlerts: true , 
        dailyActivitySummary : false
    })

    //slack Notifications States
     const [slackEnabled, setSlackEnabled] = useState(true);
    const [slackConnected, setSlackConnected] = useState(true);
    const [slackChannels, setSlackChannels] = useState({
        securityAlerts: '#security',
        userActivity: '#iam-logs',
        systemStatus: '#system-alerts'
    });

    //microsoft teams Notification states

    const [teamsEnabled , setTeamsEnabled] = useState(false) ;
    const[teamsConnected , setTeamsConnected] = useState(false) ;

    // security alert  state 
    const[alertThreshold, setAlertThreshold] = useState({
        failedLogins: "5",
         timeWindow: '10'
        })

    const[criticalAlerts , setCriticalAlerts] = useState({
         multipleMFAAttempts: true,
        accountLockout: true,
        privilegeEscalation: true,
        unusualLoginLocation: true
    }) ;

     const [activityNotifications, setActivityNotifications] = useState({
        newUserProvisioned: true,
        userDeprovisioned: true,
        groupMembershipChanged: true,
        roleAssignmentChanged: true,
        userProfileUpdated: false
    });

    // Modal States
    const [showSlackConfigModal, setShowSlackConfigModal] = useState(false);
    const [showTeamsConfigModal, setShowTeamsConfigModal] = useState(false);

    // Handle Email Notification Change
    const handleEmailNotificationChange = (notification) => {
        setEmailNotifications(prev => ({
            ...prev,
            [notification]: !prev[notification]
        }));
    };


    const handleCriticalAlertChange = (alert) => {
        setCriticalAlerts(prev => ({
            ...prev ,
            [alert] : !prev[alert] 
    } )) ;
    } ;


     // Handle Activity Notification Change
    const handleActivityNotificationChange = (notification) => {
        setActivityNotifications(prev => ({
            ...prev,
            [notification]: !prev[notification]
        }));
    };

    // Handle Slack Channel Change
    const handleSlackChannelChange = (channel, value) => {
        setSlackChannels(prev => ({
            ...prev,
            [channel]: value
        }));
    };

    // Handle Disconnect Slack
    const handleDisconnectSlack = () => {
        setSlackConnected(false);
        showAlert('Slack disconnected successfully', 'success');
    };

        // Handle Connect Slack
    const handleConnectSlack = () => {
        setSlackConnected(true);
        setShowSlackConfigModal(false);
        showAlert('Slack connected successfully', 'success');
    };

    // Handle Connect Teams
    const handleConnectTeams = () => {
        setTeamsConnected(true);
        setShowTeamsConfigModal(false);
        showAlert('Microsoft Teams connected successfully', 'success');
    };

     // Handle Disconnect Teams
    const handleDisconnectTeams = () => {
        setTeamsConnected(false);
        showAlert('Microsoft Teams disconnected successfully', 'success');
    };


     // Handle Save Changes
    const handleSaveChanges = () => {
        showAlert('Notification settings saved successfully', 'success');
    };


     const handleSendTestAlert = () => {
        showAlert('Test alert sent successfully', 'info');
    };


     return(
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
                            <h1 className="text-2xl font-semibold mt-1">Notification Settings</h1>
                            {/* <p className="text-xs text-gray-600">Configure alerts and notification preferences</p> */}
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
                    {/* Email Notifications */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <MdEmail className="text-2xl text-blue-600" />
                                    Email Notifications
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Send notifications via email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={emailNotificationsEnabled}
                                    onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-700 mb-3">Notify me about:</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={emailNotifications.newUserRegistrations}
                                        onChange={() => handleEmailNotificationChange('newUserRegistrations')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">New user registrations</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={emailNotifications.failedLoginAttempts}
                                        onChange={() => handleEmailNotificationChange('failedLoginAttempts')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Failed login attempts</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={emailNotifications.permissionChanges}
                                        onChange={() => handleEmailNotificationChange('permissionChanges')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Permission changes</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={emailNotifications.systemAlerts}
                                        onChange={() => handleEmailNotificationChange('systemAlerts')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">System alerts</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={emailNotifications.dailyActivitySummary}
                                        onChange={() => handleEmailNotificationChange('dailyActivitySummary')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Daily activity summary</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={emailAddress}
                                    onChange={(e) => setEmailAddress(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="admin@vega.ai"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                                <select
                                    value={emailFrequency}
                                    onChange={(e) => setEmailFrequency(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>Real-time</option>
                                    <option>Hourly Digest</option>
                                    <option>Daily Digest</option>
                                    <option>Weekly Digest</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Slack Integration */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <FaSlack className="text-2xl text-purple-600" />
                                    Slack Integration
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Send alerts to Slack channels</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={slackEnabled}
                                    onChange={(e) => setSlackEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>

                        {slackConnected ? (
                            <>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                                    <FaCheckCircle className="text-green-600" />
                                    <span className="text-sm text-green-800 font-medium">Connected to workspace</span>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Security Alerts Channel</label>
                                        <input
                                            type="text"
                                            value={slackChannels.securityAlerts}
                                            onChange={(e) => handleSlackChannelChange('securityAlerts', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                                            placeholder="#security"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">User Activity Channel</label>
                                        <input
                                            type="text"
                                            value={slackChannels.userActivity}
                                            onChange={(e) => handleSlackChannelChange('userActivity', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                                            placeholder="#iam-logs"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">System Status Channel</label>
                                        <input
                                            type="text"
                                            value={slackChannels.systemStatus}
                                            onChange={(e) => handleSlackChannelChange('systemStatus', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                                            placeholder="#system-alerts"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowSlackConfigModal(true)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-300"
                                    >
                                        Configure Channels
                                    </button>
                                    <button
                                        onClick={handleDisconnectSlack}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-gray-600">Not connected to Slack workspace</p>
                                </div>
                                <button
                                    onClick={() => setShowSlackConfigModal(true)}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    Connect Slack
                                </button>
                            </>
                        )}
                    </div>

                    {/* Microsoft Teams Integration */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <PiMicrosoftTeamsLogoFill className="text-2xl text-blue-600" />
                                    Microsoft Teams
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Send alerts to Teams channels</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={teamsEnabled}
                                    onChange={(e) => setTeamsEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {teamsConnected ? (
                            <>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                                    <FaCheckCircle className="text-green-600" />
                                    <span className="text-sm text-green-800 font-medium">Connected to Teams</span>
                                </div>

                                <button
                                    onClick={handleDisconnectTeams}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                                >
                                    Disconnect
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-gray-600">Not connected to Microsoft Teams</p>
                                </div>
                                <button
                                    onClick={() => setShowTeamsConfigModal(true)}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    Connect Teams
                                </button>
                            </>
                        )}
                    </div>

                    {/* Security Alerts */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🚨</span>
                            Security Alerts
                        </h2>

                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-700 mb-3">Alert Threshold:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Failed Logins</label>
                                    <input
                                        type="number"
                                        value={alertThreshold.failedLogins}
                                        onChange={(e) => setAlertThreshold({ ...alertThreshold, failedLogins: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        placeholder="5"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Number of attempts</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Window</label>
                                    <input
                                        type="number"
                                        value={alertThreshold.timeWindow}
                                        onChange={(e) => setAlertThreshold({ ...alertThreshold, timeWindow: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        placeholder="10"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Minutes</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Critical Alerts:</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={criticalAlerts.multipleMFAAttempts}
                                        onChange={() => handleCriticalAlertChange('multipleMFAAttempts')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Multiple failed MFA attempts</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={criticalAlerts.accountLockout}
                                        onChange={() => handleCriticalAlertChange('accountLockout')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Account lockout</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={criticalAlerts.privilegeEscalation}
                                        onChange={() => handleCriticalAlertChange('privilegeEscalation')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Privilege escalation</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={criticalAlerts.unusualLoginLocation}
                                        onChange={() => handleCriticalAlertChange('unusualLoginLocation')}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Unusual login location</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Activity Notifications */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">📊</span>
                            Activity Notifications
                        </h2>

                        <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={activityNotifications.newUserProvisioned}
                                    onChange={() => handleActivityNotificationChange('newUserProvisioned')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">New user provisioned</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={activityNotifications.userDeprovisioned}
                                    onChange={() => handleActivityNotificationChange('userDeprovisioned')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">User deprovisioned</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={activityNotifications.groupMembershipChanged}
                                    onChange={() => handleActivityNotificationChange('groupMembershipChanged')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Group membership changed</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={activityNotifications.roleAssignmentChanged}
                                    onChange={() => handleActivityNotificationChange('roleAssignmentChanged')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Role assignment changed</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={activityNotifications.userProfileUpdated}
                                    onChange={() => handleActivityNotificationChange('userProfileUpdated')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">User profile updated</span>
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
                         onClick={handleSendTestAlert}
                         className="text-sm font-medium text-gray-700 bg-gray-200 px-6 py-3 rounded-md font-semibold hover:text-gray-900 "
                     >
Send Test Alert
</button>
</div>
</div>
</div>
        {/* Slack Configuration Modal */}
        {showSlackConfigModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-2xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <FaSlack /> {slackConnected ? 'Configure' : 'Connect'} Slack
                            </h2>
                            <button
                                onClick={() => setShowSlackConfigModal(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {slackConnected ? (
                            <p className="text-sm text-gray-600 mb-4">Update your Slack channel configurations</p>
                        ) : (
                            <p className="text-sm text-gray-600 mb-4">Connect your Slack workspace to receive notifications</p>
                        )}
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-sm text-purple-800">
                                Click the button below to authorize Vega.ai to send messages to your Slack workspace.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <button
                            onClick={handleConnectSlack}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            {slackConnected ? 'Update Configuration' : 'Authorize Slack'}
                        </button>
                        <button
                            onClick={() => setShowSlackConfigModal(false)}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Teams Configuration Modal */}
        {showTeamsConfigModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <PiMicrosoftTeamsLogoFill /> Connect Microsoft Teams
                            </h2>
                            <button
                                onClick={() => setShowTeamsConfigModal(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-gray-600 mb-4">Connect your Microsoft Teams to receive notifications</p>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                Click the button below to authorize Vega.ai to send messages to your Teams channels.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <button
                            onClick={handleConnectTeams}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            Authorize Teams
                        </button>
                        <button
                            onClick={() => setShowTeamsConfigModal(false)}
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
}


export default NotificationSetting;