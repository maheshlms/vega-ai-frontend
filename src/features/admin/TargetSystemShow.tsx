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
    <span className="ts-stat-value text-[42px] font-bold text-gray-950 tracking-tight leading-none">{value}</span>
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
        className={`ts-filter-btn inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold border transition-all duration-150 select-none
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

/* ── NEW: Polished Live health indicator shown in the filter bar ── */
const LiveHealthIndicator = ({
  countdown,
  isChecking,
  lastChecked,
  systemCount,
}: {
  countdown: number;
  isChecking: boolean;
  lastChecked: Date | null;
  systemCount: number;
}) => {
  const timeStr = lastChecked
    ? lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  // Progress: countdown counts DOWN from 10→1, so progress fills as we approach next check
  const progress = ((30 - countdown) / 30) * 100;

  return (
    <div
      className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border overflow-hidden"
      style={{
        background: isChecking ? '#eff6ff' : '#f8fafc',
        borderColor: isChecking ? '#bfdbfe' : '#e2e8f0',
        transition: 'background 0.4s, border-color 0.4s',
        minWidth: 190,
      }}
    >
      {/* Thin progress track along the bottom — fills up toward next check */}
      {!isChecking && (
        <span
          className="absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            opacity: 0.5,
          }}
        />
      )}

      {/* Animated dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${isChecking ? 'animate-ping bg-blue-400' : ''}`}
          style={!isChecking ? { animation: 'subtle-ping 2.5s ease-in-out infinite', background: '#4ade80' } : {}}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${isChecking ? 'bg-blue-500' : 'bg-green-500'}`}
        />
      </span>

      {/* Text */}
      <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: isChecking ? '#2563eb' : '#64748b' }}>
        {isChecking ? (
          <>Checking {systemCount} system{systemCount !== 1 ? 's' : ''}…</>
        ) : (
          <span className="flex items-center gap-1">
            <span style={{ color: '#22c55e' }}>Live</span>
            {timeStr
              ? <span style={{ color: '#94a3b8' }}>· {timeStr}</span>
              : <span style={{ color: '#94a3b8' }}>· waiting…</span>
            }
            <span
              className="inline-flex items-center justify-center rounded-md px-1.5"
              style={{ background: '#f1f5f9', color: '#6366f1', fontSize: 10, fontWeight: 700, letterSpacing: '0.02em' }}
            >
              {countdown}s
            </span>
          </span>
        )}
      </span>

      <style>{`
        @keyframes subtle-ping {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
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

  /* ── NEW: auto health-check state ── */
  const [healthCheckingIds, setHealthCheckingIds] = useState<Set<string>>(new Set());
  const [countdown,         setCountdown]         = useState(30);
  const [lastChecked,       setLastChecked]       = useState<Date | null>(null);
  const [isRunningCheck,    setIsRunningCheck]    = useState(false);
  // Stable ref so interval always sees latest systems without re-registering
  const systemsRef = useRef<System[]>([]);
  systemsRef.current = systems;

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

  /* ── NEW: countdown ticker — ticks every second ── */
  useEffect(() => {
    const ticker = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  /* ── NEW: silent auto health-check every 10 seconds ── */
  useEffect(() => {
    const doHealthCheck = async () => {
      const current = systemsRef.current;
      if (!current.length) return;

      setIsRunningCheck(true);
      setCountdown(30);
      setHealthCheckingIds(new Set(current.map(s => s._id)));

      const results = await Promise.allSettled(
        current.map(async sys => {
          try {
            const r: TestResult = await api.targetSystems.testConnection(sys._id);
            const isFailure =
              r.success === false ||
              r.connected === false ||
              r.status === 'error' ||
              r.status === 'failed' ||
              /fail|error|unable|cannot|unreachable|connection failed/i.test(r.message || r.detail || '');
            return { id: sys._id, newStatus: isFailure ? 'disconnected' : 'connected' };
          } catch {
            return { id: sys._id, newStatus: 'error' };
          }
        })
      );

      const statusMap: Record<string, string> = {};
      for (const r of results) {
        if (r.status === 'fulfilled') statusMap[r.value.id] = r.value.newStatus;
      }

      // Update systems + recompute stats in a single setState call
      setSystems(prev => {
        const updated = prev.map(s => (statusMap[s._id] ? { ...s, status: statusMap[s._id] } : s));
        setStats({
          total_systems: updated.length,
          connected:     updated.filter(s => s.status === 'connected').length,
          disconnected:  updated.filter(s => s.status === 'disconnected').length,
          error:         updated.filter(s => s.status === 'error').length,
          pending:       updated.filter(s => s.status === 'pending').length,
        });
        return updated;
      });

      setHealthCheckingIds(new Set());
      setLastChecked(new Date());
      setIsRunningCheck(false);
    };

    const interval = setInterval(doHealthCheck, 30_000);
    return () => clearInterval(interval);
  }, []); // empty deps — reads systems via ref

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

  // CHANGE: return the created system so TargetSystemForm can show the
  // connection test result in its success modal. DO NOT close the form here —
  // the form's "Done" button calls onCancel which closes it.
  // No toast.success here — the form modal communicates the real outcome to the user.
  // Re-throw on error so the form shows the error instead of a false success modal.
  async function handleCreate(data: any): Promise<any> {
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
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || 'Failed to create');
      throw e;
    }
  }

  // CHANGE: return the updated system so TargetSystemForm can show the
  // connection test result in its success modal. DO NOT close the form here —
  // the form's "Done" button calls onCancel which closes it.
  // api.targetSystems.update() now auto-tests and embeds _connectionTest.
  // Re-throw on error so the form shows the error instead of a false success modal.
  async function handleUpdate(id: string, data: any): Promise<any> {
    // try {
    //   await api.targetSystems.update(id, data);
    //   toast.success('Target system updated successfully');
    //   setShowForm(false); setEditingSys(null); fetchData();
    // } catch (e: any) { toast.error(e?.response?.data?.detail || e?.message || 'Failed to update'); }
    try {
      const updated = await api.targetSystems.update(id, data);
      fetchData(); // refresh list in background
      return updated ?? { _id: id, id };
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || 'Failed to update');
      throw e;
    }
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
      // Only update this specific card's status — no full page refresh
      const newStatus = isFailure ? 'disconnected' : 'connected';
      setSystems(prev => {
        const updated = prev.map(s => s._id === id ? { ...s, status: newStatus } : s);
        setStats({
          total_systems: updated.length,
          connected:     updated.filter(s => s.status === 'connected').length,
          disconnected:  updated.filter(s => s.status === 'disconnected').length,
          error:         updated.filter(s => s.status === 'error').length,
          pending:       updated.filter(s => s.status === 'pending').length,
        });
        return updated;
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || 'Connection test failed');
      // Mark just this card as error
      setSystems(prev => {
        const updated = prev.map(s => s._id === id ? { ...s, status: 'error' } : s);
        setStats({
          total_systems: updated.length,
          connected:     updated.filter(s => s.status === 'connected').length,
          disconnected:  updated.filter(s => s.status === 'disconnected').length,
          error:         updated.filter(s => s.status === 'error').length,
          pending:       updated.filter(s => s.status === 'pending').length,
        });
        return updated;
      });
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
    // { label: 'Pending',       value: stats?.pending       ?? 0, dot: '#eab308', delay: 200 },
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

        /* ── FIX: proper ring spinner keyframe for the Test button ── */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Per-card glow during manual Test click ── */
        @keyframes test-glow {
          0%, 100% { box-shadow: 0 0 0 1.5px rgba(34,197,94,0.30), 0 0 14px 3px rgba(34,197,94,0.12); }
          50%       { box-shadow: 0 0 0 1.5px rgba(34,197,94,0.60), 0 0 24px 6px rgba(34,197,94,0.22); }
        }
        .sys-card.manual-testing {
          animation: fade-up .35s cubic-bezier(.22,1,.36,1) both, test-glow 1.4s ease-in-out infinite;
        }
        .sys-card.manual-testing .top-bar {
          transform: scaleX(1);
          background: linear-gradient(90deg, #22c55e, #16a34a);
          animation: none;
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

        /* ── Health-check full-page overlay ── */
        @keyframes hc-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes hc-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes hc-pop {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .hc-overlay {
          position: fixed; inset: 0; z-index: 40;
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: hc-fade-in 0.25s ease;
          pointer-events: none;
        }
        .hc-card {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 41;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(99,102,241,0.08);
          padding: 28px 36px;
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          animation: hc-pop 0.28s cubic-bezier(.22,1,.36,1);
          pointer-events: none;
          min-width: 220px;
        }
        .hc-ring {
          width: 44px; height: 44px;
          border: 3px solid #e5e7eb;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: hc-spin 0.75s linear infinite;
        }
        .hc-label {
          font-size: 13px; font-weight: 600; color: #374151;
          letter-spacing: -0.01em;
        }
        .hc-sub {
          font-size: 11.5px; color: #9ca3af; margin-top: -8px;
        }

        /* ══════════════════════════════════════════════════════════════════
           RESPONSIVE LAYOUT SYSTEM
           ─────────────────────────────────────────────────────────────────
           BASELINE  : 1920×1080  — exact current design, no changes
           Large     : 1440–1919px (large laptops, 1440p screens)
           Laptop    : 1024–1439px (MacBook 13/14/15", Windows 13–15")
           Small     : 768–1023px  (small laptops, large tablets in landscape)
           4K+       : 2560px+     (ultrawide / 4K monitors)

           Strategy  : clamp() for fluid scaling where possible, explicit
                       breakpoints only when layout must structurally shift.
        ══════════════════════════════════════════════════════════════════ */

        /* ── Outer page wrapper — controls max content width & gutters ── */
        .ts-page-wrapper {
          /* BASELINE 1920: max-w-7xl (1280px) with px-8 (32px) gutters */
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
          /* Fluid horizontal padding: 32px at 1920, scales down for smaller */
          padding-left:  clamp(16px, 2.5vw, 32px);
          padding-right: clamp(16px, 2.5vw, 32px);
        }

        /* ── Header section ── */
        .ts-header-section {
          padding-top:    clamp(20px, 2.5vw, 36px);
          padding-bottom: clamp(16px, 1.5vw, 24px);
        }

        /* ── H1 — fluid from 26px (laptop) to 34px (1920) ── */
        .ts-h1 {
          font-size: clamp(22px, 2vw, 34px);
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.15;
          color: #030712;
        }

        /* ── Header subtitle ── */
        .ts-h1-sub {
          font-size: clamp(12px, 0.85vw, 14px);
          color: #9ca3af;
          margin-top: clamp(4px, 0.4vw, 6px);
        }

        /* ── Header action buttons — fluid height ── */
        .ts-header-btn {
          height: clamp(34px, 2.4vw, 40px);
          padding-left:  clamp(10px, 1vw, 16px);
          padding-right: clamp(10px, 1vw, 16px);
          font-size: clamp(11px, 0.75vw, 13px);
        }

        /* ── Stat cards row ── */
        .ts-stats-section {
          padding-bottom: clamp(16px, 1.5vw, 24px);
        }
        .ts-stats-row {
          display: flex;
          gap: clamp(8px, 1vw, 16px);
        }

        /* ── Stat card internals ── */
        .stat-card {
          padding: clamp(12px, 1.2vw, 20px) clamp(14px, 1.5vw, 20px);
          border-radius: 16px;
        }
        .ts-stat-value {
          /* Fluid: 28px on small laptops → 42px at 1920 baseline */
          font-size: clamp(26px, 2.5vw, 42px) !important;
        }
        .ts-stat-label {
          font-size: clamp(9px, 0.65vw, 11px);
        }

        /* ── Filter bar ── */
        .ts-filter-section {
          padding-top:    clamp(6px, 0.6vw, 12px);
          padding-bottom: clamp(6px, 0.6vw, 12px);
        }
        .ts-filter-btn {
          height: clamp(34px, 2.2vw, 40px) !important;
          font-size: clamp(11px, 0.75vw, 13px) !important;
          padding-left:  clamp(10px, 1vw, 16px) !important;
          padding-right: clamp(10px, 1vw, 16px) !important;
        }
        .ts-count-label {
          font-size: clamp(11px, 0.75vw, 13px);
        }

        /* ── Card grid ── */
        .ts-grid-section {
          padding-top:    clamp(16px, 1.5vw, 28px);
          padding-bottom: clamp(40px, 4vw, 80px);
        }
        .ts-card-grid {
          display: grid;
          gap: clamp(12px, 1.2vw, 20px);
          /* Fluid min card width: 260px on laptop → 340px at 1920 */
          grid-template-columns: repeat(auto-fill, minmax(clamp(260px, 20vw, 340px), 1fr));
        }

        /* ── System card internals ── */
        .sys-card {
          border-radius: clamp(12px, 1vw, 16px);
        }
        .ts-card-body {
          padding: clamp(14px, 1.4vw, 24px);
        }
        .ts-card-name {
          font-size: clamp(13px, 0.95vw, 16px);
        }
        .ts-card-type {
          font-size: clamp(11px, 0.75vw, 13px);
        }
        .ts-card-detail-label {
          font-size: clamp(11px, 0.75vw, 13px);
          width: clamp(72px, 5.5vw, 96px);
        }
        .ts-card-detail-value {
          font-size: clamp(11px, 0.75vw, 13px);
        }
        .ts-card-actions {
          padding-top: clamp(10px, 1vw, 20px);
          margin-top:  clamp(10px, 1vw, 24px);
        }
        .ts-card-action-btn {
          height: clamp(30px, 2vw, 36px);
          font-size: clamp(10px, 0.7vw, 12px);
          border-radius: clamp(8px, 0.6vw, 12px);
        }
        .ts-card-trash-btn {
          width:  clamp(30px, 2vw, 36px);
          height: clamp(30px, 2vw, 36px);
          border-radius: clamp(8px, 0.6vw, 12px);
        }
        .ts-status-badge {
          font-size: clamp(10px, 0.7vw, 12px);
          padding: clamp(2px, 0.2vw, 4px) clamp(8px, 0.7vw, 12px);
        }

        /* ══════════════════════════════════════════════════════════════════
           BREAKPOINT OVERRIDES
           These kick in only when clamp() fluid scaling isn't enough and
           a structural change is needed.
        ══════════════════════════════════════════════════════════════════ */

        /* ── Laptop: 1024–1439px (MacBook 13/14/15", Windows laptops) ──
           Most scaling is already handled by clamp(). These rules handle
           layout shifts that clamp alone can't — e.g. stat cards wrapping.
        ── */
        @media (min-width: 1024px) and (max-width: 1439px) {
          .ts-page-wrapper {
            max-width: 100%;
          }

          /* Stat cards: keep all 5 in a row but allow natural compression */
          .ts-stats-row {
            flex-wrap: nowrap;
            overflow-x: auto;
            /* Subtle scrollbar for extreme cases */
            scrollbar-width: none;
          }
          .ts-stats-row::-webkit-scrollbar { display: none; }
          .ts-stats-row > * {
            flex: 1 1 0;
            min-width: 120px;
          }

          /* Header: stack on very narrow laptop if needed */
          .ts-header-inner {
            flex-wrap: wrap;
            gap: 12px;
          }
          .ts-header-actions {
            flex-wrap: wrap;
          }
        }

        /* ── Large laptop / 1440p: 1440–1919px ── */
        @media (min-width: 1440px) and (max-width: 1919px) {
          .ts-page-wrapper {
            max-width: 1280px;
          }
        }

        /* ── 1920px BASELINE — explicit lock so nothing shifts ── */
        @media (min-width: 1920px) and (max-width: 2559px) {
          .ts-page-wrapper    { max-width: 1280px; padding-left: 32px; padding-right: 32px; }
          .ts-h1              { font-size: 34px; }
          .ts-h1-sub          { font-size: 14px; }
          .ts-header-btn      { height: 40px; font-size: 13px; padding-left: 16px; padding-right: 16px; }
          .ts-stat-value      { font-size: 42px !important; }
          .ts-stat-label      { font-size: 11px; }
          .ts-filter-btn      { height: 40px !important; font-size: 13px !important; }
          .ts-card-grid       { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
          .ts-card-body       { padding: 24px; }
          .ts-card-name       { font-size: 16px; }
          .ts-card-type       { font-size: 13px; }
          .ts-card-detail-label { font-size: 13px; width: 96px; }
          .ts-card-detail-value { font-size: 13px; }
          .ts-card-action-btn { height: 36px; font-size: 12px; }
          .ts-card-trash-btn  { width: 36px; height: 36px; }
        }

        /* ── 4K / ultrawide: 2560px+ ── */
        @media (min-width: 2560px) {
          .ts-page-wrapper {
            max-width: 1920px;
            padding-left:  clamp(32px, 3vw, 80px);
            padding-right: clamp(32px, 3vw, 80px);
          }
          .ts-h1              { font-size: clamp(34px, 2.2vw, 48px); }
          .ts-header-section  { padding-top: clamp(36px, 2.5vw, 56px); padding-bottom: clamp(24px, 1.5vw, 36px); }
          .ts-stat-value      { font-size: clamp(42px, 3vw, 60px) !important; }
          .ts-card-grid       { grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 24px; }
          .ts-card-body       { padding: 28px; }
          .ts-card-name       { font-size: 18px; }
          .stat-card          { border-radius: 20px; }
          .sys-card           { border-radius: 20px; }
        }

        /* ── Small laptop / large tablet landscape: 768–1023px ── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .ts-page-wrapper {
            max-width: 100%;
            padding-left: 16px;
            padding-right: 16px;
          }
          .ts-h1         { font-size: 22px; }
          .ts-h1-sub     { font-size: 12px; }
          .ts-header-section { padding-top: 16px; padding-bottom: 14px; }
          .ts-header-inner { flex-wrap: wrap; gap: 10px; }
          .ts-header-actions { flex-wrap: wrap; gap: 6px; }

          /* Stats: 2×3 grid instead of single row */
          .ts-stats-row {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .ts-stats-row > * { flex: none; }

          /* Slightly smaller stat numbers */
          .ts-stat-value { font-size: 28px !important; }

          /* Card grid: 2 columns */
          .ts-card-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          /* Filter bar: allow wrapping */
          .ts-filter-inner { flex-wrap: wrap; gap: 8px; }
        }
      `}</style>

      <div className="ts min-h-screen bg-white">

        {/* ════════════════════ HEALTH-CHECK OVERLAY ════════════════════ */}
        {(isRunningCheck || countdown <= 5) && (
          <>
            <div className="hc-overlay" />
            <div className="hc-card">
              <div className="hc-ring" />
              <div className="hc-label">Checking systems…</div>
              <div className="hc-sub">{systems.length} system{systems.length !== 1 ? 's' : ''} · auto health-check</div>
            </div>
          </>
        )}

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
        <div className="ts-header-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="ts-page-wrapper">
            <div className="ts-header-inner flex items-start justify-between gap-6">
              <div>
                <h1 className="ts-h1">
                  {integrationName ? `${integrationName} Systems` : 'Target Systems'}
                </h1>
                <p className="ts-h1-sub">
                  {integrationName
                    ? `Manage target systems for ${integrationName}`
                    : 'Manage your connected systems and integrations'}
                </p>
              </div>
              <div className="ts-header-actions flex items-center gap-2.5 pt-1 shrink-0">
                <button onClick={fetchData} disabled={loading}
                  className="ts-header-btn inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-600 transition-all disabled:opacity-50">
                  <FaSync size={11} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
                {canAdd ? (
                  <button onClick={() => navigate('/systems/targetsys')}
                    className="ts-header-btn inline-flex items-center gap-2 rounded-xl bg-[#0f0f0f] hover:bg-[#2a2a2a] font-semibold text-white transition-all">
                    <FaPlus size={11} /> Create Target System
                  </button>
                ) : (
                  <button disabled className="ts-header-btn inline-flex items-center gap-2 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed">
                    <FaLock size={11} /> Restricted
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════ STAT CARDS ════════════════════ */}
        <div className="ts-stats-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="ts-page-wrapper">
            <div className="ts-stats-row">
              {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
            </div>
          </div>
        </div>

        {/* ════════════════════ FILTER BAR ════════════════════ */}
        <div className="ts-filter-section sticky top-0 z-10 bg-white border-y border-gray-100"
          style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="ts-page-wrapper">
            <div className="ts-filter-inner flex items-center justify-between gap-4">
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
                    className="ts-filter-btn rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border border-dashed border-gray-200 inline-flex items-center">
                    Clear ×
                  </button>
                )}
              </div>
              {/* ── right side of filter bar — polished live indicator + count ── */}
              <div className="flex items-center gap-3 shrink-0">
                {systems.length > 0 && (
                  <LiveHealthIndicator
                    countdown={countdown}
                    isChecking={isRunningCheck}
                    lastChecked={lastChecked}
                    systemCount={systems.length}
                  />
                )}
                <span className="ts-count-label text-gray-400 font-medium">
                  {systems.length} system{systems.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
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
          <div className="ts-page-wrapper pt-5">
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          </div>
        )}

        {/* ════════════════════ CARD GRID ════════════════════ */}
        <div className="ts-grid-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="ts-page-wrapper">
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
              <div className="ts-card-grid">
                {systems.map((sys, i) => {
                  const isManualTesting = testingId === sys._id;
                  return (
                    <article
                      key={sys._id}
                      className={`sys-card bg-gray-50 overflow-hidden${isManualTesting ? ' manual-testing' : ''}`}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {/* Animated top accent bar */}
                      <div className="top-bar h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500" />

                      <div className="ts-card-body">
                        {/* Name + badge */}
                        <div className="flex items-start justify-between gap-3 mb-5">
                          <div className="min-w-0">
                            <h3 className="ts-card-name font-bold text-gray-950 truncate leading-tight">{sys.name}</h3>
                            <p className="ts-card-type text-gray-400 mt-0.5">{sys.type}</p>
                          </div>
                          <div className="shrink-0 mt-0.5">
                            <span
                              className="ts-status-badge inline-flex items-center gap-1.5 rounded-full font-semibold"
                              style={{
                                background: isManualTesting ? '#f0fdf4' : (STATUS_CFG[sys.status]?.bg ?? '#f9fafb'),
                                color:      isManualTesting ? '#15803d'  : (STATUS_CFG[sys.status]?.color ?? '#6b7280'),
                              }}
                            >
                              <span
                                className="status-dot w-1.5 h-1.5 rounded-full"
                                style={{ background: isManualTesting ? '#22c55e' : (STATUS_CFG[sys.status]?.dot ?? '#9ca3af') }}
                              />
                              {isManualTesting ? 'Testing…' : (STATUS_CFG[sys.status]?.label ?? sys.status)}
                            </span>
                          </div>
                        </div>

                        {/* Detail rows */}
                        <div className="space-y-2.5 mb-6">
                          <div className="flex items-center gap-3">
                            <span className="ts-card-detail-label text-gray-400 shrink-0">Environment</span>
                            <span className="ts-card-detail-value font-medium text-gray-800 capitalize">{sys.environment}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="ts-card-detail-label text-gray-400 shrink-0">Host</span>
                            <span className="ts-card-detail-value font-medium text-gray-800 break-all leading-snug">
                              {sys.base_url || sys.host || '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="ts-card-detail-label text-gray-400 shrink-0">Status</span>
                            <span className="ts-card-detail-value flex items-center gap-1.5 font-medium text-gray-800">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: STATUS_CFG[sys.status]?.dot ?? '#9ca3af' }}
                              />
                              {sys.status}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="ts-card-actions flex gap-2 border-t border-gray-200/60">
                          {/* Edit */}
                          {canEdit ? (
                            <button
                              onClick={() => { setEditingSys(sys); setShowForm(true); }}
                              className="ts-card-action-btn flex-1 inline-flex items-center justify-center gap-1.5 bg-white hover:bg-gray-100 font-semibold text-gray-600 transition-colors"
                            >
                              <FaEdit size={10} /> Edit
                            </button>
                          ) : (
                            <button disabled className="ts-card-action-btn flex-1 inline-flex items-center justify-center gap-1.5 bg-white text-gray-300 cursor-not-allowed">
                              <FaEdit size={10} /> Edit
                            </button>
                          )}

                          {/* Test — green glow on this card only, no page overlay */}
                          <button
                            onClick={() => testConn(sys._id)}
                            disabled={isManualTesting || isRunningCheck}
                            className="ts-card-action-btn flex-1 inline-flex items-center justify-center gap-1.5 bg-[#0f0f0f] hover:bg-[#2a2a2a] font-semibold text-white transition-colors disabled:opacity-50"
                            title={isRunningCheck ? 'Auto health-check in progress…' : undefined}
                          >
                            {/* FIX: replaced rotating FaCheckCircle with a proper ring spinner */}
                            {isManualTesting ? (
                              <>
                                <span style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  border: '1.5px solid rgba(255,255,255,0.35)',
                                  borderTopColor: '#fff',
                                  display: 'inline-block',
                                  animation: 'spin 0.65s linear infinite',
                                  flexShrink: 0,
                                }} />
                                Testing…
                              </>
                            ) : (
                              <><FaCheckCircle size={10} /> Test</>
                            )}
                          </button>

                          {/* Delete — glowing trash */}
                          {canDelete ? (
                            <button
                              onClick={() => openDelete(sys)}
                              className="btn-trash ts-card-trash-btn inline-flex items-center justify-center bg-white text-gray-400"
                            >
                              <FaTrash size={10} />
                            </button>
                          ) : (
                            <button disabled className="ts-card-trash-btn inline-flex items-center justify-center bg-white text-gray-200 cursor-not-allowed">
                              <FaTrash size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}