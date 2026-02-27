import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaDownload, FaSync } from 'react-icons/fa';
import api from '../../utils/api';
import { auth } from '../../utils/auth';

interface AuditLog {
  id?: string;
  timestamp: string;
  user_email: string;
  event_type?: string;
  action?: string;
  status?: string;
  severity?: string;
  details?: string;
  description?: string;
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
}

interface ApiFilters {
  event_type?: string;
  severity?: string;
  user_email?: string;
  limit: number;
  skip: number;
  sort_order: string;
}

type SortOrder = 'ascending' | 'descending';
type ExportScope = 'current' | 'all';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeOptions, setEventTypeOptions] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    event_type: '',
    severity: '',
    user_email: '',
    limit: 50,
    skip: 0
  });

  const [sortOrder, setSortOrder] = useState<SortOrder>('descending');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportScope, setExportScope] = useState<ExportScope>('current');
  const [hasAuditReadPermission, setHasAuditReadPermission] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    console.log('AuditLogs component mounted');
    
    // Check user permissions and set email filter if needed
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setUserEmail(currentUser.email || '');
      
      // Get user roles from localStorage
      const userRolesStr = localStorage.getItem('userRoles');
      const userRoles: string[] = userRolesStr ? JSON.parse(userRolesStr) : [];
      
      console.log('User roles:', userRoles);
      
      // Check if user has read:audit_logs permission
      const hasPermission = userRoles.some(role => 
        role.toLowerCase().includes('read:audit_logs') || 
        role.toLowerCase() === 'admin'
      );
      
      console.log('Has audit read permission:', hasPermission);
      setHasAuditReadPermission(hasPermission);
      
      // If user doesn't have permission, auto-apply their email filter
      if (!hasPermission && currentUser.email) {
        setFilters(prev => ({
          ...prev,
          user_email: currentUser.email
        }));
      }
    } else {
      // If no current user, deny access
      setHasAuditReadPermission(false);
    }
    
    fetchData();
    fetchEventTypes();
  }, []);

  useEffect(() => {
    console.log('Filters or sort order changed, resetting to page 1');
    setCurrentPage(1);
  }, [filters.event_type, filters.severity, filters.user_email, filters.limit, sortOrder]);

  useEffect(() => {
    console.log('Page changed, fetching data for page:', currentPage);
    fetchData();
  }, [currentPage, sortOrder, filters.event_type, filters.severity, filters.user_email, filters.limit]);

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters: ApiFilters = {
        limit: filters.limit,
        skip: (currentPage - 1) * filters.limit,
        sort_order: sortOrder
      };
      
      if (filters.event_type) apiFilters.event_type = filters.event_type;
      if (filters.severity) apiFilters.severity = filters.severity;
      if (filters.user_email) apiFilters.user_email = filters.user_email;

      // First, fetch count of matching logs
      try {
        const countData = await api.audit.countLogs(apiFilters);
        setTotalLogs(countData.total_count || 0);
        console.log('Log count loaded:', countData.total_count);
      } catch (countErr) {
        console.error('Error fetching log count:', countErr);
        setTotalLogs(0);
      }

      // Then fetch the specific page of logs
      try {
        const logsData = await api.audit.queryLogs(apiFilters);
        if (logsData && typeof logsData === 'object') {
          if (logsData.logs) {
            // New response format with paginated logs
            setLogs(Array.isArray(logsData.logs) ? logsData.logs : []);
          } else if (Array.isArray(logsData)) {
            // Old response format (backwards compatibility)
            setLogs(logsData);
          } else {
            setLogs([]);
          }
        }
        console.log('Logs loaded:', logsData);
      } catch (logErr) {
        console.error('Error fetching logs:', logErr);
        setLogs([]);
        setError('Unable to load audit logs');
      }

      // Fetch statistics
      try {
        const statsData = await api.audit.getStats();
        setStats(statsData);
        console.log('Stats loaded:', statsData);
      } catch (statsErr) {
        console.error('Error fetching stats:', statsErr);
        setStats({
          total_events: 0,
          total_success: 0,
          total_failed: 0,
          total_warnings: 0
        });
      }
    } catch (err: any) {
      console.error('Error fetching audit data:', err);
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypes = async (): Promise<void> => {
    try {
      const types = await api.audit.getEventTypes();
      const typeList = types.event_types || types || [];
      setEventTypeOptions(typeList);
      console.log('Event types loaded:', typeList);
    } catch (err) {
      console.error('Error fetching event types:', err);
      setEventTypeOptions([]);
    }
  };

  const getTotalPages = (): number => {
    return Math.ceil(totalLogs / filters.limit);
  };

  const handleExportClick = (): void => {
    const totalPages = getTotalPages();
    if (totalPages <= 1) {
      // Only one page, export directly
      handleExport('csv', 'all');
    } else {
      // Multiple pages, show modal
      setShowExportModal(true);
      setExportScope('current');
    }
  };

  const handleExport = async (format: string = 'csv', scope: ExportScope = exportScope): Promise<void> => {
    try {
      setLoading(true);
      const apiFilters: ApiFilters = {
        limit: 0,
        skip: 0,
        sort_order: sortOrder
      };
      
      if (filters.event_type) apiFilters.event_type = filters.event_type;
      if (filters.severity) apiFilters.severity = filters.severity;
      if (filters.user_email) apiFilters.user_email = filters.user_email;

      if (scope === 'current') {
        // Export only current page
        apiFilters.limit = filters.limit;
        apiFilters.skip = (currentPage - 1) * filters.limit;
      } else {
        // Export all matching logs
        apiFilters.limit = totalLogs;
        apiFilters.skip = 0;
      }

      const blob = await api.audit.exportLogs(format, apiFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const scopeText = scope === 'current' ? `page${currentPage}` : 'all';
      a.download = `audit-logs-${scopeText}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowExportModal(false);
      console.log(`Exported ${scope} logs to ${format}`);
    } catch (err: any) {
      console.error('Error exporting logs:', err);
      alert('Failed to export logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return String(timestamp);
    }
  };

  const severityBadge = (log: AuditLog) => {
    const val = log.status || log.severity || '';
    const isSuccess = val === 'success' || val === 'info';
    const isError   = val === 'error';
    const isWarn    = val === 'warning';
    const cls = isSuccess
      ? 'bg-green-50 text-green-700 border border-green-100'
      : isError
        ? 'bg-red-50 text-red-700 border border-red-100'
        : isWarn
          ? 'bg-amber-50 text-amber-700 border border-amber-100'
          : 'bg-gray-100 text-gray-600 border border-gray-200';
    const dot = isSuccess ? 'bg-green-500' : isError ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-gray-400';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {formatValue(val)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .al-spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-12 max-md:px-5">
        <div className="max-w-[1400px] mx-auto pt-10 pb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#0A0A0A] mb-2 max-md:text-3xl">
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
            <button onClick={handleExportClick} disabled={loading || logs.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#111] hover:bg-[#333] text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-40">
              <FaDownload className="text-xs" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-12 max-md:px-5">

        {/* ── Stats strip ── */}
        {stats && (
          <div className="py-5 border-b border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: FaCheckCircle, label: 'Successful',   value: stats.events_by_severity?.success  ?? 0, bg: '#F0FDF4', color: '#22C55E' },
                { icon: FaExclamationTriangle, label: 'Errors', value: stats.events_by_severity?.error  ?? 0, bg: '#FEF2F2', color: '#EF4444' },
                { icon: FaExclamationTriangle, label: 'Warnings', value: stats.events_by_severity?.warning ?? 0, bg: '#FFFBEB', color: '#F59E0B' },
                { icon: FaClock,        label: 'Total Events', value: stats.total_events ?? 0,                bg: '#FAF5FF', color: '#A855F7' },
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
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">Event Type</label>
              <select value={filters.event_type}
                onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-gray-300 min-w-[160px]">
                <option value="">All Events</option>
                {eventTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">Severity</label>
              <select value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-gray-300 min-w-[140px]">
                <option value="">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">User Email</label>
              <input type="text" value={filters.user_email}
                onChange={(e) => setFilters({ ...filters, user_email: e.target.value })}
                disabled={!hasAuditReadPermission}
                placeholder="Filter by email..."
                title={!hasAuditReadPermission ? 'You can only view your own logs' : ''}
                className={`px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-gray-300 min-w-[200px] ${!hasAuditReadPermission ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-[#0A0A0A]'}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">Per page</label>
              <select value={filters.limit}
                onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-gray-300">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            {totalLogs > 0 && (
              <div className="ml-auto text-[12.5px] text-gray-400 self-end pb-2">
                {totalLogs.toLocaleString()} total logs
              </div>
            )}
          </div>
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
              <p className="text-[12.5px] text-gray-400">Chat interactions will appear here once logged</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAFA]">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] cursor-pointer select-none hover:text-gray-600 transition-colors"
                      onClick={() => setSortOrder(sortOrder === 'ascending' ? 'descending' : 'ascending')}
                      title="Click to toggle sort order">
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
                    <tr key={log.id || idx} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-6 py-3 text-[13px] text-gray-500 whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                            {formatValue(log.user_email)?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-[13px] font-medium text-[#0A0A0A]">{formatValue(log.user_email)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[13px] font-medium text-[#0A0A0A]">
                        {formatValue(log.event_type || log.action)}
                      </td>
                      <td className="px-6 py-3">
                        {severityBadge(log)}
                      </td>
                      <td className="px-6 py-3 text-[13px] text-gray-500 max-w-[280px] truncate"
                        title={formatValue(log.details)}>
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
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-1.5 rounded-lg text-[13px] font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  ← Previous
                </button>
                <button onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= getTotalPages()}
                  className="px-4 py-1.5 rounded-lg text-[13px] font-medium bg-[#111] text-white hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>{/* /max-w-[1400px] */}

      {/* ── Export Modal ── */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[20px] font-bold text-[#0A0A0A] mb-1">Export Audit Logs</h2>
            <p className="text-[13px] text-gray-500 mb-6">You have {getTotalPages()} pages of logs. What would you like to export?</p>

            <div className="flex flex-col gap-3 mb-6">
              {([
                { value: 'current' as ExportScope, label: 'Current Page', sub: `Page ${currentPage} · ${logs.length} logs` },
                { value: 'all'     as ExportScope, label: 'All Pages',    sub: `${totalLogs.toLocaleString()} matching logs` },
              ]).map((opt) => (
                <label key={opt.value}
                  className={`flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border-2 transition-all ${exportScope === opt.value ? 'border-[#111] bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="exportScope" value={opt.value}
                    checked={exportScope === opt.value}
                    onChange={(e) => setExportScope(e.target.value as ExportScope)}
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