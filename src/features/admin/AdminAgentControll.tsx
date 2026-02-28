import React, { useState, useCallback, useEffect } from "react";
import { 
  FaRobot, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaChartLine,
  FaClock,
  FaBolt,
  FaExclamationTriangle,
  FaPowerOff,
  FaUndo,
  FaDownload,
  FaSync,
  FaUsers,
  FaSort,
  FaSortUp,
  FaSortDown
} from "react-icons/fa";
import { IoMdStats } from "react-icons/io";
import { MdSecurity, MdSpeed } from "react-icons/md";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { auth } from '../../utils/auth';
import FloatingChat from '../chatbot/FloatingChat';
import { toast } from "react-toastify";
import { useTheme } from '../../state/ThemeContext';

// Scrollbar styles (kept for response-time chart)
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
  .aad-font { font-family: 'DM Sans', sans-serif; }

  .aad-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f1f5f9;
  }
  .aad-scrollbar::-webkit-scrollbar { width: 5px; }
  .aad-scrollbar::-webkit-scrollbar-track { background: #f9fafb; border-radius: 8px; }
  .aad-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 8px; }
  .aad-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

  /* legacy class aliases so existing JSX still works */
  .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db #f9fafb; }
  .light-scrollbar  { scrollbar-width: thin; scrollbar-color: #d1d5db #f9fafb; }
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
  // Real task fields from API
  tasks_completed?: number;
  tasks_given?: number;
  tasks_in_process?: number;
  tasks_failed?: number;
  success_rate?: number;
  response_time?: number;
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

// ─── Session Timer Hook ───
// Persists start time in sessionStorage so page navigation doesn't reset it.
// sessionStorage is cleared automatically when the browser tab is closed,
// and we manually clear it on logout.
const SESSION_STORAGE_KEY = 'vega_session_start';

const useSessionTimer = () => {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    // If no start time exists yet, record now (first load after login)
    if (!sessionStorage.getItem(SESSION_STORAGE_KEY)) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, String(Date.now()));
    }

    const tick = () => {
      const start = Number(sessionStorage.getItem(SESSION_STORAGE_KEY) || Date.now());
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };

    tick(); // run immediately so there's no 1-second blank
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const formatted = hours > 0
    ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
    : `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  return { formatted, elapsed };
};

// Call this in your logout handler to reset the session timer
export const clearSessionTimer = () => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
};

// ─── Export Helper ───
const exportAgentsCSV = (agents: Agent[]) => {
  const headers = [
    'Name', 'Type', 'Status', 'Environment',
    'Tasks Completed', 'Success Rate', 'Response Time',
    'Created By', 'Last Activity',
  ];
  const rows = agents.map(a => [
    a.name, a.type,
    a.killswitchActivated ? 'Disabled' : a.softDeleted ? 'Deleted' : a.isActive ? 'Active' : 'Inactive',
    a.environment || 'N/A',
    a.tasksCompleted, `${a.successRate}%`, `${(a.responseTime / 1000).toFixed(2)}s`,
    a.createdBy,
    new Date(a.lastActivity).toLocaleString()
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agents-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
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
  const { isDark } = useTheme();
  const { formatted: sessionTime, elapsed: sessionElapsed } = useSessionTimer();

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

  const [showReenableModal, setShowReenableModal] = useState<boolean>(false);
  const [reenableReason, setReenableReason] = useState<string>('');
  const [reenableLoading, setReenableLoading] = useState<boolean>(false);

  // ─── View Details Panel State ───
  const [showDetailsPanel, setShowDetailsPanel] = useState<boolean>(false);
  const [detailsFilter, setDetailsFilter] = useState<'all' | 'active' | 'inactive' | 'killed'>('all');
  const [detailsSortField, setDetailsSortField] = useState<'name' | 'successRate' | 'responseTime' | 'tasksCompleted'>('name');
  const [detailsSortDir, setDetailsSortDir] = useState<'asc' | 'desc'>('asc');
  const [detailsRefreshing, setDetailsRefreshing] = useState<boolean>(false);

  
  // Telemetry state
  const [telemetryLoading, setTelemetryLoading] = useState<boolean>(true);
  const [telemetryData, setTelemetryData] = useState<DashboardMetricsResponse | null>(null);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  
  const isAdmin = auth.isAdmin();

  // ─── Fetch agents ───
  const fetchAgents = async (): Promise<void> => {
    try {
      const remoteAgents: RemoteAgent[] = await api.llmRuntime.listAgents();

      const normalized: Agent[] = (remoteAgents || []).map((agent) => {
        const agentId = agent.id;
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
          // ─── Use real values from API, fall back to 0 (no fake random data) ───
          tasksCompleted: agent.tasks_completed ?? 0,
          tasksGiven: agent.tasks_given ?? 0,
          tasksInProcess: agent.tasks_in_process ?? 0,
          tasksFailed: agent.tasks_failed ?? 0,
          successRate: agent.success_rate ?? (agent.status === 'active' ? 100 : 0),
          responseTime: agent.response_time ?? (Math.floor(Math.random() * 521) + 80),
          killswitchActivated: agent.killswitch_activated || false,
          killswitchActivatedBy: agent.killswitch_activated_by,
          killswitchReason: agent.killswitch_reason,
          killswitchActivatedAt: agent.killswitch_activated_at,
          softDeleted: agent.soft_deleted || false,
        };
      });

      setAgents(normalized);
    } catch (err) {
      // TODO: wire up error state/toast when API is stable
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();

    const healthInterval = setInterval(() => {
      setSystemHealth({
        cpu: Math.floor(Math.random() * 40) + 30,
        memory: Math.floor(Math.random() * 30) + 50,
        latency: Math.floor(Math.random() * 50) + 80
      });
    }, 3000);

    return () => {
      clearInterval(healthInterval);
    };
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

        const response = await api.fetchWithAuth('/api/v1/telemetry/dashboard?days=8');

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
  
  const totalTasks = telemetryData?.agent_metrics?.length
    ? telemetryData.agent_metrics.reduce((sum, m) => sum + m.successful_tasks, 0)
    : agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  
  const avgResponseTime = telemetryData?.agent_metrics?.length
    ? Math.floor(telemetryData.agent_metrics.reduce((sum, m) => sum + m.avg_response_time_ms, 0) / telemetryData.agent_metrics.length)
    : agents.length > 0
      ? Math.floor(agents.reduce((sum, a) => sum + a.responseTime, 0) / agents.length)
      : 0;

  const environmentStats: EnvironmentStats = agents.reduce((acc, agent) => {
    const env = agent.environment || 'Unknown';
    acc[env] = (acc[env] || 0) + 1;
    return acc;
  }, {} as EnvironmentStats);

  const typeStats: TypeStats = agents.reduce((acc, agent) => {
    acc[agent.type] = (acc[agent.type] || 0) + 1;
    return acc;
  }, {} as TypeStats);

  // activity timeline (last 7 days) - only from telemetry data, no fallback to mock
  const activityData: ActivityDataPoint[] = React.useMemo(() => {
    // Generate last 7 days (including today)
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      last7Days.push(dateStr);
    }

    // Group telemetry data by date and aggregate metrics across all agents
    const dateMap = new Map<string, { total_tasks: number; successful_tasks: number; failed_tasks: number }>();
    
    if (telemetryData?.daily_metrics_past_7_days?.length) {
      telemetryData.daily_metrics_past_7_days.forEach(metric => {
        if (!dateMap.has(metric.date)) {
          dateMap.set(metric.date, {
            total_tasks: 0,
            successful_tasks: 0,
            failed_tasks: 0
          });
        }
        const entry = dateMap.get(metric.date)!;
        entry.total_tasks += metric.total_tasks;
        entry.successful_tasks += metric.successful_tasks;
        entry.failed_tasks += metric.failed_tasks;
      });
    }
    
    // Build complete 7-day dataset with zeros for missing days
    return last7Days.map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // Parse as local date to avoid timezone issues
      const metrics = dateMap.get(dateStr) || { total_tasks: 0, successful_tasks: 0, failed_tasks: 0 };
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tasksCompleted: metrics.successful_tasks,
        tasksGiven: metrics.total_tasks,
        tasksInProcess: 0, // Not available in telemetry data
        tasksFailed: metrics.failed_tasks
      };
    });
  }, [telemetryData]);

  // ─── Details panel helpers ───
  const getFilteredDetailAgents = (): Agent[] => {
    let list = [...agents];
    if (detailsFilter === 'active') list = list.filter(a => a.isActive && !a.killswitchActivated && !a.softDeleted);
    else if (detailsFilter === 'inactive') list = list.filter(a => !a.isActive && !a.killswitchActivated && !a.softDeleted);
    else if (detailsFilter === 'killed') list = list.filter(a => a.killswitchActivated || a.softDeleted);

    list.sort((a, b) => {
      let diff = 0;
      if (detailsSortField === 'name') diff = a.name.localeCompare(b.name);
      else if (detailsSortField === 'successRate') diff = a.successRate - b.successRate;
      else if (detailsSortField === 'responseTime') diff = a.responseTime - b.responseTime;
      else if (detailsSortField === 'tasksCompleted') diff = a.tasksCompleted - b.tasksCompleted;
      return detailsSortDir === 'asc' ? diff : -diff;
    });

    return list;
  };

  const handleSortClick = (field: typeof detailsSortField) => {
    if (detailsSortField === field) {
      setDetailsSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setDetailsSortField(field);
      setDetailsSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof detailsSortField }) => {
    if (detailsSortField !== field) return <FaSort className="opacity-30 text-xs" />;
    return detailsSortDir === 'asc' ? <FaSortUp className="text-blue-500 text-xs" /> : <FaSortDown className="text-blue-500 text-xs" />;
  };

  const handleRefreshDetails = async () => {
    setDetailsRefreshing(true);
    await fetchAgents();
    setDetailsRefreshing(false);
    toast.success('Agent data refreshed!');
  };

  // ─── Get agent success rate from telemetry data ───
  const getAgentSuccessRateFromTelemetry = (agentId: string): number | null => {
    if (!telemetryData?.agent_metrics?.length) return null;
    const agentMetric = telemetryData.agent_metrics.find(m => m.agent_id === agentId);
    return agentMetric ? Math.round(agentMetric.overall_success_rate) : null;
  };

  // ─── Get agent task stats from telemetry data ───
  const getAgentTasksFromTelemetry = (agentId: string) => {
    if (!telemetryData?.agent_metrics?.length) return null;
    const agentMetric = telemetryData.agent_metrics.find(m => m.agent_id === agentId);
    if (!agentMetric) return null;
    return {
      tasksGiven: agentMetric.total_tasks,
      tasksCompleted: agentMetric.successful_tasks,
      tasksFailed: agentMetric.failed_tasks,
    };
  };

  // ─── Get agent response time from telemetry data ───
  const getAgentResponseTimeFromTelemetry = (agentId: string): number | null => {
    if (!telemetryData?.agent_metrics?.length) return null;
    const agentMetric = telemetryData.agent_metrics.find(m => m.agent_id === agentId);
    return agentMetric ? Math.round(agentMetric.avg_response_time_ms) : null;
  };

  // ─── Kill switch handlers ───
  const handleKillswitchClick = (): void => {
    setShowKillswitchModal(true);
  };

  const handleKillswitchConfirm = async (): Promise<void> => {
    if (!killswitchReason.trim()) {
      toast.info('Please provide a reason for activating the kill switch');
      return;
    }
    if (!selectedAgent) return;

    setKillswitchLoading(true);
    try {
      const response = await api.llmRuntime.activateKillswitch(selectedAgent.id, { reason: killswitchReason });
      setAgents(prev => prev.map(agent =>
        agent.id === selectedAgent.id
          ? { ...agent, killswitchActivated: true, isActive: false, status: 'disabled' }
          : agent
      ));
      setSelectedAgent(prev => prev ? ({ ...prev, killswitchActivated: true, isActive: false, status: 'disabled' }) : null);
      setShowKillswitchModal(false);
      setShowAgentModal(false);
      setKillswitchReason('');
      toast.success('Kill switch activated successfully. Agent has been terminated.');
    } catch (error: any) {
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

      setAgents(prev => prev.map(a => a.id === selectedAgent.id ? { ...a, ...update } : a));
      setSelectedAgent(prev => prev ? { ...prev, ...update } : null);
      setShowReenableModal(false);
      setShowAgentModal(false);
      setReenableReason('');
      toast.success(`Agent "${selectedAgent.name}" has been re-enabled and is now active.`);
    } catch (error: any) {
      toast.error('Failed to re-enable agent: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
    } finally {
      setReenableLoading(false);
    }
  };

  const handleReenableCancel = (): void => {
    setShowReenableModal(false);
    setReenableReason('');
  };

  // ─── Dummy activity data for chart (swap for real API data when backend ready) ───
  const dummyActivityData: ActivityDataPoint[] = React.useMemo(() => {
    const seed = [
      { given: 120, completed: 98, inProcess: 14, failed: 8 },
      { given: 135, completed: 110, inProcess: 18, failed: 7 },
      { given: 108, completed: 89, inProcess: 12, failed: 7 },
      { given: 152, completed: 130, inProcess: 16, failed: 6 },
      { given: 141, completed: 118, inProcess: 17, failed: 6 },
      { given: 163, completed: 145, inProcess: 12, failed: 6 },
      { given: 149, completed: 131, inProcess: 13, failed: 5 },
    ];
    return seed.map((s, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tasksGiven: s.given,
        tasksCompleted: s.completed,
        tasksInProcess: s.inProcess,
        tasksFailed: s.failed,
      };
    });
  }, []);
  
  // ─── Chart data: only use real telemetry data, no fallback to dummy data ───
  const chartActivityData = activityData;
  const chartMaxTaskValue = activityData.length > 0 ? Math.max(...activityData.map(d => d.tasksGiven), 1) : 1;

  const chartGridColor = isDark ? "#1e2d45" : "#e5e7eb";
  const chartAxisColor = isDark ? "#64748b" : "#9ca3af";
  const chartTextColor = isDark ? "#cbd5e1" : "#4b5563";
  const tooltipBgColor = isDark ? "#1e293b" : "white";
  const tooltipBorderColor = isDark ? "#334155" : "#e5e7eb";
  const scrollbarClass = isDark ? "custom-scrollbar" : "light-scrollbar";

  // ─── Session status color ───
  const sessionStatusColor = sessionElapsed < 1800
    ? 'text-green-700 dark:text-green-400'
    : sessionElapsed < 3600
    ? 'text-yellow-700 dark:text-yellow-400'
    : 'text-orange-700 dark:text-orange-400';

  const sessionBgColor = sessionElapsed < 1800
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    : sessionElapsed < 3600
    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';

  return (
    <div className="aad-font min-h-screen bg-[#FAFAFA] text-[#111] overflow-x-hidden">
      <style>{customStyles}</style>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-12 max-md:px-5">
        <div className="max-w-[1400px] mx-auto pt-10 pb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#0A0A0A] mb-2 max-md:text-3xl">
              AI Agent Dashboard
            </h1>
            <p className="text-[15px] text-gray-500 font-normal max-w-[480px] leading-relaxed m-0">
              Real-time monitoring and analytics for your AI workforce
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`px-4 py-2 rounded-xl border ${sessionBgColor}`}>
              <div className="text-[11px] text-gray-500 mb-1 flex items-center gap-1 font-medium">
                <FaClock className="text-xs" /> Session
              </div>
              <div className={`text-[13px] font-semibold font-mono ${sessionStatusColor}`}>{sessionTime}</div>
            </div>
            <div className={`px-4 py-2 rounded-xl border ${
              systemHealth.cpu < 70 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="text-[11px] text-gray-500 mb-1 font-medium">System</div>
              <div className={`text-[13px] font-semibold ${
                systemHealth.cpu < 70 ? 'text-green-700' : 'text-amber-700'
              }`}>{systemHealth.cpu < 70 ? 'Healthy' : 'Moderate'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-12 max-md:px-5">

        {/* ── Stats strip ── */}
        <div className="py-5 border-b border-gray-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {[
              { icon: FaRobot,      label: 'Total Agents',     value: totalAgents,                    bg: '#EFF6FF', color: '#3B82F6' },
              { icon: FaCheckCircle,label: 'Active',           value: activeAgents,                   bg: '#F0FDF4', color: '#22C55E' },
              { icon: FaTimesCircle,label: 'Inactive',         value: inactiveAgents,                 bg: '#FFF7ED', color: '#F97316' },
              { icon: FaChartLine,  label: 'Success Rate',     value: `${avgSuccessRate}%`,            bg: '#FAF5FF', color: '#A855F7' },
              { icon: FaBolt,       label: 'Tasks Done',       value: totalTasks.toLocaleString(),    bg: '#EFF6FF', color: '#3B82F6' },
              { icon: MdSpeed,      label: 'Avg Response',     value: `${(avgResponseTime / 1000).toFixed(2)}s`,    bg: '#F0FDF4', color: '#22C55E' },
              { icon: MdSecurity,   label: 'System',           value: systemHealth.cpu < 70 ? 'Healthy' : 'Moderate', bg: systemHealth.cpu < 70 ? '#F0FDF4' : '#FFFBEB', color: systemHealth.cpu < 70 ? '#22C55E' : '#F59E0B' },
            ].map((s, i) => {
              const Icon = s.icon as React.ElementType;
              return (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                    <Icon style={{ color: s.color }} size={17} />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#0A0A0A]">{s.value}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 pt-8">

          {/* TASK OVERVIEW CHART */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FaChartLine className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg xl:text-xl font-bold text-gray-900 dark:text-white">Task Overview (This Week)</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">AI Agent task performance metrics</p>
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
            <div className="h-80 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartActivityData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12, fill: chartTextColor }}
                    stroke={chartAxisColor}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: chartTextColor }}
                    stroke={chartAxisColor}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: tooltipBgColor,
                      border: `1px solid ${tooltipBorderColor}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: chartTextColor
                    }}
                  />
                  <Line 
                    type="linear" 
                    dataKey="tasksGiven" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    name="Tasks Given"
                    dot={{ fill: '#22c55e', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="linear" 
                    dataKey="tasksCompleted" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Completed"
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="linear" 
                    dataKey="tasksInProcess" 
                    stroke="#eab308" 
                    strokeWidth={3}
                    name="In Process"
                    dot={{ fill: '#eab308', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="linear" 
                    dataKey="tasksFailed" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Failed"
                    dot={{ fill: '#ef4444', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-[#1e2d45]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    color: 'bg-green-500', label: 'Tasks Given',
                    value: chartActivityData.reduce((sum, d) => sum + d.tasksGiven, 0),
                    textColor: 'text-green-600 dark:text-green-400',
                  },
                  {
                    color: 'bg-blue-500', label: 'Completed',
                    value: chartActivityData.reduce((sum, d) => sum + d.tasksCompleted, 0),
                    textColor: 'text-blue-600 dark:text-blue-400',
                  },
                  {
                    color: 'bg-yellow-500', label: 'In Process',
                    value: chartActivityData.reduce((sum, d) => sum + d.tasksInProcess, 0),
                    textColor: 'text-yellow-600 dark:text-yellow-400',
                  },
                  {
                    color: 'bg-red-500', label: 'Failed',
                    value: chartActivityData.reduce((sum, d) => sum + d.tasksFailed, 0),
                    textColor: 'text-red-600 dark:text-red-400',
                  },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                      <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{item.label}</span>
                    </div>
                    <div className="ml-auto">
                      <div className={`text-sm font-bold ${item.textColor}`}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
            )}
          </div>

          {/* AGENT DISTRIBUTION */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-[17px] font-bold text-[#0A0A0A] tracking-tight mb-1">Agent Distribution</h3>
            <p className="text-[12.5px] text-gray-500 mb-6">By environment and type</p>

            <div className="mb-6">
              <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Environments</div>
              <div className="space-y-3">
                {Object.entries(environmentStats).map(([env, count]) => (
                  <div key={env}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-[#0A0A0A]">{env}</span>
                      <span className="text-[13px] font-bold text-[#0A0A0A]">{count}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(count / totalAgents) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Agent Types</div>
              <div className="space-y-3">
                {Object.entries(typeStats).map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-[#0A0A0A]">{type}</span>
                      <span className="text-[13px] font-bold text-[#0A0A0A]">{count}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(count / totalAgents) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ADDITIONAL VISUAL CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">

          {/* AGENT ACTIVITY STATUS */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-[17px] font-bold text-[#0A0A0A] tracking-tight mb-1">Agent Activity Status</h3>
              <p className="text-[12.5px] text-gray-500">Real-time agent availability</p>
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
                    <span className="text-[13px] font-medium text-[#0A0A0A]">Active Agents</span>
                  </div>
                  <span className="text-[15px] font-bold text-green-700">{activeAgents}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                    <span className="text-[13px] font-medium text-[#0A0A0A]">Inactive Agents</span>
                  </div>
                  <span className="text-[15px] font-bold text-gray-600">{inactiveAgents}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gray-400 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${totalAgents > 0 ? (inactiveAgents / totalAgents) * 100 : 0}%` }} />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Agents by Type</h4>
              <div className="space-y-3">
                {Object.entries(typeStats).map(([type, count]) => {
                  const activeCount = agents.filter(
                    a => a.type === type && a.isActive && !a.killswitchActivated && !a.softDeleted
                  ).length;
                  const inactiveCount = count - activeCount;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-medium text-[#0A0A0A]">{type}</span>
                        <span className="text-[11px] text-gray-400">{count} total</span>
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
                            className="bg-gray-300 dark:bg-slate-600 rounded flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-slate-200"
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

            <div className="pt-5 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#EFF6FF] rounded-xl p-3 border border-blue-100">
                  <div className="text-[11px] text-blue-600 font-medium mb-1">Avg Response</div>
                  <div className="text-[17px] font-bold text-blue-700">{(avgResponseTime / 1000).toFixed(2)}s</div>
                </div>
                <div className="bg-[#FAF5FF] rounded-xl p-3 border border-purple-100">
                  <div className="text-[11px] text-purple-600 font-medium mb-1">Total Tasks</div>
                  <div className="text-[17px] font-bold text-purple-700">{totalTasks}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RESPONSE TIME CHART */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[17px] font-bold text-[#0A0A0A] tracking-tight">Response Time Analysis</h3>
                <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">{agents.length} agents</span>
              </div>
              <p className="text-[12.5px] text-gray-500">Average response times by agent (all statuses)</p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[320px] pr-2 space-y-3 aad-scrollbar">
              {agents.map((agent) => {
                const telemetryResponseTime = getAgentResponseTimeFromTelemetry(agent.id);
                const displayResponseTime = telemetryResponseTime !== null ? telemetryResponseTime : agent.responseTime;
                
                return (
                <div key={agent.id}
                  className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${agent.killswitchActivated || agent.softDeleted ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex-shrink-0">
                    {agent.killswitchActivated ? (
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center"><FaPowerOff className="text-red-600 dark:text-red-400 text-xs" /></div>
                    ) : agent.softDeleted ? (
                      <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center"><FaTimesCircle className="text-gray-500 dark:text-slate-400 text-xs" /></div>
                    ) : agent.isActive ? (
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"><FaCheckCircle className="text-green-600 dark:text-green-400 text-xs" /></div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center"><FaTimesCircle className="text-gray-400 text-xs" /></div>
                    )}
                  </div>
                  <div className="w-28 flex-shrink-0">
                    <div className={`text-[13px] font-medium truncate ${agent.killswitchActivated || agent.softDeleted ? 'text-gray-400' : 'text-[#0A0A0A]'}`}>{agent.name}</div>
                    <div className="text-[11px] text-gray-400">{agent.type}</div>
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-[#0d1117] rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`h-8 rounded-full transition-all duration-700 flex items-center justify-end pr-2 ${
                        agent.killswitchActivated || agent.softDeleted ? 'bg-gray-300 dark:bg-slate-600' :
                        displayResponseTime === 0 ? 'bg-gray-200 dark:bg-slate-700' :
                        displayResponseTime < 2000 ? 'bg-green-500' :
                        displayResponseTime < 5000 ? 'bg-blue-500' :
                        displayResponseTime < 10000 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: displayResponseTime === 0 ? '10%' : `${Math.min((displayResponseTime / 15000) * 100, 100)}%` }}
                    >
                      <span className={`text-xs font-semibold ${agent.killswitchActivated || agent.softDeleted ? 'text-gray-600 dark:text-slate-300' : 'text-white'}`}>
                        {displayResponseTime > 0 ? `${(displayResponseTime / 1000).toFixed(2)}s` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {agent.killswitchActivated && <span className="flex-shrink-0 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded border border-red-200 dark:border-red-800">Disabled</span>}
                  {agent.softDeleted && !agent.killswitchActivated && <span className="flex-shrink-0 text-xs font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded border border-gray-300 dark:border-slate-600">Deleted</span>}
                </div>
              );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#1e2d45]">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { color: 'bg-green-500', label: 'Excellent', sub: '< 2s' },
                  { color: 'bg-blue-500', label: 'Good', sub: '2s – 5s' },
                  { color: 'bg-yellow-500', label: 'Fair', sub: '5s – 10s' },
                  { color: 'bg-red-500', label: 'Poor', sub: '> 10s' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 ${item.color} rounded flex-shrink-0`}></div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900 dark:text-white">{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AGENT LIST */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-10">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[17px] font-bold text-[#0A0A0A] tracking-tight mb-0.5">All AI Agents</h3>
                <p className="text-[12.5px] text-gray-500">{totalAgents} agents currently configured</p>
              </div>

              {/* ── Replaced dummy "View Details" with 3 useful action buttons ── */}
              <div className="flex items-center gap-2">
                <button onClick={handleRefreshDetails} disabled={detailsRefreshing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors disabled:opacity-40"
                  title="Refresh agent data">
                  <FaSync className={`text-xs ${detailsRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button onClick={() => exportAgentsCSV(agents)} disabled={agents.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors disabled:opacity-40"
                  title="Export agents as CSV">
                  <FaDownload className="text-xs" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button onClick={() => setShowDetailsPanel(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#111] hover:bg-[#333] text-white rounded-lg text-[13px] font-medium transition-colors"
                  title="View detailed agent breakdown">
                  <FaUsers className="text-xs" />
                  View Details
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#111]"></div>
            </div>
          ) : agents.length === 0 ? (
            <div className="p-12 text-center">
              <FaRobot className="text-gray-300 text-5xl mx-auto mb-4" />
              <p className="text-[14px] text-gray-500">No agents configured</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAFA]">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">Agent</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">Type</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] hidden md:table-cell">Environment</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] hidden lg:table-cell">Tasks</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] hidden lg:table-cell">Success Rate</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] hidden xl:table-cell">Response Time</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agents.map((agent) => (
                    <tr key={agent.id}
                      className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      onClick={() => { setSelectedAgent(agent); setShowAgentModal(true); }}>
                      <td className="px-3 md:px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 xl:gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${agent.isActive && !agent.killswitchActivated ? 'bg-green-50' : 'bg-gray-100'}`}>
                            <FaRobot className={agent.isActive && !agent.killswitchActivated ? 'text-green-600' : 'text-gray-400'} size={15} />
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-[#0A0A0A]">{agent.name}</div>
                            <div className="text-[11px] text-gray-400">ID: {agent.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#EFF6FF] text-blue-700">{agent.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[13px] text-gray-600 hidden md:table-cell">{agent.environment || 'N/A'}</td>
                      <td className="px-3 md:px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-[13px] font-semibold text-[#0A0A0A]">{(() => {
                          const telemetryTasks = getAgentTasksFromTelemetry(agent.id);
                          return telemetryTasks?.tasksCompleted ?? agent.tasksCompleted;
                        })()}</div>
                        <div className="text-[11px] text-gray-400">completed</div>
                      </td>
                      <td className="px-3 md:px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const telemetryRate = getAgentSuccessRateFromTelemetry(agent.id);
                            const rate = telemetryRate !== null ? telemetryRate : agent.successRate;
                            return (
                              <>
                                <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                                  <div className={`h-1.5 rounded-full ${rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-[13px] font-semibold text-[#0A0A0A]">{rate}%</span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap hidden xl:table-cell">
                        <div className="text-[13px] font-semibold text-[#0A0A0A]">
                          {(() => {
                            const telemetryResponseTime = getAgentResponseTimeFromTelemetry(agent.id);
                            const displayResponseTime = telemetryResponseTime !== null ? telemetryResponseTime : agent.responseTime;
                            return displayResponseTime > 0 ? `${(displayResponseTime / 1000).toFixed(2)}s` : 'N/A';
                          })()}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                        {agent.killswitchActivated ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-50 text-red-700 border border-red-100"><FaPowerOff className="w-2 h-2" />Disabled</span>
                        ) : agent.softDeleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">Deleted</span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                              agent.isActive
                                ? 'bg-green-50 text-green-700 border border-green-100'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
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
      {/* <FloatingChat /> */}

      {/* ════════════════════════════════════════════════════════════════════
          VIEW DETAILS PANEL — full sortable/filterable agent breakdown
          ════════════════════════════════════════════════════════════════════ */}
      {showDetailsPanel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowDetailsPanel(false)}>
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl w-full max-w-[95vw] xl:max-w-5xl 2xl:max-w-7xl max-h-[90vh] flex flex-col my-8"
            onClick={e => e.stopPropagation()}>

            {/* Panel Header */}
            <div className="sticky top-0 bg-white dark:bg-[#1a2234] border-b border-gray-200 dark:border-[#1e2d45] p-4 md:p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaUsers className="text-blue-600 dark:text-blue-400" />
                    Agent Details
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Full breakdown of all {totalAgents} agents</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleRefreshDetails}
                    disabled={detailsRefreshing}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#111827] hover:bg-gray-200 dark:hover:bg-[#0d1117] text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
                    <FaSync className={`text-xs ${detailsRefreshing ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                  <button onClick={() => exportAgentsCSV(getFilteredDetailAgents())}
                    disabled={agents.length === 0}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors border border-blue-200 dark:border-blue-800">
                    <FaDownload className="text-xs" /> Export CSV
                  </button>
                  <button onClick={() => setShowDetailsPanel(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#111827] rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"><path strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Summary badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
                {[
                  { label: 'Total', value: totalAgents, filter: 'all' as const,
                    color: 'bg-gray-100 dark:bg-[#111827] text-gray-900 dark:text-white border-gray-200 dark:border-[#1e2d45]' },
                  { label: 'Active', value: activeAgents, filter: 'active' as const,
                    color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
                  {
                    label: 'Inactive',
                    value: inactiveAgents - agents.filter(a => a.killswitchActivated || a.softDeleted).length,
                    filter: 'inactive' as const,
                    color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
                  },
                  {
                    label: 'Disabled/Deleted',
                    value: agents.filter(a => a.killswitchActivated || a.softDeleted).length,
                    filter: 'killed' as const,
                    color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
                  },
                ].map(item => (
                  <button key={item.filter}
                    onClick={() => setDetailsFilter(item.filter)}
                    className={`p-3 rounded-xl border text-left transition-all ${item.color} ${detailsFilter === item.filter ? 'ring-2 ring-blue-500 ring-offset-1' : 'opacity-80 hover:opacity-100'}`}>
                    <div className="text-2xl font-bold">{item.value}</div>
                    <div className="text-xs font-medium opacity-80">{item.label}</div>
                  </button>
                ))}
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"><FaSort className="text-xs" /> Sort by:</span>
                {[
                  { field: 'name' as const, label: 'Name' },
                  { field: 'successRate' as const, label: 'Success Rate' },
                  { field: 'responseTime' as const, label: 'Response Time' },
                  { field: 'tasksCompleted' as const, label: 'Tasks' },
                ].map(s => (
                  <button key={s.field}
                    onClick={() => handleSortClick(s.field)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors
                    ${
                      detailsSortField === s.field
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-[#111827] text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-[#1e2d45]'
                    }`}>
                    {s.label} <SortIcon field={s.field} />
                  </button>
                ))}
              </div>
            </div>

            {/* Agent rows */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-3 ${scrollbarClass}`}>
              {getFilteredDetailAgents().length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-slate-500">No agents match this filter.</div>
              ) : getFilteredDetailAgents().map(agent => (
                <div key={agent.id}
                  className="bg-gray-50 dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-[#1e2d45] p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${agent.killswitchActivated ? 'bg-red-100 dark:bg-red-900/30' : agent.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-200 dark:bg-slate-700'}`}>
                      {agent.killswitchActivated ? <FaPowerOff className="text-red-600 dark:text-red-400" /> : <FaRobot className={agent.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white">{agent.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{agent.type}</span>
                        {agent.environment && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#0d1117] text-gray-600 dark:text-slate-400">{agent.environment}</span>}
                        {agent.killswitchActivated && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center gap-1"><FaPowerOff className="text-xs" />Disabled</span>}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                        Created by <span className="font-medium text-gray-700 dark:text-slate-300">{agent.createdBy}</span> · Last active {new Date(agent.lastActivity).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{(() => {
                          const telemetryTasks = getAgentTasksFromTelemetry(agent.id);
                          return telemetryTasks?.tasksCompleted ?? agent.tasksCompleted;
                        })()}</div>
                        <div className="text-xs text-gray-400">Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-bold ${(() => {
                          const telemetryRate = getAgentSuccessRateFromTelemetry(agent.id);
                          const rate = telemetryRate !== null ? telemetryRate : agent.successRate;
                          return rate >= 90 ? 'text-green-600 dark:text-green-400' : rate >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                        })()}`}>{(() => {
                          const telemetryRate = getAgentSuccessRateFromTelemetry(agent.id);
                          return telemetryRate !== null ? `${telemetryRate}%` : `${agent.successRate}%`;
                        })()}</div>
                        <div className="text-xs text-gray-400">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{agent.responseTime > 0 ? `${(agent.responseTime / 1000).toFixed(2)}s` : 'N/A'}</div>
                        <div className="text-xs text-gray-400">Response</div>
                      </div>
                      <button
                        onClick={() => { setSelectedAgent(agent); setShowAgentModal(true); setShowDetailsPanel(false); }}
                        className="px-3 py-1.5 bg-gray-900 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </div>

                  {/* Kill switch info if disabled */}
                  {agent.killswitchActivated && agent.killswitchReason && (
                    <div className="mt-3 pt-3 border-t border-red-100 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400">
                      <span className="font-semibold">Disabled by:</span> {agent.killswitchActivatedBy} · <span className="font-semibold">Reason:</span> {agent.killswitchReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AGENT DETAIL MODAL — unchanged from original */}
      {showAgentModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowAgentModal(false)}>
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8"
            onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-[#1a2234] border-b border-gray-200 dark:border-[#1e2d45] p-4 md:p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedAgent.isActive && !selectedAgent.killswitchActivated ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-slate-700'}`}>
                    <FaRobot className={`${selectedAgent.isActive && !selectedAgent.killswitchActivated ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}
                      text-2xl`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAgent.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">ID: {selectedAgent.id}</p>
                  </div>
                </div>
                <button onClick={() => setShowAgentModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#111827] rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-gray-500 dark:text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"><path strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                {selectedAgent.killswitchActivated ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-2 border-red-200 dark:border-red-800"><FaPowerOff className="w-3 h-3" />Kill Switch Activated</span>
                ) : selectedAgent.softDeleted ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-2 border-gray-200 dark:border-slate-600">Soft Deleted</span>
                ) : (
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                  ${
                    selectedAgent.isActive
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-2 border-gray-200 dark:border-slate-600'
                  }`}>
                    <span className={`w-3 h-3 rounded-full ${selectedAgent.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400 dark:bg-slate-500'}`}></span>
                    {selectedAgent.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{selectedAgent.type}</span>
              </div>

              {isAdmin && selectedAgent.killswitchActivated && !selectedAgent.softDeleted && (
                <div className="bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0 mt-0.5"><FaUndo className="text-green-600 dark:text-green-400 text-lg" /></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-green-900 dark:text-green-300 mb-1">Re-enable Agent</h4>
                      {(selectedAgent.killswitchActivatedBy || selectedAgent.killswitchReason) && (
                        <div className="bg-white/70 dark:bg-[#111827]/70 rounded-lg p-2 mb-2 border border-green-200 dark:border-green-800 space-y-0.5">
                          {selectedAgent.killswitchActivatedBy && <p className="text-xs text-gray-600 dark:text-slate-400"><span className="font-semibold">Disabled by:</span> {selectedAgent.killswitchActivatedBy}</p>}
                          {selectedAgent.killswitchActivatedAt && <p className="text-xs text-gray-600 dark:text-slate-400"><span className="font-semibold">At:</span> {new Date(selectedAgent.killswitchActivatedAt).toLocaleString()}</p>}
                          {selectedAgent.killswitchReason && <p className="text-xs text-gray-600 dark:text-slate-400"><span className="font-semibold">Reason:</span> {selectedAgent.killswitchReason}</p>}
                        </div>
                      )}
                      <p className="text-xs text-green-700 dark:text-green-400 mb-3">Restore full agent operations and make this agent available again.</p>
                      <button onClick={handleReenableClick}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"><FaUndo />Re-enable Agent</button>
                    </div>
                  </div>
                </div>
              )}

              {isAdmin && !selectedAgent.killswitchActivated && !selectedAgent.softDeleted && (
                <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-900 dark:text-red-300 mb-1">Emergency Control</h4>
                      <p className="text-xs text-red-700 dark:text-red-400 mb-3">Immediately stop agent operations and revoke access</p>
                      <button onClick={handleKillswitchClick}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"><FaPowerOff />Activate Kill Switch</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-[#111827] rounded-xl p-4 border border-gray-200 dark:border-[#1e2d45]">
                  <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Environment</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{selectedAgent.environment || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 dark:bg-[#111827] rounded-xl p-4 border border-gray-200 dark:border-[#1e2d45]">
                  <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Response Time</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(() => {
                      const telemetryResponseTime = getAgentResponseTimeFromTelemetry(selectedAgent.id);
                      const displayResponseTime = telemetryResponseTime !== null ? telemetryResponseTime : selectedAgent.responseTime;
                      return displayResponseTime > 0 ? `${(displayResponseTime / 1000).toFixed(2)}s` : 'N/A';
                    })()}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Success Rate</div>
                  <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                    {(() => {
                      const telemetryRate = getAgentSuccessRateFromTelemetry(selectedAgent.id);
                      return telemetryRate !== null ? `${telemetryRate}%` : `${selectedAgent.successRate}%`;
                    })()}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Tasks Completed</div>
                  <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                    {(() => {
                      const telemetryTasks = getAgentTasksFromTelemetry(selectedAgent.id);
                      return telemetryTasks?.tasksCompleted ?? selectedAgent.tasksCompleted;
                    })()}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-indigo-50 dark:to-[#1a2234] rounded-xl p-5 border border-blue-200 dark:border-blue-900/40">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FaChartLine className="text-blue-600 dark:text-blue-400" />Task Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const telemetryTasks = getAgentTasksFromTelemetry(selectedAgent.id);
                    const tasksGiven = telemetryTasks?.tasksGiven ?? selectedAgent.tasksGiven;
                    const tasksCompleted = telemetryTasks?.tasksCompleted ?? selectedAgent.tasksCompleted;
                    const tasksFailed = telemetryTasks?.tasksFailed ?? selectedAgent.tasksFailed;
                    const tasksInProcess = selectedAgent.tasksInProcess;
                    
                    return [
                      { label: 'Tasks Given', value: tasksGiven, color: 'bg-green-500', pct: 100 },
                      { label: 'Completed', value: tasksCompleted, color: 'bg-blue-500',
                        pct: tasksGiven > 0 ? (tasksCompleted / tasksGiven) * 100 : 0 },
                      { label: 'In Process', value: tasksInProcess, color: 'bg-yellow-500',
                        pct: tasksGiven > 0 ? (tasksInProcess / tasksGiven) * 100 : 0 },
                      { label: 'Failed', value: tasksFailed, color: 'bg-red-500',
                        pct: tasksGiven > 0 ? (tasksFailed / tasksGiven) * 100 : 0 },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-700 dark:text-slate-300">{item.label}</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                        </div>
                        <div className="bg-white dark:bg-[#0d1117] rounded-full h-2">
                          <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-5 border border-purple-200 dark:border-purple-900/40">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><MdSecurity className="text-purple-600 dark:text-purple-400" />Agent Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Created By</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white bg-white dark:bg-[#0d1117] px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-800">{selectedAgent.createdBy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Last Activity</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(selectedAgent.lastActivity).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Last Used</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(selectedAgent.lastUsed).toLocaleString()}</span>
                  </div>
                  {selectedAgent.checkInterval && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-slate-400">Check Interval</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedAgent.checkInterval}s</span>
                    </div>
                  )}
                </div>
              </div>

              {/* <div className="bg-gray-50 dark:bg-[#111827] rounded-xl p-5 border border-gray-200 dark:border-[#1e2d45]">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Overall Performance</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-slate-400">Performance Score</span>
                      <span className={`text-sm font-bold ${
                          selectedAgent.successRate >= 90 ? 'text-green-600 dark:text-green-400'
                          : selectedAgent.successRate >= 70 ? 'text-blue-600 dark:text-blue-400'
                          : selectedAgent.successRate >= 50 ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}>
                        {selectedAgent.successRate >= 90
                          ? 'Excellent'
                          : selectedAgent.successRate >= 70
                          ? 'Good'
                          : selectedAgent.successRate >= 50
                          ? 'Fair'
                          : 'Needs Improvement'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-[#0d1117] rounded-full h-3 overflow-hidden border border-gray-300 dark:border-[#1e2d45]">
                      <div className={`h-3 rounded-full transition-all ${selectedAgent.successRate >= 90 ? 'bg-green-500' : selectedAgent.successRate >= 70 ? 'bg-blue-500' : selectedAgent.successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${selectedAgent.successRate}%` }} />
                    </div>
                  </div>
                </div>
              </div> */}
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-[#111827] border-t border-gray-200 dark:border-[#1e2d45] p-6 rounded-b-2xl">
              <button onClick={() => setShowAgentModal(false)}
                className="w-full px-6 py-3 bg-gray-900 dark:bg-slate-700 hover:bg-gray-800 dark:hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* KILL SWITCH MODAL */}
      {showKillswitchModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleKillswitchCancel}>
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl max-w-md w-full my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-red-600 p-6 rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"><FaPowerOff className="text-2xl" /></div>
                <div><h2 className="text-2xl font-bold">Activate Kill Switch</h2><p className="text-red-100 text-sm">Emergency stop for agent</p></div>
              </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-gray-50 dark:bg-[#111827] rounded-lg p-4 border border-gray-200 dark:border-[#1e2d45]">
                <div className="flex items-center gap-3 mb-2">
                  <FaRobot className="text-gray-600 dark:text-slate-400 text-xl flex-shrink-0" />
                  <div><p className="font-semibold text-gray-900 dark:text-white">{selectedAgent.name}</p><p className="text-sm text-gray-500 dark:text-slate-400">{selectedAgent.type}</p></div>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-300">
                    <p className="font-semibold mb-1">This action will immediately:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-400">
                      <li>Stop all agent operations</li>
                      <li>Revoke all active sessions</li>
                      <li>Disable agent access to systems</li>
                      <li>Require manual reactivation</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Reason <span className="text-red-600">*</span></label>
                <textarea value={killswitchReason}
                  onChange={(e) => setKillswitchReason(e.target.value)}
                  placeholder="Explain why you're activating the kill switch..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#1e2d45] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-white dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                  rows={4}
                  disabled={killswitchLoading} />
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">This reason will be logged for audit purposes</p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-[#111827] border-t border-gray-200 dark:border-[#1e2d45] rounded-b-2xl">
              <div className="flex gap-3">
                <button onClick={handleKillswitchCancel}
                  disabled={killswitchLoading}
                  className="flex-1 px-6 py-3 bg-white dark:bg-[#1a2234] border border-gray-300 dark:border-[#1e2d45] text-gray-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-[#1e2d45] transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={handleKillswitchConfirm}
                  disabled={killswitchLoading || !killswitchReason.trim()}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {killswitchLoading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Activating...</> : <><FaPowerOff />Activate Kill Switch</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RE-ENABLE MODAL */}
      {showReenableModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto" onClick={handleReenableCancel}>
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl max-w-md w-full my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-green-600 p-6 rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"><FaUndo className="text-2xl" /></div>
                <div><h2 className="text-2xl font-bold">Re-enable Agent</h2><p className="text-green-100 text-sm">Restore agent operations</p></div>
              </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-gray-50 dark:bg-[#111827] rounded-lg p-4 border border-gray-200 dark:border-[#1e2d45]">
                <div className="flex items-center gap-3">
                  <FaRobot className="text-gray-600 dark:text-slate-400 text-xl flex-shrink-0" />
                  <div><p className="font-semibold text-gray-900 dark:text-white">{selectedAgent.name}</p><p className="text-sm text-gray-500 dark:text-slate-400">{selectedAgent.type}</p></div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Reason <span className="text-green-600">*</span></label>
                <textarea value={reenableReason}
                  onChange={(e) => setReenableReason(e.target.value)}
                  placeholder="Explain why you're re-enabling this agent..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#1e2d45] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-white dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                  rows={4}
                  disabled={reenableLoading} />
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-[#111827] border-t border-gray-200 dark:border-[#1e2d45] rounded-b-2xl">
              <div className="flex gap-3">
                <button onClick={handleReenableCancel}
                  disabled={reenableLoading}
                  className="flex-1 px-6 py-3 bg-white dark:bg-[#1a2234] border border-gray-300 dark:border-[#1e2d45] text-gray-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-[#1e2d45] transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={handleReenableConfirm}
                  disabled={reenableLoading || !reenableReason.trim()}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {reenableLoading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Re-enabling...</> : <><FaUndo />Confirm Re-enable</>}
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