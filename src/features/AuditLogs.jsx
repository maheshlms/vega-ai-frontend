import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaClock } from 'react-icons/fa';

const AuditLogs = () => {
  // Mock audit log data
  const auditLogs = [
    {
      id: 1,
      timestamp: '2025-01-15 14:23:45',
      agent: 'Astra',
      action: 'Certificate Renewal',
      status: 'success',
      details: 'SSL certificate renewed for production.pingfederate.com',
      duration: '2.3s'
    },
    {
      id: 2,
      timestamp: '2025-01-15 13:15:22',
      agent: 'Nexa',
      action: 'User Sync',
      status: 'success',
      details: 'Synchronized 1,247 users from Active Directory',
      duration: '5.1s'
    },
    {
      id: 3,
      timestamp: '2025-01-15 12:45:10',
      agent: 'Orion',
      action: 'Access Policy Update',
      status: 'warning',
      details: 'Policy updated with 3 new rules, 1 deprecated rule removed',
      duration: '1.8s'
    },
    {
      id: 4,
      timestamp: '2025-01-15 11:30:05',
      agent: 'Astra',
      action: 'License Check',
      status: 'success',
      details: 'License valid until 2026-03-15, 425 days remaining',
      duration: '0.9s'
    },
    {
      id: 5,
      timestamp: '2025-01-15 10:20:33',
      agent: 'Nexa',
      action: 'Schema Validation',
      status: 'success',
      details: 'Directory schema validated, no inconsistencies found',
      duration: '3.2s'
    },
    {
      id: 6,
      timestamp: '2025-01-15 09:15:18',
      agent: 'Orion',
      action: 'MFA Configuration',
      status: 'info',
      details: 'MFA enabled for 45 new users in Sales department',
      duration: '4.5s'
    },
    {
      id: 7,
      timestamp: '2025-01-15 08:05:42',
      agent: 'Astra',
      action: 'Token Rotation',
      status: 'success',
      details: 'OAuth tokens rotated for 234 active sessions',
      duration: '6.7s'
    },
    {
      id: 8,
      timestamp: '2025-01-15 07:30:15',
      agent: 'Nexa',
      action: 'Backup Completed',
      status: 'success',
      details: 'Full directory backup completed (2.3 GB)',
      duration: '45.2s'
    },
    {
      id: 9,
      timestamp: '2025-01-14 23:45:20',
      agent: 'Orion',
      action: 'Security Scan',
      status: 'warning',
      details: 'Security scan completed, 2 medium-risk findings detected',
      duration: '12.4s'
    },
    {
      id: 10,
      timestamp: '2025-01-14 22:30:08',
      agent: 'Astra',
      action: 'Connection Test',
      status: 'success',
      details: 'All federation connections tested successfully',
      duration: '3.8s'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'info':
        return <FaInfoCircle className="text-blue-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: 'bg-green-100 text-green-700 border border-green-300',
      warning: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      info: 'bg-blue-100 text-blue-700 border border-blue-300'
    };
    return badges[status] || 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Audit Logs</h1>
          <p className="text-sm text-gray-500">
            Track all agent activities and system events
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">247</div>
                <div className="text-xs text-gray-500">Successful Actions</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FaExclamationTriangle className="text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">12</div>
                <div className="text-xs text-gray-500">Warnings</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaInfoCircle className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">45</div>
                <div className="text-xs text-gray-500">Info Events</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaClock className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">3.2s</div>
                <div className="text-xs text-gray-500">Avg Duration</div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {log.agent[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{log.agent}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {log.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;