import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaSync, FaTrash, FaEdit, FaCheckCircle, FaTimesCircle, FaClock, FaLock, FaArrowLeft } from 'react-icons/fa';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { auth } from '../utils/auth';
import TargetSystemForm from './TargetSystemForm';
import TargetSystemStatus from './TargetSystemStatus';
import { toast } from "react-toastify";

interface LocationState {
  integrationName?: string;
  integrationValue?: string;
  authMethods?: string[];
}

interface System {
  _id: string;
  name: string;
  type: string;
  environment: string;
  status: string;
  base_url?: string;
  host?: string;
  integration_id?: string;
}

interface Stats {
  total_systems: number;
  connected: number;
  disconnected: number;
  error: number;
  pending: number;
}

interface Filters {
  environment: string;
  status: string;
}

interface TypeOption {
  value: string;
  label: string;
}

interface SystemsResponse {
  systems?: System[];
  [key: string]: any;
}

interface TypesResponse {
  types?: TypeOption[];
  [key: string]: any;
}

interface TestConnectionResult {
  message?: string;
  detail?: string;
  [key: string]: any;
}

interface User {
  role?: string;
  roles?: string[];
  [key: string]: any;
}

const TargetSystemShow: React.FC = () => {
  const { integrationId } = useParams<{ integrationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | undefined;
  const integrationName = locationState?.integrationName;
  const integrationValue = locationState?.integrationValue;
  const authMethodsFromState = locationState?.authMethods || [];
  
  const [systems, setSystems] = useState<System[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [typeOptions, setTypeOptions] = useState<TypeOption[]>([]);
  const [availableAuthMethods, setAvailableAuthMethods] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [canAdd, setCanAdd] = useState<boolean>(false);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [canDelete, setCanDelete] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [systemToDelete, setSystemToDelete] = useState<System | null>(null);
  
  // Filter states - don't include integrationId in API filters
  const [filters, setFilters] = useState<Filters>({
    environment: '',
    status: ''
  });

  useEffect(() => {
    // Check user roles and permissions
    const user: User | null = auth.getCurrentUser();
    const isUserAdmin: boolean = auth.isAdmin();
    setIsAdmin(isUserAdmin);
    
    const roles = user?.roles || [];
    setUserRoles(roles);
    
    console.log('[TargetSystemShow] User:', user);
    console.log('[TargetSystemShow] Is Admin:', isUserAdmin);
    console.log('[TargetSystemShow] Roles:', roles);
    
    // Admins can do everything
    const hasCreatePerm = roles.includes('create:target_systems') || isUserAdmin;
    const hasEditPerm = roles.includes('edit:target_systems') || isUserAdmin;
    const hasDeletePerm = roles.includes('delete:target_systems') || isUserAdmin;
    
    console.log('[TargetSystemShow] Permissions - Create:', hasCreatePerm, 'Edit:', hasEditPerm, 'Delete:', hasDeletePerm);
    
    setCanAdd(hasCreatePerm);
    setCanEdit(hasEditPerm);
    setCanDelete(hasDeletePerm);
    
    fetchData();
  }, [filters]);

  // Use auth methods from route state
  useEffect(() => {
    if (authMethodsFromState && authMethodsFromState.length > 0) {
      setAvailableAuthMethods(authMethodsFromState);
    }
  }, [authMethodsFromState]);

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [systemsData, typesData]: [SystemsResponse, TypesResponse | TypeOption[]] = await Promise.all([
        api.targetSystems.list(filters),
        api.targetSystems.getTypes().catch(() => [])
      ]);

      let systemsList: System[] = Array.isArray(systemsData) ? systemsData : systemsData.systems || [];
      
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
      setTypeOptions(Array.isArray(typesData) ? typesData : (typesData as TypesResponse).types || []);
      
      // Calculate stats from the filtered systems list
      const calculatedStats: Stats = {
        total_systems: systemsList.length,
        connected: systemsList.filter(s => s.status === 'connected').length,
        disconnected: systemsList.filter(s => s.status === 'disconnected').length,
        error: systemsList.filter(s => s.status === 'error').length,
        pending: systemsList.filter(s => s.status === 'pending').length
      };
      setStats(calculatedStats);
    } catch (err) {
      console.error('Error fetching target systems:', err);
      setError((err as Error).message || 'Failed to fetch target systems');
      setSystems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any): Promise<void> => {
    try {
      await api.targetSystems.create(data);
      toast.success('Target system created successfully');
      // Only close form and refresh on success
      setShowForm(false);
      setEditingSystem(null);
      fetchData();
    } catch (err: any) {
      console.error('Error creating target system:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to create target system';
      toast.error(errorMessage);
      // DON'T close form - let user fix the error
    }
  };

  const handleUpdate = async (id: string, data: any): Promise<void> => {
    try {
      await api.targetSystems.update(id, data);
      toast.success('Target system updated successfully');
      // Only close form and refresh on success
      setShowForm(false);
      setEditingSystem(null);
      fetchData();
    } catch (err: any) {
      console.error('Error updating target system:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to update target system';
      toast.error(errorMessage);
      // DON'T close form - let user fix the error
    }
  };

  // Handle delete button click - show modal
  const handleDeleteClick = useCallback((system: System): void => {
    setSystemToDelete(system);
    setShowDeleteModal(true);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async (): Promise<void> => {
    if (!systemToDelete) return;

    try {
      await api.targetSystems.delete(systemToDelete._id);
      toast.success('Target system deleted successfully');
      setShowDeleteModal(false);
      setSystemToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting target system:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to delete target system';
      toast.error(errorMessage);
      // Don't close modal on error
    }
  }, [systemToDelete]);

  // Cancel delete
  const cancelDelete = useCallback((): void => {
    setShowDeleteModal(false);
    setSystemToDelete(null);
  }, []);

  const handleTestConnection = async (id: string): Promise<void> => {
    setTestingId(id);
    try {
      const result: TestConnectionResult = await api.targetSystems.testConnection(id);
      console.log('[handleTestConnection] Result:', result);
      const message = result.message || result.detail || 'Connection test completed';
      toast.success(`Connection test: ${message}`);
      fetchData();
    } catch (err: any) {
      console.error('Connection test failed:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Connection test failed';
      toast.error(errorMessage);
    } finally {
      setTestingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string): string => {
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
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <FaTrash className="text-red-600 text-2xl" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Delete Target System?
            </h2>

            {/* System Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="mb-3">
                <p className="font-semibold text-gray-900 text-lg">{systemToDelete?.name}</p>
                <p className="text-sm text-gray-500">{systemToDelete?.type}</p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  Environment: <span className="font-medium text-gray-800">{systemToDelete?.environment}</span>
                </p>
                <p className="text-gray-600">
                  Host: <span className="font-medium text-gray-800 break-all">{systemToDelete?.base_url || systemToDelete?.host}</span>
                </p>
                <div className="mt-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(systemToDelete?.status || '')}`}>
                    {systemToDelete?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <p className="text-gray-600 text-center mb-8">
              Are you sure you want to delete this target system? This action cannot be undone. 
              All associated agents and monitoring will be affected.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex justify-between items-start">
            <div>
              {integrationId && (
                <button
                  onClick={() => navigate('/admin/targetsys')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3"
                >
                  <FaArrowLeft size={16} />
                  <span className="text-sm">Back to Integrations</span>
                </button>
              )}

              <button
                onClick={() => navigate('/admin')}
                className="group text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors mb-1"
              >
                <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
                <span>Back</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Available Target Systems
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
                  onClick={() => navigate("/admin/targetsys")}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  title="Add a new target system"
                >
                  <FaPlus />
                  Create Target System
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, environment: e.target.value })}
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, status: e.target.value })}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
            <TargetSystemForm
              system={editingSystem}
              typeOptions={typeOptions}
              availableAuthMethods={availableAuthMethods}
              integrationValue={integrationValue}
              integrationId={integrationId}
              integrationName={integrationName}
              isModal={true}
              onSubmit={editingSystem ? (data) => handleUpdate(editingSystem._id, data) : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingSystem(null);
              }}
            />
          </div>
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
                onClick={() => navigate("/admin/targetsys")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaPlus />
                Create your first target system
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
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
                    <span className="ml-2 font-medium text-gray-900 break-all">{system.base_url || system.hostname || system.host}</span>
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
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium"
                      title="Edit this target system"
                    >
                      <FaEdit className="text-sm" />
                      Edit
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 cursor-not-allowed rounded-md text-sm font-medium"
                      title="You do not have permission to edit target systems"
                    >
                      <FaEdit className="text-sm" />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleTestConnection(system._id)}
                    disabled={testingId === system._id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 text-sm font-medium disabled:opacity-50"
                  >
                    <FaCheckCircle className="text-sm" />
                    Test
                  </button>
                  {canDelete ? (
                    <button
                      onClick={() => handleDeleteClick(system)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm font-medium"
                      title="Delete this target system"
                    >
                      <FaTrash className="text-sm" />
                      Delete
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 cursor-not-allowed rounded-md text-sm font-medium"
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TargetSystemShow;