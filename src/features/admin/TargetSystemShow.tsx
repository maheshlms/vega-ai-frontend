import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlus, FaSync, FaTrash, FaEdit, FaCheckCircle, FaLock, FaChevronDown, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { auth } from '../../utils/auth';
import TargetSystemForm from './TargetSystemForm';
import { toast } from 'react-toastify';
// ── CHANGED: import the background service instead of managing timers locally
import healthCheckService, { HealthCheckState } from '../../utils/healthCheckService';

healthCheckService.init();

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

const LiveHealthIndicator = ({
  countdown,
  isChecking,
  lastChecked,
  systemCount,
  intervalMinutes,
}: {
  countdown: number;
  isChecking: boolean;
  lastChecked: Date | null;
  systemCount: number;
  intervalMinutes: number;
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [inputVal, setInputVal] = useState(String(intervalMinutes));
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync input when interval changes externally
  useEffect(() => { setInputVal(String(intervalMinutes)); }, [intervalMinutes]);

  // Close popover on click outside
  useEffect(() => {
    if (!popoverOpen) return;
    const fn = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
        setInputVal(String(intervalMinutes));
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [popoverOpen, intervalMinutes]);

  const handleSave = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n >= 3) {
      healthCheckService.setIntervalMinutes(n);
      setPopoverOpen(false);
    }
  };

  const timeStr = lastChecked
    ? lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  const totalSeconds = intervalMinutes * 60;
  const progress = ((totalSeconds - countdown) / totalSeconds) * 100;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setPopoverOpen(o => !o)}
        title="Configure interval"
        className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border overflow-hidden hover:opacity-80 transition-opacity"
        style={{
          background: isChecking ? '#eff6ff' : '#f8fafc',
          borderColor: isChecking ? '#bfdbfe' : '#e2e8f0',
          transition: 'background 0.4s, border-color 0.4s',
          minWidth: 190,
          cursor: 'pointer',
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
              {/* Countdown display */}
              <span
                className="inline-flex items-center justify-center rounded-md px-1.5"
                style={{ background: '#f1f5f9', color: '#6366f1', fontSize: 10, fontWeight: 700, letterSpacing: '0.02em' }}
              >
                {`${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`}
              </span>
            </span>
          )}
        </span>

        {/* Chevron indicator */}
        <FaChevronDown
          size={8}
          className={`transition-transform duration-200 ml-auto shrink-0 ${popoverOpen ? 'rotate-180' : ''}`}
          style={{ color: '#94a3b8' }}
        />
      </button>

      {/* Compact interval popover */}
      {popoverOpen && (
        <div
          className="absolute top-full mt-2 right-0 bg-white rounded-xl border border-gray-200 shadow-lg z-50 p-3"
          style={{ minWidth: 170 }}
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Check every</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={3}
              step={1}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-[12px] font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent text-center"
            />
            <span className="text-[12px] text-gray-500 font-medium">min</span>
            <button
              onClick={handleSave}
              className="ml-auto px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
          {inputVal !== '' && parseInt(inputVal, 10) < 3 && (
            <p className="text-[10px] text-red-500 mt-1.5">Minimum 3 minutes</p>
          )}
        </div>
      )}

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

  // ── UNCHANGED state ──
  const [systems,     setSystems]     = useState<System[]>([]);
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [editingSys,  setEditingSys]  = useState<System | null>(null);
  // ── CHANGED: testingId (single string | null) → testingIds (Set<string>)
  //    so multiple cards can be in "Testing…" state simultaneously. ──
  const [testingIds,  setTestingIds]  = useState<Set<string>>(new Set());
  const [typeOptions, setTypeOptions] = useState<TypeOption[]>([]);
  const [authMethods, setAuthMethods] = useState<string[]>([]);
  const [canAdd,      setCanAdd]      = useState(false);
  const [canEdit,     setCanEdit]     = useState(false);
  const [canDelete,   setCanDelete]   = useState(false);
  const [delModal,    setDelModal]    = useState(false);
  const [delTarget,   setDelTarget]   = useState<System | null>(null);
  const [delText,     setDelText]     = useState('');
  const [filters,     setFilters]     = useState<Filters>({ environment: '', status: '' });

  // ── CHANGED: removed healthCheckingIds, countdown, lastChecked, isRunningCheck.
  //    Replaced with a single hcState from the background service. ──
  const [hcState, setHcState] = useState<HealthCheckState>(healthCheckService.getState());

  // ── ADDED: tracks which system IDs are currently being swept by the Refresh
  //    button's health check OR the bg auto health check so their cards show
  //    the "Testing…" badge. ──
  // const [refreshTestingIds, setRefreshTestingIds] = useState<Set<string>>(new Set());

  // ── UNCHANGED: stable ref so the service getter always sees latest systems ──
  const systemsRef = useRef<System[]>([]);
  systemsRef.current = systems;

  // ── FIX: ref to track manually tested systems so bg-check results don't
  //    overwrite a fresh manual test result. Maps system _id → { status, timestamp }.
  //    Grace period: 15s — just enough to survive an in-flight auto-check cycle. ──
  const manuallyTestedRef = useRef<Map<string, { status: string; timestamp: number }>>(new Map());

  // ── UNCHANGED useEffect ──
  useEffect(() => {
    const user: User | null = auth.getCurrentUser();
    const isAdmin = auth.isAdmin();
    const roles = user?.roles || [];
    setCanAdd(roles.includes('create:target_systems') || isAdmin);
    setCanEdit(roles.includes('edit:target_systems') || isAdmin);
    setCanDelete(roles.includes('delete:target_systems') || isAdmin);
    fetchData();
  }, [filters]);

  // ── UNCHANGED useEffect ──
  useEffect(() => { if (authMethodsFromState.length) setAuthMethods(authMethodsFromState); }, []);

  // ── CHANGED: replaces the two timer useEffects (countdown ticker + 30s interval).
  //    Registers this page's systems getter with the background service.
  //    Subscribes to state changes and applies bg-check results locally.
  //    Cleans up on unmount — service skips checks when page is gone.
  //
  //    FIX: before applying bg-check results, skip any system that was manually
  //    tested within the last 15 seconds — their result is fresher than any
  //    in-flight auto-check that was already running when the user clicked Test.
  //    15s covers the backend's 10s timeout plus a small buffer.
  //
  //    CRITICAL BUG FIX: was using manuallyTestedRef.current.delete(r.id) which
  //    returns a boolean, not the entry. Changed to .get(r.id) so the timestamp
  //    comparison works correctly. Entries are cleared after the loop separately.
  //
  //    FIX (Problem 1 — bg auto-check "Testing…" badges):
  //    When a bg check STARTS (state.isRunning), all card IDs are added to
  //    refreshTestingIds so cards show green "Testing…" badges. Cleared once
  //    results are applied. This restores the per-card green glow for auto checks.
  useEffect(() => {
    healthCheckService.registerSystemsGetter(() => systemsRef.current.map(s => s._id));

    // const unsub = healthCheckService.subscribe(state => {
    //   setHcState(state);

    //   // ── FIX (Problem 1): when a bg check STARTS, mark all cards as "Testing…"
    //   //    so the UI shows green per-card badges instead of nothing. ──
    //   // if (state.isRunning) {
    //   //   setRefreshTestingIds(new Set(systemsRef.current.map(s => s._id)));
    //   // }

    //   // When a bg check completes, apply the new statuses to local systems list.
    //   // FIX: skip systems that were manually tested within the grace window so a
    //   // stale auto-check result never overwrites a fresh manual test result.
    //   if (!state.isRunning && state.results.length > 0) {
    //     const now = Date.now();
    //     // Grace window = 15s (covers backend 10s timeout + buffer).
    //     // Independent of user-configured interval so it works at any interval setting.
    //     const MANUAL_GRACE_MS = 15_000;

    //     const statusMap: Record<string, string> = {};
    //     for (const r of state.results) {
    //       // CRITICAL FIX: use .get() not .delete() — .delete() returns boolean,
    //       // not the entry object, breaking the timestamp comparison below.
    //       const manualEntry = manuallyTestedRef.current.get(r.id);
    //       // Only apply the bg result if there is no recent manual test for this system
    //       if (!manualEntry || now - manualEntry.timestamp > MANUAL_GRACE_MS) {
    //         statusMap[r.id] = r.newStatus;
    //       }
    //     }

    //     // Clear processed entries so next cycle starts clean
    //     for (const r of state.results) {
    //       manuallyTestedRef.current.delete(r.id);
    //     }

    //     // Nothing to update — all results were suppressed by the grace window.
    //     // Still clear the testing badges so cards don't stay stuck in "Testing…".
    //     // if (Object.keys(statusMap).length === 0) {
    //     //   setRefreshTestingIds(new Set());
    //     //   return;
    //     // }

    //     setSystems(prev => {
    //       const updated = prev.map(s => statusMap[s._id] ? { ...s, status: statusMap[s._id] } : s);
    //       setStats({
    //         total_systems: updated.length,
    //         connected:     updated.filter(s => s.status === 'connected').length,
    //         disconnected:  updated.filter(s => s.status === 'disconnected').length,
    //         error:         updated.filter(s => s.status === 'error').length,
    //         pending:       updated.filter(s => s.status === 'pending').length,
    //       });
    //       return updated;
    //     });
    //     // Clear bg-check testing badges once results are applied
    //     // setRefreshTestingIds(new Set());
    //   }
    // });

    const unsub = healthCheckService.subscribe(state => {
      setHcState(state);

      // When a bg check completes, apply the new statuses to local systems list.
      // FIX: skip systems that were manually tested within the grace window so a
      // stale auto-check result never overwrites a fresh manual test result.
      if (!state.isRunning && state.results.length > 0) {
        const now = Date.now();
        // Grace window = 15s (covers backend 10s timeout + buffer).
        // Independent of user-configured interval so it works at any interval setting.
        const MANUAL_GRACE_MS = 15_000;

        const statusMap: Record<string, string> = {};
        for (const r of state.results) {
          // CRITICAL FIX: use .get() not .delete() — .delete() returns boolean,
          // not the entry object, breaking the timestamp comparison below.
          const manualEntry = manuallyTestedRef.current.get(r.id);
          // Only apply the bg result if there is no recent manual test for this system
          if (!manualEntry || now - manualEntry.timestamp > MANUAL_GRACE_MS) {
            statusMap[r.id] = r.newStatus;
          }
        }

        // Clear processed entries so next cycle starts clean
        for (const r of state.results) {
          manuallyTestedRef.current.delete(r.id);
        }

        // Nothing to update — all results were suppressed by the grace window.
        if (Object.keys(statusMap).length === 0) {
          return;
        }

        setSystems(prev => {
          const updated = prev.map(s => statusMap[s._id] ? { ...s, status: statusMap[s._id] } : s);
          setStats({
            total_systems: updated.length,
            connected:     updated.filter(s => s.status === 'connected').length,
            disconnected:  updated.filter(s => s.status === 'disconnected').length,
            error:         updated.filter(s => s.status === 'error').length,
            pending:       updated.filter(s => s.status === 'pending').length,
          });
          return updated;
        });
      }
    });

    return () => {
      healthCheckService.registerSystemsGetter(null);
      unsub();
    };
  }, []); // empty deps — reads systems via ref

  // ── UNCHANGED base, with FIX 3 applied:
  //    After fetching the systems list from the API, override the DB-fetched
  //    status for any system that was manually tested within the grace window.
  //    This prevents fetchData() (triggered by filter changes, form submits,
  //    deletes, etc.) from reading a stale DB status that was written by a
  //    subsequent auto health-check and reverting the manual test result. ──
  async function fetchData() {
    setLoading(true); setError(null);
    try {
      const [sd, td]: [SystemsResponse, TypesResponse | TypeOption[]] = await Promise.all([
        api.targetSystems.list(filters),
        api.targetSystems.getTypes().catch(() => []),
      ]);
      let list: System[] = Array.isArray(sd) ? sd : sd.systems || [];
      if (integrationId) list = list.filter(s => s.integration_id === integrationId);

      // ── FIX 3: preserve manual test results over DB-fetched status ──
      // fetchData() reads from MongoDB which may have been overwritten by an
      // auto health-check that ran after the manual test. If a system was
      // manually tested within the grace window, keep that status instead.
      const now = Date.now();
      const FETCH_GRACE_MS = 15_000;
      list = list.map(s => {
        const manual = manuallyTestedRef.current.get(s._id);
        if (manual && now - manual.timestamp < FETCH_GRACE_MS) {
          return { ...s, status: manual.status };
        }
        return s;
      });
      // ────────────────────────────────────────────────────────────────

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

  // ── CHANGED: handleRefresh — SMART RETRY with consecutive-failure bail-out.
  //
  //    The two scenarios we need to handle:
  //
  //    1. PF IS OFF (Docker stopped, connection refused):
  //       → Backend gets ECONNREFUSED, returns a clean JSON failure fast (~1s).
  //       → We get the same clean failure on EVERY retry — it never changes.
  //       → BAIL OUT after 3 consecutive identical clean failures (~3-6s total).
  //       → User sees "Disconnected" in ~3-6s. Fast. ✓
  //
  //    2. PF IS STARTING (Docker just started the container):
  //       → Backend times out OR throws a network exception for ~20-40s.
  //       → OR it returns a clean JSON failure initially, then flips to connected
  //         once PF finishes booting.
  //       → We retry up to STARTUP_RETRY_ATTEMPTS times with STARTUP_RETRY_DELAY_MS.
  //       → Card stays in "Testing…" the whole time.
  //       → User sees "Connected" once PF is ready. ✓
  //
  //    BAIL-OUT RULE:
  //    If testConnection() RESOLVES with a clean JSON failure 3 times in a row
  //    with no change in the response, we treat it as definitively down and stop.
  //    This distinguishes "truly off" (~3 fast identical failures) from "starting
  //    up" (failures that eventually flip to connected after some retries).
  //
  //    If testConnection() REJECTS (network exception / timeout), we always retry
  //    since exceptions mean the system is unreachable but possibly just booting.
  // ──────────────────────────────────────────────────────────────────────────
  // async function handleRefresh() {
  //   // Step 1: fetch the latest system list from DB (uses the normal loading spinner).
  //   await fetchData();

  //   // Step 2: grab the freshly loaded systems via the stable ref and fire
  //   // testConnection for every one simultaneously.
  //   // const currentSystems = systemsRef.current;
  //   // if (currentSystems.length === 0) return;

  //   // Mark ALL systems as refresh-testing so their badges switch to "Testing…"
  //   // setRefreshTestingIds(new Set(currentSystems.map(s => s._id)));

  //   // ── Per-request timeout: 12s cap per attempt.
  //   //    Keeps individual attempts from hanging while still being generous enough
  //   //    for slow backends. ──
  //   const TIMEOUT_MS = 12_000;

  //   async function testConnectionWithTimeout(id: string): Promise<TestResult> {
  //     return new Promise<TestResult>((resolve, reject) => {
  //       const timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
  //       api.targetSystems.testConnection(id)
  //         .then(r => { clearTimeout(timer); resolve(r); })
  //         .catch(e => { clearTimeout(timer); reject(e); });
  //     });
  //   }

  //   // ── STARTUP RETRY CONFIG ──
  //   // Total retry window: 8 retries × 5s delay = 40s.
  //   // Covers PingFederate cold-starts which typically take 20-40s.
  //   const STARTUP_RETRY_ATTEMPTS  = 8;
  //   const STARTUP_RETRY_DELAY_MS  = 5_000;

  //   // ── BAIL-OUT CONFIG ──
  //   // If we get this many consecutive clean JSON failures with no change,
  //   // we treat the instance as definitively off and stop retrying immediately.
  //   // 3 consecutive clean failures × ~1s each = ~3s to declare "Disconnected"
  //   // when PF is truly stopped. This is the key to fast results when PF is off.
  //   const CONSECUTIVE_FAIL_BAIL = 3;

  //   function sleep(ms: number) {
  //     return new Promise<void>(resolve => setTimeout(resolve, ms));
  //   }

  //   // Returns true if the API responded with a JSON failure.
  //   // Clean failures mean the backend reached the target but it reported down.
  //   function isCleanFailureResult(r: TestResult): boolean {
  //     const msg = r.message || r.detail || '';
  //     return (
  //       r.success === false ||
  //       r.connected === false ||
  //       r.status === 'error' ||
  //       r.status === 'failed' ||
  //       /fail|error|unable|cannot|unreachable|connection failed/i.test(msg)
  //     );
  //   }

  //   // Fire all tests in parallel; handle each result as it arrives so a slow
  //   // system doesn't block a fast one from updating.
  //   await Promise.allSettled(
  //     currentSystems.map(async (sys) => {
  //       let finalStatus: string = 'disconnected';
  //       let consecutiveCleanFailures = 0;

  //       for (let attempt = 0; attempt <= STARTUP_RETRY_ATTEMPTS; attempt++) {
  //         // On retries (attempt > 0), wait before trying again so the instance
  //         // has more time to finish starting up.
  //         if (attempt > 0) {
  //           await sleep(STARTUP_RETRY_DELAY_MS);
  //         }

  //         try {
  //           const r: TestResult = await testConnectionWithTimeout(sys._id);

  //           if (!isCleanFailureResult(r)) {
  //             // ✅ Connected — done immediately, no more retries needed.
  //             finalStatus = 'connected';
  //             break;
  //           } else {
  //             // Clean JSON failure — instance responded but said it's down.
  //             finalStatus = 'disconnected';
  //             consecutiveCleanFailures++;

  //             // ── BAIL-OUT: if we've seen CONSECUTIVE_FAIL_BAIL clean failures
  //             //    in a row, the instance is definitively off. Stop retrying now
  //             //    so the user gets fast feedback instead of waiting 40s. ──
  //             if (consecutiveCleanFailures >= CONSECUTIVE_FAIL_BAIL) {
  //               break;
  //             }
  //             // Otherwise continue retrying — it may still be booting up and
  //             // returning a clean failure before it's actually ready.
  //           }
  //         } catch {
  //           // Network exception or timeout — instance is unreachable, possibly
  //           // still booting. Reset consecutive clean failure counter and keep
  //           // retrying since exceptions don't mean "definitively off".
  //           finalStatus = 'error';
  //           consecutiveCleanFailures = 0;
  //         }
  //       }

  //       // Record in grace-window map so the auto health-check subscriber won't
  //       // overwrite these fresh results during the next scheduled cycle.
  //       manuallyTestedRef.current.set(sys._id, { status: finalStatus, timestamp: Date.now() });

  //       // Apply this system's result immediately — don't wait for the others.
  //       setSystems(prev => {
  //         const updated = prev.map(s => s._id === sys._id ? { ...s, status: finalStatus } : s);
  //         setStats({
  //           total_systems: updated.length,
  //           connected:     updated.filter(s => s.status === 'connected').length,
  //           disconnected:  updated.filter(s => s.status === 'disconnected').length,
  //           error:         updated.filter(s => s.status === 'error').length,
  //           pending:       updated.filter(s => s.status === 'pending').length,
  //         });
  //         return updated;
  //       });

  //       // Clear this system's "Testing…" badge as soon as its final result is in.
  //       setRefreshTestingIds(prev => {
  //         const next = new Set(prev);
  //         next.delete(sys._id);
  //         return next;
  //       });
  //     })
  //   );
  // }

  async function handleRefresh(){
    await fetchData();
  }

  // ── UNCHANGED ──
  async function handleCreate(data: any): Promise<any> {
    try {
      const created = await api.targetSystems.create(data);
      fetchData();
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

  // ── UNCHANGED ──
  async function handleUpdate(id: string, data: any): Promise<any> {
    try {
      const updated = await api.targetSystems.update(id, data);
      fetchData();
      return updated ?? { _id: id, id };
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || 'Failed to update');
      throw e;
    }
  }

  // ── UNCHANGED ──
  const openDelete  = useCallback((s: System) => { setDelTarget(s); setDelModal(true); }, []);
  const closeDelete = useCallback(() => { setDelModal(false); setDelTarget(null); setDelText(''); }, []);

  // ── UNCHANGED ──
  const confirmDelete = useCallback(async () => {
    if (!delTarget) return;
    try {
      await api.targetSystems.delete(delTarget._id);
      toast.success('Target system deleted successfully. Associated agents have been removed.');
      closeDelete(); fetchData();
    } catch (e: any) { toast.error(e?.response?.data?.detail || e?.message || 'Failed to delete'); }
  }, [delTarget]);

  // ── CHANGED: testConn — corrected bail-out logic for the PF startup race condition.
  //
  //    ROOT CAUSE of the original bug:
  //    When PF has JUST started in Docker, its HTTP port is open immediately but
  //    PF itself is still initializing. During this window (~10-30s), the backend
  //    CAN reach PF's port and gets a response — but it's a failure response
  //    (PF not ready yet). The backend returns this as a clean JSON failure fast
  //    (< 2s), so the previous "fast bail-out" logic treated it as "definitively
  //    off" and stopped retrying. Result: user sees "Disconnected" even though PF
  //    was about to be ready in a few more seconds.
  //
  //    THE CORRECT MENTAL MODEL:
  //    ┌─────────────────────────────────────────────────────────────────────┐
  //    │ Clean JSON failure (resolve) = PF port is OPEN, PF is responding.  │
  //    │   → PF IS running. It may just need more time to fully initialize. │
  //    │   → NEVER bail out on clean JSON failures. Always keep retrying.   │
  //    │                                                                     │
  //    │ Network exception / timeout (reject) = PF port is CLOSED or        │
  //    │   unreachable. Backend couldn't reach PF at all.                   │
  //    │   → PF is definitively OFF (or Docker is stopped).                 │
  //    │   → Bail out after NETWORK_FAIL_BAIL consecutive exceptions.       │
  //    └─────────────────────────────────────────────────────────────────────┘
  //
  //    NEW BAIL-OUT RULE — only bail on consecutive NETWORK EXCEPTIONS:
  //    - Clean JSON failure → keep retrying (PF is up but initializing). No bail.
  //    - Network exception  → count toward bail. After NETWORK_FAIL_BAIL (3)
  //      consecutive exceptions, PF is definitively off. Bail out fast.
  //    - Clean failure resets exception counter (PF came back / port is open).
  //
  //    RESULT:
  //    • PF just started: gets clean JSON failures during init → keeps retrying
  //      → eventually gets connected response → shows "Connected". ✓
  //    • PF truly off: port closed → gets network exceptions every time → bails
  //      after 3 → fast "Error" in ~3 × retry_delay seconds. ✓
  //    • Multiple cards: uses testingIds (Set) so each card tests independently. ✓
  // ──────────────────────────────────────────────────────────────────────────
  async function testConn(id: string) {
    // ── Add this id to the Set so this card shows "Testing…" independently ──
    setTestingIds(prev => new Set(prev).add(id));

    // ── Per-attempt timeout: 12s cap so individual calls don't hang forever. ──
    const TIMEOUT_MS = 12_000;

    // ── Startup retry config — covers PF cold-starts (~20-40s). ──
    // Total window: 8 retries × 5s delay = 40s maximum wait.
    const STARTUP_RETRY_ATTEMPTS = 8;
    const STARTUP_RETRY_DELAY_MS = 5_000;

    // ── CORRECTED bail-out: only bail on consecutive NETWORK EXCEPTIONS.
    //    Clean JSON failures mean PF IS reachable — never bail on those.
    //    Network exceptions mean PF port is closed — bail after this many. ──
    const NETWORK_FAIL_BAIL = 3;

    function sleep(ms: number) {
      return new Promise<void>(resolve => setTimeout(resolve, ms));
    }

    async function testConnectionWithTimeout(): Promise<TestResult> {
      return new Promise<TestResult>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
        api.targetSystems.testConnection(id)
          .then(r => { clearTimeout(timer); resolve(r); })
          .catch(e => { clearTimeout(timer); reject(e); });
      });
    }

    // Returns true if the API resolved with a success/connected result.
    function isSuccessResult(r: TestResult): boolean {
      const msg = r.message || r.detail || '';
      return !(
        r.success === false ||
        r.connected === false ||
        r.status === 'error' ||
        r.status === 'failed' ||
        /fail|error|unable|cannot|unreachable|connection failed/i.test(msg)
      );
    }

    let finalStatus: string = 'disconnected';
    let lastResult: TestResult | null = null;
    // Only counts consecutive NETWORK exceptions (reject), not clean JSON failures.
    let consecutiveNetworkFailures = 0;

    try {
      for (let attempt = 0; attempt <= STARTUP_RETRY_ATTEMPTS; attempt++) {
        // Wait between retries so PF has time to finish booting.
        if (attempt > 0) {
          await sleep(STARTUP_RETRY_DELAY_MS);
        }

        try {
          const r: TestResult = await testConnectionWithTimeout();
          lastResult = r;

          if (isSuccessResult(r)) {
            // ✅ Connected — stop immediately.
            finalStatus = 'connected';
            break;
          } else {
            // Clean JSON failure — PF's port is OPEN and responding, but PF
            // itself is still initializing or reporting an error state.
            // This means PF IS running — it just needs more time.
            // Reset network failure counter (we DID reach PF) and keep retrying.
            finalStatus = 'disconnected';
            consecutiveNetworkFailures = 0;
            // Do NOT break or bail — keep retrying until PF finishes initializing.
          }
        } catch {
          // Network exception or per-attempt timeout — PF port is CLOSED or
          // completely unreachable. Backend couldn't reach PF at all.
          finalStatus = 'error';
          consecutiveNetworkFailures++;

          // ── BAIL-OUT: only here, on consecutive network exceptions.
          //    3 consecutive exceptions = PF port is definitively closed/off.
          //    Stop retrying to give the user fast feedback. ──
          if (consecutiveNetworkFailures >= NETWORK_FAIL_BAIL) {
            break;
          }
          // Otherwise keep retrying — Docker may still be starting.
          lastResult = null;
        }
      }

      // ── Show toast using the last known result message (if any). ──
      const msg = lastResult ? (lastResult.message || lastResult.detail || '') : '';
      if (finalStatus === 'connected') {
        toast.success(msg || 'Connection successful');
      } else {
        toast.error(msg || 'Connection test failed');
      }

      // FIX: record this manual test result so the bg-check subscriber won't
      // overwrite it with a stale result during the grace window.
      manuallyTestedRef.current.set(id, { status: finalStatus, timestamp: Date.now() });

      setSystems(prev => {
        const updated = prev.map(s => s._id === id ? { ...s, status: finalStatus } : s);
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
      // Outer catch — should not normally be reached since the inner loop
      // catches all exceptions, but kept as a safety net.
      toast.error(e?.response?.data?.detail || e?.message || 'Connection test failed');

      // FIX: record the error result too — same grace-window protection.
      manuallyTestedRef.current.set(id, { status: 'error', timestamp: Date.now() });

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
    } finally {
      // ── Remove only this id from the Set, leaving other in-flight
      //    tests untouched so their cards keep showing "Testing…" ──
      setTestingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  /* ── UNCHANGED filter options ── */
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

  // ── CHANGED: removed showHealthOverlay entirely.
  //    The full-page blur overlay is replaced by per-card "Testing…" badges
  //    via refreshTestingIds, which now covers bg auto health checks too.
  //    Manual Test button uses testingIds independently. ──
  const isPageBusy = delModal || showForm || testingIds.size > 0;

  // ── CHANGED: isCardTesting now checks the Set instead of comparing a single string ──
  const isCardTesting = (id: string) => testingIds.has(id);

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

        /* ══════════════════════════════════════════════════════════════════
           RESPONSIVE LAYOUT SYSTEM
           ─────────────────────────────────────────────────────────────────
           BASELINE  : 1920×1080  — exact current design, no changes
           Large     : 1440–1919px (large laptops, 1440p screens)
           Laptop    : 1024–1439px (MacBook 13/14/15", Windows 13–15")
           Tablet    : 768–1023px  (large tablets in landscape)
           QHD+      : 2560–3839px (ultrawide / QHD monitors)
           4K+       : 3840px+     (4K TVs, ultrawide)
        ══════════════════════════════════════════════════════════════════ */

        /* ── Global safety ── */
        .ts {
          overflow-x: hidden;
          box-sizing: border-box;
        }
        *, *::before, *::after {
          box-sizing: inherit;
        }

        /* ── Z-index scale ── */
        :root {
          --z-base:     1;
          --z-sticky:   10;
          --z-dropdown: 30;
          --z-overlay:  40;
          --z-modal:    50;
          --z-toast:    100;
        }

        /* ── Outer page wrapper — controls max content width & gutters ── */
        .ts-page-wrapper {
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
          padding-left:  clamp(16px, 2.5vw, 32px);
          padding-right: clamp(16px, 2.5vw, 32px);
          width: 100%;
        }

        /* ── Header section ── */
        /* CHANGED: padding-top/bottom now use clamp() to match aad-header-wrapper / ag-header-inner / al-header-inner exactly */
        .ts-header-section {
          padding-top:    clamp(20px, 2.5vw, 40px);
          padding-bottom: clamp(16px, 2vw, 32px);
        }

        /* ── H1 — fluid, matches aad-h1-resp / ag-h1 / al-h1 exactly ── */
        /* CHANGED: was clamp(22px, 1.8vw, 34px); now matches the other pages */
        .ts-h1 {
          font-size: clamp(22px, 2.5vw, 36px);
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.15;
          color: #030712;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        /* ── Header subtitle ── */
        .ts-h1-sub {
          font-size: clamp(11px, 0.75vw, 14px);
          color: #9ca3af;
          margin-top: clamp(3px, 0.3vw, 6px);
          overflow-wrap: break-word;
        }

        /* ── Header action buttons ── */
        .ts-header-btn {
          height: clamp(32px, 2.1vw, 40px);
          padding-left:  clamp(10px, 0.85vw, 16px);
          padding-right: clamp(10px, 0.85vw, 16px);
          font-size: clamp(11px, 0.68vw, 13px);
          white-space: nowrap;
        }

        /* Header inner flex — allow wrap on smaller sizes */
        .ts-header-inner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: clamp(8px, 1vw, 24px);
          flex-wrap: wrap;
        }
        .ts-header-actions {
          display: flex;
          align-items: center;
          gap: clamp(6px, 0.6vw, 10px);
          flex-wrap: nowrap;
          flex-shrink: 0;
        }

        /* ── Stat cards row ── */
        .ts-stats-section {
          padding-bottom: clamp(12px, 1.2vw, 24px);
        }
        .ts-stats-row {
          display: flex;
          gap: clamp(8px, 0.85vw, 16px);
        }
        .ts-stats-row > * {
          flex: 1 1 0;
          min-width: 0;
        }

        /* ── Stat card internals ── */
        .stat-card {
          padding: clamp(10px, 1vw, 20px) clamp(12px, 1.2vw, 20px);
          border-radius: clamp(12px, 1vw, 16px);
        }
        .ts-stat-value {
          font-size: clamp(24px, 2.2vw, 42px) !important;
          line-height: 1;
        }
        .stat-card .text-\[11px\] {
          font-size: clamp(9px, 0.6vw, 11px);
        }

        /* ── Filter bar ── */
        .ts-filter-section {
          padding-top:    clamp(5px, 0.5vw, 10px);
          padding-bottom: clamp(5px, 0.5vw, 10px);
        }
        .ts-filter-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: clamp(6px, 0.8vw, 16px);
          flex-wrap: nowrap;
          // overflow-x: auto;
          scrollbar-width: none;
        }
        .ts-filter-inner::-webkit-scrollbar { display: none; }

        .ts-filter-btn {
          height: clamp(32px, 2vw, 40px) !important;
          font-size: clamp(11px, 0.68vw, 13px) !important;
          padding-left:  clamp(8px, 0.85vw, 16px) !important;
          padding-right: clamp(8px, 0.85vw, 16px) !important;
          white-space: nowrap;
        }
        .ts-count-label {
          font-size: clamp(11px, 0.68vw, 13px);
          white-space: nowrap;
        }

        /* ── Card grid ── */
        .ts-grid-section {
          padding-top:    clamp(12px, 1.2vw, 28px);
          padding-bottom: clamp(32px, 4vw, 80px);
        }
        .ts-card-grid {
          display: grid;
          gap: clamp(10px, 1vw, 20px);
          grid-template-columns: repeat(auto-fill, minmax(clamp(240px, 18vw, 340px), 1fr));
        }

        /* ── System card internals ── */
        .sys-card {
          border-radius: clamp(10px, 0.85vw, 16px);
          min-width: 0;
        }
        .ts-card-body {
          padding: clamp(12px, 1.2vw, 24px);
        }
        .ts-card-name {
          font-size: clamp(12px, 0.85vw, 16px);
          min-width: 0;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        .ts-card-type {
          font-size: clamp(10px, 0.68vw, 13px);
        }
        .ts-card-detail-label {
          font-size: clamp(10px, 0.68vw, 13px);
          width: clamp(68px, 5vw, 96px);
          flex-shrink: 0;
        }
        .ts-card-detail-value {
          font-size: clamp(10px, 0.68vw, 13px);
          min-width: 0;
          overflow-wrap: break-word;
          word-break: break-all;
        }
        .ts-card-actions {
          padding-top: clamp(8px, 0.85vw, 20px);
          margin-top:  clamp(8px, 0.85vw, 24px);
        }
        .ts-card-action-btn {
          height: clamp(28px, 1.9vw, 36px);
          font-size: clamp(10px, 0.63vw, 12px);
          border-radius: clamp(6px, 0.5vw, 10px);
        }
        .ts-card-trash-btn {
          width:  clamp(28px, 1.9vw, 36px);
          height: clamp(28px, 1.9vw, 36px);
          border-radius: clamp(6px, 0.5vw, 10px);
          flex-shrink: 0;
        }
        .ts-status-badge {
          font-size: clamp(10px, 0.63vw, 12px) !important;
          padding: clamp(2px, 0.15vw, 4px) clamp(6px, 0.6vw, 12px) !important;
          white-space: nowrap;
        }

        /* ══════════════════════════════════════════════════════════════════
           BREAKPOINT OVERRIDES — structural shifts only
        ══════════════════════════════════════════════════════════════════ */

        /* ── Tablet: 768–1023px ── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .ts-page-wrapper {
            max-width: 100%;
            padding-left: 16px;
            padding-right: 16px;
          }

          /* CHANGED: matches aad-header-wrapper / ag-header-inner / al-header-inner tablet values */
          .ts-header-section {
            padding-top: 16px;
            padding-bottom: 14px;
          }
          /* CHANGED: matches aad-h1-resp / ag-h1 / al-h1 tablet value */
          .ts-h1 { font-size: 1.625rem !important; }

          /* Stats: 2-column grid at tablet */
          .ts-stats-row {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .ts-stats-row > * {
            flex: none;
            min-width: 0;
          }

          /* Card grid: 2 columns at tablet */
          .ts-card-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          /* Header buttons wrap on tablet */
          .ts-header-actions {
            flex-wrap: wrap;
            gap: 6px;
          }

          /* Touch targets — min 44px */
          .ts-header-btn,
          .ts-filter-btn,
          .ts-card-action-btn {
            min-height: 44px !important;
          }
          .ts-card-trash-btn {
            min-width: 44px !important;
            min-height: 44px !important;
          }

          /* Delete modal: full width on tablet */
          .modal-box {
            width: calc(100vw - 32px);
            max-width: 100%;
            max-height: 90vh;
            overflow-y: auto;
          }

          /* Filter bar: allow wrapping on tablet */
          .ts-filter-inner {
            flex-wrap: wrap;
            gap: 8px;
            overflow-x: visible;
          }

          /* Live health indicator: allow shrink */
          .ts-filter-inner > div:last-child {
            flex-shrink: 1;
          }
        }

        /* ── Small laptop: 1024–1279px ── */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .ts-page-wrapper {
            max-width: 100%;
            padding-left: 24px;
            padding-right: 24px;
          }

          /* CHANGED: matches aad-header-wrapper / ag-header-inner / al-header-inner small-laptop values */
          .ts-header-section {
            padding-top: 24px;
            padding-bottom: 20px;
          }
          /* CHANGED: matches aad-h1-resp / ag-h1 / al-h1 small-laptop value */
          .ts-h1 { font-size: 1.875rem !important; }

          /* Stat cards: keep in single row, allow natural compression */
          .ts-stats-row {
            flex-wrap: nowrap;
            overflow-x: auto;
            scrollbar-width: none;
          }
          .ts-stats-row::-webkit-scrollbar { display: none; }
          .ts-stats-row > * {
            min-width: 110px;
          }
        }

        /* ── Medium laptop: 1280–1439px ── */
        @media (min-width: 1280px) and (max-width: 1439px) {
          .ts-page-wrapper {
            max-width: 1100px;
            padding-left: 28px;
            padding-right: 28px;
          }

          /* CHANGED: matches aad-header-wrapper / ag-header-inner / al-header-inner medium-laptop values */
          .ts-header-section {
            padding-top: 28px;
            padding-bottom: 22px;
          }
          /* CHANGED: matches aad-h1-resp / ag-h1 / al-h1 medium-laptop value */
          .ts-h1 { font-size: 2rem !important; }
        }

        /* ── Large laptop / 1440p: 1440–1919px ── */
        @media (min-width: 1440px) and (max-width: 1919px) {
          .ts-page-wrapper {
            max-width: 1280px;
            padding-left: 36px;
            padding-right: 36px;
          }

          /* CHANGED: matches aad-header-wrapper / ag-header-inner / al-header-inner large-laptop values */
          .ts-header-section {
            padding-top: 36px;
            padding-bottom: 28px;
          }
          /* CHANGED: matches aad-h1-resp / ag-h1 / al-h1 large-laptop value */
          .ts-h1 { font-size: 2rem !important; }
        }

        /* ── 1920px BASELINE — explicit lock ── */
        @media (min-width: 1920px) and (max-width: 2559px) {
          .ts-page-wrapper    { max-width: 1280px; padding-left: 32px; padding-right: 32px; }
          /* CHANGED: matches aad-header-wrapper / ag-header-inner / al-header-inner 1920px values */
          .ts-header-section  { padding-top: 40px; padding-bottom: 32px; }
          /* CHANGED: matches aad-h1-resp / ag-h1 / al-h1 1920px value */
          .ts-h1              { font-size: 2.25rem !important; }
          .ts-h1-sub          { font-size: 14px; }
          .ts-header-btn      { height: 40px; font-size: 13px; padding-left: 16px; padding-right: 16px; }
          .ts-stat-value      { font-size: 42px !important; }
          .ts-filter-btn      { height: 40px !important; font-size: 13px !important; }
          .ts-card-grid       { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
          .ts-card-body       { padding: 24px; }
          .ts-card-name       { font-size: 16px; }
          .ts-card-type       { font-size: 13px; }
          .ts-card-detail-label { font-size: 13px; width: 96px; }
          .ts-card-detail-value { font-size: 13px; }
          .ts-card-action-btn { height: 36px; font-size: 12px; }
          .ts-card-trash-btn  { width: 36px; height: 36px; }
          .ts-status-badge    { font-size: 12px !important; }
        }

        /* ── QHD: 2560–3839px ── */
        @media (min-width: 2560px) and (max-width: 3839px) {
          .ts-page-wrapper {
            max-width: 1600px;
            padding-left: 48px;
            padding-right: 48px;
          }
          /* CHANGED: matches aad-header-wrapper / ag-header-inner / al-header-inner QHD values */
          .ts-header-section  { padding-top: 52px; padding-bottom: 40px; }
          /* CHANGED: matches aad-h1-resp / ag-h1 / al-h1 QHD value */
          .ts-h1              { font-size: clamp(34px, 2.2vw, 48px) !important; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
          .ts-stat-value      { font-size: clamp(42px, 3vw, 60px) !important; }
          .ts-stats-row       { gap: 20px; }
          .ts-card-grid       { grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 24px; }
          .ts-card-body       { padding: 28px; }
          .ts-card-name       { font-size: 18px; }
          .ts-card-type       { font-size: 14px; }
          .ts-card-detail-label { font-size: 14px; width: 108px; }
          .ts-card-detail-value { font-size: 14px; }
          .ts-card-action-btn { height: 40px; font-size: 13px; }
          .ts-card-trash-btn  { width: 40px; height: 40px; }
          .stat-card          { border-radius: 20px; padding: 24px; }
          .sys-card           { border-radius: 20px; }
          .ts-header-btn      { height: 44px; font-size: 14px; padding-left: 20px; padding-right: 20px; }
          .ts-filter-btn      { height: 44px !important; font-size: 14px !important; }
          .ts-status-badge    { font-size: 13px !important; }
          .modal-box          { max-width: 560px; max-height: 90vh; overflow-y: auto; }
        }

        /* ── 4K+: 3840px+ ── */
        @media (min-width: 3840px) {
          .ts-page-wrapper {
            max-width: 2200px;
            padding-left: 64px;
            padding-right: 64px;
          }
          /* CHANGED: matches aad-header-wrapper / ag-header-inner / al-header-inner 4K values */
          .ts-header-section  { padding-top: 64px; padding-bottom: 48px; }
          /* CHANGED: matches aad-h1-resp / ag-h1 / al-h1 4K value */
          .ts-h1              { font-size: 3.5rem !important; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
          .ts-h1-sub          { font-size: 22px; }
          .ts-stat-value      { font-size: 72px !important; }
          .ts-stats-row       { gap: 28px; }
          .ts-card-grid       { grid-template-columns: repeat(auto-fill, minmax(520px, 1fr)); gap: 32px; }
          .ts-card-body       { padding: 40px; }
          .ts-card-name       { font-size: 24px; }
          .ts-card-type       { font-size: 18px; }
          .ts-card-detail-label { font-size: 18px; width: 140px; }
          .ts-card-detail-value { font-size: 18px; }
          .ts-card-action-btn { height: 52px; font-size: 16px; border-radius: 14px; }
          .ts-card-trash-btn  { width: 52px; height: 52px; border-radius: 14px; }
          .stat-card          { border-radius: 24px; padding: 32px; }
          .sys-card           { border-radius: 24px; }
          .ts-header-btn      { height: 56px; font-size: 18px; padding-left: 28px; padding-right: 28px; }
          .ts-filter-btn      { height: 52px !important; font-size: 18px !important; }
          .ts-filter-section  { padding-top: 12px; padding-bottom: 12px; }
          .ts-status-badge    { font-size: 16px !important; padding: 6px 18px !important; }
          .modal-box          { max-width: 800px; max-height: 90vh; overflow-y: auto; }
          .hc-card            { border-radius: 28px; padding: 40px 56px; min-width: 360px; }
          .hc-ring            { width: 64px; height: 64px; border-width: 4px; }
          .hc-label           { font-size: 20px; }
          .hc-sub             { font-size: 16px; }
        }
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
        <div className="ts-header-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div className="ts-page-wrapper">
            <div className="ts-header-inner flex items-start justify-between gap-6">
              <div>
                <h1 className="ts-h1 font-bold leading-tight tracking-tight text-[#0A0A0A]">
                  {integrationName ? `${integrationName} Systems` : 'Target Systems'}
                </h1>
                <p className="text-[15px] text-gray-500 font-normal max-w-[480px] leading-relaxed m-0">
                  {integrationName
                    ? `Manage target systems for ${integrationName}`
                    : 'Manage your connected systems and integrations'}
                </p>
              </div>
              <div className="ts-header-actions flex items-center gap-2.5 pt-1 shrink-0">
                <button onClick={handleRefresh} disabled={loading}
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
              <div className="flex items-center gap-3 shrink-0">
                {systems.length > 0 && (
                  <LiveHealthIndicator
                    countdown={hcState.countdown}
                    isChecking={hcState.isRunning}
                    lastChecked={hcState.lastChecked}
                    systemCount={systems.length}
                    intervalMinutes={hcState.intervalMinutes}
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
                  const isManualTesting = isCardTesting(sys._id);
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

                          {/* Test — disabled only while THIS card is being tested */}
                          <button
                            onClick={() => testConn(sys._id)}
                            disabled={isManualTesting}
                            className="ts-card-action-btn flex-1 inline-flex items-center justify-center gap-1.5 bg-[#0f0f0f] hover:bg-[#2a2a2a] font-semibold text-white transition-colors disabled:opacity-50"
                          >
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