import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlus, FaSync, FaTrash, FaEdit, FaCheckCircle, FaLock, FaChevronDown, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { auth } from '../../utils/auth';
import TargetSystemForm from './TargetSystemForm';
import { toast } from 'react-toastify';

/* ─────────────────────────────── interfaces ─────────────────────────────── */
interface LocationState { integrationName?: string; integrationValue?: string; authMethods?: string[]; }
interface System {
  _id: string; name: string; type: string; environment: string;
  status: string; base_url?: string; host?: string; integration_id?: string;
}
interface Stats { total_systems: number; connected: number; disconnected: number; error: number; pending: number; }
interface Filters { environment: string; status: string; }
interface TypeOption { value: string; label: string; }
interface SystemsResponse { systems?: System[]; [k: string]: any; }
interface TypesResponse   { types?: TypeOption[];  [k: string]: any; }
interface TestResult      { message?: string; detail?: string; success?: boolean; status?: string; connected?: boolean; [k: string]: any; }
interface User            { role?: string; roles?: string[]; [k: string]: any; }

/* ─────────────────────────────── status config ──────────────────────────── */
const STATUS_CFG: Record<string, { dot: string; label: string; bg: string; color: string; glow: string }> = {
  connected:    { dot: '#22c55e', label: 'Connected',    bg: '#f0fdf4', color: '#15803d', glow: 'rgba(34,197,94,0.35)'  },
  disconnected: { dot: '#ef4444', label: 'Disconnected', bg: '#fef2f2', color: '#b91c1c', glow: 'rgba(239,68,68,0.35)'  },
  error:        { dot: '#f97316', label: 'Error',        bg: '#fff7ed', color: '#c2410c', glow: 'rgba(249,115,22,0.35)' },
  pending:      { dot: '#eab308', label: 'Pending',      bg: '#fefce8', color: '#a16207', glow: 'rgba(234,179,8,0.35)'  },
};

/* ─────────────────────────────── sub-components ────────────────────────── */

const StatusBadge = ({ status }: { status: string }) => {
  const c = STATUS_CFG[status] ?? { dot: '#9ca3af', label: status, bg: '#f9fafb', color: '#6b7280', glow: 'transparent' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
};

/* Stat card — soft bg, no border */
const StatCard = ({ label, dot, value, delay }: { label: string; dot: string; value: number; delay: number }) => (
  <div className="stat-card flex-1 bg-gray-50 rounded-2xl px-5 py-5" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center gap-2 mb-3">
      <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    </div>
    <span className="text-[42px] font-bold text-gray-950 tracking-tight leading-none">{value}</span>
  </div>
);

/* Dropdown filter */
interface DDOption { key: string; label: string; dot?: string; }
const DropdownFilter = ({
  label, value, options, onChange,
}: { label: string; value: string; options: DDOption[]; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = options.find(o => o.key === value);
  const isActive = value !== '';

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold border transition-all duration-150 select-none
          ${isActive
            ? 'bg-white text-gray-900 border-gray-900 shadow-sm'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
          }`}
      >
        {isActive && active?.dot && (
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: active.dot }} />
        )}
        <span>{isActive ? active?.label : label}</span>
        <FaChevronDown
          size={9}
          className={`transition-transform duration-200 text-gray-400 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="dd-panel absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-black/[.08] overflow-hidden z-30">
          <div className="py-1.5">
            {options.map(opt => {
              const sel = value === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => { onChange(opt.key); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] transition-colors
                    ${sel ? 'bg-gray-50 text-gray-950 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'}`}
                >
                  <span className="flex items-center gap-2.5">
                    {opt.dot && <span className="w-2 h-2 rounded-full" style={{ background: opt.dot }} />}
                    {opt.label}
                  </span>
                  {sel && <FaCheck size={10} className="text-gray-950" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════ Main Component ════════════════════════════ */
export default function TargetSystemShow() {
  const { integrationId } = useParams<{ integrationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const ls = location.state as LocationState | undefined;
  const integrationName      = ls?.integrationName;
  const integrationValue     = ls?.integrationValue;
  const authMethodsFromState = ls?.authMethods || [];

  const [systems,     setSystems]     = useState<System[]>([]);
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [editingSys,  setEditingSys]  = useState<System | null>(null);
  const [testingId,   setTestingId]   = useState<string | null>(null);
  const [typeOptions, setTypeOptions] = useState<TypeOption[]>([]);
  const [authMethods, setAuthMethods] = useState<string[]>([]);
  const [canAdd,      setCanAdd]      = useState(false);
  const [canEdit,     setCanEdit]     = useState(false);
  const [canDelete,   setCanDelete]   = useState(false);
  const [delModal,    setDelModal]    = useState(false);
  const [delTarget,   setDelTarget]   = useState<System | null>(null);
  const [delText,     setDelText]     = useState('');
  const [filters,     setFilters]     = useState<Filters>({ environment: '', status: '' });

  useEffect(() => {
    const user: User | null = auth.getCurrentUser();
    const isAdmin = auth.isAdmin();
    const roles = user?.roles || [];
    setCanAdd(roles.includes('create:target_systems') || isAdmin);
    setCanEdit(roles.includes('edit:target_systems') || isAdmin);
    setCanDelete(roles.includes('delete:target_systems') || isAdmin);
    fetchData();
  }, [filters]);

  useEffect(() => { if (authMethodsFromState.length) setAuthMethods(authMethodsFromState); }, []);

  async function fetchData() {
    setLoading(true); setError(null);
    try {
      const [sd, td]: [SystemsResponse, TypesResponse | TypeOption[]] = await Promise.all([
        api.targetSystems.list(filters),
        api.targetSystems.getTypes().catch(() => []),
      ]);
      let list: System[] = Array.isArray(sd) ? sd : sd.systems || [];
      if (integrationId) list = list.filter(s => s.integration_id === integrationId);
      setSystems(list);
      setTypeOptions(Array.isArray(td) ? td : (td as TypesResponse).types || []);
      setStats({
        total_systems: list.length,
        connected:     list.filter(s => s.status === 'connected').length,
        disconnected:  list.filter(s => s.status === 'disconnected').length,
        error:         list.filter(s => s.status === 'error').length,
        pending:       list.filter(s => s.status === 'pending').length,
      });
    } catch (e) {
      setError((e as Error).message);
      setSystems([]);
    } finally { setLoading(false); }
  }

  async function handleCreate(data: any) {
    try {
      await api.targetSystems.create(data);
      toast.success('Target system created successfully');
      setShowForm(false); setEditingSys(null); fetchData();
    } catch (e: any) { toast.error(e?.response?.data?.detail || e?.message || 'Failed to create'); }
  }

  async function handleUpdate(id: string, data: any) {
    try {
      await api.targetSystems.update(id, data);
      toast.success('Target system updated successfully');
      setShowForm(false); setEditingSys(null); fetchData();
    } catch (e: any) { toast.error(e?.response?.data?.detail || e?.message || 'Failed to update'); }
  }

  const openDelete  = useCallback((s: System) => { setDelTarget(s); setDelModal(true); }, []);
  const closeDelete = useCallback(() => { setDelModal(false); setDelTarget(null); setDelText(''); }, []);

  const confirmDelete = useCallback(async () => {
    if (!delTarget) return;
    try {
      await api.targetSystems.delete(delTarget._id);
      toast.success('Target system deleted successfully. Associated agents have been removed.');
      closeDelete(); fetchData();
    } catch (e: any) { toast.error(e?.response?.data?.detail || e?.message || 'Failed to delete'); }
  }, [delTarget]);

  async function testConn(id: string) {
    setTestingId(id);
    try {
      const r: TestResult = await api.targetSystems.testConnection(id);
      const msg = r.message || r.detail || '';
      const isFailure =
        r.success === false ||
        r.connected === false ||
        r.status === 'error' ||
        r.status === 'failed' ||
        /fail|error|unable|cannot|unreachable|connection failed/i.test(msg);
      if (isFailure) {
        toast.error(msg || 'Connection test failed');
      } else {
        toast.success(msg || 'Connection successful');
      }
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || 'Connection test failed');
    } finally { setTestingId(null); }
  }

  /* filter options */
  const ENV_OPTIONS: DDOption[] = [
    { key: '',            label: 'All Environments' },
    { key: 'development', label: 'Development' },
    { key: 'staging',     label: 'Staging' },
    { key: 'production',  label: 'Production' },
  ];
  const STATUS_OPTIONS: DDOption[] = [
    { key: '',             label: 'All Statuses' },
    { key: 'connected',    label: 'Connected',    dot: '#22c55e' },
    { key: 'disconnected', label: 'Disconnected', dot: '#ef4444' },
    { key: 'error',        label: 'Error',        dot: '#f97316' },
    { key: 'pending',      label: 'Pending',      dot: '#eab308' },
  ];

  const STAT_CARDS = [
    { label: 'Total Systems', value: stats?.total_systems ?? 0, dot: '#9ca3af', delay: 0   },
    { label: 'Connected',     value: stats?.connected     ?? 0, dot: '#22c55e', delay: 50  },
    { label: 'Disconnected',  value: stats?.disconnected  ?? 0, dot: '#ef4444', delay: 100 },
    { label: 'Error',         value: stats?.error         ?? 0, dot: '#f97316', delay: 150 },
    { label: 'Pending',       value: stats?.pending       ?? 0, dot: '#eab308', delay: 200 },
  ];

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      connected:    'bg-green-100 text-green-700 border border-green-300',
      disconnected: 'bg-red-100 text-red-700 border border-red-300',
      error:        'bg-red-100 text-red-700 border border-red-300',
      pending:      'bg-yellow-100 text-yellow-700 border border-yellow-300',
    };
    return map[status] || 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .ts { font-family: 'Inter', system-ui, sans-serif; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .stat-card { animation: fade-up .4s cubic-bezier(.22,1,.36,1) both; }
        .sys-card  { animation: fade-up .35s cubic-bezier(.22,1,.36,1) both; }
        .modal-box { animation: modal-in .28s cubic-bezier(.22,1,.36,1); }
        .overlay   { animation: overlay-in .2s ease; }

        .sys-card {
          transition: box-shadow .2s ease, transform .2s ease;
        }
        .sys-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,.08);
          transform: translateY(-2px);
        }

        /* top accent bar */
        .sys-card .top-bar {
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .3s cubic-bezier(.22,1,.36,1);
        }
        .sys-card:hover .top-bar { transform: scaleX(1); }

        /* glowing trash button */
        .btn-trash {
          transition: background .2s, box-shadow .2s, color .2s;
        }
        .btn-trash:hover {
          background: #fef2f2 !important;
          color: #ef4444 !important;
          box-shadow: 0 0 0 4px rgba(239,68,68,.15), 0 0 14px rgba(239,68,68,.25);
        }

        .dd-panel { animation: fade-up .15s cubic-bezier(.22,1,.36,1); }
      `}</style>

      <div className="ts min-h-screen bg-white">

        {/* ════════════════════ DELETE MODAL ════════════════════ */}
        {delModal && (
          <div className="overlay fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="modal-box bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

              <div className="p-6">
                {/* Compact header row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <FaTrash className="text-red-500 text-sm" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-gray-900 leading-tight">Delete Target System?</h2>
                    <p className="text-[12px] text-gray-400 mt-0.5">This action cannot be undone</p>
                  </div>
                </div>

                {/* System info — inline compact */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 mb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-[14px] truncate">{delTarget?.name}</p>
                      <p className="text-[12px] text-gray-400">{delTarget?.type} · <span className="capitalize">{delTarget?.environment}</span></p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(delTarget?.status || '')}`}>
                      {delTarget?.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-1.5 break-all">{delTarget?.base_url || delTarget?.host}</p>
                </div>

                {/* Warning — compact */}
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
                  <p className="text-[12px] text-red-600 leading-relaxed">
                    <span className="font-bold">Warning:</span> Permanently removes this system along with all associated agents and monitoring data.
                  </p>
                </div>

                {/* Confirm input */}
                <div className="mb-4">
                  <label className="block text-[12px] font-bold text-red-500 mb-1.5">
                    Type <span className="font-black">"{delTarget?.name}"</span> to confirm
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
                    placeholder={`Type "${delTarget?.name}" to confirm`}
                    value={delText}
                    onChange={e => setDelText(e.target.value)}
                  />
                  {delText && delText !== delTarget?.name && (
                    <p className="text-red-400 text-[11px] mt-1">System name does not match</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2.5">
                  <button onClick={closeDelete}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors">
                    Cancel
                  </button>
                  <button onClick={confirmDelete} disabled={delText !== delTarget?.name}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ HEADER ════════════════════ */}
        <div className="px-8 max-md:px-5 pt-9 pb-6">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[34px] font-bold tracking-tight text-gray-950 leading-tight">
                {integrationName ? `${integrationName} Systems` : 'Target Systems'}
              </h1>
              <p className="text-[14px] text-gray-400 mt-1.5">
                {integrationName
                  ? `Manage target systems for ${integrationName}`
                  : 'Manage your connected systems and integrations'}
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-1 shrink-0">
              <button onClick={fetchData} disabled={loading}
                className="h-10 px-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[13px] font-semibold text-gray-600 transition-all disabled:opacity-50">
                <FaSync size={11} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              {canAdd ? (
                <button onClick={() => navigate('/systems/targetsys')}
                  className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-[#0f0f0f] hover:bg-[#2a2a2a] text-[13px] font-semibold text-white transition-all">
                  <FaPlus size={11} /> Create Target System
                </button>
              ) : (
                <button disabled className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-gray-100 text-[13px] text-gray-400 cursor-not-allowed">
                  <FaLock size={11} /> Restricted
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════ STAT CARDS ════════════════════ */}
        <div className="px-8 max-md:px-5 pb-6">
          <div className="max-w-7xl mx-auto flex gap-4 max-md:grid max-md:grid-cols-2">
            {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
          </div>
        </div>

        {/* ════════════════════ FILTER BAR ════════════════════ */}
        <div className="px-8 max-md:px-5 sticky top-0 z-10 bg-white py-3 border-y border-gray-100">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <DropdownFilter
                label="All Environments"
                value={filters.environment}
                options={ENV_OPTIONS}
                onChange={v => setFilters(f => ({ ...f, environment: v }))}
              />
              <DropdownFilter
                label="All Statuses"
                value={filters.status}
                options={STATUS_OPTIONS}
                onChange={v => setFilters(f => ({ ...f, status: v }))}
              />
              {(filters.environment || filters.status) && (
                <button onClick={() => setFilters({ environment: '', status: '' })}
                  className="h-10 px-3.5 rounded-xl text-[12px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border border-dashed border-gray-200">
                  Clear ×
                </button>
              )}
            </div>
            <span className="text-[13px] text-gray-400 font-medium">
              {systems.length} system{systems.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ════════════════════ FORM MODAL ════════════════════ */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
            <div className="w-full max-w-3xl my-auto">
              <TargetSystemForm
                system={editingSys}
                typeOptions={typeOptions}
                availableAuthMethods={authMethods}
                integrationValue={integrationValue}
                integrationId={integrationId}
                integrationName={integrationName}
                isModal={true}
                onSubmit={editingSys ? d => handleUpdate(editingSys._id, d) : handleCreate}
                onCancel={() => { setShowForm(false); setEditingSys(null); }}
              />
            </div>
          </div>
        )}

        {/* ════════════════════ ERROR ════════════════════ */}
        {error && (
          <div className="max-w-7xl mx-auto px-8 pt-5">
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          </div>
        )}

        {/* ════════════════════ CARD GRID ════════════════════ */}
        <div className="max-w-7xl mx-auto px-8 pt-7 pb-20 max-md:px-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
              <span className="text-sm text-gray-400">Loading systems…</span>
            </div>
          ) : systems.length === 0 ? (
            <div className="flex flex-col items-center py-28 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                <svg width="22" height="22" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                  <rect x="2" y="6" width="20" height="14" rx="2"/>
                  <path d="M2 10h20M8 2v4M16 2v4"/>
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-gray-500">No systems found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or create a new target system</p>
            </div>
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
              {systems.map((sys, i) => (
                <article
                  key={sys._id}
                  className="sys-card bg-gray-50 rounded-2xl overflow-hidden"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Animated top accent bar */}
                  <div className="top-bar h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500" />

                  <div className="p-6">
                    {/* Name + badge */}
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div className="min-w-0">
                        <h3 className="text-[16px] font-bold text-gray-950 truncate leading-tight">{sys.name}</h3>
                        <p className="text-[13px] text-gray-400 mt-0.5">{sys.type}</p>
                      </div>
                      <div className="shrink-0 mt-0.5">
                        <StatusBadge status={sys.status} />
                      </div>
                    </div>

                    {/* Detail rows */}
                    <div className="space-y-2.5 mb-6">
                      <div className="flex items-center gap-3 text-[13px]">
                        <span className="text-gray-400 w-24 shrink-0">Environment</span>
                        <span className="font-medium text-gray-800 capitalize">{sys.environment}</span>
                      </div>
                      <div className="flex items-start gap-3 text-[13px]">
                        <span className="text-gray-400 w-24 shrink-0">Host</span>
                        <span className="font-medium text-gray-800 break-all leading-snug">
                          {sys.base_url || sys.host || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[13px]">
                        <span className="text-gray-400 w-24 shrink-0">Status</span>
                        <span className="flex items-center gap-1.5 font-medium text-gray-800">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: STATUS_CFG[sys.status]?.dot ?? '#9ca3af' }}
                          />
                          {sys.status}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-5 border-t border-gray-200/60">
                      {/* Edit */}
                      {canEdit ? (
                        <button
                          onClick={() => { setEditingSys(sys); setShowForm(true); }}
                          className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-gray-100 text-[12px] font-semibold text-gray-600 transition-colors"
                        >
                          <FaEdit size={10} /> Edit
                        </button>
                      ) : (
                        <button disabled className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white text-[12px] text-gray-300 cursor-not-allowed">
                          <FaEdit size={10} /> Edit
                        </button>
                      )}

                      {/* Test */}
                      <button
                        onClick={() => testConn(sys._id)}
                        disabled={testingId === sys._id}
                        className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0f0f0f] hover:bg-[#2a2a2a] text-[12px] font-semibold text-white transition-colors disabled:opacity-50"
                      >
                        <FaCheckCircle size={10} className={testingId === sys._id ? 'animate-spin' : ''} />
                        {testingId === sys._id ? 'Testing…' : 'Test'}
                      </button>

                      {/* Delete — glowing trash */}
                      {canDelete ? (
                        <button
                          onClick={() => openDelete(sys)}
                          className="btn-trash w-9 h-9 inline-flex items-center justify-center rounded-xl bg-white text-gray-400"
                        >
                          <FaTrash size={10} />
                        </button>
                      ) : (
                        <button disabled className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-white text-gray-200 cursor-not-allowed">
                          <FaTrash size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}