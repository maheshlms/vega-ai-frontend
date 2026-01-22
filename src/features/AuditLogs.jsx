import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaDownload, FaSync } from 'react-icons/fa';
import api from '../utils/api';
import { auth } from '../utils/auth';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventTypeOptions, setEventTypeOptions] = useState([]);
  const [filters, setFilters] = useState({
    event_type: '',
    severity: '',
    user_email: '',
    limit: 50,
    skip: 0
  });

  const [sortOrder, setSortOrder] = useState('descending'); // 'ascending' or 'descending'
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState('current'); // 'current' or 'all'
  const [hasAuditReadPermission, setHasAuditReadPermission] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    console.log('AuditLogs component mounted');
    
    // Check user permissions and set email filter if needed
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setUserEmail(currentUser.email || '');
      
      // Get user roles from localStorage
      const userRolesStr = localStorage.getItem('userRoles');
      const userRoles = userRolesStr ? JSON.parse(userRolesStr) : [];
      
      // Check if user has read:audit_logs permission
      const hasPermission = userRoles.some(role => 
        role.toLowerCase().includes('read:audit_logs') || 
        role.toLowerCase() === 'admin'
      );
      
      setHasAuditReadPermission(hasPermission);
      
      // If user doesn't have permission, auto-apply their email filter
      if (!hasPermission && currentUser.email) {
        setFilters(prev => ({
          ...prev,
          user_email: currentUser.email
        }));
      }
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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters = {};
      if (filters.event_type) apiFilters.event_type = filters.event_type;
      if (filters.severity) apiFilters.severity = filters.severity;
      if (filters.user_email) apiFilters.user_email = filters.user_email;
      apiFilters.limit = filters.limit;
      apiFilters.skip = (currentPage - 1) * filters.limit;
      apiFilters.sort_order = sortOrder;

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
    } catch (err) {
      console.error('Error fetching audit data:', err);
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypes = async () => {
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

  const getTotalPages = () => {
    return Math.ceil(totalLogs / filters.limit);
  };

  const handleExportClick = () => {
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

  const handleExport = async (format = 'csv', scope = exportScope) => {
    try {
      setLoading(true);
      const apiFilters = {};
      if (filters.event_type) apiFilters.event_type = filters.event_type;
      if (filters.severity) apiFilters.severity = filters.severity;
      if (filters.user_email) apiFilters.user_email = filters.user_email;
      apiFilters.sort_order = sortOrder;

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
    } catch (err) {
      console.error('Error exporting logs:', err);
      alert('Failed to export logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' || typeof value === 'number') return value;
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

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return String(timestamp);
    }
  };

  return (
    <div style={{ width: '100%', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Audit Logs</h1>
            <p style={{ fontSize: '14px', color: '#4b5563' }}>Track all agent activities and system events</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                fontSize: '14px'
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
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (loading || logs.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (loading || logs.length === 0) ? 0.5 : 1,
                fontSize: '14px'
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
        <div style={{ padding: '24px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'linear-gradient(to bottom right, #dcfce7, #bbf7d0)', border: '1px solid #86efac', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#86efac', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaCheckCircle style={{ color: '#166534', fontSize: '18px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{stats.events_by_severity?.success || stats.events_by_severity?.["success"] || 0}</div>
                  <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Successful Events</div>
                </div>
              </div>
            </div>
            
            <div style={{ background: 'linear-gradient(to bottom right, #fee2e2, #fecaca)', border: '1px solid #fca5a5', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#fca5a5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaExclamationTriangle style={{ color: '#7f1d1d', fontSize: '18px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{stats.events_by_severity?.error || stats.events_by_severity?.["error"] || 0}</div>
                  <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Error Events</div>
                </div>
              </div>
            </div>
            
            <div style={{ background: 'linear-gradient(to bottom right, #fef3c7, #fde68a)', border: '1px solid #fcd34d', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#fcd34d', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaExclamationTriangle style={{ color: '#78350f', fontSize: '18px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{stats.events_by_severity?.warning || stats.events_by_severity?.["warning"] || 0}</div>
                  <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Warnings</div>
                </div>
              </div>
            </div>
            
            <div style={{ background: 'linear-gradient(to bottom right, #f3e8ff, #e9d5ff)', border: '1px solid #d8b4fe', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#d8b4fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaClock style={{ color: '#581c87', fontSize: '18px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{stats.total_events || 0}</div>
                  <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Total Events</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ padding: '16px 24px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Event Type</label>
              <select
                value={filters.event_type}
                onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
              >
                <option value="">All Events</option>
                {eventTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
              >
                <option value="">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>User Email</label>
              <input
                type="text"
                value={filters.user_email}
                onChange={(e) => setFilters({ ...filters, user_email: e.target.value })}
                disabled={!hasAuditReadPermission}
                placeholder="Filter by email..."
                title={!hasAuditReadPermission ? 'You can only view your own logs' : ''}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: !hasAuditReadPermission ? '#f3f4f6' : 'white', cursor: !hasAuditReadPermission ? 'not-allowed' : 'text', opacity: !hasAuditReadPermission ? 0.7 : 1 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Items per page</label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
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
        <div style={{ padding: '16px 24px' }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <FaCheckCircle style={{ color: '#22c55e', fontSize: '18px', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '13px', color: '#166534', margin: 0, fontWeight: '500' }}>Restricted Access</p>
              <p style={{ fontSize: '12px', color: '#15803d', marginTop: '4px', margin: 0 }}>You can only view audit logs for your own account ({userEmail})</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ padding: '16px 24px' }}>
          <div style={{ backgroundColor: '#fef3c7', border: '4px solid #fbbf24', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <FaExclamationTriangle style={{ color: '#d97706', fontSize: '20px', marginTop: '4px', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontWeight: '600', color: '#78350f', marginBottom: '4px' }}>Note</h3>
              <p style={{ color: '#92400e', fontSize: '14px' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Activity Log</h2>
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', minHeight: '200px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #2563eb', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#4b5563' }}>Loading audit logs...</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', minHeight: '200px' }}>
              <div style={{ textAlign: 'center' }}>
                <FaClock style={{ fontSize: '48px', color: '#9ca3af', margin: '0 auto 16px', display: 'block' }} />
                <p style={{ color: '#4b5563', fontSize: '18px' }}>No audit logs found</p>
                <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>Chat interactions will appear here once logged</p>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }} onClick={() => setSortOrder(sortOrder === 'ascending' ? 'descending' : 'ascending')} title="Click to toggle sort order">
                      Timestamp {sortOrder === 'ascending' ? '↑' : '↓'}
                    </th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase' }}>User</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase' }}>Event Type</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr key={log.id || idx} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                      <td style={{ padding: '12px 24px', fontSize: '14px', color: '#4b5563', whiteSpace: 'nowrap' }}>
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td style={{ padding: '12px 24px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(to bottom right, #60a5fa, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                            {formatValue(log.user_email)?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontWeight: '500', color: '#111827' }}>{formatValue(log.user_email)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                        {formatValue(log.event_type || log.action)}
                      </td>
                      <td style={{ padding: '12px 24px', fontSize: '14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: (log.status === 'success' || log.severity === 'info') ? '#dbeafe' : (log.status === 'error' || log.severity === 'error') ? '#fee2e2' : '#fef3c7',
                          color: (log.status === 'success' || log.severity === 'info') ? '#1e40af' : (log.status === 'error' || log.severity === 'error') ? '#7f1d1d' : '#78350f'
                        }}>
                          {formatValue(log.status || log.severity)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 24px', fontSize: '14px', color: '#4b5563', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={formatValue(log.details)}>
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
            <div style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>
                Page {currentPage} of {getTotalPages()} ({totalLogs} total logs)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentPage === 1 ? '#e5e7eb' : '#2563eb',
                    color: currentPage === 1 ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => currentPage !== 1 && (e.target.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => currentPage !== 1 && (e.target.style.backgroundColor = '#2563eb')}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= getTotalPages()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentPage >= getTotalPages() ? '#e5e7eb' : '#2563eb',
                    color: currentPage >= getTotalPages() ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPage >= getTotalPages() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => currentPage < getTotalPages() && (e.target.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => currentPage < getTotalPages() && (e.target.style.backgroundColor = '#2563eb')}
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
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Export Audit Logs</h2>
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '24px' }}>You have {getTotalPages()} pages of logs. What would you like to export?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: exportScope === 'current' ? '#dbeafe' : '#f9fafb', borderRadius: '8px', border: `2px solid ${exportScope === 'current' ? '#2563eb' : '#e5e7eb'}`, transition: 'all 0.2s' }}>
                <input
                  type="radio"
                  name="exportScope"
                  value="current"
                  checked={exportScope === 'current'}
                  onChange={(e) => setExportScope(e.target.value)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>Current Page</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Export only page {currentPage} ({logs.length} logs)</div>
                </div>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: exportScope === 'all' ? '#dbeafe' : '#f9fafb', borderRadius: '8px', border: `2px solid ${exportScope === 'all' ? '#2563eb' : '#e5e7eb'}`, transition: 'all 0.2s' }}>
                <input
                  type="radio"
                  name="exportScope"
                  value="all"
                  checked={exportScope === 'all'}
                  onChange={(e) => setExportScope(e.target.value)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>All Pages</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Export all {totalLogs} matching logs</div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowExportModal(false)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#111827',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#d1d5db')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#e5e7eb')}
              >
                Cancel
              </button>
              <button
                onClick={() => handleExport('csv', exportScope)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
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
