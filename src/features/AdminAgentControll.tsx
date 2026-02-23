import React, { useState, useEffect } from "react";
import { 
  FaRobot, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaChartLine,
  FaClock,
  FaBolt,
  FaShieldAlt,
  FaExclamationTriangle,
  FaPowerOff,
  FaUndo
} from "react-icons/fa";
import { IoMdStats } from "react-icons/io";
import { MdSecurity, MdSpeed } from "react-icons/md";
import api from '../utils/api';
import { auth } from '../utils/auth';
import FloatingChat from './FloatingChat';
import { toast } from "react-toastify";

// Add custom scrollbar styles
const customStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
    transition: background 0.2s ease;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  .custom-scrollbar {
    scroll-behavior: smooth;
  }
`;

interface Agent {
  id: string;
  _id: string;
  name: string;
  type: string;
  status: string;
  isActive: boolean;
  permission: string;
  environment?: string;
  checkInterval?: number;
  lastActivity: string;
  createdBy: string;
  lastUsed: string;
  tasksCompleted: number;
  tasksGiven: number;
  tasksInProcess: number;
  tasksFailed: number;
  successRate: number;
  responseTime: number;
  killswitchActivated: boolean;
  killswitchActivatedBy?: string;
  killswitchReason?: string;
  killswitchActivatedAt?: string;
  softDeleted: boolean;
}

interface RemoteAgent {
  id: string;
  _id?: string;
  name: string;
  type: string;
  status?: string;
  permission?: string;
  config?: {
    environment?: string;
  };
  checkInterval?: number;
  lastActivity?: string;
  created_by?: string;
  last_used_at?: string;
  killswitch_activated?: boolean;
  killswitch_activated_by?: string;
  killswitch_reason?: string;
  killswitch_activated_at?: string;
  soft_deleted?: boolean;
}

interface SystemHealth {
  cpu: number;
  memory: number;
  latency: number;
}

interface ActivityDataPoint {
  day: string;
  fullDate: string;
  tasksCompleted: number;
  tasksGiven: number;
  tasksInProcess: number;
  tasksFailed: number;
}

interface EnvironmentStats {
  [key: string]: number;
}

interface TypeStats {
  [key: string]: number;
}

interface DailyMetrics {
  agent_id: string;
  date: string;
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  avg_response_time_ms: number;
  min_response_time_ms: number;
  max_response_time_ms: number;
  success_rate: number;
}

interface AgentMetrics {
  agent_id: string;
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  overall_success_rate: number;
  avg_response_time_ms: number;
  min_response_time_ms: number;
  max_response_time_ms: number;
}

interface DashboardMetricsResponse {
  daily_metrics_past_7_days: DailyMetrics[];
  agent_metrics: AgentMetrics[];
  timestamp: string;
}

const AdminAgentControll: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpu: 0,
    memory: 0,
    latency: 0
  });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentModal, setShowAgentModal] = useState<boolean>(false);
  const [showKillswitchModal, setShowKillswitchModal] = useState<boolean>(false);
  const [killswitchReason, setKillswitchReason] = useState<string>('');
  const [killswitchLoading, setKillswitchLoading] = useState<boolean>(false);

  // Re-enable state
  const [showReenableModal, setShowReenableModal] = useState<boolean>(false);
  const [reenableReason, setReenableReason] = useState<string>('');
  const [reenableLoading, setReenableLoading] = useState<boolean>(false);
  
  // Telemetry state
  const [telemetryLoading, setTelemetryLoading] = useState<boolean>(true);
  const [telemetryData, setTelemetryData] = useState<DashboardMetricsResponse | null>(null);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  
  const isAdmin = auth.isAdmin();

  // Load agents from API
  useEffect(() => {
    const fetchAgents = async (): Promise<void> => {
      try {
        const remoteAgents: RemoteAgent[] = await api.llmRuntime.listAgents();
        
        console.log('=== RAW AGENTS FROM API (FULL RESPONSE) ===');
        console.log('Number of agents:', remoteAgents?.length || 0);
        
        if (remoteAgents && remoteAgents.length > 0) {
          console.log('First agent structure:', remoteAgents[0]);
          console.log('Agent ID fields available:');
          remoteAgents.forEach((agent, idx) => {
            console.log(`  Agent ${idx + 1} (${agent.name}):`);
            console.log(`    - id: ${agent.id}`);
            console.log(`    - _id: ${agent._id}`);
          });
        }
        
        const normalized: Agent[] = (remoteAgents || []).map((agent) => {
          const agentId = agent.id;
          
          console.log(`Normalizing agent: ${agent.name}, using ID: ${agentId}`);
          
          return {
            id: agentId,
            _id: agentId,
            name: agent.name,
            type: agent.type,
            status: agent.status || 'enabled',
            isActive: agent.status === 'enabled' || agent.status === 'active',
            permission: agent.permission || 'read',
            environment: agent.config?.environment,
            checkInterval: agent.checkInterval,
            lastActivity: agent.lastActivity || new Date().toISOString(),
            createdBy: agent.created_by || 'Unknown',
            lastUsed: agent.last_used_at || new Date().toISOString(),
            tasksCompleted: Math.floor(Math.random() * 100),
            tasksGiven: Math.floor(Math.random() * 120) + 100,
            tasksInProcess: Math.floor(Math.random() * 20),
            tasksFailed: Math.floor(Math.random() * 10),
            successRate: Math.floor(Math.random() * 20) + 80,
            responseTime: Math.floor(Math.random() * 500) + 100,
            killswitchActivated: agent.killswitch_activated || false,
            killswitchActivatedBy: agent.killswitch_activated_by,
            killswitchReason: agent.killswitch_reason,
            killswitchActivatedAt: agent.killswitch_activated_at,
            softDeleted: agent.soft_deleted || false,
          };
        });

        console.log('=== NORMALIZED AGENTS ===');
        normalized.forEach((agent, idx) => {
          console.log(`Agent ${idx + 1}: ${agent.name}, ID: ${agent.id}`);
        });
        
        setAgents(normalized);
      } catch (err) {
        console.error('Failed to fetch agents', err);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();

    // Simulate system health updates
    const healthInterval = setInterval(() => {
      setSystemHealth({
        cpu: Math.floor(Math.random() * 40) + 30,
        memory: Math.floor(Math.random() * 30) + 50,
        latency: Math.floor(Math.random() * 50) + 80
      });
    }, 3000);

    return () => clearInterval(healthInterval);
  }, []);

  // Load telemetry data from API
  useEffect(() => {
    const fetchTelemetry = async (): Promise<void> => {
      try {
        const token = auth.getToken();
        if (!token) {
          const errorMsg = 'No authentication token available for telemetry';
          console.warn(errorMsg);
          setTelemetryError(errorMsg);
          setTelemetryLoading(false);
          return;
        }

        const response = await fetch('/api/v1/telemetry/dashboard?days=7', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data: DashboardMetricsResponse = await response.json();
          console.info('Telemetry data fetched successfully');
          setTelemetryData(data);
          setTelemetryError(null);
        } else {
          const errorMsg = `Telemetry endpoint returned status ${response.status}`;
          console.error('Failed to fetch telemetry:', errorMsg);
          setTelemetryError(errorMsg);
        }
      } catch (error: any) {
        const errorMsg = `Unable to reach telemetry endpoint: ${error?.message || 'Network error'}`;
        console.error('Error fetching telemetry:', error);
        setTelemetryError(errorMsg);
      } finally {
        setTelemetryLoading(false);
      }
    };

    fetchTelemetry();
  }, []);

  // Calculate real-time statistics
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.isActive && !a.killswitchActivated && !a.softDeleted).length;
  const inactiveAgents = agents.filter(a => !a.isActive || a.killswitchActivated || a.softDeleted).length;
  
  // Use telemetry data if available, otherwise fallback to agent-based calculations
  const avgSuccessRate = telemetryData?.agent_metrics?.length
    ? (telemetryData.agent_metrics.reduce((sum, m) => sum + m.overall_success_rate, 0) / telemetryData.agent_metrics.length).toFixed(1)
    : agents.length > 0 
      ? (agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length).toFixed(1)
      : '0';
  
  const totalTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  
  const avgResponseTime = telemetryData?.agent_metrics?.length
    ? Math.floor(telemetryData.agent_metrics.reduce((sum, m) => sum + m.avg_response_time_ms, 0) / telemetryData.agent_metrics.length)
    : agents.length > 0
      ? Math.floor(agents.reduce((sum, a) => sum + a.responseTime, 0) / agents.length)
      : 0;

  // Get environment distribution
  const environmentStats: EnvironmentStats = agents.reduce((acc, agent) => {
    const env = agent.environment || 'Unknown';
    acc[env] = (acc[env] || 0) + 1;
    return acc;
  }, {} as EnvironmentStats);

  // Get type distribution
  const typeStats: TypeStats = agents.reduce((acc, agent) => {
    acc[agent.type] = (acc[agent.type] || 0) + 1;
    return acc;
  }, {} as TypeStats);

  // activity timeline (last 7 days) - only from telemetry data, no fallback to mock
  const activityData: ActivityDataPoint[] = telemetryData?.daily_metrics_past_7_days?.length 
    ? telemetryData.daily_metrics_past_7_days.map(metric => {
        const date = new Date(metric.date);
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          tasksCompleted: metric.successful_tasks,
          tasksGiven: metric.total_tasks,
          tasksInProcess: 0, // Not available in telemetry data
          tasksFailed: metric.failed_tasks
        };
      })
    : [];

  const maxTaskValue = Math.max(...activityData.map(d => d.tasksGiven));

  // Handle kill switch activation
  const handleKillswitchClick = (): void => {
    console.log('Kill switch button clicked for agent:', selectedAgent);
    console.log('Agent ID to be killed:', selectedAgent?.id);
    setShowKillswitchModal(true);
  };

  const handleKillswitchConfirm = async (): Promise<void> => {
    if (!killswitchReason.trim()) {
      toast.info('Please provide a reason for activating the kill switch');
      return;
    }

    if (!selectedAgent) return;

    console.log('=== KILL SWITCH ACTIVATION DEBUG ===');
    console.log('Agent ID:', selectedAgent.id);
    console.log('Agent Name:', selectedAgent.name);
    console.log('Reason:', killswitchReason);
    console.log('API endpoint will be:', `/api/v1/agents/${selectedAgent.id}/killswitch`);

    setKillswitchLoading(true);
    
    try {
      console.log('Calling API with payload:', { reason: killswitchReason });
      const response = await api.llmRuntime.activateKillswitch(selectedAgent.id, { 
        reason: killswitchReason 
      });
      
      console.log('Kill switch activated successfully:', response);
      
      // Update agent in local state
      setAgents(prev => prev.map(agent => 
        agent.id === selectedAgent.id 
          ? { ...agent, killswitchActivated: true, isActive: false, status: 'killed' }
          : agent
      ));
      
      // Update selected agent
      setSelectedAgent(prev => prev ? ({
        ...prev,
        killswitchActivated: true,
        isActive: false,
        status: 'killed'
      }) : null);
      
      setShowKillswitchModal(false);
      setShowAgentModal(false);
      setKillswitchReason('');
      
      toast.success('Kill switch activated successfully. Agent has been terminated.');
    } catch (error: any) {
      console.error('=== KILL SWITCH ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      toast.error('Failed to activate kill switch: ' + errorMessage);
    } finally {
      setKillswitchLoading(false);
    }
  };

  const handleKillswitchCancel = (): void => {
    setShowKillswitchModal(false);
    setKillswitchReason('');
  };

  // Re-enable handlers
  const handleReenableClick = (): void => {
    setShowReenableModal(true);
  };

  const handleReenableConfirm = async (): Promise<void> => {
    if (!reenableReason.trim()) {
      toast.info('Please provide a reason for re-enabling this agent');
      return;
    }
    if (!selectedAgent) return;

    setReenableLoading(true);
    try {
      // Call PATCH /api/v1/agents/{agent_id} to reset all killswitch fields.
      // soft_deleted must be explicitly sent as boolean (not null/undefined)
      // because the backend AgentResponse Pydantic model requires a valid bool.
      await api.llmRuntime.updateAgent(selectedAgent.id, {
        killswitch_activated: false,
        killswitch_activated_at: "",
        killswitch_activated_by: "",
        killswitch_reason: "",
        soft_deleted: false,
        status: "active"
      });

      const update = {
        killswitchActivated: false,
        killswitchActivatedBy: undefined as string | undefined,
        killswitchReason: undefined as string | undefined,
        killswitchActivatedAt: undefined as string | undefined,
        isActive: true,
        status: 'active'
      };

      // Update agent list state
      setAgents(prev => prev.map(a => a.id === selectedAgent.id ? { ...a, ...update } : a));
      // Update selected agent state
      setSelectedAgent(prev => prev ? { ...prev, ...update } : null);

      setShowReenableModal(false);
      setShowAgentModal(false);
      setReenableReason('');
      toast.success(`Agent "${selectedAgent.name}" has been re-enabled and is now active.`);
    } catch (error: any) {
      console.error('Re-enable error:', error);
      toast.error('Failed to re-enable agent: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
    } finally {
      setReenableLoading(false);
    }
  };

  const handleReenableCancel = (): void => {
    setShowReenableModal(false);
    setReenableReason('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Inject custom scrollbar styles */}
      <style>{customStyles}</style>
      
      <div className="max-w-[1920px] mx-auto px-8 py-6">
        
        {/* HEADER */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>
                AI Agent Dashboard
              </h1>
              <p className="text-gray-500 text-lg">Real-time monitoring and analytics for your AI workforce</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                <div className="text-sm font-semibold text-gray-900">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg border ${systemHealth.cpu < 70 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="text-xs text-gray-500 mb-1">System Status</div>
                <div className={`text-sm font-semibold ${systemHealth.cpu < 70 ? 'text-green-700' : 'text-yellow-700'}`}>
                  {systemHealth.cpu < 70 ? 'Healthy' : 'Moderate'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Agents */}
          <div className="bg-white border shadow-md border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <FaRobot className="text-blue-600 text-2xl" />
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Agents</div>
                <div className="text-4xl font-bold text-gray-900">{totalAgents}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">System-wide deployment</span>
            </div>
          </div>

          {/* Active Agents */}
          <div className="bg-white border shadow-md  border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <FaCheckCircle className="text-green-600 text-2xl" />
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Active Now</div>
                <div className="text-4xl font-bold text-gray-900">{activeAgents}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Inactive Agents */}
          <div className="bg-white border shadow-md border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <FaTimesCircle className="text-orange-600 text-2xl" />
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Inactive</div>
                <div className="text-4xl font-bold text-gray-900">{inactiveAgents}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Paused or killed</span>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white border shadow-md border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <FaChartLine className="text-purple-600 text-2xl" />
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Success Rate</div>
                <div className="text-4xl font-bold text-gray-900">{avgSuccessRate}%</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${avgSuccessRate}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">Avg performance</span>
            </div>
          </div>
        </div>

        {/* SECONDARY STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Tasks Completed */}
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <FaBolt className="text-blue-600 text-xl" />
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Tasks Completed</div>
                <div className="text-3xl font-bold text-gray-900">{totalTasks.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Average Response Time */}
          <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <MdSpeed className="text-green-600 text-xl" />
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Avg Response Time</div>
                <div className="text-3xl font-bold text-gray-900">{avgResponseTime}ms</div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <MdSecurity className="text-purple-600 text-xl" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">System Health</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-16">CPU:</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${systemHealth.cpu < 70 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${systemHealth.cpu}%` }}
                      />
                    </div>
                    <span className="text-gray-700 font-semibold w-8">{systemHealth.cpu}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-16">Memory:</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${systemHealth.memory}%` }}
                      />
                    </div>
                    <span className="text-gray-700 font-semibold w-8">{systemHealth.memory}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* TASK OVERVIEW CHART */}
          <div className="lg:col-span-2 shadow-md bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FaChartLine className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Task Overview (This Week)</h3>
                  <p className="text-sm text-gray-500">AI Agent task performance metrics</p>
                </div>
              </div>
            </div>
            
            {telemetryError ? (
              <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-center">
                  <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-3" />
                  <p className="text-red-700 font-medium">Telemetry Data Unavailable</p>
                  <p className="text-red-600 text-sm mt-1">{telemetryError}</p>
                </div>
              </div>
            ) : (
              <>
            {/* Chart Area */}
            <div className="relative h-64 mb-4">
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-400 pr-2">
                <span>{maxTaskValue}</span>
                <span>{Math.floor(maxTaskValue * 0.75)}</span>
                <span>{Math.floor(maxTaskValue * 0.5)}</span>
                <span>{Math.floor(maxTaskValue * 0.25)}</span>
                <span>0</span>
              </div>

              <div className="absolute left-12 right-0 top-0 bottom-6">
                <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="700" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="60" x2="700" y2="60" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="120" x2="700" y2="120" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="180" x2="700" y2="180" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="240" x2="700" y2="240" stroke="#e5e7eb" strokeWidth="1" />
                  <polyline points={activityData.map((d, i) => { const x = (i / (activityData.length - 1)) * 700; const y = 240 - (d.tasksGiven / maxTaskValue) * 240; return `${x},${y}`; }).join(' ')} fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={activityData.map((d, i) => { const x = (i / (activityData.length - 1)) * 700; const y = 240 - (d.tasksCompleted / maxTaskValue) * 240; return `${x},${y}`; }).join(' ')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={activityData.map((d, i) => { const x = (i / (activityData.length - 1)) * 700; const y = 240 - (d.tasksInProcess / maxTaskValue) * 240; return `${x},${y}`; }).join(' ')} fill="none" stroke="#eab308" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={activityData.map((d, i) => { const x = (i / (activityData.length - 1)) * 700; const y = 240 - (d.tasksFailed / maxTaskValue) * 240; return `${x},${y}`; }).join(' ')} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {activityData.map((d, i) => { const x = (i / (activityData.length - 1)) * 700; const y = 240 - (d.tasksGiven / maxTaskValue) * 240; return <circle key={`given-${i}`} cx={x} cy={y} r="4" fill="#22c55e" />; })}
                  {activityData.map((d, i) => { const x = (i / (activityData.length - 1)) * 700; const y = 240 - (d.tasksCompleted / maxTaskValue) * 240; return <circle key={`completed-${i}`} cx={x} cy={y} r="4" fill="#3b82f6" />; })}
                </svg>
              </div>

              <div className="absolute left-12 right-0 bottom-0 flex justify-between text-xs text-gray-500">
                {activityData.map((d, i) => (
                  <div key={i} className="text-center">
                    <div className="font-medium">{d.day}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend and Stats */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-700">Tasks Given</span>
                  </div>
                  <div className="ml-auto">
                    <div className="text-sm font-bold text-green-600">
                      {activityData.reduce((sum, d) => sum + d.tasksGiven, 0)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-700">Completed</span>
                  </div>
                  <div className="ml-auto">
                    <div className="text-sm font-bold text-blue-600">
                      {activityData.reduce((sum, d) => sum + d.tasksCompleted, 0)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-700">In Process</span>
                  </div>
                  <div className="ml-auto">
                    <div className="text-sm font-bold text-yellow-600">
                      {activityData.reduce((sum, d) => sum + d.tasksInProcess, 0)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-700">Failed</span>
                  </div>
                  <div className="ml-auto">
                    <div className="text-sm font-bold text-red-600">
                      {activityData.reduce((sum, d) => sum + d.tasksFailed, 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </div>

          {/* AGENT DISTRIBUTION */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Agent Distribution</h3>
            <p className="text-sm text-gray-500 mb-6">By environment and type</p>
            
            {/* Environment Stats */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 mb-3">Environments</div>
              <div className="space-y-3">
                {Object.entries(environmentStats).map(([env, count]) => (
                  <div key={env}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{env}</span>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(count / totalAgents) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Type Stats */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3">Agent Types</div>
              <div className="space-y-3">
                {Object.entries(typeStats).map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{type}</span>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(count / totalAgents) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ADDITIONAL VISUAL CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* AGENT ACTIVITY STATUS */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Agent Activity Status</h3>
              <p className="text-sm text-gray-500">Real-time agent availability</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">Active Agents</span>
                    </div>
                    <span className="text-lg font-bold text-green-700">{activeAgents}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0}%` }}
                    >
                      {activeAgents > 0 && (
                        <span className="text-xs font-bold text-white">
                          {Math.round((activeAgents / totalAgents) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Inactive Agents</span>
                    </div>
                    <span className="text-lg font-bold text-gray-700">{inactiveAgents}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-gray-400 to-gray-500 h-4 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${totalAgents > 0 ? (inactiveAgents / totalAgents) * 100 : 0}%` }}
                    >
                      {inactiveAgents > 0 && (
                        <span className="text-xs font-bold text-white">
                          {Math.round((inactiveAgents / totalAgents) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Type Breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Agents by Type</h4>
              <div className="space-y-3">
                {Object.entries(typeStats).map(([type, count]) => {
                  const activeCount = agents.filter(a => a.type === type && a.isActive && !a.killswitchActivated && !a.softDeleted).length;
                  const inactiveCount = count - activeCount;
                  
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 font-medium">{type}</span>
                        <span className="text-xs text-gray-500">{count} total</span>
                      </div>
                      <div className="flex gap-1 h-6">
                        {activeCount > 0 && (
                          <div 
                            className="bg-green-500 rounded flex items-center justify-center text-xs font-semibold text-white"
                            style={{ width: `${(activeCount / count) * 100}%` }}
                            title={`${activeCount} active`}
                          >
                            {activeCount}
                          </div>
                        )}
                        {inactiveCount > 0 && (
                          <div 
                            className="bg-gray-300 rounded flex items-center justify-center text-xs font-semibold text-gray-700"
                            style={{ width: `${(inactiveCount / count) * 100}%` }}
                            title={`${inactiveCount} inactive`}
                          >
                            {inactiveCount}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs text-blue-600 mb-1">Avg Response</div>
                  <div className="text-lg font-bold text-blue-700">{avgResponseTime}ms</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-xs text-purple-600 mb-1">Total Tasks</div>
                  <div className="text-lg font-bold text-purple-700">{totalTasks}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RESPONSE TIME CHART */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-gray-900">Response Time Analysis</h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {agents.length} agents
                </span>
              </div>
              <p className="text-sm text-gray-500">Average response times by agent (all statuses)</p>
            </div>
            
            {/* Scrollable Agent List */}
            <div className="flex-1 overflow-y-auto max-h-[320px] pr-2 space-y-3 custom-scrollbar">
              {agents.map((agent) => (
                <div 
                  key={agent.id} 
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    agent.killswitchActivated || agent.softDeleted ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {agent.killswitchActivated ? (
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center" title="Killed">
                        <FaPowerOff className="text-red-600 text-xs" />
                      </div>
                    ) : agent.softDeleted ? (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center" title="Deleted">
                        <FaTimesCircle className="text-gray-500 text-xs" />
                      </div>
                    ) : agent.isActive ? (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center" title="Active">
                        <FaCheckCircle className="text-green-600 text-xs" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center" title="Inactive">
                        <FaTimesCircle className="text-gray-400 text-xs" />
                      </div>
                    )}
                  </div>

                  <div className="w-28 flex-shrink-0">
                    <div className={`text-sm font-medium truncate ${
                      agent.killswitchActivated || agent.softDeleted ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      {agent.name}
                    </div>
                    <div className="text-xs text-gray-400">{agent.type}</div>
                  </div>

                  <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                    <div 
                      className={`h-8 rounded-full transition-all duration-700 flex items-center justify-end pr-2 ${
                        agent.killswitchActivated || agent.softDeleted ? 'bg-gray-300' :
                        agent.responseTime < 200 ? 'bg-green-500' :
                        agent.responseTime < 400 ? 'bg-blue-500' :
                        agent.responseTime < 500 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((agent.responseTime / 600) * 100, 100)}%` }}
                    >
                      <span className={`text-xs font-semibold ${
                        agent.killswitchActivated || agent.softDeleted ? 'text-gray-600' : 'text-white'
                      }`}>
                        {agent.responseTime}ms
                      </span>
                    </div>
                  </div>

                  {agent.killswitchActivated && (
                    <span className="flex-shrink-0 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                      Killed
                    </span>
                  )}
                  {agent.softDeleted && !agent.killswitchActivated && (
                    <span className="flex-shrink-0 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-300">
                      Deleted
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Response Time Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded flex-shrink-0"></div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Excellent</div>
                    <div className="text-xs text-gray-500">&lt;200ms</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded flex-shrink-0"></div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Good</div>
                    <div className="text-xs text-gray-500">200-400ms</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded flex-shrink-0"></div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Fair</div>
                    <div className="text-xs text-gray-500">400-500ms</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded flex-shrink-0"></div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Poor</div>
                    <div className="text-xs text-gray-500">&gt;500ms</div>
                  </div>
                </div>
              </div>
              
              {/* Status Legend */}
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-600 text-sm flex-shrink-0" />
                  <span className="text-xs text-gray-600">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaPowerOff className="text-red-600 text-sm flex-shrink-0" />
                  <span className="text-xs text-gray-600">Killed</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaTimesCircle className="text-gray-400 text-sm flex-shrink-0" />
                  <span className="text-xs text-gray-600">Inactive</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaTimesCircle className="text-gray-500 text-sm flex-shrink-0" />
                  <span className="text-xs text-gray-600">Deleted</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AGENT LIST */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">All AI Agents</h3>
                <p className="text-sm text-gray-500">{totalAgents} agents currently configured</p>
              </div>
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold">
                View Details
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            </div>
          ) : agents.length === 0 ? (
            <div className="p-12 text-center">
              <FaRobot className="text-gray-300 text-5xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No agents configured</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Environment</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tasks</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Success Rate</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Response Time</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agents.map((agent) => (
                    <tr 
                      key={agent.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedAgent(agent);
                        setShowAgentModal(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            agent.isActive && !agent.killswitchActivated ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <FaRobot className={agent.isActive && !agent.killswitchActivated ? 'text-green-600' : 'text-gray-400'} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{agent.name}</div>
                            <div className="text-xs text-gray-500">ID: {agent.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {agent.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {agent.environment || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{agent.tasksCompleted}</div>
                        <div className="text-xs text-gray-500">completed</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 w-20">
                            <div
                              className={`h-2 rounded-full ${
                                agent.successRate >= 90 ? 'bg-green-500' :
                                agent.successRate >= 70 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${agent.successRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{agent.successRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{agent.responseTime}ms</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent.killswitchActivated ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <FaPowerOff className="w-2 h-2" />
                            Killed
                          </span>
                        ) : agent.softDeleted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            Deleted
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            agent.isActive
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              agent.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}></span>
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat */}
      <FloatingChat />

      {/* AGENT DETAIL MODAL */}
      {showAgentModal && selectedAgent && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowAgentModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    selectedAgent.isActive && !selectedAgent.killswitchActivated ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <FaRobot className={`${selectedAgent.isActive && !selectedAgent.killswitchActivated ? 'text-green-600' : 'text-gray-400'} text-2xl`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h2>
                    <p className="text-sm text-gray-500">ID: {selectedAgent.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAgentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {selectedAgent.killswitchActivated ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-red-50 text-red-700 border-2 border-red-200">
                    <FaPowerOff className="w-3 h-3" />
                    Kill Switch Activated
                  </span>
                ) : selectedAgent.softDeleted ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border-2 border-gray-200">
                    Soft Deleted
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    selectedAgent.isActive
                      ? 'bg-green-50 text-green-700 border-2 border-green-200'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
                  }`}>
                    <span className={`w-3 h-3 rounded-full ${
                      selectedAgent.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`}></span>
                    {selectedAgent.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedAgent.type}
                </span>
              </div>

              {/* ── RE-ENABLE CARD: shown only when killswitch is on and agent is not soft-deleted ── */}
              {isAdmin && selectedAgent.killswitchActivated && !selectedAgent.softDeleted && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0 mt-0.5">
                      <FaUndo className="text-green-600 text-lg" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-green-900 mb-1">Re-enable Agent</h4>
                      {/* Show previous killswitch details if available */}
                      {(selectedAgent.killswitchActivatedBy || selectedAgent.killswitchReason) && (
                        <div className="bg-white/70 rounded-lg p-2 mb-2 border border-green-200 space-y-0.5">
                          {selectedAgent.killswitchActivatedBy && (
                            <p className="text-xs text-gray-600">
                              <span className="font-semibold">Killed by:</span> {selectedAgent.killswitchActivatedBy}
                            </p>
                          )}
                          {selectedAgent.killswitchActivatedAt && (
                            <p className="text-xs text-gray-600">
                              <span className="font-semibold">At:</span> {new Date(selectedAgent.killswitchActivatedAt).toLocaleString()}
                            </p>
                          )}
                          {selectedAgent.killswitchReason && (
                            <p className="text-xs text-gray-600">
                              <span className="font-semibold">Reason:</span> {selectedAgent.killswitchReason}
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-green-700 mb-3">
                        Restore full agent operations and make this agent available again in the Agents section.
                      </p>
                      <button
                        onClick={handleReenableClick}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <FaUndo />
                        Re-enable Agent
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Kill Switch Button — only when not already activated */}
              {isAdmin && !selectedAgent.killswitchActivated && !selectedAgent.softDeleted && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-600 text-xl flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-900 mb-1">Emergency Control</h4>
                      <p className="text-xs text-red-700 mb-3">
                        Immediately stop  agent operations and revoke access
                      </p>
                      <button
                        onClick={handleKillswitchClick}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <FaPowerOff />
                        Activate Kill Switch
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Information Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Environment</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedAgent.environment || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Response Time</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedAgent.responseTime}ms</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="text-xs text-green-600 uppercase tracking-wide mb-1">Success Rate</div>
                  <div className="text-lg font-semibold text-green-700">{selectedAgent.successRate}%</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">Tasks Completed</div>
                  <div className="text-lg font-semibold text-blue-700">{selectedAgent.tasksCompleted}</div>
                </div>
              </div>

              {/* Task Statistics */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaChartLine className="text-blue-600" />
                  Task Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700">Tasks Given</span>
                      <span className="text-sm font-bold text-gray-900">{selectedAgent.tasksGiven}</span>
                    </div>
                    <div className="bg-white rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700">Completed</span>
                      <span className="text-sm font-bold text-gray-900">{selectedAgent.tasksCompleted}</span>
                    </div>
                    <div className="bg-white rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(selectedAgent.tasksCompleted / selectedAgent.tasksGiven) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700">In Process</span>
                      <span className="text-sm font-bold text-gray-900">{selectedAgent.tasksInProcess}</span>
                    </div>
                    <div className="bg-white rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(selectedAgent.tasksInProcess / selectedAgent.tasksGiven) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700">Failed</span>
                      <span className="text-sm font-bold text-gray-900">{selectedAgent.tasksFailed}</span>
                    </div>
                    <div className="bg-white rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(selectedAgent.tasksFailed / selectedAgent.tasksGiven) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Information */}
              <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MdSecurity className="text-purple-600" />
                  Agent Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created By</span>
                    <span className="text-sm font-semibold text-gray-900 bg-white px-3 py-1 rounded-lg border border-purple-200">
                      {selectedAgent.createdBy}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Activity</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedAgent.lastActivity).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Used</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedAgent.lastUsed).toLocaleString()}
                    </span>
                  </div>
                  {selectedAgent.checkInterval && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Check Interval</span>
                      <span className="text-sm font-medium text-gray-900">{selectedAgent.checkInterval}s</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Overall Performance</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Performance Score</span>
                      <span className={`text-sm font-bold ${
                        selectedAgent.successRate >= 90 ? 'text-green-600' :
                        selectedAgent.successRate >= 70 ? 'text-blue-600' :
                        selectedAgent.successRate >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {selectedAgent.successRate >= 90 ? 'Excellent' :
                         selectedAgent.successRate >= 70 ? 'Good' :
                         selectedAgent.successRate >= 50 ? 'Fair' : 'Needs Improvement'}
                      </span>
                    </div>
                    <div className="bg-white rounded-full h-3 overflow-hidden border border-gray-300">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          selectedAgent.successRate >= 90 ? 'bg-green-500' :
                          selectedAgent.successRate >= 70 ? 'bg-blue-500' :
                          selectedAgent.successRate >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${selectedAgent.successRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl">
              <button
                onClick={() => setShowAgentModal(false)}
                className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KILL SWITCH CONFIRMATION MODAL */}
      {showKillswitchModal && selectedAgent && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleKillswitchCancel}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-600 p-6 rounded-t-2xl ">
              <div className="flex items-center gap-3 text-white ">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 ">
                  <FaPowerOff className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Activate Kill Switch</h2>
                  <p className="text-red-100 text-sm">Emergency stop for agent</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4  overflow-y-auto ">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 ">
                <div className="flex items-center gap-3 mb-2 ">
                  <FaRobot className="text-gray-600 text-xl flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{selectedAgent.name}</p>
                    <p className="text-sm text-gray-500">{selectedAgent.type}</p>
                  </div>
                </div>
                {selectedAgent.environment && (
                  <p className="text-xs text-gray-500 mt-2">
                    Environment: <span className="font-medium text-gray-700">{selectedAgent.environment}</span>
                  </p>
                )}
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <FaExclamationTriangle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">This action will immediately:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-700">
                      <li>Stop all agent operations</li>
                      <li>Revoke all active sessions</li>
                      <li>Disable agent access to systems</li>
                      <li>Require manual reactivation</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Reason for Kill Switch Activation <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={killswitchReason}
                  onChange={(e) => setKillswitchReason(e.target.value)}
                  placeholder="Explain why you're activating the kill switch..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  disabled={killswitchLoading}
                />
                <p className="text-xs text-gray-500 mt-1">This reason will be logged for audit purposes</p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={handleKillswitchCancel}
                  disabled={killswitchLoading}
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleKillswitchConfirm}
                  disabled={killswitchLoading || !killswitchReason.trim()}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {killswitchLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Activating...
                    </>
                  ) : (
                    <>
                      <FaPowerOff />
                      Activate Kill Switch
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RE-ENABLE CONFIRMATION MODAL */}
      {showReenableModal && selectedAgent && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleReenableCancel}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8 max-h-[90vh] flex flex-col  "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Green header — mirrors the red header style of the kill switch modal */}
            <div className="bg-green-600 p-6 rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUndo className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Re-enable Agent</h2>
                  <p className="text-green-100 text-sm">Restore agent operations</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Agent info card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <FaRobot className="text-gray-600 text-xl flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{selectedAgent.name}</p>
                    <p className="text-sm text-gray-500">{selectedAgent.type}</p>
                  </div>
                </div>
                {selectedAgent.environment && (
                  <p className="text-xs text-gray-500 mt-2">
                    Environment: <span className="font-medium text-gray-700">{selectedAgent.environment}</span>
                  </p>
                )}
              </div>

              {/* Previous killswitch details */}
              {(selectedAgent.killswitchActivatedBy || selectedAgent.killswitchReason) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-700 mb-1.5 uppercase tracking-wide">Previous Kill Switch Details</p>
                  <div className="space-y-1">
                    {selectedAgent.killswitchActivatedBy && (
                      <p className="text-xs text-red-800">
                        <span className="font-semibold">Killed by:</span> {selectedAgent.killswitchActivatedBy}
                      </p>
                    )}
                    {selectedAgent.killswitchActivatedAt && (
                      <p className="text-xs text-red-800">
                        <span className="font-semibold">At:</span> {new Date(selectedAgent.killswitchActivatedAt).toLocaleString()}
                      </p>
                    )}
                    {selectedAgent.killswitchReason && (
                      <p className="text-xs text-red-800">
                        <span className="font-semibold">Reason:</span> {selectedAgent.killswitchReason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* What this action will do */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <FaCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold mb-1">This action will:</p>
                    <ul className="list-disc list-inside space-y-1 text-green-700">
                      <li>Restore full agent operations</li>
                      <li>Make agent visible in the Agents section</li>
                      <li>Allow users to chat with this agent</li>
                      <li>Re-enable all system access permissions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Reason input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Reason for Re-enabling <span className="text-green-600">*</span>
                </label>
                <textarea
                  value={reenableReason}
                  onChange={(e) => setReenableReason(e.target.value)}
                  placeholder="Explain why you're re-enabling this agent..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={4}
                  disabled={reenableLoading}
                />
                <p className="text-xs text-gray-500 mt-1">This reason will be logged for audit purposes</p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={handleReenableCancel}
                  disabled={reenableLoading}
                  className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReenableConfirm}
                  disabled={reenableLoading || !reenableReason.trim()}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {reenableLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Re-enabling...
                    </>
                  ) : (
                    <>
                      <FaUndo />
                      Confirm Re-enable
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAgentControll;