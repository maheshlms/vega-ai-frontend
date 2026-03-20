import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaSync, FaTrash, FaEdit, FaCheckCircle, FaTimesCircle, FaClock, FaLock, FaArrowLeft } from 'react-icons/fa';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { auth } from '../../utils/auth';
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

const TargetSystems: React.FC = () => {
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
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  
  // Filter states - don't include integrationId in API filters
  const [filters, setFilters] = useState<Filters>({
    environment: '',
    status: ''
  });

  useEffect(() => {
    // Check user roles and permissions
    const user: User | null = auth.getCurrentUser();
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

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all systems (don't pass integration type to API)
      const [systemsData, typesData]: [SystemsResponse, TypesResponse | TypeOption[]] = await Promise.all([
        api.targetSystems.list(filters),
        api.targetSystems.getTypes().catch(() => [])
      ]);

      let systemsList: System[] = Array.isArray(systemsData) ? systemsData : systemsData.systems || [];

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

  // CHANGE: return the created system so TargetSystemForm can show the
  // connection test result in its success modal. DO NOT close the form here —
  // the form's "Done" button calls onCancel which closes it.
  // Re-throw on error so the form shows the error instead of a false success modal.
  const handleCreate = async (data: any): Promise<any> => {
    try {
      // api.targetSystems.create() now auto-tests the connection internally.
      // It returns the created system with a _connectionTest: { success, message } field.
      const created = await api.targetSystems.create(data);
      fetchData(); // refresh the list in background

      const test = created?._connectionTest;
      if (test) {
        if (test.success) {
          toast.success(`Connected: ${test.message}`);
        } else {
          toast.error(`System created but connection failed: ${test.message}`);
        }
      }

      return created;
    } catch (err) {
      console.error('Error creating target system:', err);
      toast.error('Failed to create target system: ' + (err as Error).message);
      throw err;
    }
  };

  // CHANGE: return the updated system so TargetSystemForm can show the
  // connection test result in its success modal. DO NOT close the form here —
  // the form's "Done" button calls onCancel which closes it.
  // api.targetSystems.update() now auto-tests and embeds _connectionTest.
  // Re-throw on error so the form shows the error instead of a false success modal.
  const handleUpdate = async (id: string, data: any): Promise<void> => {
    // try {
    //   await api.targetSystems.update(id, data);
    //   setShowForm(false);
    //   setEditingSystem(null);
    //   fetchData();
    // } catch (err) {
    //   console.error('Error updating target system:', err);
    //   toast.error('Failed to update target system: ' + (err as Error).message);
    // }
    try {
      const updated = await api.targetSystems.update(id, data);
      fetchData(); // refresh list in background
      return updated ?? { _id: id, id };
    } catch (err: any) {
      console.error('Error updating target system:', err);
      toast.error('Failed to update target system: ' + (err as Error).message);
      throw err;
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
      setShowDeleteModal(false);
      setSystemToDelete(null);
      setDeleteConfirmText('');
      toast.success('Target system deleted successfully. Associated agents have been removed.');
      fetchData();
    } catch (err) {
      console.error('Error deleting target system:', err);
      toast.error('Failed to delete target system: ' + (err as Error).message);
    }
  }, [systemToDelete]);

  // Cancel delete
  const cancelDelete = useCallback((): void => {
    setShowDeleteModal(false);
    setSystemToDelete(null);
    setDeleteConfirmText('');
  }, []);

  const handleTestConnection = async (id: string): Promise<void> => {
    setTestingId(id);
    try {
      const result: TestConnectionResult = await api.targetSystems.testConnection(id);
      console.log('[handleTestConnection] Result:', result);
      const message = result.message || result.detail || 'Connection test completed';
      toast.info(`Connection test: ${message}`);
      fetchData();
    } catch (err) {
      console.error('Connection test failed:', err);
      toast.info('Connection test failed: ' + (err as Error).message);
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md 2xl:max-w-xl w-full p-8 2xl:p-12 animate-scaleIn">
            {/* Warning Icon */}
            <div className="flex justify-center mb-6 2xl:mb-8">
              <div className="w-16 h-16 2xl:w-20 2xl:h-20 bg-red-100 rounded-full flex items-center justify-center">
                <FaTrash className="text-red-600 text-2xl 2xl:text-3xl" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl 2xl:text-3xl font-bold text-gray-900 text-center mb-3">
              Delete Target System?
            </h2>

            {/* System Info */}
            <div className="bg-gray-50 rounded-lg p-4 2xl:p-5 mb-6 2xl:mb-8">
              <div className="mb-3">
                <p className="font-semibold text-gray-900 text-lg 2xl:text-xl">{systemToDelete?.name}</p>
                <p className="text-sm 2xl:text-base text-gray-500">{systemToDelete?.type}</p>
              </div>
              <div className="space-y-1 text-sm 2xl:text-base">
                <p className="text-gray-600">
                  Environment: <span className="font-medium text-gray-800">{systemToDelete?.environment}</span>
                </p>
                <p className="text-gray-600">
                  Host: <span className="font-medium text-gray-800 break-all">{systemToDelete?.base_url || systemToDelete?.host}</span>
                </p>
                <div className="mt-2">
                  <span className={`px-2.5 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-xs 2xl:text-sm font-medium ${getStatusColor(systemToDelete?.status || '')}`}>
                    {systemToDelete?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> Deleting this target system will permanently remove it along with all associated agents and monitoring data. This action cannot be undone.
              </p>
            </div>

            {/* Confirmation Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-red-600 mb-2">
                To confirm deletion, please enter the target system name
              </label>
              <input
                type="text"
                placeholder={`Type "${systemToDelete?.name}" to confirm`}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {deleteConfirmText && deleteConfirmText !== systemToDelete?.name && (
                <p className="text-red-600 text-xs mt-2">Target system name does not match</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 2xl:gap-4">
              <button
                onClick={cancelDelete}
                className="flex-1 px-6 py-3 2xl:px-8 2xl:py-4 2xl:text-base bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirmText !== systemToDelete?.name}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="ts-header-px px-6 2xl:px-20 py-6 2xl:py-10">
          <div className="flex justify-between items-start">
            <div>
              {integrationId && (
                <button
                  onClick={() => navigate('/systems/targetsys')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3 2xl:mb-4"
                >
                  <FaArrowLeft size={16} className="2xl:text-lg" />
                  <span className="text-sm 2xl:text-base">Back to Integrations</span>
                </button>
              )}
              <h1 className="text-2xl 2xl:text-4xl font-bold text-gray-900 mb-1">
                {integrationName ? `${integrationName} - Target Systems` : 'Target Systems'}
              </h1>
              <p className="text-sm 2xl:text-base text-gray-500">
                {integrationName
                  ? `Manage target systems for ${integrationName}`
                  : 'Manage your connected systems and integrations'
                }
              </p>
            </div>
            <div className="flex gap-2 2xl:gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 2xl:px-6 2xl:py-3 2xl:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                  className="flex items-center gap-2 px-4 py-2 2xl:px-6 2xl:py-3 2xl:text-base bg-green-600 text-white rounded-lg hover:bg-green-700"
                  title="Add a new target system"
                >
                  <FaPlus />
                  Add Target System
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 2xl:px-6 2xl:py-3 2xl:text-base bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
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
        <div className="ts-px px-6 2xl:px-20 py-6 2xl:py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 2xl:gap-6 mb-6 2xl:mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 2xl:p-6">
              <div className="flex items-center gap-3 2xl:gap-4">
                <div className="w-10 h-10 2xl:w-14 2xl:h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-blue-600 2xl:text-xl" />
                </div>
                <div>
                  <div className="text-2xl 2xl:text-4xl font-bold text-gray-900">{stats.total_systems || 0}</div>
                  <div className="text-xs 2xl:text-sm text-gray-500">Total Systems</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 2xl:p-6">
              <div className="flex items-center gap-3 2xl:gap-4">
                <div className="w-10 h-10 2xl:w-14 2xl:h-14 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-green-600 2xl:text-xl" />
                </div>
                <div>
                  <div className="text-2xl 2xl:text-4xl font-bold text-gray-900">{stats.connected || 0}</div>
                  <div className="text-xs 2xl:text-sm text-gray-500">Connected</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 2xl:p-6">
              <div className="flex items-center gap-3 2xl:gap-4">
                <div className="w-10 h-10 2xl:w-14 2xl:h-14 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaTimesCircle className="text-red-600 2xl:text-xl" />
                </div>
                <div>
                  <div className="text-2xl 2xl:text-4xl font-bold text-gray-900">{stats.disconnected || 0}</div>
                  <div className="text-xs 2xl:text-sm text-gray-500">Disconnected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="ts-px px-6 2xl:px-20 pb-4 2xl:pb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 2xl:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 2xl:gap-6">
            <div>
              <label className="block text-xs 2xl:text-sm font-semibold text-gray-600 mb-2">Environment</label>
              <select
                value={filters.environment}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, environment: e.target.value })}
                className="w-full px-3 py-2 2xl:px-4 2xl:py-3 2xl:text-base border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Environments</option>
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-xs 2xl:text-sm font-semibold text-gray-600 mb-2">Connection Status</label>
              <select
                value={filters.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 2xl:px-4 2xl:py-3 2xl:text-base border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="ts-px px-6 2xl:px-20 pb-4 2xl:pb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 2xl:p-5 text-sm 2xl:text-base text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Target Systems Grid */}
      <div className="ts-px px-6 2xl:px-20 pb-6 2xl:pb-10">
        {loading ? (
          <div className="flex items-center justify-center p-12 2xl:p-20">
            <div className="animate-spin rounded-full h-8 w-8 2xl:h-12 2xl:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : systems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 2xl:p-20 text-center">
            <p className="text-gray-500 2xl:text-lg mb-4">No target systems found</p>
            {canAdd && (
              <button
                onClick={() => {
                  setEditingSystem(null);
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 2xl:px-6 2xl:py-3 2xl:text-base bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaPlus />
                Create your first target system
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 2xl:gap-6">
            {systems.map((system) => (
              <div key={system._id} className="ts-card bg-white rounded-lg shadow-sm border border-gray-200 p-6 2xl:p-8 hover:shadow-md transition-shadow w-fit min-w-[400px] 2xl:min-w-[500px] max-w-full">
                <div className="mb-4 2xl:mb-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg 2xl:text-xl font-semibold text-gray-900">{system.name}</h3>
                    <TargetSystemStatus status={system.status} />
                  </div>
                  <p className="text-sm 2xl:text-base text-gray-600">{system.type}</p>
                </div>

                <div className="space-y-2 2xl:space-y-3 mb-4 2xl:mb-5 text-sm 2xl:text-base">
                  <div>
                    <span className="text-gray-600">Environment:</span>
                    <span className="ml-2 font-medium text-gray-900">{system.environment}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Host:</span>
                    <span className="ml-2 font-medium text-gray-900 break-all">{system.base_url || system.host}</span>
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-xs 2xl:text-sm font-medium ${getStatusColor(system.status)}`}>
                      {system.status}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 2xl:pt-5 flex gap-2 2xl:gap-3">
                  {canEdit ? (
                    <button
                      onClick={() => {
                        setEditingSystem(system);
                        setShowForm(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 2xl:px-4 2xl:py-3 2xl:text-base bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium"
                      title="Edit this target system"
                    >
                      <FaEdit className="text-sm 2xl:text-base" />
                      Edit
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 2xl:px-4 2xl:py-3 2xl:text-base bg-gray-100 text-gray-400 cursor-not-allowed rounded-md text-sm font-medium"
                      title="You do not have permission to edit target systems"
                    >
                      <FaEdit className="text-sm 2xl:text-base" />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleTestConnection(system._id)}
                    disabled={testingId === system._id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 2xl:px-4 2xl:py-3 2xl:text-base bg-green-50 text-green-600 rounded-md hover:bg-green-100 text-sm font-medium disabled:opacity-50"
                  >
                    <FaCheckCircle className="text-sm 2xl:text-base" />
                    Test
                  </button>
                  {canDelete ? (
                    <button
                      onClick={() => handleDeleteClick(system)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 2xl:px-4 2xl:py-3 2xl:text-base bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm font-medium"
                      title="Delete this target system"
                    >
                      <FaTrash className="text-sm 2xl:text-base" />
                      Delete
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 2xl:px-4 2xl:py-3 2xl:text-base bg-gray-100 text-gray-400 cursor-not-allowed rounded-md text-sm font-medium"
                      title="You do not have permission to delete target systems"
                    >
                      <FaTrash className="text-sm 2xl:text-base" />
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

        /* ═══════════════════════════════════════════════════════
           RESPONSIVE RULES — TargetSystems.tsx
           1920×1080 → exact current design (no changes)
           All breakpoints scale proportionally from baseline.
        ═══════════════════════════════════════════════════════ */

        /* ── Z-index scale ── */
        :root {
          --z-base:     1;
          --z-sticky:   10;
          --z-dropdown: 30;
          --z-overlay:  40;
          --z-modal:    50;
          --z-toast:    100;
        }

        /* ── Global safety: no horizontal overflow ── */
        .min-h-screen.bg-gray-50 {
          overflow-x: hidden;
          box-sizing: border-box;
        }

        /* ── Host/URL strings: break long unbreakable values ── */
        .break-all {
          overflow-wrap: break-word;
          word-break: break-all;
        }

        /* ── Section padding wrapper ── */
        .ts-px {
          padding-left: clamp(16px, 3.125vw, 60px);
          padding-right: clamp(16px, 3.125vw, 60px);
        }

        /* ── Header inner wrapper ── */
        .ts-header-px {
          padding-left: clamp(16px, 3.125vw, 60px);
          padding-right: clamp(16px, 3.125vw, 60px);
          padding-top: clamp(16px, 1.875vw, 36px);
          padding-bottom: clamp(16px, 1.875vw, 36px);
          box-sizing: border-box;
        }

        /* Header title+subtitle area must not overflow on narrow screens */
        .ts-header-px .flex.justify-between.items-start {
          flex-wrap: wrap;
          gap: clamp(8px, 1vw, 16px);
        }

        /* Header button group: wrap on tablet / small laptop */
        .ts-header-px .flex.gap-2 {
          flex-wrap: wrap;
        }

        /* Touch targets for header buttons at tablet */
        @media (min-width: 768px) and (max-width: 1023px) {
          .ts-header-px .flex.gap-2 > button {
            min-height: 44px;
          }
        }

        /* ── System card ── */
        .ts-card {
          min-width: clamp(280px, 30vw, 400px);
          max-width: 100%;
          box-sizing: border-box;
          /* flex children with truncated text */
          overflow: hidden;
        }

        /* Card action buttons: stack label below icon on very tight widths */
        .ts-card .border-t .flex.gap-2 {
          flex-wrap: nowrap;
        }

        /* ════════════════════════════
           TABLET  768–1023px
        ════════════════════════════ */
        @media (min-width: 768px) and (max-width: 1023px) {
          .ts-px {
            padding-left: 16px;
            padding-right: 16px;
          }
          .ts-header-px {
            padding-left: 16px;
            padding-right: 16px;
            padding-top: 16px;
            padding-bottom: 16px;
          }
          /* Cards: full width on tablet, no awkward min-width */
          .ts-card {
            min-width: 100%;
            width: 100%;
          }
          /* Card grid switches to single column so cards don't crush */
          .flex.flex-wrap.items-center.gap-4 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          /* Stats grid already uses md:grid-cols-3 → tablet shows 1 col via Tailwind */
          /* Back button touch target */
          .flex.items-center.gap-2.text-blue-600 {
            min-height: 44px;
          }
          /* Delete modal: full width on tablet */
          .bg-white.rounded-2xl.shadow-2xl {
            width: calc(100vw - 32px);
            max-width: 100%;
            max-height: 90vh;
            overflow-y: auto;
          }
        }

        /* ════════════════════════════
           SMALL LAPTOP  1024–1279px
        ════════════════════════════ */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .ts-px {
            padding-left: 24px;
            padding-right: 24px;
          }
          .ts-header-px {
            padding-left: 24px;
            padding-right: 24px;
            padding-top: 20px;
            padding-bottom: 20px;
          }
          .ts-card {
            min-width: clamp(260px, 28vw, 360px);
          }
          .flex.flex-wrap.items-center.gap-4 {
            gap: 14px;
          }
        }

        /* ════════════════════════════
           MEDIUM LAPTOP  1280–1439px
        ════════════════════════════ */
        @media (min-width: 1280px) and (max-width: 1439px) {
          .ts-px {
            padding-left: 28px;
            padding-right: 28px;
          }
          .ts-header-px {
            padding-left: 28px;
            padding-right: 28px;
            padding-top: 22px;
            padding-bottom: 22px;
          }
          .ts-card {
            min-width: clamp(280px, 28vw, 380px);
          }
        }

        /* ════════════════════════════
           LARGE LAPTOP  1440–1919px
        ════════════════════════════ */
        @media (min-width: 1440px) and (max-width: 1919px) {
          .ts-px {
            padding-left: 36px;
            padding-right: 36px;
          }
          .ts-header-px {
            padding-left: 36px;
            padding-right: 36px;
            padding-top: 24px;
            padding-bottom: 24px;
          }
          .ts-card {
            min-width: clamp(340px, 28vw, 400px);
          }
        }

        /* ════════════════════════════
           1920px BASELINE LOCK
        ════════════════════════════ */
        @media (min-width: 1920px) and (max-width: 2559px) {
          .ts-px {
            padding-left: 24px;
            padding-right: 24px;
          }
          .ts-header-px {
            padding-left: 24px;
            padding-right: 24px;
            padding-top: 24px;
            padding-bottom: 24px;
          }
          .ts-card {
            min-width: 400px;
          }
        }

        /* ════════════════════════════
           QHD  2560–3839px
        ════════════════════════════ */
        @media (min-width: 2560px) and (max-width: 3839px) {
          .ts-px {
            padding-left: 48px;
            padding-right: 48px;
          }
          .ts-header-px {
            padding-left: 48px;
            padding-right: 48px;
            padding-top: 36px;
            padding-bottom: 36px;
          }
          .ts-card {
            min-width: 500px;
          }
          /* Delete modal: scale up for QHD */
          .bg-white.rounded-2xl.shadow-2xl {
            max-width: 640px;
            max-height: 90vh;
            overflow-y: auto;
          }
          /* Font smoothing for large headings */
          h1, h2, h3 {
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
        }

        /* ════════════════════════════
           4K+  3840px+
        ════════════════════════════ */
        @media (min-width: 3840px) {
          .ts-px {
            padding-left: 64px;
            padding-right: 64px;
          }
          .ts-header-px {
            padding-left: 64px;
            padding-right: 64px;
            padding-top: 48px;
            padding-bottom: 48px;
          }
          .ts-card {
            min-width: 600px;
          }
          .flex.flex-wrap.items-center.gap-4 {
            gap: 32px;
          }
          /* Delete modal: proportional at 4K */
          .bg-white.rounded-2xl.shadow-2xl {
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
          }
          h1, h2, h3 {
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
        }
      `}</style>
    </div>
  );
};

export default TargetSystems;