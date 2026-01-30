import React, { useState } from 'react';
import { FaLongArrowAltLeft, FaTimes, FaCheckCircle, FaExclamationCircle, FaEdit, FaTrash, FaUsers, FaCrown, FaUser, FaEye } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { IoMdInformationCircle } from "react-icons/io";

const UserGroupSetting = () => {
    const navigate = useNavigate();
    
    // Alert state
    const [alert, setAlert] = useState(null);

    // Show alert function
    const showAlert = (message, type = 'success') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000);
    };

    // User Management States
    const [defaultRole, setDefaultRole] = useState('Standard User');
    const [defaultGroups, setDefaultGroups] = useState('All Users');
    const [emailVerificationRequired, setEmailVerificationRequired] = useState(true);
    const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
    const [requireAdminApproval, setRequireAdminApproval] = useState(false);

    // Group Synchronization States
    const [groupSyncEnabled, setGroupSyncEnabled] = useState(true);
    const [syncSource, setSyncSource] = useState('Azure AD');
    const [syncFrequency, setSyncFrequency] = useState('Every 6 hours');
    const [groupMappings, setGroupMappings] = useState([
        { id: 1, sourceGroup: 'IT Department', vegaGroup: 'IT_Team' },
        { id: 2, sourceGroup: 'Engineering', vegaGroup: 'Developers' },
        { id: 3, sourceGroup: 'HR', vegaGroup: 'Human_Resources' }
    ]);

    // Roles Data
    const [roles, setRoles] = useState([
        { id: 1, name: 'Admin', icon: '👑', users: 5, color: 'red' },
        { id: 2, name: 'Manager', icon: '👨‍💼', users: 23, color: 'blue' },
        { id: 3, name: 'Standard User', icon: '👤', users: 487, color: 'green' },
        { id: 4, name: 'Read Only', icon: '👁️', users: 12, color: 'gray' }
    ]);

    // Self-Service Options States
    const [selfServiceOptions, setSelfServiceOptions] = useState({
        updateProfile: true,
        resetPassword: true,
        requestAccess: false,
        createGroups: false
    });

    // Modal States
    const [showAddMappingModal, setShowAddMappingModal] = useState(false);
    const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
    const [showEditRoleModal, setShowEditRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [newMapping, setNewMapping] = useState({ sourceGroup: '', vegaGroup: '' });
    const [newRole, setNewRole] = useState({ name: '', icon: '👤', users: 0, color: 'blue' });

    // Handle Self-Service Option Change
    const handleSelfServiceChange = (option) => {
        setSelfServiceOptions(prev => ({
            ...prev,
            [option]: !prev[option]
        }));
    };

    // Handle Add Mapping
    const handleAddMapping = () => {
        if (newMapping.sourceGroup.trim() && newMapping.vegaGroup.trim()) {
            setGroupMappings([...groupMappings, { 
                id: groupMappings.length + 1, 
                ...newMapping 
            }]);
            setNewMapping({ sourceGroup: '', vegaGroup: '' });
            setShowAddMappingModal(false);
            showAlert('Group mapping added successfully', 'success');
        }
    };

    // Handle Remove Mapping
    const handleRemoveMapping = (id) => {
        setGroupMappings(groupMappings.filter(mapping => mapping.id !== id));
        showAlert('Group mapping removed successfully', 'success');
    };

    // Handle Create Role
    const handleCreateRole = () => {
        if (newRole.name.trim()) {
            setRoles([...roles, { 
                id: roles.length + 1, 
                ...newRole 
            }]);
            setNewRole({ name: '', icon: '👤', users: 0, color: 'blue' });
            setShowCreateRoleModal(false);
            showAlert('Role created successfully', 'success');
        }
    };

    // Handle Edit Role
    const handleEditRole = (role) => {
        setSelectedRole(role);
        setShowEditRoleModal(true);
    };

    // Handle Delete Role
    const handleDeleteRole = (id) => {
        setRoles(roles.filter(role => role.id !== id));
        showAlert('Role deleted successfully', 'success');
    };

    // Handle Save Changes
    const handleSaveChanges = () => {
        showAlert('Users & Groups settings saved successfully', 'success');
    };

    // Handle Bulk Import
    const handleBulkImport = () => {
        showAlert('Opening bulk import wizard...', 'info');
    };

    // Handle Export Users
    const handleExportUsers = () => {
        showAlert('Exporting user list...', 'info');
    };

    // Handle Sync Now
    const handleSyncNow = () => {
        showAlert('Group synchronization started', 'success');
    };

    // Handle Manage Roles
    const handleManageRoles = () => {
        showAlert('Opening role management...', 'info');
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
                            <h1 className="text-2xl font-semibold mt-1">Users & Groups Settings</h1>
                            {/* <p className="text-xs text-gray-600">Manage user access, roles, and group synchronization</p> */}
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
                    {/* User Management */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">👤</span>
                            User Management
                        </h2>

                        <p className="text-sm font-medium text-gray-700 mb-4">Default User Settings:</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Default Role</label>
                                <select
                                    value={defaultRole}
                                    onChange={(e) => setDefaultRole(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>Standard User</option>
                                    <option>Manager</option>
                                    <option>Admin</option>
                                    <option>Read Only</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Default Groups</label>
                                <select
                                    value={defaultGroups}
                                    onChange={(e) => setDefaultGroups(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>All Users</option>
                                    <option>Department Specific</option>
                                    <option>None</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={emailVerificationRequired}
                                    onChange={(e) => setEmailVerificationRequired(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Email verification required</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={sendWelcomeEmail}
                                    onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Send welcome email</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={requireAdminApproval}
                                    onChange={(e) => setRequireAdminApproval(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Require admin approval for new users</span>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleBulkImport}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Bulk Import Users
                            </button>
                            <button
                                onClick={handleExportUsers}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-300"
                            >
                                Export User List
                            </button>
                        </div>
                    </div>

                    {/* Group Synchronization */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="text-2xl">🔄</span>
                                    Group Synchronization
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Sync groups from identity providers</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={groupSyncEnabled}
                                    onChange={(e) => setGroupSyncEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sync Source</label>
                                <select
                                    value={syncSource}
                                    onChange={(e) => setSyncSource(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>Azure AD</option>
                                    <option>Okta</option>
                                    <option>Google Workspace</option>
                                    <option>PingOne</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sync Frequency</label>
                                <select
                                    value={syncFrequency}
                                    onChange={(e) => setSyncFrequency(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                >
                                    <option>Every 1 hour</option>
                                    <option>Every 6 hours</option>
                                    <option>Every 12 hours</option>
                                    <option>Daily</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">Group Mapping:</p>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="grid grid-cols-3 gap-4 mb-3 text-xs font-semibold text-gray-600 uppercase">
                                    <div>Source Group</div>
                                    <div>Vega.ai Group</div>
                                    <div>Actions</div>
                                </div>
                                <div className="space-y-2">
                                    {groupMappings.map((mapping) => (
                                        <div key={mapping.id} className="grid grid-cols-3 gap-4 items-center bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="text-sm text-gray-800 font-medium">{mapping.sourceGroup}</div>
                                            <div className="text-sm text-gray-800 font-medium">{mapping.vegaGroup}</div>
                                            <div>
                                                <button
                                                    onClick={() => handleRemoveMapping(mapping.id)}
                                                    className="text-red-600 hover:text-red-700 transition"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddMappingModal(true)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                + Add Mapping
                            </button>
                            <button
                                onClick={handleSyncNow}
                                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Sync Now
                            </button>
                        </div>
                    </div>

                    {/* Role Assignment */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🎭</span>
                            Role Assignment
                        </h2>

                        <p className="text-sm font-medium text-gray-700 mb-4">Available Roles:</p>

                        <div className="space-y-3 mb-6">
                            {roles.map((role) => (
                                <div key={role.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{role.icon}</span>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{role.name}</h3>
                                            <p className="text-sm text-gray-600">({role.users} users)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditRole(role)}
                                            className="text-blue-600 hover:text-blue-700 transition p-2"
                                        >
                                            <FaEdit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRole(role.id)}
                                            className="text-red-600 hover:text-red-700 transition p-2"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowCreateRoleModal(true)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            + Create New Role
                        </button>
                    </div>

                    {/* Access Permissions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🔓</span>
                            Access Permissions
                        </h2>

                        <p className="text-sm font-medium text-gray-700 mb-3">Self-Service Options:</p>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selfServiceOptions.updateProfile}
                                    onChange={() => handleSelfServiceChange('updateProfile')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Users can update their profile</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selfServiceOptions.resetPassword}
                                    onChange={() => handleSelfServiceChange('resetPassword')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Users can reset their password</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selfServiceOptions.requestAccess}
                                    onChange={() => handleSelfServiceChange('requestAccess')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Users can request access to resources</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selfServiceOptions.createGroups}
                                    onChange={() => handleSelfServiceChange('createGroups')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">Users can create groups</span>
                            </label>
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
                            onClick={handleManageRoles}
                            className="text-sm font-medium text-gray-700 bg-gray-200 px-6 py-3 rounded-md font-semibold hover:text-gray-900 "
                        >
                            Manage Roles
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Mapping Modal */}
            {showAddMappingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Add Group Mapping</h2>
                                <button
                                    onClick={() => setShowAddMappingModal(false)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Source Group</label>
                                <input
                                    type="text"
                                    value={newMapping.sourceGroup}
                                    onChange={(e) => setNewMapping({ ...newMapping, sourceGroup: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="e.g., Marketing Team"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vega.ai Group</label>
                                <input
                                    type="text"
                                    value={newMapping.vegaGroup}
                                    onChange={(e) => setNewMapping({ ...newMapping, vegaGroup: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    placeholder="e.g., Marketing_Team"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={handleAddMapping}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Add Mapping
                            </button>
                            <button
                                onClick={() => setShowAddMappingModal(false)}
                                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Role Modal */}
            {showCreateRoleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Create New Role</h2>
                                <button
                                    onClick={() => setShowCreateRoleModal(false)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                                <input
                                    type="text"
                                    value={newRole.name}
                                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder="e.g., Supervisor"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                                <select
                                    value={newRole.icon}
                                    onChange={(e) => setNewRole({ ...newRole, icon: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                >
                                    <option value="👤">👤 User</option>
                                    <option value="👨‍💼">👨‍💼 Manager</option>
                                    <option value="👑">👑 Admin</option>
                                    <option value="👁️">👁️ Viewer</option>
                                    <option value="⚡">⚡ Power User</option>
                                    <option value="🎯">🎯 Specialist</option>
                                </select>
                            </div>
                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                            <select
                                value={newRole.color}
                                onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            >
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                                <option value="red">Red</option>
                                <option value="purple">Purple</option>
                                <option value="yellow">Yellow</option>
                                <option value="gray">Gray</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <button
                            onClick={handleCreateRole}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            Create Role
                        </button>
                        <button
                            onClick={() => setShowCreateRoleModal(false)}
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

export default UserGroupSetting;