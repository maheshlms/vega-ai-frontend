import React, { useState, useRef, useEffect } from 'react';
import { FaLongArrowAltLeft } from "react-icons/fa";
import {useNavigate} from 'react-router-dom';

const AuthenticationSetting = () => {
    const navigate = useNavigate() ;
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [requireSpecialChars, setRequireSpecialChars] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState(true);
    const [ssoEnabled, setSsoEnabled] = useState(true);
    
    const [minPasswordLength, setMinPasswordLength] = useState("8");
    const [passwordExpiration, setPasswordExpiration] = useState("90");
    const [timeoutDuration, setTimeoutDuration] = useState("30");

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3 p-6 cursor-pointer">
                        <span className="text-gray-500  relative left-6   pb-8 "  onClick={()=>navigate('/settings')}>
                            <FaLongArrowAltLeft size={16}   />
                        </span>
                        <div>
                            <p className="text-sm text-gray-600 pl-6">Back to Settings</p>
                            <h1 className="text-2xl font-semibold mt-1">Authentication Settings</h1>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-6 max-w-7xl mx-auto">
                    {/* Multi-Factor Authentication Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Multi-Factor Authentication (MFA)
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Require users to verify their identity using a second factor
                                </p>
                            </div>
                            <div>
                                <button
                                    onClick={() => setMfaEnabled(prev => !prev)}
                                    className={`
                                        relative inline-flex h-6 w-11 items-center rounded-full
                                        transition-colors duration-300
                                        ${mfaEnabled ? "bg-blue-600" : "bg-gray-300"}
                                    `}
                                >
                                    <span
                                        className={`
                                            inline-block h-5 w-5 transform rounded-full bg-white
                                            transition-transform duration-300 shadow-sm
                                            ${mfaEnabled ? "translate-x-6" : "translate-x-0.5"}
                                        `}
                                    />
                                </button>
                            </div>
                        </div>
                        
                        {mfaEnabled && (
                            <div className="p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    MFA Methods
                                </label>
                                <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option>SMS Code</option>
                                    <option>Authenticator App</option>
                                    <option>Email Code</option>
                                    <option>Biometric</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Password Policies Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Password Policies
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Set password complexity and expiration requirements
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Minimum Password Length */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Password Length
                                </label>
                                <input
                                    type="number"
                                    value={minPasswordLength}
                                    onChange={(e) => setMinPasswordLength(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Password Expiration */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password Expiration (days)
                                </label>
                                <input
                                    type="number"
                                    value={passwordExpiration}
                                    onChange={(e) => setPasswordExpiration(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Require Special Characters */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    Require special characters
                                </span>
                                <button
                                    onClick={() => setRequireSpecialChars(prev => !prev)}
                                    className={`
                                        relative inline-flex h-6 w-11 items-center rounded-full
                                        transition-colors duration-300
                                        ${requireSpecialChars ? "bg-blue-600" : "bg-gray-300"}
                                    `}
                                >
                                    <span
                                        className={`
                                            inline-block h-5 w-5 transform rounded-full bg-white
                                            transition-transform duration-300 shadow-sm
                                            ${requireSpecialChars ? "translate-x-6" : "translate-x-0.5"}
                                        `}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Session Timeout Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Session Timeout
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Automatically log out users after period of inactivity
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSessionTimeout(prev => !prev)}
                                    className={`
                                        relative inline-flex h-6 w-11 items-center rounded-full
                                        transition-colors duration-300
                                        ${sessionTimeout ? "bg-blue-600" : "bg-gray-300"}
                                    `}
                                >
                                    <span
                                        className={`
                                            inline-block h-5 w-5 transform rounded-full bg-white
                                            transition-transform duration-300 shadow-sm
                                            ${sessionTimeout ? "translate-x-6" : "translate-x-0.5"}
                                        `}
                                    />
                                </button>
                            </div>
                        </div>

                        {sessionTimeout && (
                            <div className="p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Timeout Duration (minutes)
                                </label>
                                <input
                                    type="number"
                                    value={timeoutDuration}
                                    onChange={(e) => setTimeoutDuration(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Single Sign-On Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Single Sign-On (SSO)
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Allow users to authenticate using enterprise SSO providers
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSsoEnabled(prev => !prev)}
                                    className={`
                                        relative inline-flex h-6 w-11 items-center rounded-full
                                        transition-colors duration-300
                                        ${ssoEnabled ? "bg-blue-600" : "bg-gray-300"}
                                    `}
                                >
                                    <span
                                        className={`
                                            inline-block h-5 w-5 transform rounded-full bg-white
                                            transition-transform duration-300 shadow-sm
                                            ${ssoEnabled ? "translate-x-6" : "translate-x-0.5"}
                                        `}
                                    />
                                </button>
                            </div>
                        </div>

                        {ssoEnabled && (
                            <div className="p-6">
                                <button className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
                                    Configure SSO
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            Save Changes
                        </button>
                        <button className="px-6 py-2.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors">
                            Reset to Default
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AuthenticationSetting;