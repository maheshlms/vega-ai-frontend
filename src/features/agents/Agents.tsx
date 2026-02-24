import React, { useCallback, useState, useEffect } from 'react'
import { FaPlus, FaTrash } from "react-icons/fa6";
import { GoPeople, GoGraph } from "react-icons/go";
import { TiFlashOutline, TiTickOutline } from "react-icons/ti";
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api';
import { IconType } from 'react-icons';
import { auth } from '../../utils/auth';

interface Agent {
  id: string;
  name: string;
  role: string;
  type: string;
  avatarImg: string;       // ← real HeyGen photo URL from config
  avatarName: string;      // ← avatar display name from config
  tasks: string;
  success: string;
  status: string;
  environment?: string;
  isDefault: boolean;
  killswitchActivated?: boolean;
  category: string;
}

interface StatData { icon: IconType; value: string; description: string; sub: string; iconcolor: string; bg: string; }

interface TargetSystem { id?: string; _id?: string; type: string; }

interface RemoteAgent {
  id: string; name: string; type: string; description?: string;
  checkInterval?: number; status?: string;
  config?: {
    environment?: string;
    selectedAvatarImg?: string;    // ← stored by AgentCreationForm
    selectedAvatarName?: string;   // ← stored by AgentCreationForm
  };
  killswitch_activated?: boolean;
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

interface DailyMetrics {
  date: string;
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
}

interface DashboardMetricsResponse {
  daily_metrics_past_7_days: DailyMetrics[];
  agent_metrics: AgentMetrics[];
  timestamp: string;
}

interface TargetSystemMap { [key: string]: string; }

const CATEGORY_CONFIG: Record<string, { label: string; accent: string; tagline: string; icon: string }> = {
  ping_federate:  { label: 'PingFederate',  accent: '#E9472A', tagline: 'Federation & SSO Agents',  icon: '🔐' },
  ping_directory: { label: 'PingDirectory', accent: '#0A85C2', tagline: 'Directory & LDAP Agents',  icon: '📁' },
  ping_one:       { label: 'PingOne',       accent: '#7C3AED', tagline: 'Cloud Identity Agents',    icon: '☁️' },
  unknown:        { label: 'Other Agents',  accent: '#6B7280', tagline: 'Miscellaneous Agents',     icon: '🤖' },
};

const resolveCategory = (systemType: string): string => {
  const t = systemType.toLowerCase().replace(/[-\s]/g, '_');
  if (t.includes('ping_federate')  || t.includes('pingfederate'))  return 'ping_federate';
  if (t.includes('ping_directory') || t.includes('pingdirectory')) return 'ping_directory';
  if (t.includes('ping_one')       || t.includes('pingone'))       return 'ping_one';
  return 'unknown';
};

// ─── Reusable avatar photo with graceful fallback ─────────────────────────────
interface AvatarPhotoProps {
  src: string;
  name: string;
  size: number;
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
}
const AvatarPhoto: React.FC<AvatarPhotoProps> = ({ src, name, size, accent = '#6366f1', className = '', style = {} }) => {
  const [error, setError] = useState(false);
  const initial = (name?.[0] ?? '?').toUpperCase();

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center text-white font-bold rounded-full flex-shrink-0 ${className}`}
        style={{
          width: size, height: size, fontSize: size * 0.38,
          background: `linear-gradient(135deg, ${accent}cc, ${accent})`,
          ...style,
        }}
      >
        {initial}
      </div>
    );
  }
  return (
    <img
      src={src} alt={name}
      className={`object-cover object-top rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size, ...style }}
      onError={() => setError(true)}
    />
  );
};

// ─── Agent Card ───────────────────────────────────────────────────────────────
interface AgentCardProps {
  agent: Agent;
  accent: string;
  metrics?: AgentMetrics | null;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>, agent: Agent) => void;
  onClick: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, accent, metrics, onDelete, onClick }) => {
  const isKilled = agent.killswitchActivated;
  const isActive = agent.status === 'active' && !isKilled;

  return (
    <div
      onClick={onClick}
      className={`relative group rounded-2xl overflow-hidden transition-all duration-300 select-none
        ${isKilled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl'}`}
      style={{ width: 260, background: isKilled ? '#f3f4f6' : '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
    >
      <div className="p-5 2xl:p-7">
        {/* Status dot */}
        <div className="flex justify-end mb-2">
          <div className={`w-2.5 h-2.5 2xl:w-3.5 2xl:h-3.5 rounded-full ${isKilled ? 'bg-gray-400' : isActive ? 'bg-emerald-500' : 'bg-amber-400'}`} />
        </div>

        {/* ─── Real HeyGen avatar photo on card ─────────────────────────── */}
        <div className="flex justify-center mb-4 2xl:mb-5">
          <div
            className="w-24 h-24 2xl:w-32 2xl:h-32 rounded-full p-[3px]"
            style={{ background: isKilled ? '#d1d5db' : `linear-gradient(135deg, ${accent}88, ${accent})` }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
              <AvatarPhoto
                src={agent.avatarImg}
                name={agent.avatarName || agent.name}
                size={90}
                accent={accent}
                className={`w-full h-full ${isKilled ? 'grayscale' : ''}`}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
        {/* ──────────────────────────────────────────────────────────────── */}

        {/* Name & role */}
        <div className="text-center mb-4 2xl:mb-5">
          <h3 className={`text-base 2xl:text-lg font-bold mb-0.5 ${isKilled ? 'text-gray-400' : 'text-gray-900'}`}>
            {agent.name}
          </h3>
          <p className={`text-xs 2xl:text-sm ${isKilled ? 'text-gray-400' : 'text-gray-500'}`}>{agent.role}</p>
          {agent.avatarName && (
            <p className={`text-xs mt-0.5 font-medium ${isKilled ? 'text-gray-300' : 'text-indigo-400'}`}>
              {agent.avatarName}
            </p>
          )}
        </div>

        {/* Type pill */}
        <div className="flex justify-center mb-4 2xl:mb-5">
          <span className="text-xs 2xl:text-sm font-semibold px-3 2xl:px-4 py-1 2xl:py-1.5 rounded-full"
            style={{ background: isKilled ? '#e5e7eb' : `${accent}18`, color: isKilled ? '#9ca3af' : accent }}>
            {agent.type}
          </span>
        </div>

        <div className="border-t border-gray-100 my-3 2xl:my-4" />

        {/* Stats */}
        <div className="flex justify-around">
          <div className="text-center">
            <div className={`text-lg 2xl:text-xl font-bold ${isKilled ? 'text-gray-400' : 'text-gray-800'}`}>
              {metrics?.total_tasks ?? agent.tasks}
            </div>
            <div className="text-xs 2xl:text-sm text-gray-400 mt-0.5">Tasks</div>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="text-center">
            <div className={`text-lg 2xl:text-xl font-bold ${isKilled ? 'text-gray-400' : 'text-emerald-600'}`}>
              {metrics?.overall_success_rate ? `${Math.round(metrics.overall_success_rate)}%` : agent.success}
            </div>
            <div className="text-xs 2xl:text-sm text-gray-400 mt-0.5">Success</div>
          </div>
          {agent.environment && (
            <>
              <div className="w-px bg-gray-100" />
              <div className="text-center">
                <div className={`text-xs 2xl:text-sm font-semibold capitalize mt-1 ${isKilled ? 'text-gray-400' : 'text-gray-700'}`}>
                  {agent.environment}
                </div>
                <div className="text-xs 2xl:text-sm text-gray-400 mt-0.5">Env</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Category Section ─────────────────────────────────────────────────────────
interface CategorySectionProps {
  categoryKey: string;
  agents: Agent[];
  telemetryData: DashboardMetricsResponse | null;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>, agent: Agent) => void;
  onNavigate: (agent: Agent) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ categoryKey, agents, telemetryData, onDelete, onNavigate }) => {
  const config = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG.unknown;
  return (
    <div className="mb-10 2xl:mb-14">
      <div className="flex items-center gap-3 2xl:gap-4 mb-5 2xl:mb-7">
        <div className="w-10 h-10 2xl:w-14 2xl:h-14 rounded-xl flex items-center justify-center text-lg 2xl:text-2xl flex-shrink-0"
          style={{ background: `${config.accent}18` }}>
          {config.icon}
        </div>
        <div>
          <div className="flex items-center gap-2 2xl:gap-3">
            <h2 className="text-lg 2xl:text-2xl font-bold text-gray-900 dark:text-white">{config.label}</h2>
            <span className="text-xs 2xl:text-sm font-semibold px-2 2xl:px-3 py-0.5 2xl:py-1 rounded-full"
              style={{ background: `${config.accent}18`, color: config.accent }}>
              {agents.length} agent{agents.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs 2xl:text-sm text-gray-400 mt-0.5">{config.tagline}</p>
        </div>
        <div className="flex-1 h-px ml-2" style={{ background: `linear-gradient(to right, ${config.accent}40, transparent)` }} />
      </div>
      <div className="flex flex-wrap gap-5 2xl:gap-8">
        {agents.map((agent, i) => {
          const agentMetrics = telemetryData?.agent_metrics?.length
            ? telemetryData.agent_metrics.find(m => m.agent_id === agent.id)
            : null;
          return (
            <AgentCard key={agent.id || i} agent={agent} accent={config.accent} metrics={agentMetrics}
              onDelete={onDelete} onClick={() => { if (!agent.killswitchActivated) onNavigate(agent); }} />
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Agents: React.FC = () => {
  const navigate = useNavigate();
  const [agents,          setAgents]          = useState<Agent[]>([]);
  const [loading,         setLoading]         = useState<boolean>(true);
  const [error,           setError]           = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [agentToDelete,   setAgentToDelete]   = useState<Agent | null>(null);
  const [activeFilter,    setActiveFilter]    = useState<string>('All');
  const [telemetryData,   setTelemetryData]   = useState<DashboardMetricsResponse | null>(null);

  useEffect(() => {
    const formatSystemTypeName = (systemType: string): string => {
      if (!systemType) return 'System';
      return systemType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };

    const fetchAgents = async (): Promise<void> => {
      try {
        let targetSystemMap: TargetSystemMap = {};
        try {
          const targetSystems: TargetSystem[] = await api.targetSystems.list();
          if (Array.isArray(targetSystems)) {
            targetSystems.forEach(system => {
              const systemId = system.id || system._id;
              if (systemId) targetSystemMap[systemId] = system.type;
            });
          }
        } catch (err) { console.warn('Failed to fetch target systems:', err); }

        const remoteAgents: RemoteAgent[] = await api.llmRuntime.listAgents();
        const normalized: Agent[] = (remoteAgents || []).map(agent => {
          let systemType = agent.type;
          const targetMatch = (agent.description || '').match(/\(target\s+([a-f0-9\-]+)\)/);
          if (targetMatch) {
            const tid = targetMatch[1];
            if (targetSystemMap[tid]) systemType = targetSystemMap[tid];
          }

          return {
            id:                 agent.id,
            name:               agent.name,
            role:               `${formatSystemTypeName(systemType)} Agent`,
            type:               agent.type,
            avatarImg:          agent.config?.selectedAvatarImg  ?? '',  // ← real photo
            avatarName:         agent.config?.selectedAvatarName ?? '',  // ← avatar name
            tasks:              agent.checkInterval ? Math.max(1, Math.floor(86400 / agent.checkInterval)).toString() : '0',
            success:            agent.status === 'active' ? '100%' : '0%',
            status:             agent.status || 'active',
            environment:        agent.config?.environment,
            isDefault:          false,
            killswitchActivated: agent.killswitch_activated || false,
            category:           resolveCategory(systemType),
          };
        });

        setAgents(normalized);
      } catch (err) {
        console.error('Failed to fetch agents', err);
        setError('Unable to load agents from runtime');
        setAgents([]);
      } finally { setLoading(false); }
    };

    fetchAgents();
  }, []);

  // ─── Fetch telemetry data ───
  useEffect(() => {
    const fetchTelemetry = async (): Promise<void> => {
      try {
        const token = auth.getToken();
        if (!token) {
          console.warn('No authentication token available for telemetry');
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
        } else {
          console.error('Failed to fetch telemetry:', response.status);
        }
      } catch (error: any) {
        console.error('Error fetching telemetry:', error);
      }
    };

    fetchTelemetry();
  }, []);

  // ─── Get agent telemetry metrics ───
  const getAgentMetrics = (agentId: string) => {
    if (!telemetryData?.agent_metrics?.length) return null;
    return telemetryData.agent_metrics.find(m => m.agent_id === agentId);
  };

  const handleCreateAgent = useCallback(() => navigate('/agents/select-target'), [navigate]);

  const alive      = agents.filter(a => !a.killswitchActivated);
  const active     = agents.filter(a => a.status === 'active' && !a.killswitchActivated);
  
  // Calculate total tasks and average success rate from telemetry - only for displayed agents
  const totalTasks = telemetryData?.agent_metrics?.length 
    ? telemetryData.agent_metrics
        .filter(m => alive.some(a => a.id === m.agent_id))
        .reduce((sum, m) => sum + m.total_tasks, 0)
    : alive.reduce((s, a) => s + parseInt(a.tasks || '0'), 0);
  
  const avgSuccessRate = telemetryData?.agent_metrics?.length
    ? (telemetryData.agent_metrics
        .filter(m => alive.some(a => a.id === m.agent_id))
        .reduce((sum, m) => sum + m.overall_success_rate, 0) / telemetryData.agent_metrics.filter(m => alive.some(a => a.id === m.agent_id)).length).toFixed(1)
    : '0.0';

  const stats: StatData[] = [
    { icon: GoPeople,       value: alive.length.toString(),   description: 'Total Agents',     sub: '+1 this month',      iconcolor: '#60A5FA', bg: '#EFF6FF' },
    { icon: TiFlashOutline, value: active.length.toString(),  description: 'Active Now',       sub: '75% uptime',         iconcolor: '#22C55E', bg: '#F0FDF4' },
    { icon: TiTickOutline,  value: totalTasks.toString(),     description: 'Tasks Completed',  sub: '+12% vs last week',  iconcolor: '#A78BFA', bg: '#F5F3FF' },
    { icon: GoGraph,        value: `${avgSuccessRate}%`,      description: 'Avg Success Rate', sub: '+2.3% improvement',  iconcolor: '#F97316', bg: '#FFF7ED' },
  ];

  const filters = ['All', 'Production', 'Staging', 'Development', 'Inactive'];

  const getFilteredAgents = (): Agent[] => {
    switch (activeFilter) {
      case 'Production': return agents.filter(a => !a.killswitchActivated && ['production', 'prod'].includes(a.environment?.toLowerCase() || ''));
      case 'Staging':    return agents.filter(a => !a.killswitchActivated && ['staging', 'stage'].includes(a.environment?.toLowerCase() || ''));
      case 'Development':    return agents.filter(a => !a.killswitchActivated && ['development', 'dev'].includes(a.environment?.toLowerCase() || ''));
      case 'Inactive':   return agents.filter(a => a.killswitchActivated || a.status !== 'active');
      default:           return agents.filter(a => !a.killswitchActivated);
    }
  };

  const filteredAgents  = getFilteredAgents();
  const categoryOrder   = ['ping_federate', 'ping_directory', 'ping_one', 'unknown'];
  const grouped: Record<string, Agent[]> = {};
  categoryOrder.forEach(k => { grouped[k] = []; });
  filteredAgents.forEach(a => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  });
  const activeCategories = categoryOrder.filter(k => grouped[k]?.length > 0);

  const handleDeleteClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, agent: Agent) => {
    e.stopPropagation(); setAgentToDelete(agent); setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!agentToDelete) return;
    (async () => {
      try {
        await api.llmRuntime.deleteAgent(agentToDelete.id);
        setAgents(prev => prev.filter(a => a.id !== agentToDelete.id));
      } catch (err: any) { alert('Failed to delete agent: ' + err.message); }
      finally { setShowDeleteModal(false); setAgentToDelete(null); }
    })();
  }, [agentToDelete]);

  const cancelDelete = useCallback(() => { setShowDeleteModal(false); setAgentToDelete(null); }, []);

  return (
    <div className="bg-[#F9FAFB] dark:bg-[#1a2234] min-h-screen pb-12 2xl:pb-20">

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl max-w-md 2xl:max-w-xl w-full p-8 2xl:p-12">
            <div className="flex justify-center mb-6 2xl:mb-8">
              <div className="w-16 h-16 2xl:w-20 2xl:h-20 bg-red-100 rounded-full flex items-center justify-center">
                <FaTrash className="text-red-600 text-2xl 2xl:text-3xl" />
              </div>
            </div>
            <h2 className="text-2xl 2xl:text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">Delete Agent?</h2>

            {/* Show avatar photo in delete modal */}
            {agentToDelete && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 2xl:p-5 mb-6 2xl:mb-8 flex items-center gap-3">
                <AvatarPhoto
                  src={agentToDelete.avatarImg}
                  name={agentToDelete.avatarName || agentToDelete.name}
                  size={48}
                  className="flex-shrink-0"
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white 2xl:text-lg">{agentToDelete.name}</p>
                  <p className="text-sm 2xl:text-base text-gray-500">{agentToDelete.role}</p>
                  {agentToDelete.environment && (
                    <p className="text-xs 2xl:text-sm text-gray-400 mt-1">Env: {agentToDelete.environment}</p>
                  )}
                </div>
              </div>
            )}

            <p className="text-gray-500 2xl:text-base text-center mb-8 2xl:mb-10 text-sm">
              This action cannot be undone. All monitoring for this agent will stop.
            </p>
            <div className="flex gap-3 2xl:gap-4">
              <button onClick={cancelDelete}
                className="flex-1 px-6 py-3 2xl:px-8 2xl:py-4 2xl:text-base bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 px-6 py-3 2xl:px-8 2xl:py-4 2xl:text-base bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1920px] 2xl:max-w-[2400px] mx-auto px-6 2xl:px-20 pt-6 2xl:pt-10">

        <div className="flex justify-between items-start mb-8 2xl:mb-12">
          <div>
            <h1 className="font-bold text-2xl 2xl:text-4xl text-gray-900 dark:text-white">AI Agents</h1>
            <p className="text-gray-400 text-sm 2xl:text-base mt-1">Manage and monitor your AI-powered IAM agents</p>
          </div>
          <button onClick={handleCreateAgent}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 2xl:px-7 h-10 2xl:h-12 2xl:text-base rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm">
            <FaPlus size={12} /> Create New Agent
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 2xl:gap-6 mb-10 2xl:mb-14">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white dark:bg-[#1a2234] rounded-2xl p-5 2xl:p-7 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 2xl:gap-5">
                <div className="w-11 h-11 2xl:w-14 2xl:h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                  <Icon style={{ color: s.iconcolor }} size={20} />
                </div>
                <div>
                  <div className="text-2xl 2xl:text-4xl font-bold text-gray-900 dark:text-white">{s.value}</div>
                  <div className="text-xs 2xl:text-sm text-gray-400 mt-0.5">{s.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1 mb-8 2xl:mb-10 bg-gray-100 dark:bg-gray-800 w-fit rounded-xl p-1">
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-4 2xl:px-6 py-1.5 2xl:py-2 rounded-lg text-sm 2xl:text-base font-medium transition-all ${
                activeFilter === f
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-24 2xl:p-36">
            <div className="animate-spin rounded-full h-8 w-8 2xl:h-12 2xl:w-12 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 2xl:p-8 text-red-600 text-sm 2xl:text-base">{error}</div>
        ) : filteredAgents.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 p-16 2xl:p-24 text-center">
            <div className="text-4xl 2xl:text-6xl mb-4">🤖</div>
            <p className="text-gray-500 dark:text-white text-lg 2xl:text-2xl font-medium">
              {activeFilter === 'All' ? 'No agents configured yet.' : `No ${activeFilter.toLowerCase()} agents found.`}
            </p>
            {activeFilter === 'All' && (
              <button onClick={handleCreateAgent}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 2xl:px-8 py-2.5 2xl:py-3 2xl:text-base rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2">
                <FaPlus size={12} /> Create your first agent
              </button>
            )}
          </div>
        ) : (
          <div>
            {activeCategories.map(catKey => (
              <CategorySection key={catKey} categoryKey={catKey} agents={grouped[catKey]} telemetryData={telemetryData}
                onDelete={handleDeleteClick}
                onNavigate={agent => navigate(`/agents/${agent.id}/chat`, { state: { agent } })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agents;