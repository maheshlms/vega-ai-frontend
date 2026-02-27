import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaDownload, FaSync } from 'react-icons/fa';
import api from '../../utils/api';
import { auth } from '../../utils/auth';
import { useTheme } from '../../state/ThemeContext';

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

/* ── Tiny hook to get viewport width reactively ── */
function useViewportWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

/* ── Scale a px value proportionally based on viewport vs 1920 baseline ── */
function scale(base: number, vw: number): number {
  if (vw <= 1920) {
    // Compress slightly for screens smaller than 1920
    const ratio = Math.max(0.72, vw / 1920);
    return Math.round(base * ratio);
  }
  // Expand proportionally for screens larger than 1920
  const ratio = Math.min(2, vw / 1920);
  return Math.round(base * ratio);
}

const AuditLogs: React.FC = () => {
  const { isDark } = useTheme();
  const vw = useViewportWidth();

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
    
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setUserEmail(currentUser.email || '');
      
      const userRolesStr = localStorage.getItem('userRoles');
      const userRoles: string[] = userRolesStr ? JSON.parse(userRolesStr) : [];
      
      console.log('User roles:', userRoles);
      
      const hasPermission = userRoles.some(role => 
        role.toLowerCase().includes('read:audit_logs') || 
        role.toLowerCase() === 'admin'
      );
      
      console.log('Has audit read permission:', hasPermission);
      setHasAuditReadPermission(hasPermission);
      
      if (!hasPermission && currentUser.email) {
        setFilters(prev => ({
          ...prev,
          user_email: currentUser.email
        }));
      }
    } else {
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

      try {
        const countData = await api.audit.countLogs(apiFilters);
        setTotalLogs(countData.total_count || 0);
        console.log('Log count loaded:', countData.total_count);
      } catch (countErr) {
        console.error('Error fetching log count:', countErr);
        setTotalLogs(0);
      }

      try {
        const logsData = await api.audit.queryLogs(apiFilters);
        if (logsData && typeof logsData === 'object') {
          if (logsData.logs) {
            setLogs(Array.isArray(logsData.logs) ? logsData.logs : []);
          } else if (Array.isArray(logsData)) {
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
      handleExport('csv', 'all');
    } else {
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
        apiFilters.limit = filters.limit;
        apiFilters.skip = (currentPage - 1) * filters.limit;
      } else {
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

  // Dark mode style helpers
  const bg = isDark ? '#0d1117' : '#f9fafb';
  const cardBg = isDark ? '#1a2234' : 'white';
  const borderColor = isDark ? '#1e2d45' : '#e5e7eb';
  const textPrimary = isDark ? '#ffffff' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#4b5563';
  const textMuted = isDark ? '#64748b' : '#6b7280';
  const inputBg = isDark ? '#111827' : 'white';
  const inputBorder = isDark ? '#1e2d45' : '#d1d5db';
  const tableHeadBg = isDark ? '#111827' : '#f9fafb';
  const tableRowHover = isDark ? '#1e2d45' : '#f9fafb';
  const disabledInputBg = isDark ? '#1a2234' : '#f3f4f6';

  /* ── Responsive derived sizes ── */
  const px = (n: number) => `${scale(n, vw)}px`;
  const headerPadding = px(24);
  const sectionPadding = `${px(16)} ${px(24)}`;
  const fontSize14 = px(14);
  const fontSize12 = px(12);
  const fontSize18 = px(18);
  const fontSize24 = px(24);
  const fontSize48 = px(48);
  const statIconSize = scale(40, vw);
  const statIconFont = px(18);
  const avatarSize = scale(32, vw);
  const avatarFont = px(12);
  const btnPadding = `${px(8)} ${px(16)}`;
  const btnFontSize = px(14);
  const statGridMinWidth = Math.max(160, scale(250, vw));
  const filterGridMinWidth = Math.max(140, scale(200, vw));
  const tablepadding = `${px(12)} ${px(24)}`;
  const paginationPadding = `${px(16)} ${px(24)}`;

  return (
    <div style={{ width: '100%', backgroundColor: bg, display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s' }}>
      {/* Header */}
      <div style={{ backgroundColor: cardBg, borderBottom: `1px solid ${borderColor}`, padding: headerPadding, position: 'sticky', top: 0, zIndex: 10, transition: 'background-color 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: px(32), fontWeight: 'bold', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: px(8), color: textPrimary }}>Audit Logs</h1>
            <p style={{ color: textMuted, fontSize: fontSize14, marginTop: px(4) }}>Track all agent activities and system events</p>
          </div>
          <div style={{ display: 'flex', gap: px(8) }}>
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: px(8),
                padding: btnPadding,
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: px(8),
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                fontSize: btnFontSize
              }}
            >
              <FaSync style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
            <button
              onClick={handleExportClick}
              disabled={loading || logs.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: px(8),
                padding: btnPadding,
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: px(8),
                cursor: (loading || logs.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (loading || logs.length === 0) ? 0.5 : 1,
                fontSize: btnFontSize
              }}
            >
              <FaDownload />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div style={{ padding: headerPadding, backgroundColor: cardBg, borderBottom: `1px solid ${borderColor}`, transition: 'background-color 0.3s' }}>
          <h2 style={{ fontSize: fontSize18, fontWeight: '600', color: textPrimary, marginBottom: px(16) }}>Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${statGridMinWidth}px, 1fr))`, gap: px(16) }}>
            <div
              style={{ background: isDark ? 'linear-gradient(to bottom right, #14532d, #166534)' : 'linear-gradient(to bottom right, #dcfce7, #bbf7d0)', border: `1px solid ${isDark ? '#166534' : '#86efac'}`, borderRadius: px(8), padding: px(16) }}
              className="shadow-md hover:shadow-xl"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: px(12) }}>
                <div style={{ width: statIconSize, height: statIconSize, backgroundColor: isDark ? '#166534' : '#86efac', borderRadius: px(8), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaCheckCircle style={{ color: isDark ? '#4ade80' : '#166534', fontSize: statIconFont }} />
                </div>
                <div>
                  <div style={{ fontSize: fontSize24, fontWeight: 'bold', color: isDark ? '#ffffff' : 'black' }}>{stats.events_by_severity?.success || 0}</div>
                  <div style={{ fontSize: fontSize12, color: isDark ? '#86efac' : '#4b5563', marginTop: px(4) }}>Successful Events</div>
                </div>
              </div>
            </div>
            
            <div
              style={{ background: isDark ? 'linear-gradient(to bottom right, #7f1d1d, #991b1b)' : 'linear-gradient(to bottom right, #fee2e2, #fecaca)', border: `1px solid ${isDark ? '#991b1b' : '#fca5a5'}`, borderRadius: px(8), padding: px(16) }}
              className="shadow-md hover:shadow-xl"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: px(12) }}>
                <div style={{ width: statIconSize, height: statIconSize, backgroundColor: isDark ? '#991b1b' : '#fca5a5', borderRadius: px(8), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaExclamationTriangle style={{ color: isDark ? '#fca5a5' : '#7f1d1d', fontSize: statIconFont }} />
                </div>
                <div>
                  <div style={{ fontSize: fontSize24, fontWeight: 'bold', color: textPrimary }}>{stats.events_by_severity?.error || 0}</div>
                  <div style={{ fontSize: fontSize12, color: isDark ? '#fca5a5' : '#4b5563', marginTop: px(4) }}>Error Events</div>
                </div>
              </div>
            </div>
            
            <div
              style={{ background: isDark ? 'linear-gradient(to bottom right, #78350f, #92400e)' : 'linear-gradient(to bottom right, #fef3c7, #fde68a)', border: `1px solid ${isDark ? '#92400e' : '#fcd34d'}`, borderRadius: px(8), padding: px(16) }}
              className="shadow-md hover:shadow-xl"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: px(12) }}>
                <div style={{ width: statIconSize, height: statIconSize, backgroundColor: isDark ? '#92400e' : '#fcd34d', borderRadius: px(8), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaExclamationTriangle style={{ color: isDark ? '#fde68a' : '#78350f', fontSize: statIconFont }} />
                </div>
                <div>
                  <div style={{ fontSize: fontSize24, fontWeight: 'bold', color: textPrimary }}>{stats.events_by_severity?.warning || 0}</div>
                  <div style={{ fontSize: fontSize12, color: isDark ? '#fde68a' : '#4b5563', marginTop: px(4) }}>Warnings</div>
                </div>
              </div>
            </div>
            
            <div
              style={{ background: isDark ? 'linear-gradient(to bottom right, #4c1d95, #5b21b6)' : 'linear-gradient(to bottom right, #f3e8ff, #e9d5ff)', border: `1px solid ${isDark ? '#5b21b6' : '#d8b4fe'}`, borderRadius: px(8), padding: px(16) }}
              className="shadow-md hover:shadow-xl"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: px(12) }}>
                <div style={{ width: statIconSize, height: statIconSize, backgroundColor: isDark ? '#5b21b6' : '#d8b4fe', borderRadius: px(8), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaClock style={{ color: isDark ? '#e9d5ff' : '#581c87', fontSize: statIconFont }} />
                </div>
                <div>
                  <div style={{ fontSize: fontSize24, fontWeight: 'bold', color: textPrimary }}>{stats.total_events || 0}</div>
                  <div style={{ fontSize: fontSize12, color: isDark ? '#e9d5ff' : '#4b5563', marginTop: px(4) }}>Total Events</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ padding: sectionPadding, backgroundColor: cardBg, borderBottom: `1px solid ${borderColor}`, transition: 'background-color 0.3s' }}>
        <div style={{ backgroundColor: cardBg, borderRadius: px(8), border: `1px solid ${borderColor}`, padding: px(16) }}>
          <h3 style={{ fontSize: fontSize14, fontWeight: '600', color: textPrimary, marginBottom: px(16) }}>Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${filterGridMinWidth}px, 1fr))`, gap: px(16) }}>
            <div>
              <label style={{ display: 'block', fontSize: fontSize12, fontWeight: '600', color: isDark ? '#94a3b8' : '#374151', marginBottom: px(8) }}>Event Type</label>
              <select
                value={filters.event_type}
                onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                style={{ width: '100%', padding: `${px(8)} ${px(12)}`, border: `1px solid ${inputBorder}`, borderRadius: px(8), fontSize: fontSize14, backgroundColor: inputBg, color: textPrimary }}
              >
                <option value="">All Events</option>
                {eventTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: fontSize12, fontWeight: '600', color: isDark ? '#94a3b8' : '#374151', marginBottom: px(8) }}>Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                style={{ width: '100%', padding: `${px(8)} ${px(12)}`, border: `1px solid ${inputBorder}`, borderRadius: px(8), fontSize: fontSize14, backgroundColor: inputBg, color: textPrimary }}
              >
                <option value="">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: fontSize12, fontWeight: '600', color: isDark ? '#94a3b8' : '#374151', marginBottom: px(8) }}>User Email</label>
              <input
                type="text"
                value={filters.user_email}
                onChange={(e) => setFilters({ ...filters, user_email: e.target.value })}
                disabled={!hasAuditReadPermission}
                placeholder="Filter by email..."
                title={!hasAuditReadPermission ? 'You can only view your own logs' : ''}
                style={{
                  width: '100%',
                  padding: `${px(8)} ${px(12)}`,
                  border: `1px solid ${inputBorder}`,
                  borderRadius: px(8),
                  fontSize: fontSize14,
                  boxSizing: 'border-box',
                  backgroundColor: !hasAuditReadPermission ? disabledInputBg : inputBg,
                  color: textPrimary,
                  cursor: !hasAuditReadPermission ? 'not-allowed' : 'text',
                  opacity: !hasAuditReadPermission ? 0.7 : 1
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: fontSize12, fontWeight: '600', color: isDark ? '#94a3b8' : '#374151', marginBottom: px(8) }}>Items per page</label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
                style={{ width: '100%', padding: `${px(8)} ${px(12)}`, border: `1px solid ${inputBorder}`, borderRadius: px(8), fontSize: fontSize14, backgroundColor: inputBg, color: textPrimary }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Restricted Access Notice */}
      {!hasAuditReadPermission && (
        <div style={{ padding: sectionPadding }}>
          <div style={{
            backgroundColor: isDark ? 'rgba(20, 83, 45, 0.3)' : '#f0fdf4',
            border: `1px solid ${isDark ? '#166534' : '#86efac'}`,
            borderRadius: px(8),
            padding: `${px(12)} ${px(16)}`,
            display: 'flex',
            gap: px(12),
            alignItems: 'flex-start'
          }}>
            <FaCheckCircle style={{ color: '#22c55e', fontSize: px(18), marginTop: '2px', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: fontSize12, color: isDark ? '#4ade80' : '#166534', margin: 0, fontWeight: '500' }}>Restricted Access</p>
              <p style={{ fontSize: px(12), color: isDark ? '#86efac' : '#15803d', marginTop: px(4), margin: 0 }}>You can only view audit logs for your own account ({userEmail})</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ padding: sectionPadding }}>
          <div style={{
            backgroundColor: isDark ? 'rgba(120, 53, 15, 0.3)' : '#fef3c7',
            border: `4px solid ${isDark ? '#d97706' : '#fbbf24'}`,
            borderRadius: px(8),
            padding: px(16),
            display: 'flex',
            gap: px(12),
            alignItems: 'flex-start'
          }}>
            <FaExclamationTriangle style={{ color: '#d97706', fontSize: px(20), marginTop: '4px', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontWeight: '600', color: isDark ? '#fbbf24' : '#78350f', marginBottom: px(4) }}>Note</h3>
              <p style={{ color: isDark ? '#fde68a' : '#92400e', fontSize: fontSize14 }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div style={{ padding: headerPadding, flex: 1, overflow: 'auto' }}>
        <div style={{ backgroundColor: cardBg, borderRadius: px(8), border: `1px solid ${borderColor}`, overflow: 'hidden', transition: 'background-color 0.3s' }}>
          <div style={{ backgroundColor: tableHeadBg, borderBottom: `1px solid ${borderColor}`, padding: `${px(16)} ${px(24)}` }}>
            <h2 style={{ fontSize: fontSize18, fontWeight: '600', color: textPrimary }}>Activity Log</h2>
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: px(48), minHeight: px(200) }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: px(48), height: px(48), border: `4px solid ${borderColor}`, borderTop: '4px solid #2563eb', borderRadius: '50%', margin: `0 auto ${px(16)}`, animation: 'spin 1s linear infinite' }} />
                <p style={{ color: textSecondary }}>Loading audit logs...</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: px(48), minHeight: px(200) }}>
              <div style={{ textAlign: 'center' }}>
                <FaClock style={{ fontSize: px(48), color: isDark ? '#475569' : '#9ca3af', margin: `0 auto ${px(16)}`, display: 'block' }} />
                <p style={{ color: textSecondary, fontSize: fontSize18 }}>No audit logs found</p>
                <p style={{ color: textMuted, fontSize: fontSize14, marginTop: px(8) }}>Chat interactions will appear here once logged</p>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: tableHeadBg, borderBottom: `1px solid ${borderColor}` }}>
                  <tr>
                    <th
                      style={{ padding: tablepadding, textAlign: 'left', fontSize: fontSize12, fontWeight: '600', color: textSecondary, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => setSortOrder(sortOrder === 'ascending' ? 'descending' : 'ascending')}
                      title="Click to toggle sort order"
                    >
                      Timestamp {sortOrder === 'ascending' ? '↑' : '↓'}
                    </th>
                    <th style={{ padding: tablepadding, textAlign: 'left', fontSize: fontSize12, fontWeight: '600', color: textSecondary, textTransform: 'uppercase' }}>User</th>
                    <th style={{ padding: tablepadding, textAlign: 'left', fontSize: fontSize12, fontWeight: '600', color: textSecondary, textTransform: 'uppercase' }}>Event Type</th>
                    <th style={{ padding: tablepadding, textAlign: 'left', fontSize: fontSize12, fontWeight: '600', color: textSecondary, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: tablepadding, textAlign: 'left', fontSize: fontSize12, fontWeight: '600', color: textSecondary, textTransform: 'uppercase' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr
                      key={log.id || idx}
                      style={{ borderBottom: `1px solid ${borderColor}`, transition: 'background-color 0.2s', backgroundColor: cardBg }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tableRowHover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = cardBg}
                    >
                      <td style={{ padding: tablepadding, fontSize: fontSize14, color: textSecondary, whiteSpace: 'nowrap' }}>
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td style={{ padding: tablepadding, fontSize: fontSize14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: px(8) }}>
                          <div style={{ width: avatarSize, height: avatarSize, background: 'linear-gradient(to bottom right, #60a5fa, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: avatarFont, fontWeight: 'bold' }}>
                            {formatValue(log.user_email)?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontWeight: '500', color: textPrimary }}>{formatValue(log.user_email)}</span>
                        </div>
                      </td>
                      <td style={{ padding: tablepadding, fontSize: fontSize14, fontWeight: '500', color: textPrimary }}>
                        {formatValue(log.event_type || log.action)}
                      </td>
                      <td style={{ padding: tablepadding, fontSize: fontSize14 }}>
                        <span style={{
                          display: 'inline-block',
                          padding: `${px(4)} ${px(12)}`,
                          borderRadius: '9999px',
                          fontSize: fontSize12,
                          fontWeight: '500',
                          backgroundColor: (log.status === 'success' || log.severity === 'info')
                            ? (isDark ? 'rgba(30, 58, 138, 0.5)' : '#dbeafe')
                            : (log.status === 'error' || log.severity === 'error')
                            ? (isDark ? 'rgba(127, 29, 29, 0.5)' : '#fee2e2')
                            : (isDark ? 'rgba(120, 53, 15, 0.5)' : '#fef3c7'),
                          color: (log.status === 'success' || log.severity === 'info')
                            ? (isDark ? '#93c5fd' : '#1e40af')
                            : (log.status === 'error' || log.severity === 'error')
                            ? (isDark ? '#fca5a5' : '#7f1d1d')
                            : (isDark ? '#fde68a' : '#78350f')
                        }}>
                          {formatValue(log.status || log.severity)}
                        </span>
                      </td>
                      <td
                        style={{ padding: tablepadding, fontSize: fontSize14, color: textSecondary, maxWidth: px(300), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={formatValue(log.details)}
                      >
                        {formatValue(log.details || log.description)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {totalLogs > 0 && !loading && (
            <div style={{ backgroundColor: tableHeadBg, borderTop: `1px solid ${borderColor}`, padding: paginationPadding, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: fontSize14, color: textSecondary }}>
                Page {currentPage} of {getTotalPages()} ({totalLogs} total logs)
              </div>
              <div style={{ display: 'flex', gap: px(8) }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: btnPadding,
                    backgroundColor: currentPage === 1 ? (isDark ? '#1e2d45' : '#e5e7eb') : '#2563eb',
                    color: currentPage === 1 ? (isDark ? '#475569' : '#9ca3af') : 'white',
                    border: 'none',
                    borderRadius: px(6),
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: fontSize14,
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => currentPage !== 1 && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => currentPage !== 1 && (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= getTotalPages()}
                  style={{
                    padding: btnPadding,
                    backgroundColor: currentPage >= getTotalPages() ? (isDark ? '#1e2d45' : '#e5e7eb') : '#2563eb',
                    color: currentPage >= getTotalPages() ? (isDark ? '#475569' : '#9ca3af') : 'white',
                    border: 'none',
                    borderRadius: px(6),
                    cursor: currentPage >= getTotalPages() ? 'not-allowed' : 'pointer',
                    fontSize: fontSize14,
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => currentPage < getTotalPages() && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => currentPage < getTotalPages() && (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: cardBg, borderRadius: px(12), padding: px(32), maxWidth: px(400), boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: `1px solid ${borderColor}` }}>
            <h2 style={{ fontSize: px(20), fontWeight: 'bold', color: textPrimary, marginBottom: px(16) }}>Export Audit Logs</h2>
            <p style={{ fontSize: fontSize14, color: textSecondary, marginBottom: px(24) }}>You have {getTotalPages()} pages of logs. What would you like to export?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: px(12), marginBottom: px(24) }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: px(12), cursor: 'pointer', padding: px(12),
                backgroundColor: exportScope === 'current' ? (isDark ? 'rgba(37, 99, 235, 0.2)' : '#dbeafe') : (isDark ? '#111827' : '#f9fafb'),
                borderRadius: px(8),
                border: `2px solid ${exportScope === 'current' ? '#2563eb' : borderColor}`,
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="exportScope"
                  value="current"
                  checked={exportScope === 'current'}
                  onChange={(e) => setExportScope(e.target.value as ExportScope)}
                  style={{ cursor: 'pointer', width: px(18), height: px(18) }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: textPrimary }}>Current Page</div>
                  <div style={{ fontSize: fontSize12, color: textMuted }}>Export only page {currentPage} ({logs.length} logs)</div>
                </div>
              </label>
              
              <label style={{
                display: 'flex', alignItems: 'center', gap: px(12), cursor: 'pointer', padding: px(12),
                backgroundColor: exportScope === 'all' ? (isDark ? 'rgba(37, 99, 235, 0.2)' : '#dbeafe') : (isDark ? '#111827' : '#f9fafb'),
                borderRadius: px(8),
                border: `2px solid ${exportScope === 'all' ? '#2563eb' : borderColor}`,
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="exportScope"
                  value="all"
                  checked={exportScope === 'all'}
                  onChange={(e) => setExportScope(e.target.value as ExportScope)}
                  style={{ cursor: 'pointer', width: px(18), height: px(18) }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: textPrimary }}>All Pages</div>
                  <div style={{ fontSize: fontSize12, color: textMuted }}>Export all {totalLogs} matching logs</div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: px(12), justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowExportModal(false)}
                disabled={loading}
                style={{
                  padding: `${px(10)} ${px(20)}`,
                  backgroundColor: isDark ? '#1e2d45' : '#e5e7eb',
                  color: textPrimary,
                  border: 'none',
                  borderRadius: px(6),
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: fontSize14,
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleExport('csv', exportScope)}
                disabled={loading}
                style={{
                  padding: `${px(10)} ${px(20)}`,
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: px(6),
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: fontSize14,
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
              >
                {loading ? 'Exporting...' : 'Export to CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuditLogs;