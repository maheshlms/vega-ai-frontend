import React, { useState, useEffect } from 'react';
import { FaPlus, FaSync, FaTrash, FaEdit, FaCheckCircle, FaTimesCircle, FaClock, FaLock, FaArrowLeft } from 'react-icons/fa';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { auth } from '../utils/auth';
import TargetSystemForm from './TargetSystemForm';
import TargetSystemStatus from './TargetSystemStatus';

const TargetSystems = () => {
  const { integrationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const integrationName = location.state?.integrationName;
  const integrationValue = location.state?.integrationValue;
  const authMethodsFromState = location.state?.authMethods || [];
  
  const [systems, setSystems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSystem, setEditingSystem] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [typeOptions, setTypeOptions] = useState([]);
  const [availableAuthMethods, setAvailableAuthMethods] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [canAdd, setCanAdd] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  
  // Filter states - don't include integrationId in API filters
  const [filters, setFilters] = useState({
    environment: '',
    status: ''
  });

  useEffect(() => {
    // Check user roles and permissions
    const user = auth.getCurrentUser();
    setIsAdmin(user?.role === 'admin');
    
    const roles = user?.roles || [];
    setUserRoles(roles);
    
    // Check specific permissions
    setCanAdd(roles.includes('create:target_systems'));
    setCanEdit(roles.includes('edit:target_systems'));
    setCanDelete(roles.includes('delete:target_systems'));
    
    fetchData();
  }, [filters]);

  // Use auth methods from route state (passed from IntegrationsPage)
  useEffect(() => {
    if (authMethodsFromState && authMethodsFromState.length > 0) {
      setAvailableAuthMethods(authMethodsFromState);
    }
  }, [authMethodsFromState]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all systems (don't pass integration type to API)
      const [systemsData, typesData] = await Promise.all([
        api.targetSystems.list(filters),
        api.targetSystems.getTypes().catch(() => [])
      ]);

      let systemsList = Array.isArray(systemsData) ? systemsData : systemsData.systems || [];
      
      // Log to see what fields are available
      console.log('[fetchData] Raw systems data:', systemsData);
      if (systemsList.length > 0) {
        console.log('[fetchData] First system object keys:', Object.keys(systemsList[0]));
        console.log('[fetchData] First system object:', systemsList[0]);
      }
      
      // Filter by integration_id on the frontend if integrationId is provided
      if (integrationId) {
        console.log('[fetchData] Filtering by integrationId:', integrationId);
        systemsList = systemsList.filter(s => {
          console.log('[fetchData] System:', s.name, 'integration_id:', s.integration_id, 'matches:', s.integration_id === integrationId);
          return s.integration_id === integrationId;
        });
      }
  
      setSystems(systemsList);
      setTypeOptions(Array.isArray(typesData) ? typesData : typesData.types || []);
      
      // Calculate stats from the filtered systems list
      const calculatedStats = {
        total_systems: systemsList.length,
        connected: systemsList.filter(s => s.status === 'connected').length,
        disconnected: systemsList.filter(s => s.status === 'disconnected').length,
        error: systemsList.filter(s => s.status === 'error').length,
        pending: systemsList.filter(s => s.status === 'pending').length
      };
      setStats(calculatedStats);
    } catch (err) {
      console.error('Error fetching target systems:', err);
      setError(err.message || 'Failed to fetch target systems');
      setSystems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await api.targetSystems.create(data);
      setShowForm(false);
      setEditingSystem(null);
      fetchData();
    } catch (err) {
      console.error('Error creating target system:', err);
      alert('Failed to create target system: ' + err.message);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await api.targetSystems.update(id, data);
      setShowForm(false);
      setEditingSystem(null);
      fetchData();
    } catch (err) {
      console.error('Error updating target system:', err);
      alert('Failed to update target system: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this target system?')) {
      return;
    }

    try {
      await api.targetSystems.delete(id);
      fetchData();
    } catch (err) {
      console.error('Error deleting target system:', err);
      alert('Failed to delete target system: ' + err.message);
    }
  };

  const handleTestConnection = async (id) => {
    setTestingId(id);
    try {
      const result = await api.targetSystems.testConnection(id);
      console.log('[handleTestConnection] Result:', result);
      const message = result.message || result.detail || 'Connection test completed';
      alert(`Connection test: ${message}`);
      fetchData();
    } catch (err) {
      console.error('Connection test failed:', err);
      alert('Connection test failed: ' + err.message);
    } finally {
      setTestingId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <FaCheckCircle className="text-green-500" />;
      case 'disconnected':
        return <FaTimesCircle className="text-red-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500 animate-spin" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'disconnected':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'error':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex justify-between items-start">
            <div>
              {integrationId && (
                <button
                  onClick={() => navigate('/integration')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3"
                >
                  <FaArrowLeft size={16} />
                  <span className="text-sm">Back to Integrations</span>
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {integrationName ? `${integrationName} - Target Systems` : 'Target Systems'}
              </h1>
              <p className="text-sm text-gray-500">
                {integrationName 
                  ? `Manage target systems for ${integrationName}` 
                  : 'Manage your connected systems and integrations'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                title="Refresh systems"
              >
                <FaSync className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              {canAdd ? (
                <button
                  onClick={() => {
                    setEditingSystem(null);
                    setShowForm(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  title="Add a new target system"
                >
                  <FaPlus />
                  Add Target System
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                  title="You do not have permission to add target systems"
                >
                  <FaLock />
                  Restricted
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total_systems || 0}</div>
                  <div className="text-xs text-gray-500">Total Systems</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.connected || 0}</div>
                  <div className="text-xs text-gray-500">Connected</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaTimesCircle className="text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.disconnected || 0}</div>
                  <div className="text-xs text-gray-500">Disconnected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 pb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Environment</label>
              <select
                value={filters.environment}
                onChange={(e) => setFilters({ ...filters, environment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Environments</option>
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Connection Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="connected">Connected</option>
                <option value="disconnected">Disconnected</option>
                <option value="error">Error</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <TargetSystemForm
            system={editingSystem}
            typeOptions={typeOptions}
            availableAuthMethods={availableAuthMethods}
            integrationValue={integrationValue}
            integrationId={integrationId}
            integrationName={integrationName}
            onSubmit={editingSystem ? (data) => handleUpdate(editingSystem._id, data) : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingSystem(null);
            }}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="px-6 pb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Target Systems Grid */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : systems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">No target systems found</p>
            {canAdd && (
              <button
                onClick={() => {
                  setEditingSystem(null);
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaPlus />
                Create your first target system
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systems.map((system) => (
              <div key={system._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow w-fit min-w-[400px] max-w-full">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{system.name}</h3>
                    <TargetSystemStatus status={system.status} />
                  </div>
                  <p className="text-sm text-gray-600">{system.type}</p>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Environment:</span>
                    <span className="ml-2 font-medium text-gray-900">{system.environment}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Host:</span>
                    <span className="ml-2 font-medium text-gray-900 break-all">{system.base_url || system.host}</span>
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(system.status)}`}>
                      {system.status}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 flex gap-2">
                  {canEdit ? (
                    <button
                      onClick={() => {
                        setEditingSystem(system);
                        setShowForm(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-sm font-medium"
                      title="Edit this target system"
                    >
                      <FaEdit className="text-sm" />
                      Edit
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 cursor-not-allowed rounded text-sm font-medium"
                      title="You do not have permission to edit target systems"
                    >
                      <FaEdit className="text-sm" />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleTestConnection(system._id)}
                    disabled={testingId === system._id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 text-sm font-medium disabled:opacity-50"
                  >
                    <FaCheckCircle className="text-sm" />
                    Test
                  </button>
                  {canDelete ? (
                    <button
                      onClick={() => handleDelete(system._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium"
                      title="Delete this target system"
                    >
                      <FaTrash className="text-sm" />
                      Delete
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 cursor-not-allowed rounded text-sm font-medium"
                      title="You do not have permission to delete target systems"
                    >
                      <FaTrash className="text-sm" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TargetSystems;
