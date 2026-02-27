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
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  
  const [filters, setFilters] = useState<Filters>({
    environment: '',
    status: ''
  });

  useEffect(() => {
    const user: User | null = auth.getCurrentUser();
    const isUserAdmin: boolean = auth.isAdmin();
    setIsAdmin(isUserAdmin);
    
    const roles = user?.roles || [];
    setUserRoles(roles);
    
    console.log('[TargetSystemShow] User:', user);
    console.log('[TargetSystemShow] Is Admin:', isUserAdmin);
    console.log('[TargetSystemShow] Roles:', roles);
    
    const hasCreatePerm = roles.includes('create:target_systems') || isUserAdmin;
    const hasEditPerm = roles.includes('edit:target_systems') || isUserAdmin;
    const hasDeletePerm = roles.includes('delete:target_systems') || isUserAdmin;
    
    console.log('[TargetSystemShow] Permissions - Create:', hasCreatePerm, 'Edit:', hasEditPerm, 'Delete:', hasDeletePerm);
    
    setCanAdd(hasCreatePerm);
    setCanEdit(hasEditPerm);
    setCanDelete(hasDeletePerm);
    
    fetchData();
  }, [filters]);

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
      
      if (integrationId) {
        console.log('[fetchData] Filtering by integrationId:', integrationId);
        systemsList = systemsList.filter(s => {
          console.log('[fetchData] System:', s.name, 'integration_id:', s.integration_id, 'matches:', s.integration_id === integrationId);
          return s.integration_id === integrationId;
        });
      }
  
      setSystems(systemsList);
      setTypeOptions(Array.isArray(typesData) ? typesData : (typesData as TypesResponse).types || []);
      
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
      setShowForm(false);
      setEditingSystem(null);
      fetchData();
    } catch (err: any) {
      console.error('Error creating target system:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to create target system';
      toast.error(errorMessage);
    }
  };

  const handleUpdate = async (id: string, data: any): Promise<void> => {
    try {
      await api.targetSystems.update(id, data);
      toast.success('Target system updated successfully');
      setShowForm(false);
      setEditingSystem(null);
      fetchData();
    } catch (err: any) {
      console.error('Error updating target system:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to update target system';
      toast.error(errorMessage);
    }
  };

  const handleDeleteClick = useCallback((system: System): void => {
    setSystemToDelete(system);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (!systemToDelete) return;

    try {
      await api.targetSystems.delete(systemToDelete._id);
      toast.success('Target system deleted successfully. Associated agents have been removed.');
      setShowDeleteModal(false);
      setSystemToDelete(null);
      setDeleteConfirmText('');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting target system:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to delete target system';
      toast.error(errorMessage);
    }
  }, [systemToDelete]);

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
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800';
      case 'disconnected':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d1117] transition-colors duration-300">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl w-full
            max-w-sm xl:max-w-md 2xl:max-w-xl 3xl:max-w-2xl
            p-6 xl:p-8 2xl:p-12 animate-scaleIn">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4 xl:mb-6 2xl:mb-8">
              <div className="w-12 h-12 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <FaTrash className="text-red-600 dark:text-red-400 text-xl xl:text-2xl 2xl:text-3xl" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
              Delete Target System?
            </h2>

            {/* System Info */}
            <div className="bg-gray-50 dark:bg-[#111827] rounded-lg p-3 xl:p-4 2xl:p-5 mb-4 xl:mb-6 2xl:mb-8">
              <div className="mb-3">
                <p className="font-semibold text-gray-900 dark:text-white text-base xl:text-lg 2xl:text-xl">{systemToDelete?.name}</p>
                <p className="text-xs xl:text-sm 2xl:text-base text-gray-500 dark:text-slate-400">{systemToDelete?.type}</p>
              </div>
              <div className="space-y-1 text-xs xl:text-sm 2xl:text-base">
                <p className="text-gray-600 dark:text-slate-400">
                  Environment: <span className="font-medium text-gray-800 dark:text-slate-200">{systemToDelete?.environment}</span>
                </p>
                <p className="text-gray-600 dark:text-slate-400">
                  Host: <span className="font-medium text-gray-800 dark:text-slate-200 break-all">{systemToDelete?.base_url || systemToDelete?.host}</span>
                </p>
                <div className="mt-2">
                  <span className={`px-2 py-0.5 xl:px-2.5 xl:py-1 2xl:px-3 2xl:py-1.5 rounded-full text-xs 2xl:text-sm font-medium ${getStatusColor(systemToDelete?.status || '')}`}>
                    {systemToDelete?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 xl:p-4 mb-4 xl:mb-6">
              <p className="text-xs xl:text-sm text-red-700 dark:text-red-400">
                <strong>Warning:</strong> Deleting this target system will permanently remove it along with all associated agents and monitoring data. This action cannot be undone.
              </p>
            </div>

            {/* Confirmation Input */}
            <div className="mb-4 xl:mb-6">
              <label className="block text-xs xl:text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                To confirm deletion, please enter the target system name
              </label>
              <input
                type="text"
                placeholder={`Type "${systemToDelete?.name}" to confirm`}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 xl:px-4 border border-gray-300 dark:border-[#1e2d45] rounded-lg text-xs xl:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              />
              {deleteConfirmText && deleteConfirmText !== systemToDelete?.name && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-2">Target system name does not match</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 xl:gap-3 2xl:gap-4">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 xl:px-6 xl:py-3 2xl:px-8 2xl:py-4 2xl:text-base bg-gray-100 dark:bg-[#111827] hover:bg-gray-200 dark:hover:bg-[#1e2d45] text-gray-700 dark:text-slate-300 rounded-lg font-medium transition-colors border border-transparent dark:border-[#1e2d45] text-sm xl:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirmText !== systemToDelete?.name}
                className="flex-1 px-4 py-2 xl:px-6 xl:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm xl:text-base"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-[#1a2234] border-b border-gray-200 dark:border-[#1e2d45]">
        <div className="px-4 xl:px-6 2xl:px-20 py-4 xl:py-6 2xl:py-10">
          <div className="flex justify-between items-start gap-4">
            <div>
              {integrationId && (
                <button
                  onClick={() => navigate('/admin/targetsys')}
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 xl:mb-3 2xl:mb-4"
                >
                  <FaArrowLeft size={14} className="xl:text-base 2xl:text-lg" />
                  <span className="text-xs xl:text-sm 2xl:text-base">Back to Integrations</span>
                </button>
              )}

              <button
                onClick={() => navigate('/admin')}
                className="group text-xs xl:text-sm 2xl:text-base text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors mb-1"
              >
                <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
                <span>Back</span>
              </button>
              <h1 className="text-xl xl:text-2xl 2xl:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                Available Target Systems
              </h1>
              <p className="text-xs xl:text-sm 2xl:text-base text-gray-500 dark:text-slate-400">
                {integrationName 
                  ? `Manage target systems for ${integrationName}` 
                  : 'Manage your connected systems and integrations'
                }
              </p>
            </div>
            <div className="flex gap-2 2xl:gap-3 flex-shrink-0">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 2xl:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs xl:text-sm"
                title="Refresh systems"
              >
                <FaSync className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              {canAdd ? (
                <button
                  onClick={() => navigate("/admin/targetsys")}
                  className="flex items-center gap-2 px-3 py-2 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 2xl:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs xl:text-sm"
                  title="Add a new target system"
                >
                  <FaPlus />
                  Create Target System
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-3 py-2 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 2xl:text-base bg-gray-300 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded-lg cursor-not-allowed text-xs xl:text-sm"
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
        <div className="px-4 xl:px-6 2xl:px-20 py-4 xl:py-6 2xl:py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 xl:gap-4 2xl:gap-6 mb-4 xl:mb-6 2xl:mb-8">
            <div className="bg-white dark:bg-[#1a2234] rounded-lg shadow-sm border border-gray-200 dark:border-[#1e2d45] p-3 xl:p-4 2xl:p-6">
              <div className="flex items-center gap-2 xl:gap-3 2xl:gap-4">
                <div className="w-8 h-8 xl:w-10 xl:h-10 2xl:w-14 2xl:h-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-blue-600 dark:text-blue-400 text-sm xl:text-base 2xl:text-xl" />
                </div>
                <div>
                  <div className="text-xl xl:text-2xl 2xl:text-4xl font-bold text-gray-900 dark:text-white">{stats.total_systems || 0}</div>
                  <div className="text-xs 2xl:text-sm text-gray-500 dark:text-slate-400">Total Systems</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a2234] rounded-lg shadow-sm border border-gray-200 dark:border-[#1e2d45] p-3 xl:p-4 2xl:p-6">
              <div className="flex items-center gap-2 xl:gap-3 2xl:gap-4">
                <div className="w-8 h-8 xl:w-10 xl:h-10 2xl:w-14 2xl:h-14 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-green-600 dark:text-green-400 text-sm xl:text-base 2xl:text-xl" />
                </div>
                <div>
                  <div className="text-xl xl:text-2xl 2xl:text-4xl font-bold text-gray-900 dark:text-white">{stats.connected || 0}</div>
                  <div className="text-xs 2xl:text-sm text-gray-500 dark:text-slate-400">Connected</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a2234] rounded-lg shadow-sm border border-gray-200 dark:border-[#1e2d45] p-3 xl:p-4 2xl:p-6">
              <div className="flex items-center gap-2 xl:gap-3 2xl:gap-4">
                <div className="w-8 h-8 xl:w-10 xl:h-10 2xl:w-14 2xl:h-14 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <FaTimesCircle className="text-red-600 dark:text-red-400 text-sm xl:text-base 2xl:text-xl" />
                </div>
                <div>
                  <div className="text-xl xl:text-2xl 2xl:text-4xl font-bold text-gray-900 dark:text-white">{stats.disconnected || 0}</div>
                  <div className="text-xs 2xl:text-sm text-gray-500 dark:text-slate-400">Disconnected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 xl:px-6 2xl:px-20 pb-3 xl:pb-4 2xl:pb-6">
        <div className="bg-white dark:bg-[#1a2234] rounded-lg shadow-sm border border-gray-200 dark:border-[#1e2d45] p-3 xl:p-4 2xl:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xl:gap-4 2xl:gap-6">
            <div>
              <label className="block text-xs 2xl:text-sm font-semibold text-gray-600 dark:text-slate-400 mb-1.5 xl:mb-2">Environment</label>
              <select
                value={filters.environment}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, environment: e.target.value })}
                className="w-full px-3 py-2 2xl:px-4 2xl:py-3 2xl:text-base border border-gray-300 dark:border-[#1e2d45] rounded-lg text-xs xl:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
              >
                <option value="">All Environments</option>
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div>
              <label className="block text-xs 2xl:text-sm font-semibold text-gray-600 dark:text-slate-400 mb-1.5 xl:mb-2">Connection Status</label>
              <select
                value={filters.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 2xl:px-4 2xl:py-3 2xl:text-base border border-gray-300 dark:border-[#1e2d45] rounded-lg text-xs xl:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
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
          <div className="w-full max-w-xl xl:max-w-2xl 2xl:max-w-4xl my-auto">
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
        <div className="px-4 xl:px-6 2xl:px-20 pb-3 xl:pb-4 2xl:pb-6">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 xl:p-4 2xl:p-5 text-xs xl:text-sm 2xl:text-base text-red-700 dark:text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Target Systems Grid */}
      <div className="px-4 xl:px-6 2xl:px-20 pb-4 xl:pb-6 2xl:pb-10">
        {loading ? (
          <div className="flex items-center justify-center p-8 xl:p-12 2xl:p-20">
            <div className="animate-spin rounded-full h-6 w-6 xl:h-8 xl:w-8 2xl:h-12 2xl:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : systems.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2234] rounded-lg shadow-sm border border-gray-200 dark:border-[#1e2d45] p-8 xl:p-12 2xl:p-20 text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm xl:text-base 2xl:text-lg mb-4">No target systems found</p>
            {canAdd && (
              <button
                onClick={() => navigate("/admin/targetsys")}
                className="inline-flex items-center gap-2 px-3 py-2 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 2xl:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm xl:text-base"
              >
                <FaPlus />
                Create your first target system
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 xl:gap-4 2xl:gap-6">
            {systems.map((system) => (
              <div
                key={system._id}
                className="bg-white dark:bg-[#1a2234] rounded-lg shadow-sm border border-gray-200 dark:border-[#1e2d45] p-4 xl:p-6 2xl:p-8 hover:shadow-md transition-shadow
                  w-fit
                  min-w-[300px] xl:min-w-[380px] 2xl:min-w-[500px]
                  max-w-full"
              >
                <div className="mb-3 xl:mb-4 2xl:mb-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base xl:text-lg 2xl:text-xl font-semibold text-gray-900 dark:text-white">{system.name}</h3>
                    <TargetSystemStatus status={system.status} />
                  </div>
                  <p className="text-xs xl:text-sm 2xl:text-base text-gray-600 dark:text-slate-400">{system.type}</p>
                </div>

                <div className="space-y-1.5 xl:space-y-2 2xl:space-y-3 mb-3 xl:mb-4 2xl:mb-5 text-xs xl:text-sm 2xl:text-base">
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Environment:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{system.environment}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Host:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white break-all">{system.base_url || system.host}</span>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 xl:px-2.5 xl:py-1 2xl:px-3 2xl:py-1.5 rounded-full text-xs 2xl:text-sm font-medium ${getStatusColor(system.status)}`}>
                      {system.status}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-[#1e2d45] pt-3 xl:pt-4 2xl:pt-5 flex gap-1.5 xl:gap-2 2xl:gap-3">
                  {canEdit ? (
                    <button
                      onClick={() => {
                        setEditingSystem(system);
                        setShowForm(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 xl:gap-2 px-2 py-1.5 xl:px-3 xl:py-2 2xl:px-4 2xl:py-3 2xl:text-base bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md text-xs xl:text-sm font-medium"
                      title="Edit this target system"
                    >
                      <FaEdit className="text-xs xl:text-sm 2xl:text-base" />
                      Edit
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-1.5 xl:gap-2 px-2 py-1.5 xl:px-3 xl:py-2 2xl:px-4 2xl:py-3 2xl:text-base bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed rounded-md text-xs xl:text-sm font-medium"
                      title="You do not have permission to edit target systems"
                    >
                      <FaEdit className="text-xs xl:text-sm 2xl:text-base" />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleTestConnection(system._id)}
                    disabled={testingId === system._id}
                    className="flex-1 flex items-center justify-center gap-1.5 xl:gap-2 px-2 py-1.5 xl:px-3 xl:py-2 2xl:px-4 2xl:py-3 2xl:text-base bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/40 text-xs xl:text-sm font-medium disabled:opacity-50"
                  >
                    <FaCheckCircle className="text-xs xl:text-sm 2xl:text-base" />
                    Test
                  </button>
                  {canDelete ? (
                    <button
                      onClick={() => handleDeleteClick(system)}
                      className="flex-1 flex items-center justify-center gap-1.5 xl:gap-2 px-2 py-1.5 xl:px-3 xl:py-2 2xl:px-4 2xl:py-3 2xl:text-base bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md text-xs xl:text-sm font-medium"
                      title="Delete this target system"
                    >
                      <FaTrash className="text-xs xl:text-sm 2xl:text-base" />
                      Delete
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-1.5 xl:gap-2 px-2 py-1.5 xl:px-3 xl:py-2 2xl:px-4 2xl:py-3 2xl:text-base bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed rounded-md text-xs xl:text-sm font-medium"
                      title="You do not have permission to delete target systems"
                    >
                      <FaTrash className="text-xs xl:text-sm 2xl:text-base" />
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

        /* 3xl breakpoint for very large displays */
        @media (min-width: 1921px) {
          .\\33xl\\:max-w-2xl { max-width: 42rem; }
        }
      `}</style>
    </div>
  );
};

export default TargetSystemShow;