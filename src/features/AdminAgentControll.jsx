import React, { useState, useEffect, useCallback } from "react";
import { 
  FaRobot, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaChartLine,
  FaShieldAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaCog,
  FaPlayCircle,
  FaPauseCircle
} from "react-icons/fa";
import { IoMdStats } from "react-icons/io";
import { MdSecurity } from "react-icons/md";
import api from '../utils/api';

const AdminAgentControl = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Permission levels
  const permissionLevels = [
    { value: "read", label: "Read Only", icon: FaEye, color: "blue" },
    { value: "write", label: "Read & Write", icon: FaEdit, color: "green" },
    { value: "admin", label: "Full Admin", icon: FaShieldAlt, color: "purple" },
    { value: "none", label: "No Access", icon: FaTimesCircle, color: "red" }
  ];

  // Load agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const remoteAgents = await api.llmRuntime.listAgents();
        
        // Normalize agent data
        const normalized = (remoteAgents || []).map((agent) => ({
          id: agent.id,
          name: agent.name,
          type: agent.type,
          status: agent.status || 'active',
          isActive: agent.status === 'active',
          permission: agent.permission || 'read', // Default permission
          environment: agent.config?.environment,
          checkInterval: agent.checkInterval,
          lastActivity: agent.lastActivity || new Date().toISOString(),
          tasksCompleted: Math.floor(Math.random() * 100), // Mock data
          successRate: Math.floor(Math.random() * 20) + 80, // Mock data
        }));

        setAgents(normalized);
      } catch (err) {
        console.error('Failed to fetch agents', err);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Calculate stats
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.isActive).length;
  const inactiveAgents = agents.filter(a => !a.isActive).length;
  const avgSuccessRate = agents.length > 0 
    ? (agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length).toFixed(1)
    : 0;

  // Toggle agent active status
  const handleToggleAgent = useCallback(async (agentId) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      const newStatus = agent.isActive ? 'inactive' : 'active';
      
      // Update via API (you may need to implement this endpoint)
      // await api.llmRuntime.updateAgentStatus(agentId, newStatus);
      
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { ...a, isActive: !a.isActive, status: newStatus }
          : a
      ));
    } catch (err) {
      console.error('Failed to toggle agent status', err);
    }
  }, [agents]);

  // Open permission modal
  const handlePermissionClick = useCallback((agent) => {
    setSelectedAgent(agent);
    setShowPermissionModal(true);
  }, []);

  // Update agent permission
  const handlePermissionUpdate = useCallback(async (newPermission) => {
    if (!selectedAgent) return;

    try {
      // Update via API (implement this endpoint)
      // await api.llmRuntime.updateAgentPermission(selectedAgent.id, newPermission);
      
      setAgents(prev => prev.map(a =>
        a.id === selectedAgent.id
          ? { ...a, permission: newPermission }
          : a
      ));
      
      setShowPermissionModal(false);
      setSelectedAgent(null);
    } catch (err) {
      console.error('Failed to update permission', err);
    }
  }, [selectedAgent]);

  // Get permission badge color
  const getPermissionColor = (permission) => {
    const colors = {
      read: "bg-blue-100 text-blue-800 border-blue-200",
      write: "bg-green-100 text-green-800 border-green-200",
      admin: "bg-purple-100 text-purple-800 border-purple-200",
      none: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[permission] || colors.read;
  };

  const statsCards = [
    {
      icon: FaRobot,
      value: totalAgents,
      label: "Total AI Agents",
      sublabel: "System-wide agents",
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      icon: FaCheckCircle,
      value: activeAgents,
      label: "Active Agents",
      sublabel: "Currently running",
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600"
    },
    {
      icon: FaTimesCircle,
      value: inactiveAgents,
      label: "Inactive Agents",
      sublabel: "Paused or stopped",
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      icon: FaChartLine,
      value: `${avgSuccessRate}%`,
      label: "Avg Success Rate",
      sublabel: "Overall performance",
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-10">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="pt-6">
          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FaRobot className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  AI Agent Control Center
                </h1>
                <p className="text-slate-600 mt-1">Manage, monitor, and configure all AI agents from one central dashboard</p>
              </div>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center shadow-sm`}>
                      <Icon className={`${stat.iconColor} text-2xl`} />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-slate-800 font-semibold text-lg mb-1">{stat.label}</h3>
                  <p className="text-slate-500 text-sm">{stat.sublabel}</p>
                </div>
              );
            })}
          </div>

          {/* AGENTS SECTION HEADER */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center shadow-md">
                <IoMdStats className="text-white text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">All AI Agents</h2>
            </div>
            <div className="text-sm text-slate-600">
              {totalAgents} agent{totalAgents !== 1 ? 's' : ''} configured
            </div>
          </div>

          {/* AGENTS TABLE */}
          {loading ? (
            <div className="flex items-center justify-center p-20 bg-white rounded-2xl shadow-lg border border-slate-200">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading agents...</p>
              </div>
            </div>
          ) : agents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-20 text-center">
              <FaRobot className="text-slate-300 text-6xl mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium mb-2">No AI agents found</p>
              <p className="text-slate-400 text-sm">Create your first agent to get started</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Environment
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Permission
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Tasks
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Success Rate
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agents.map((agent) => (
                      <tr
                        key={agent.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* Agent Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              agent.isActive ? 'bg-gradient-to-br from-emerald-400 to-green-600' : 'bg-gradient-to-br from-slate-300 to-slate-500'
                            }`}>
                              <FaRobot className="text-white text-lg" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{agent.name}</div>
                              <div className="text-xs text-slate-500">ID: {agent.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {agent.type}
                          </span>
                        </td>

                        {/* Environment */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-700">
                            {agent.environment || 'N/A'}
                          </span>
                        </td>

                        {/* Permission */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handlePermissionClick(agent)}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getPermissionColor(agent.permission)} hover:shadow-md transition-all`}
                          >
                            <MdSecurity className="text-sm" />
                            {agent.permission}
                          </button>
                        </td>

                        {/* Tasks */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">{agent.tasksCompleted}</span>
                            <span className="text-xs text-slate-500">completed</span>
                          </div>
                        </td>

                        {/* Success Rate */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 w-20">
                              <div
                                className={`h-2 rounded-full ${
                                  agent.successRate >= 90 ? 'bg-emerald-500' :
                                  agent.successRate >= 70 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${agent.successRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{agent.successRate}%</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              agent.isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${
                              agent.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}></span>
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {/* Toggle Button */}
                            <button
                              onClick={() => handleToggleAgent(agent.id)}
                              className={`p-2 rounded-lg transition-all ${
                                agent.isActive
                                  ? 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-600'
                              }`}
                              title={agent.isActive ? 'Pause agent' : 'Activate agent'}
                            >
                              {agent.isActive ? (
                                <FaPauseCircle className="text-lg" />
                              ) : (
                                <FaPlayCircle className="text-lg" />
                              )}
                            </button>

                            {/* Settings Button */}
                            <button
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all"
                              title="Configure agent"
                            >
                              <FaCog className="text-lg" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PERMISSION MODAL */}
      {showPermissionModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-scaleIn">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <MdSecurity className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Set Permission Level
                </h2>
                <p className="text-sm text-slate-500">For agent: {selectedAgent.name}</p>
              </div>
            </div>

            {/* Permission Options */}
            <div className="space-y-3 mb-6">
              {permissionLevels.map((perm) => {
                const Icon = perm.icon;
                const isSelected = selectedAgent.permission === perm.value;
                
                return (
                  <button
                    key={perm.value}
                    onClick={() => handlePermissionUpdate(perm.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      isSelected
                        ? `border-${perm.color}-500 bg-${perm.color}-50 shadow-md`
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected 
                        ? `bg-${perm.color}-500 text-white` 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="text-lg" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-semibold ${isSelected ? `text-${perm.color}-900` : 'text-slate-800'}`}>
                        {perm.label}
                      </div>
                      <div className="text-xs text-slate-500">
                        {perm.value === 'read' && 'View only, no modifications'}
                        {perm.value === 'write' && 'Can view and modify settings'}
                        {perm.value === 'admin' && 'Full control over agent'}
                        {perm.value === 'none' && 'No access to this agent'}
                      </div>
                    </div>
                    {isSelected && (
                      <FaCheckCircle className={`text-${perm.color}-600 text-xl`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowPermissionModal(false);
                setSelectedAgent(null);
              }}
              className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
      `}</style>
    </div>
  );
};

export default AdminAgentControl;