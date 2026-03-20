import React, { useState, useEffect, useRef } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaDownload, FaSync, FaChevronDown, FaCopy, FaTimes, FaUser, FaTag, FaInfoCircle, FaIdBadge } from 'react-icons/fa';
import api from '../../utils/api';
import { auth } from '../../utils/auth';

interface AuditLog {
  id?: string;
  timestamp: string;
  user_email: string;
  user_id?: string;
  event_type?: string;
  action?: string;
  status?: string;
  severity?: string;
  details?: any;
  description?: string;
  session_id?: string;
  agent_id?: string;
  agent_type?: string;
  resource_type?: string;
  resource_id?: string;
  target_id?: string;
  target_type?: string;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  [key: string]: any;
}

interface Stats {
  total_events: number;
  total_success?: number;
  total_failed?: number;
  total_warnings?: number;
  events_by_severity?: {
    success?: number;
    error?: number;
    warning?: number;
    info?: number;
  };
}

interface Filters {
  event_type: string;
  severity: string;
  user_email: string;
  limit: number;
  skip: number;
  start_date?: string;
  end_date?: string;
}

interface ApiFilters {
  event_type?: string;
  severity?: string;
  user_email?: string;
  limit: number;
  skip: number;
  sort_order: string;
  start_date?: string;  // ✅ Fixed: was date_from
  end_date?: string;    // ✅ Fixed: was date_to
}

type SortOrder = 'ascending' | 'descending';
type ExportScope = 'current' | 'all';

// ─────────────────────────────────────────────────────────────────────────────
// Shared CustomSelect
// ─────────────────────────────────────────────────────────────────────────────

interface SelectOption { value: string; label: string; }

interface CustomSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  minWidth?: number;
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label, value, options, onChange, minWidth = 150, placeholder,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected  = options.find(o => o.value === value);
  const isActive  = value !== '' && value !== options[0]?.value;
  const labelText = selected?.label ?? placeholder ?? options[0]?.label ?? '';

  return (
    <div className="flex flex-col gap-1 relative" ref={ref}>
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">{label}</span>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ minWidth }}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-[13px] bg-white transition-all focus:outline-none focus:ring-1 focus:ring-gray-300 ${
          isActive
            ? 'border-[#111] text-[#0A0A0A] font-semibold'
            : 'border-gray-200 text-[#0A0A0A] font-normal'
        }`}
      >
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#111] flex-shrink-0" />}
        <span className="flex-1 text-left truncate">{labelText}</span>
        <FaChevronDown
          className={`text-gray-400 text-[10px] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1"
          style={{ minWidth: Math.max(minWidth, 160), maxHeight: 260, overflowY: 'auto', overflowX: 'hidden' }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center gap-2.5 ${
                value === opt.value
                  ? 'bg-gray-50 text-[#0A0A0A] font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 font-normal'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${value === opt.value ? 'bg-[#111]' : 'bg-transparent'}`} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Time preset options
// ─────────────────────────────────────────────────────────────────────────────

type TimePreset = 'all' | 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

const TIME_OPTIONS: SelectOption[] = [
  { value: 'all',       label: 'All Time'      },
  { value: 'today',     label: 'Today'         },
  { value: 'yesterday', label: 'Yesterday'     },
  { value: '7d',        label: 'Last 7 Days'   },
  { value: '30d',       label: 'Last 30 Days'  },
  { value: '90d',       label: 'Last 90 Days'  },
  { value: 'custom',    label: 'Custom Range…' },
];

// ✅ Fixed: returns start_date / end_date (not date_from / date_to)
const getDateRange = (preset: TimePreset): { start_date?: string; end_date?: string } => {
  const now = new Date();
  const toISO    = (d: Date) => d.toISOString();
  const startOf  = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0);       return x; };
  const endOf    = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999);   return x; };
  const daysAgo  = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

  switch (preset) {
    case 'today':     return { start_date: toISO(startOf(now)),        end_date: toISO(endOf(now))         };
    case 'yesterday': return { start_date: toISO(startOf(daysAgo(1))), end_date: toISO(endOf(daysAgo(1)))  };
    case '7d':        return { start_date: toISO(startOf(daysAgo(7))), end_date: toISO(endOf(now))         };
    case '30d':       return { start_date: toISO(startOf(daysAgo(30))),end_date: toISO(endOf(now))         };
    case '90d':       return { start_date: toISO(startOf(daysAgo(90))),end_date: toISO(endOf(now))         };
    default:          return {};
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Time Range Picker
// ─────────────────────────────────────────────────────────────────────────────

interface TimeRangePickerProps {
  preset: TimePreset;
  customFrom: string;
  customTo: string;
  onPresetChange: (p: TimePreset) => void;
  onCustomChange: (from: string, to: string) => void;
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  preset, customFrom, customTo, onPresetChange, onCustomChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive      = preset !== 'all';
  const selectedLabel = TIME_OPTIONS.find(o => o.value === preset)?.label ?? 'All Time';

  return (
    <div className="flex flex-col gap-1 relative" ref={ref}>
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">Date Range</span>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ minWidth: 160 }}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-[13px] bg-white transition-all focus:outline-none focus:ring-1 focus:ring-gray-300 ${
          isActive ? 'border-[#111] text-[#0A0A0A] font-semibold' : 'border-gray-200 text-[#0A0A0A] font-normal'
        }`}
      >
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#111] flex-shrink-0" />}
        <span className="flex-1 text-left">{selectedLabel}</span>
        <FaChevronDown className={`text-gray-400 text-[10px] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          style={{ minWidth: 200 }}>
          <div className="py-1">
            {TIME_OPTIONS.filter(o => o.value !== 'custom').map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onPresetChange(opt.value as TimePreset); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center gap-2.5 ${
                  preset === opt.value
                    ? 'bg-gray-50 text-[#0A0A0A] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 font-normal'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${preset === opt.value ? 'bg-[#111]' : 'bg-transparent'}`} />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100">
            <button
              type="button"
              onClick={() => onPresetChange('custom')}
              className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center gap-2.5 ${
                preset === 'custom' ? 'bg-gray-50 text-[#0A0A0A] font-semibold' : 'text-gray-600 hover:bg-gray-50 font-normal'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${preset === 'custom' ? 'bg-[#111]' : 'bg-transparent'}`} />
              Custom Range…
            </button>

            {preset === 'custom' && (
              <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-[0.05em]">From</span>
                  <input type="datetime-local" value={customFrom}
                    onChange={e => onCustomChange(e.target.value, customTo)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-[0.05em]">To</span>
                  <input type="datetime-local" value={customTo}
                    onChange={e => onCustomChange(customFrom, e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50" />
                </div>
                <button type="button" onClick={() => setOpen(false)}
                  className="mt-1 px-3 py-1.5 bg-[#111] text-white rounded-lg text-[12px] font-medium hover:bg-[#333] transition-colors">
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const AuditLogs: React.FC = () => {
  const [logs,         setLogs]         = useState<AuditLog[]>([]);
  const [totalLogs,    setTotalLogs]    = useState<number>(0);
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [loading,      setLoading]      = useState<boolean>(false);
  const [error,        setError]        = useState<string | null>(null);
  const [eventTypeOptions, setEventTypeOptions] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    event_type: '', severity: '', user_email: '', limit: 50, skip: 0,
  });

  const [timePreset,  setTimePreset]  = useState<TimePreset>('all');
  const [customFrom,  setCustomFrom]  = useState<string>('');
  const [customTo,    setCustomTo]    = useState<string>('');
  const [sortOrder,   setSortOrder]   = useState<SortOrder>('descending');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [selectedLog,     setSelectedLog]     = useState<AuditLog | null>(null);
  const [copied,          setCopied]          = useState<boolean>(false);
  const [exportScope,     setExportScope]     = useState<ExportScope>('current');
  const [hasAuditReadPermission, setHasAuditReadPermission] = useState<boolean>(false);
  const [userEmail,    setUserEmail]   = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // ✅ Fixed: returns start_date / end_date to match backend AuditLogQuery model
  const getActiveDateRange = (): { start_date?: string; end_date?: string } => {
    if (timePreset === 'custom') {
      return {
        start_date: customFrom ? new Date(customFrom).toISOString() : undefined,
        end_date:   customTo   ? new Date(customTo).toISOString()   : undefined,
      };
    }
    return getDateRange(timePreset);
  };

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setUserEmail(currentUser.email || '');
      const userRolesStr = localStorage.getItem('userRoles');
      const userRoles: string[] = userRolesStr ? JSON.parse(userRolesStr) : [];
      const hasPermission = userRoles.some(role =>
        role.toLowerCase().includes('read:audit_logs') || role.toLowerCase() === 'admin'
      );
      setHasAuditReadPermission(hasPermission);
      if (!hasPermission && currentUser.email)
        setFilters(prev => ({ ...prev, user_email: currentUser.email }));
    } else {
      setHasAuditReadPermission(false);
    }
    setIsInitialized(true);
    fetchEventTypes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.event_type, filters.severity, filters.user_email, filters.limit, sortOrder, timePreset, customFrom, customTo]);

  useEffect(() => {
    if (!isInitialized) return;
    fetchData();
  }, [isInitialized, currentPage, sortOrder, filters.event_type, filters.severity, filters.user_email, filters.limit, timePreset, customFrom, customTo]);

  const fetchData = async (): Promise<void> => {
    setLoading(true); setError(null);
    try {
      // ✅ Fixed: dateRange now contains start_date / end_date
      const dateRange = getActiveDateRange();
      const apiFilters: ApiFilters = {
        limit: filters.limit,
        skip: (currentPage - 1) * filters.limit,
        sort_order: sortOrder,
        ...dateRange, // spreads start_date and end_date correctly
      };
      if (filters.event_type) apiFilters.event_type = filters.event_type;
      if (filters.severity)   apiFilters.severity   = filters.severity;
      if (filters.user_email) apiFilters.user_email  = filters.user_email;

      try {
        const logsData = await api.audit.queryLogs(apiFilters);
        if (logsData && typeof logsData === 'object') {
          setTotalLogs(logsData.total_count ?? 0);
          if      (logsData.logs)              setLogs(Array.isArray(logsData.logs) ? logsData.logs : []);
          else if (Array.isArray(logsData))  { setLogs(logsData); setTotalLogs(logsData.length); }
          else                                 setLogs([]);
        }
      } catch { setLogs([]); setTotalLogs(0); setError('Unable to load audit logs'); }

      try {
        const statsData = await api.audit.getStats();
        setStats(statsData);
      } catch {
        setStats({ total_events: 0, total_success: 0, total_failed: 0, total_warnings: 0 });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally { setLoading(false); }
  };

  const fetchEventTypes = async (): Promise<void> => {
    try {
      const types = await api.audit.getEventTypes();
      setEventTypeOptions(types.event_types || types || []);
    } catch { setEventTypeOptions([]); }
  };

  const getTotalPages = (): number => Math.ceil(totalLogs / filters.limit);

  const handleExportClick = (): void => {
    if (getTotalPages() <= 1) handleExport('csv', 'all');
    else { setShowExportModal(true); setExportScope('current'); }
  };

  const handleExport = async (format: string = 'csv', scope: ExportScope = exportScope): Promise<void> => {
    try {
      setLoading(true);
      // ✅ Fixed: dateRange now contains start_date / end_date
      const dateRange = getActiveDateRange();
      const apiFilters: ApiFilters = {
        limit: scope === 'current' ? filters.limit : totalLogs,
        skip:  scope === 'current' ? (currentPage - 1) * filters.limit : 0,
        sort_order: sortOrder,
        ...dateRange, // spreads start_date and end_date correctly
      };
      if (filters.event_type) apiFilters.event_type = filters.event_type;
      if (filters.severity)   apiFilters.severity   = filters.severity;
      if (filters.user_email) apiFilters.user_email  = filters.user_email;
      const blob = await api.audit.exportLogs(format, apiFilters);
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `audit-logs-${scope === 'current' ? `page${currentPage}` : 'all'}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      setShowExportModal(false);
    } catch (err: any) { alert('Failed to export logs: ' + err.message); }
    finally { setLoading(false); }
  };

  const formatValue     = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') { try { return JSON.stringify(value); } catch { return String(value); } }
    return String(value);
  };
  const formatTimestamp = (ts: string): string => { try { return new Date(ts).toLocaleString(); } catch { return String(ts); } };

  const severityBadge = (log: AuditLog) => {
    const val = log.status || log.severity || '';
    const isSuccess = val === 'success' || val === 'info';
    const isError   = val === 'error' || val === 'failed';
    const isWarn    = val === 'warning';
    const cls = isSuccess ? 'bg-green-50 text-green-700 border border-green-100'
              : isError   ? 'bg-red-50 text-red-700 border border-red-100'
              : isWarn    ? 'bg-amber-50 text-amber-700 border border-amber-100'
              : 'bg-gray-100 text-gray-600 border border-gray-200';
    const dot = isSuccess ? 'bg-green-500' : isError ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-gray-400';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {formatValue(val)}
      </span>
    );
  };

  const activeTimeLabel = timePreset !== 'all'
    ? (timePreset === 'custom'
        ? `${customFrom ? customFrom.slice(0, 10) : '?'} → ${customTo ? customTo.slice(0, 10) : '?'}`
        : TIME_OPTIONS.find(o => o.value === timePreset)?.label)
    : null;

  // ── Select option arrays ──
  const eventTypeOpts: SelectOption[] = [
    { value: '', label: 'All Events' },
    ...eventTypeOptions.map(t => ({ value: t, label: t })),
  ];
  const severityOpts: SelectOption[] = [
    { value: '',        label: 'All Levels' },
    { value: 'info',    label: 'Info'       },
    { value: 'warning', label: 'Warning'    },
    { value: 'error',   label: 'Error'      },
  ];
  const perPageOpts: SelectOption[] = [
    { value: '10',  label: '10 / page'  },
    { value: '25',  label: '25 / page'  },
    { value: '50',  label: '50 / page'  },
    { value: '100', label: '100 / page' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        .al-spin { animation: spin 1s linear infinite; }

        /* ═══════════════════════════════════════════════════════
           RESPONSIVE RULES — AuditLogs.tsx
           1920×1080 → exact current design (no changes)
           Laptop (1024–1919px, incl. MacBook 13/14/15") → scales down
           Tablet (768–1023px) → compressed
           4K / ultrawide (2560px+) → expands gently
        ═══════════════════════════════════════════════════════ */

        /* ── Header band padding ── */
        .al-band-px { padding-left: 48px; padding-right: 48px; }

        /* ── Header inner wrapper ── */
        .al-header-inner {
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          padding-top: 40px;
          padding-bottom: 32px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* ── Page content wrapper ── */
        .al-page-wrapper {
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 48px;
          padding-right: 48px;
        }

        /* ── Stats grid ── */
        .al-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        /* ── H1 ── */
        .al-h1 { font-size: 2.25rem; }

        /* Tablet: 768–1023 */
        @media (min-width: 768px) and (max-width: 1023px) {
          .al-band-px      { padding-left: 20px; padding-right: 20px; }
          .al-header-inner { max-width: 100%; padding-top: 20px; padding-bottom: 16px; }
          .al-page-wrapper { max-width: 100%; padding-left: 20px; padding-right: 20px; }
          .al-stats-grid   { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .al-h1           { font-size: 1.75rem !important; }
        }

        /* Small laptop: 1024–1279 (MacBook 13") */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .al-band-px      { padding-left: 28px; padding-right: 28px; }
          .al-header-inner { max-width: 1100px; padding-top: 28px; padding-bottom: 22px; }
          .al-page-wrapper { max-width: 1100px; padding-left: 28px; padding-right: 28px; }
          .al-stats-grid   { gap: 10px; }
          .al-h1           { font-size: 1.875rem !important; }
        }

        /* Laptop: 1280–1439 (MacBook 14/15", typical 1366/1440) */
        @media (min-width: 1280px) and (max-width: 1439px) {
          .al-band-px      { padding-left: 36px; padding-right: 36px; }
          .al-header-inner { max-width: 1280px; padding-top: 32px; padding-bottom: 26px; }
          .al-page-wrapper { max-width: 1280px; padding-left: 36px; padding-right: 36px; }
          .al-h1           { font-size: 2rem !important; }
        }

        /* Large laptop / small desktop: 1440–1919 */
        @media (min-width: 1440px) and (max-width: 1919px) {
          .al-band-px      { padding-left: 44px; padding-right: 44px; }
          .al-header-inner { max-width: 1400px; }
          .al-page-wrapper { max-width: 1400px; padding-left: 44px; padding-right: 44px; }
        }

        /* Exact target: 1920×1080 — unchanged (defaults above already match) */

        /* 4K / ultrawide: 2560px+ */
        @media (min-width: 2560px) {
          .al-band-px      { padding-left: 80px; padding-right: 80px; }
          .al-header-inner { max-width: 1920px; padding-top: 56px; padding-bottom: 44px; }
          .al-page-wrapper { max-width: 1920px; padding-left: 80px; padding-right: 80px; }
          .al-stats-grid   { gap: 16px; }
          .al-h1           { font-size: 3rem !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 al-band-px">
        <div className="al-header-inner">
          <div>
            <h1 className="al-h1 text-4xl font-bold leading-tight tracking-tight text-[#0A0A0A] mb-2 max-md:text-3xl">
              Audit Logs
            </h1>
            <p className="text-[15px] text-gray-500 font-normal leading-relaxed m-0">
              Track all agent activities and system events
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors disabled:opacity-40">
              <FaSync className={loading ? 'al-spin text-xs' : 'text-xs'} />
              Refresh
            </button>
            {/* <button onClick={handleExportClick} disabled={loading || logs.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#111] hover:bg-[#333] text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-40">
              <FaDownload className="text-xs" />
              Export CSV
            </button> */}
          </div>
        </div>
      </div>

      <div className="al-page-wrapper">

        {/* ── Stats strip ── */}
        {stats && (
          <div className="py-5 border-b border-gray-100">
            <div className="al-stats-grid">
              {[
                { icon: FaCheckCircle,        label: 'Successful',  value: stats.events_by_severity?.success ?? 0, bg: '#F0FDF4', color: '#22C55E' },
                { icon: FaExclamationTriangle, label: 'Errors',      value: stats.events_by_severity?.error   ?? 0, bg: '#FEF2F2', color: '#EF4444' },
                { icon: FaExclamationTriangle, label: 'Warnings',    value: stats.events_by_severity?.warning ?? 0, bg: '#FFFBEB', color: '#F59E0B' },
                { icon: FaClock,              label: 'Total Events', value: stats.total_events                ?? 0, bg: '#FAF5FF', color: '#A855F7' },
              ].map((s, i) => {
                const Icon = s.icon as React.ElementType;
                return (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                      <Icon style={{ color: s.color }} size={16} />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-[#0A0A0A]">{s.value.toLocaleString()}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Filters toolbar ── */}
        <div className="py-4 border-b border-gray-100">
          <div className="flex items-end gap-3 flex-wrap">

            {/* Time range */}
            <TimeRangePicker
              preset={timePreset} customFrom={customFrom} customTo={customTo}
              onPresetChange={p => setTimePreset(p)}
              onCustomChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
            />

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200 self-end mb-1" />

            {/* Event type */}
            <CustomSelect
              label="Event Type"
              value={filters.event_type}
              options={eventTypeOpts}
              onChange={v => setFilters({ ...filters, event_type: v })}
              minWidth={180}
            />

            {/* Severity */}
            <CustomSelect
              label="Severity"
              value={filters.severity}
              options={severityOpts}
              onChange={v => setFilters({ ...filters, severity: v })}
              minWidth={150}
            />

            {/* User email */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">User Email</label>
              <input
                type="text"
                value={filters.user_email}
                onChange={e => setFilters({ ...filters, user_email: e.target.value })}
                disabled={!hasAuditReadPermission}
                placeholder="Filter by email..."
                title={!hasAuditReadPermission ? 'You can only view your own logs' : ''}
                className={`px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-gray-300 min-w-[200px] ${
                  !hasAuditReadPermission ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-[#0A0A0A]'
                }`}
              />
            </div>

            {/* Per page */}
            <CustomSelect
              label="Per Page"
              value={String(filters.limit)}
              options={perPageOpts}
              onChange={v => setFilters({ ...filters, limit: parseInt(v) })}
              minWidth={130}
            />

            {totalLogs > 0 && (
              <div className="ml-auto text-[12.5px] text-gray-400 self-end pb-2">
                {totalLogs.toLocaleString()} total logs
              </div>
            )}
          </div>

          {/* Active time chip */}
          {activeTimeLabel && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[11px] text-gray-400 font-medium">Filtered by:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#111] text-white text-[11px] font-semibold rounded-md">
                <FaClock size={9} />
                {activeTimeLabel}
                <button
                  onClick={() => { setTimePreset('all'); setCustomFrom(''); setCustomTo(''); }}
                  className="ml-1 opacity-60 hover:opacity-100 transition-opacity leading-none"
                  title="Clear time filter"
                >✕</button>
              </span>
            </div>
          )}
        </div>

        {/* ── Notices ── */}
        {!hasAuditReadPermission && (
          <div className="mt-4 flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={15} />
            <div>
              <p className="text-[13px] text-green-800 font-medium m-0">Restricted Access</p>
              <p className="text-[12px] text-green-700 mt-0.5 m-0">You can only view audit logs for your own account ({userEmail})</p>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <FaExclamationTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={15} />
            <div>
              <p className="text-[13px] text-amber-800 font-semibold m-0">Note</p>
              <p className="text-[12px] text-amber-700 mt-0.5 m-0">{error}</p>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className="mt-6 mb-10 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#0A0A0A] tracking-tight">Activity Log</h2>
            {totalLogs > 0 && !loading && (
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">
                Page {currentPage} of {getTotalPages()}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-2 border-gray-200 border-t-[#111] rounded-full al-spin" />
              <p className="text-[13px] text-gray-400">Loading audit logs…</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FaClock size={40} className="text-gray-300" />
              <p className="text-[14px] text-gray-500 font-medium">No audit logs found</p>
              <p className="text-[12.5px] text-gray-400">
                {activeTimeLabel ? `No events in "${activeTimeLabel}"` : 'Chat interactions will appear here once logged'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAFA]">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] cursor-pointer select-none hover:text-gray-600 transition-colors"
                      onClick={() => setSortOrder(sortOrder === 'ascending' ? 'descending' : 'ascending')}
                      title="Click to toggle sort order"
                    >
                      Timestamp {sortOrder === 'ascending' ? '↑' : '↓'}
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">User</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">Event Type</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">Status</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log, idx) => (
                    <tr key={log.id || idx} onClick={() => setSelectedLog(log)} className="hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                      <td className="px-6 py-3 text-[13px] text-gray-500 whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                            {formatValue(log.user_email)?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-[13px] font-medium text-[#0A0A0A]">{formatValue(log.user_email)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[13px] font-medium text-[#0A0A0A]">{formatValue(log.event_type || log.action)}</td>
                      <td className="px-6 py-3">{severityBadge(log)}</td>
                      <td className="px-6 py-3 text-[13px] text-gray-500 max-w-[280px] truncate" title={formatValue(log.details)}>
                        {formatValue(log.details || log.description)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalLogs > 0 && !loading && (
            <div className="bg-[#FAFAFA] border-t border-gray-100 px-6 py-3 flex items-center justify-between">
              <span className="text-[12.5px] text-gray-400">
                Page {currentPage} of {getTotalPages()} · {totalLogs.toLocaleString()} total
              </span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                  className="px-4 py-1.5 rounded-lg text-[13px] font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  ← Previous
                </button>
                <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= getTotalPages()}
                  className="px-4 py-1.5 rounded-lg text-[13px] font-medium bg-[#111] text-white hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Log Detail Modal ── */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setSelectedLog(null); setCopied(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Colored dot indicator */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  (selectedLog.status === 'success' || selectedLog.severity === 'info' || selectedLog.status === 'info') ? 'bg-green-500'
                  : (selectedLog.status === 'error' || selectedLog.status === 'failed' || selectedLog.severity === 'error') ? 'bg-red-500'
                  : (selectedLog.status === 'warning' || selectedLog.severity === 'warning') ? 'bg-amber-500'
                  : 'bg-gray-400'
                }`} />
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-[#0A0A0A] truncate">
                    {selectedLog.event_type || selectedLog.action || 'Audit Event'}
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{formatTimestamp(selectedLog.timestamp)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    const clean = Object.fromEntries(
                      Object.entries(selectedLog).filter(([, v]) => v !== null && v !== undefined && v !== '')
                    );
                    navigator.clipboard.writeText(JSON.stringify(clean, null, 2)).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                    copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {copied ? <FaCheckCircle size={10} /> : <FaCopy size={10} />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
                <button
                  onClick={() => { setSelectedLog(null); setCopied(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FaTimes size={13} />
                </button>
              </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">

              {/* ── SECTION 1: Overview row ── */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Status',     value: selectedLog.status || selectedLog.severity || '—' },
                  { label: 'Event Type', value: selectedLog.event_type || selectedLog.action || '—' },
                  { label: 'Timestamp',  value: formatTimestamp(selectedLog.timestamp) },
                ].map(f => (
                  <div key={f.label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-1.5">{f.label}</div>
                    <div className="text-[12px] font-semibold text-[#0A0A0A] break-all leading-snug">
                      {f.label === 'Status' ? (
                        <span className={`inline-flex items-center gap-1.5 ${
                          (f.value === 'success' || f.value === 'info') ? 'text-green-700'
                          : (f.value === 'error' || f.value === 'failed') ? 'text-red-700'
                          : f.value === 'warning' ? 'text-amber-700'
                          : 'text-gray-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            (f.value === 'success' || f.value === 'info') ? 'bg-green-500'
                            : (f.value === 'error' || f.value === 'failed') ? 'bg-red-500'
                            : f.value === 'warning' ? 'bg-amber-500'
                            : 'bg-gray-400'
                          }`} />
                          {f.value}
                        </span>
                      ) : f.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── SECTION 2: User & Identity ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FaUser size={9} className="text-gray-300" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">User & Identity</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Email',      value: selectedLog.user_email },
                    { label: 'User ID',    value: selectedLog.user_id },
                    { label: 'IP Address', value: selectedLog.ip_address },
                    { label: 'User Agent', value: selectedLog.user_agent },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} className={`rounded-xl border border-gray-100 bg-white px-4 py-3 ${f.label === 'User Agent' ? 'col-span-2' : ''}`}>
                      <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-1">{f.label}</div>
                      <div className="text-[12.5px] text-[#0A0A0A] font-medium break-all leading-snug">{formatValue(f.value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SECTION 3: Event Details ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FaTag size={9} className="text-gray-300" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Event Details</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Action',        value: selectedLog.action },
                    { label: 'Severity',      value: selectedLog.severity },
                    { label: 'Session ID',    value: selectedLog.session_id },
                    { label: 'Agent ID',      value: selectedLog.agent_id },
                    { label: 'Agent Type',    value: selectedLog.agent_type },
                    { label: 'Target ID',     value: selectedLog.target_id },
                    { label: 'Target Type',   value: selectedLog.target_type },
                    { label: 'Resource Type', value: selectedLog.resource_type },
                    { label: 'Resource ID',   value: selectedLog.resource_id },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                      <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-1">{f.label}</div>
                      <div className="text-[12.5px] text-[#0A0A0A] font-medium break-all leading-snug font-mono">{formatValue(f.value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SECTION 4: Description ── */}
              {selectedLog.description && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaInfoCircle size={9} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Description</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                    <p className="text-[13px] text-[#222] leading-relaxed">{formatValue(selectedLog.description)}</p>
                  </div>
                </div>
              )}

              {/* ── SECTION 5: Details / Payload — structured fields + raw toggle ── */}
              {selectedLog.details && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaTag size={9} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Payload</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  {typeof selectedLog.details === 'object' && !Array.isArray(selectedLog.details) ? (
                    <div className="space-y-2">
                      {/* Render each key as a labeled card */}
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedLog.details).map(([key, val]) => {
                          const isLong = typeof val === 'object' || String(val).length > 60;
                          // FIX: for error-type boolean keys, true = red (bad), false = green (good)
                          const isErrorKey = /error|fail|invalid/i.test(key);
                          return (
                            <div
                              key={key}
                              className={`rounded-xl border border-gray-100 bg-white px-4 py-3 ${isLong ? 'col-span-2' : ''}`}
                            >
                              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-1.5">
                                {key.replace(/_/g, ' ')}
                              </div>
                              {typeof val === 'boolean' ? (
                                <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${
                                  isErrorKey
                                    ? (val ? 'text-red-700' : 'text-green-700')
                                    : (val ? 'text-green-700' : 'text-red-700')
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isErrorKey
                                      ? (val ? 'bg-red-500' : 'bg-green-500')
                                      : (val ? 'bg-green-500' : 'bg-red-500')
                                  }`} />
                                  {val ? 'true' : 'false'}
                                </span>
                              ) : typeof val === 'object' ? (
                                <pre className="text-[11px] text-[#1a1a1a] font-mono leading-relaxed whitespace-pre-wrap break-all bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 mt-1">
                                  {JSON.stringify(val, null, 2)}
                                </pre>
                              ) : (
                                <div className="text-[12.5px] text-[#0A0A0A] font-medium break-all leading-snug">{String(val)}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Fallback: plain string or array */
                    <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] px-4 py-3">
                      <pre className="text-[11.5px] text-[#1a1a1a] font-mono leading-relaxed whitespace-pre-wrap break-all overflow-x-auto">
                        {Array.isArray(selectedLog.details)
                          ? JSON.stringify(selectedLog.details, null, 2)
                          : formatValue(selectedLog.details)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* ── SECTION 6: Metadata ── */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaIdBadge size={9} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Metadata</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedLog.metadata).map(([key, val]) => {
                      const isLong = typeof val === 'object' || String(val).length > 60;
                      // FIX: for error-type boolean keys, true = red (bad), false = green (good)
                      const isErrorKey = /error|fail|invalid/i.test(key);
                      return (
                        <div
                          key={key}
                          className={`rounded-xl border border-gray-100 bg-white px-4 py-3 ${isLong ? 'col-span-2' : ''}`}
                        >
                          <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-1.5">
                            {key.replace(/_/g, ' ')}
                          </div>
                          {typeof val === 'boolean' ? (
                            <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${
                              isErrorKey
                                ? (val ? 'text-red-700' : 'text-green-700')
                                : (val ? 'text-green-700' : 'text-red-700')
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isErrorKey
                                  ? (val ? 'bg-red-500' : 'bg-green-500')
                                  : (val ? 'bg-green-500' : 'bg-red-500')
                              }`} />
                              {val ? 'true' : 'false'}
                            </span>
                          ) : typeof val === 'object' ? (
                            <pre className="text-[11px] text-[#1a1a1a] font-mono leading-relaxed whitespace-pre-wrap break-all bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 mt-1">
                              {JSON.stringify(val, null, 2)}
                            </pre>
                          ) : (
                            <div className="text-[12.5px] text-[#0A0A0A] font-medium break-all leading-snug">{String(val)}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── SECTION 7: Error — enhanced display ── */}
              {selectedLog.error_message && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaExclamationTriangle size={9} className="text-red-500" />
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.1em]">Error Detail</span>
                    <div className="flex-1 h-px bg-red-100" />
                  </div>
                  <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
                    {/* Error header bar */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-100 bg-red-100/60">
                      <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                      <span className="text-[11px] font-bold text-red-700 uppercase tracking-[0.06em]">
                        {selectedLog.status === 'failed' ? 'Failure' : 'Error'}
                      </span>
                      {selectedLog.event_type && (
                        <span className="ml-auto text-[10px] text-red-400 font-mono">{selectedLog.event_type}</span>
                      )}
                    </div>
                    {/* Error message body */}
                    <div className="px-4 py-3">
                      <pre className="text-[12.5px] text-red-800 font-mono leading-relaxed whitespace-pre-wrap break-all">
                        {formatValue(selectedLog.error_message)}
                      </pre>
                    </div>
                    {/* Context from payload if has_error flag present */}
                    {selectedLog.details && typeof selectedLog.details === 'object' && selectedLog.details.has_error && (
                      <div className="px-4 py-2.5 border-t border-red-100 bg-red-100/40 flex items-center gap-2">
                        <FaExclamationTriangle size={9} className="text-red-400 flex-shrink-0" />
                        <span className="text-[11px] text-red-600">
                          Error flagged in payload —
                          {selectedLog.details.intent ? <> intent: <span className="font-semibold">{String(selectedLog.details.intent)}</span></> : null}
                          {selectedLog.details.message_preview ? <> · &quot;{String(selectedLog.details.message_preview)}&quot;</> : null}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── SECTION 8: Log ID ── */}
              {selectedLog.id && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-1">Log ID</div>
                    <div className="text-[11.5px] text-gray-500 font-mono break-all">{selectedLog.id}</div>
                  </div>
                </div>
              )}

            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
              <span className="text-[11px] text-gray-400">Click outside to dismiss</span>
              <button
                onClick={() => { setSelectedLog(null); setCopied(false); }}
                className="px-5 py-2 rounded-lg text-[13px] font-medium bg-[#111] text-white hover:bg-[#333] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Modal ── */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-[20px] font-bold text-[#0A0A0A] mb-1">Export Audit Logs</h2>
            <p className="text-[13px] text-gray-500 mb-6">
              You have {getTotalPages()} pages of logs. What would you like to export?
            </p>
            <div className="flex flex-col gap-3 mb-6">
              {([
                { value: 'current' as ExportScope, label: 'Current Page', sub: `Page ${currentPage} · ${logs.length} logs` },
                { value: 'all'     as ExportScope, label: 'All Pages',    sub: `${totalLogs.toLocaleString()} matching logs` },
              ]).map(opt => (
                <label key={opt.value}
                  className={`flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border-2 transition-all ${exportScope === opt.value ? 'border-[#111] bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="exportScope" value={opt.value}
                    checked={exportScope === opt.value}
                    onChange={e => setExportScope(e.target.value as ExportScope)}
                    className="cursor-pointer" />
                  <div>
                    <div className="text-[13px] font-semibold text-[#0A0A0A]">{opt.label}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{opt.sub}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowExportModal(false)} disabled={loading}
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors disabled:opacity-40">
                Cancel
              </button>
              <button onClick={() => handleExport('csv', exportScope)} disabled={loading}
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-[#111] hover:bg-[#333] text-white transition-colors disabled:opacity-40">
                {loading ? 'Exporting…' : 'Export to CSV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;