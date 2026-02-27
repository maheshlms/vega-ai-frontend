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
      toast.success('Target system deleted successfully. Associated agents have been removed.');
      setShowDeleteModal(false);
      setSystemToDelete(null);
      setDeleteConfirmText('');
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
      case 'connected':    return 'bg-green-50 text-green-700';
      case 'disconnected': return 'bg-red-50 text-red-700';
      case 'error':        return 'bg-red-50 text-red-700';
      case 'pending':      return 'bg-yellow-50 text-yellow-700';
      default:             return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusDot = (status: string): string => {
    switch (status) {
      case 'connected':    return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      case 'error':        return 'bg-red-500';
      case 'pending':      return 'bg-yellow-400';
      default:             return 'bg-gray-400';
    }
  };

  return (
    <div className="ts-font min-h-screen bg-[#FAFAFA]">
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
      <div className="bg-white border-b border-gray-200 px-12 max-md:px-5">
        <div className="max-w-[1400px] mx-auto pt-10 pb-8">
          <div className="flex items-start justify-between gap-6 max-md:flex-col">
            <div>
              {integrationId ? (
                <button
                  onClick={() => navigate('/systems/targetsys')}
                  className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-700 mb-3 transition-colors"
                >
                  <FaArrowLeft size={12} />
                  <span>Back to Integrations</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/systems')}
                  className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-700 mb-3 transition-colors"
                >
                  <span>←</span>
                  <span>Back</span>
                </button>
              )}
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#0A0A0A] max-md:text-3xl mb-2">
                {integrationName ? `${integrationName} Systems` : 'Target Systems'}
              </h1>
              <p className="text-[15px] text-gray-500 font-normal leading-relaxed m-0">
                {integrationName
                  ? `Manage target systems for ${integrationName}`
                  : 'Manage your connected systems and integrations'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50"
                title="Refresh systems"
              >
                <FaSync className={loading ? 'animate-spin' : ''} size={12} />
                Refresh
              </button>
              {canAdd ? (
                <button
                  onClick={() => navigate("/systems/targetsys")}
                  className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#333] text-white rounded-lg text-[13px] font-medium transition-colors"
                  title="Add a new target system"
                >
                  <FaPlus size={12} />
                  Create Target System
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-[13px] font-medium cursor-not-allowed"
                  title="You do not have permission to add target systems"
                >
                  <FaLock size={12} />
                  Restricted
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div className="bg-white border-b border-gray-200 px-12 max-md:px-5">
          <div className="max-w-[1400px] mx-auto py-5">
            <div className="grid grid-cols-5 gap-4 max-md:grid-cols-3">
              {[
                { label: 'Total Systems', value: stats.total_systems || 0, dot: 'bg-gray-400' },
                { label: 'Connected',     value: stats.connected     || 0, dot: 'bg-green-500' },
                { label: 'Disconnected',  value: stats.disconnected  || 0, dot: 'bg-red-500' },
                { label: 'Error',         value: stats.error         || 0, dot: 'bg-orange-500' },
                { label: 'Pending',       value: stats.pending       || 0, dot: 'bg-yellow-400' },
              ].map(({ label, value, dot }) => (
                <div key={label} className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">{label}</span>
                  </div>
                  <div className="text-3xl font-bold text-[#0A0A0A] tracking-tight">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white border-b border-gray-200 px-12 sticky top-0 z-10 max-md:px-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6 h-14">
          {/* Environment pills */}
          <div className="flex items-center gap-0.5">
            {['All', 'development', 'staging', 'production'].map(env => {
              const label = env === 'All' ? 'All Environments' : env.charAt(0).toUpperCase() + env.slice(1);
              const active = env === 'All' ? filters.environment === '' : filters.environment === env;
              return (
                <button
                  key={env}
                  onClick={() => setFilters({ ...filters, environment: env === 'All' ? '' : env })}
                  className={`px-3.5 py-1.5 rounded-md border-none text-[13px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap font-[inherit]
                    ${active ? 'bg-[#111] text-white' : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-[#111]'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {/* Status pills */}
          <div className="flex items-center gap-0.5">
            {['All', 'connected', 'disconnected', 'error', 'pending'].map(st => {
              const label = st === 'All' ? 'All Statuses' : st.charAt(0).toUpperCase() + st.slice(1);
              const active = st === 'All' ? filters.status === '' : filters.status === st;
              return (
                <button
                  key={st}
                  onClick={() => setFilters({ ...filters, status: st === 'All' ? '' : st })}
                  className={`px-3.5 py-1.5 rounded-md border-none text-[13px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap font-[inherit]
                    ${active ? 'bg-[#111] text-white' : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-[#111]'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <span className="text-[13px] text-gray-400 whitespace-nowrap font-normal shrink-0">
            {systems.length} system{systems.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-3xl my-auto">
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
        <div className="max-w-[1400px] mx-auto px-12 pt-6 max-md:px-5">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Target Systems Grid */}
      <div className="max-w-[1400px] mx-auto px-12 pt-10 pb-20 max-md:px-5">
        {loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
        ) : systems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-20 text-center">
            <div className="text-5xl mb-4 opacity-30">🖥️</div>
            <p className="text-[15px] text-gray-400 mb-6">No target systems found</p>
            {canAdd && (
              <button
                onClick={() => navigate("/systems/targetsys")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#333] text-white rounded-lg text-[13px] font-medium transition-colors"
              >
                <FaPlus size={12} />
                Create your first target system
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {systems.map((system, idx) => (
              <div
                key={system._id}
                className="ts-card bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-[220ms] hover:shadow-lg hover:-translate-y-0.5"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* Accent bar */}
                <div className="ts-accent-bar h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500" />

                {/* Card body */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Title row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#0A0A0A] leading-tight">{system.name}</h3>
                      <p className="text-[13px] text-gray-500 mt-0.5">{system.type}</p>
                    </div>
                    <TargetSystemStatus status={system.status} />
                  </div>

                  {/* Meta */}
                  <div className="space-y-2 mb-4 text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-24 shrink-0">Environment</span>
                      <span className="font-medium text-[#111]">{system.environment}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-24 shrink-0">Host</span>
                      <span className="font-medium text-[#111] break-all">{system.base_url || system.host}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-24 shrink-0">Status</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${getStatusColor(system.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(system.status)}`} />
                        {system.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-100 pt-4 mt-auto flex gap-2">
                    {canEdit ? (
                      <button
                        onClick={() => { setEditingSystem(system); setShowForm(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[12px] font-medium transition-colors"
                        title="Edit this target system"
                      >
                        <FaEdit size={11} />
                        Edit
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-300 cursor-not-allowed rounded-lg text-[12px] font-medium"
                      >
                        <FaEdit size={11} />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleTestConnection(system._id)}
                      disabled={testingId === system._id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#111] hover:bg-[#333] text-white rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
                    >
                      <FaCheckCircle size={11} className={testingId === system._id ? 'animate-spin' : ''} />
                      {testingId === system._id ? 'Testing…' : 'Test'}
                    </button>
                    {canDelete ? (
                      <button
                        onClick={() => handleDeleteClick(system)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[12px] font-medium transition-colors"
                        title="Delete this target system"
                      >
                        <FaTrash size={11} />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-300 cursor-not-allowed rounded-lg text-[12px] font-medium"
                      >
                        <FaTrash size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        .ts-font { font-family: 'DM Sans', sans-serif; }

        /* Card rise animation */
        @keyframes ts-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ts-card { animation: ts-rise 0.35s ease both; }

        /* Accent bar: scaleX on hover */
        .ts-accent-bar {
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        .ts-card:hover .ts-accent-bar { transform: scaleX(1); }

        /* Delete modal animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn  { animation: fadeIn  0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default TargetSystemShow;