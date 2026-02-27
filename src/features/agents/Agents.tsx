import React, { useCallback, useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { GoPeople, GoGraph } from "react-icons/go";
import { TiFlashOutline, TiTickOutline } from "react-icons/ti";
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api';
import { IconType } from 'react-icons';
import { auth } from '../../utils/auth';

let avatarManifest: Record<string, string> = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  avatarManifest = require('../../data/avatarManifest.json');
} catch {
  // Script not run yet — will fall back to stored CDN URL or initials
}

function resolveAvatarImg(avatarId: string, storedImg: string): string {
  if (avatarId && avatarManifest[avatarId]) return avatarManifest[avatarId];
  if (storedImg && !storedImg.match(/\.(mp4|webm|mov)(\?|$)/i)) return storedImg;
  return '';
}

interface Agent {
  id: string;
  name: string;
  role: string;
  type: string;
  avatarImg: string;
  avatarName: string;
  avatarId: string;
  tasks: string;
  success: string;
  status: string;
  environment?: string;
  isDefault: boolean;
  killswitchActivated?: boolean;
  category: string;
}

interface StatData { icon: IconType; value: string; description: string; sub: string; iconcolor: string; bg: string; darkBg: string; }

interface TargetSystem { id?: string; _id?: string; type: string; }

interface RemoteAgent {
  id: string; name: string; type: string; description?: string;
  checkInterval?: number; status?: string;
  config?: {
    environment?: string;
    integrationType?: string;
    targetSystemName?: string;
    selectedAvatarId?: string;
    selectedAvatarImg?: string;
    selectedAvatarName?: string;
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

const resolveCategory = (input: string): string => {
  if (!input) return 'unknown';
  const t = input.toLowerCase().replace(/[-\s]/g, '_');
  if (t.includes('ping_federate') || t.includes('pingfederate') || t.includes('federation')) return 'ping_federate';
  if (t.includes('ping_directory') || t.includes('pingdirectory') || t.includes('directory')) return 'ping_directory';
  if (t.includes('ping_one') || t.includes('pingone')) return 'ping_one';
  return 'unknown';
};

interface AvatarPhotoProps {
  src: string;
  name: string;
  size: number;
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
}
const AvatarPhoto: React.FC<AvatarPhotoProps> = ({ src, name, size, accent = '#6366f1', className = '', style = {} }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => { setImgSrc(src); setFailed(false); }, [src]);

  const initial = (name?.[0] ?? '?').toUpperCase();

  if (!imgSrc || failed) {
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
      src={imgSrc}
      alt={name}
      className={`object-cover object-top rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size, ...style }}
      onError={() => setFailed(true)}
    />
  );
};

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

  const resolvedImg = resolveAvatarImg(agent.avatarId, agent.avatarImg);

  return (
    <div
      onClick={onClick}
      className={`relative group rounded-2xl overflow-hidden transition-all duration-300 select-none
        ${isKilled
          ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-[#1a2234]'
          : 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl bg-white dark:bg-[#1a2234]'
        }`}
      style={{
        /* Responsive card width: smaller on <1920, base at 1920, larger above */
        width: 'clamp(220px, 14vw, 320px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)'
      }}
    >
      {/* Delete button */}
      <button
        onClick={(e) => onDelete(e, agent)}
        title="Delete agent"
        className="absolute top-3 left-3 z-10 w-7 h-7 2xl:w-9 2xl:h-9 flex items-center justify-center rounded-full bg-white dark:bg-[#111827] shadow-md border border-gray-100 dark:border-[#1e2d45] text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <FaTrash size={11} />
      </button>

      <div className="p-4 xl:p-5 2xl:p-7">
        {/* Status dot */}
        <div className="flex justify-end mb-2">
          <div className={`w-2.5 h-2.5 2xl:w-3.5 2xl:h-3.5 rounded-full ${isKilled ? 'bg-gray-400' : isActive ? 'bg-emerald-500' : 'bg-amber-400'}`} />
        </div>

        {/* Avatar photo */}
        <div className="flex justify-center mb-3 xl:mb-4 2xl:mb-5">
          <div
            className="w-20 h-20 xl:w-24 xl:h-24 2xl:w-32 2xl:h-32 rounded-full p-[3px]"
            style={{ background: isKilled ? '#d1d5db' : `linear-gradient(135deg, ${accent}88, ${accent})` }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-[#111827]">
              <AvatarPhoto
                src={resolvedImg}
                name={agent.avatarName || agent.name}
                size={90}
                accent={accent}
                className={`w-full h-full ${isKilled ? 'grayscale' : ''}`}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Name & role */}
        <div className="text-center mb-3 xl:mb-4 2xl:mb-5">
          <h3 className={`text-sm xl:text-base 2xl:text-lg font-bold mb-0.5 ${isKilled ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            {agent.name}
          </h3>
          <p className={`text-xs 2xl:text-sm ${isKilled ? 'text-gray-400' : 'text-gray-500 dark:text-slate-400'}`}>{agent.role}</p>
        </div>

        {/* Type pill */}
        <div className="flex justify-center mb-3 xl:mb-4 2xl:mb-5">
          <span className="text-xs 2xl:text-sm font-semibold px-3 2xl:px-4 py-1 2xl:py-1.5 rounded-full"
            style={{
              background: isKilled ? (document.documentElement.classList.contains('dark') ? '#1e2d45' : '#e5e7eb') : `${accent}18`,
              color: isKilled ? (document.documentElement.classList.contains('dark') ? '#6b7280' : '#9ca3af') : accent
            }}>
            {agent.type}
          </span>
        </div>

        <div className="border-t border-gray-100 dark:border-[#1e2d45] my-2.5 xl:my-3 2xl:my-4" />

        {/* Stats */}
        <div className="flex justify-around">
          <div className="text-center">
            <div className={`text-base xl:text-lg 2xl:text-xl font-bold ${isKilled ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
              {metrics?.total_tasks ?? 0}
            </div>
            <div className="text-xs 2xl:text-sm text-gray-400 dark:text-slate-500 mt-0.5">Tasks</div>
          </div>
          <div className="w-px bg-gray-100 dark:bg-[#1e2d45]" />
          <div className="text-center">
            <div className={`text-base xl:text-lg 2xl:text-xl font-bold ${isKilled ? 'text-gray-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {metrics?.overall_success_rate ? `${Math.round(metrics.overall_success_rate)}%` : agent.success}
            </div>
            <div className="text-xs 2xl:text-sm text-gray-400 dark:text-slate-500 mt-0.5">Success</div>
          </div>
          {agent.environment && (
            <>
              <div className="w-px bg-gray-100 dark:bg-[#1e2d45]" />
              <div className="text-center">
                <div className={`text-xs 2xl:text-sm font-semibold capitalize mt-1 ${isKilled ? 'text-gray-400' : 'text-gray-700 dark:text-slate-300'}`}>
                  {agent.environment}
                </div>
                <div className="text-xs 2xl:text-sm text-gray-400 dark:text-slate-500 mt-0.5">Env</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

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
    <div className="mb-8 xl:mb-10 2xl:mb-14">
      <div className="flex items-center gap-2 xl:gap-3 2xl:gap-4 mb-4 xl:mb-5 2xl:mb-7">
        <div className="w-8 h-8 xl:w-10 xl:h-10 2xl:w-14 2xl:h-14 rounded-xl flex items-center justify-center text-base xl:text-lg 2xl:text-2xl flex-shrink-0"
          style={{ background: `${config.accent}18` }}>
          {config.icon}
        </div>
        <div>
          <div className="flex items-center gap-2 2xl:gap-3">
            <h2 className="text-base xl:text-lg 2xl:text-2xl font-bold text-gray-900 dark:text-white">{config.label}</h2>
            <span className="text-xs 2xl:text-sm font-semibold px-2 2xl:px-3 py-0.5 2xl:py-1 rounded-full"
              style={{ background: `${config.accent}18`, color: config.accent }}>
              {agents.length} agent{agents.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs 2xl:text-sm text-gray-400 dark:text-slate-500 mt-0.5">{config.tagline}</p>
        </div>
        <div className="flex-1 h-px ml-2" style={{ background: `linear-gradient(to right, ${config.accent}40, transparent)` }} />
      </div>
      <div className="flex flex-wrap gap-4 xl:gap-5 2xl:gap-8">
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

          const avatarId  = agent.config?.selectedAvatarId  ?? '';
          const storedImg = agent.config?.selectedAvatarImg  ?? '';

          const storedIntegrationType = agent.config?.integrationType ?? '';
          const targetSystemName      = agent.config?.targetSystemName ?? '';

          const categoryInput =
            storedIntegrationType                      ? storedIntegrationType :
            systemType !== agent.type                  ? systemType :
            targetSystemName                           ? targetSystemName :
            agent.type;

          const role = `${formatSystemTypeName(
            storedIntegrationType || (systemType !== agent.type ? systemType : agent.type)
          )} Agent`;

          return {
            id:                  agent.id,
            name:                agent.name,
            role,
            type:                agent.type,
            avatarId,
            avatarImg:           storedImg,
            avatarName:          agent.config?.selectedAvatarName ?? '',
            tasks:               agent.checkInterval ? Math.max(1, Math.floor(86400 / agent.checkInterval)).toString() : '0',
            success:             agent.status === 'active' ? '100%' : '0%',
            status:              agent.status || 'active',
            environment:         agent.config?.environment,
            isDefault:           false,
            killswitchActivated: agent.killswitch_activated || false,
            category:            resolveCategory(categoryInput),
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

  useEffect(() => {
    const fetchTelemetry = async (): Promise<void> => {
      try {
        const token = auth.getToken();
        if (!token) return;
        const response = await fetch('/api/v1/telemetry/dashboard?days=7', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) setTelemetryData(await response.json());
      } catch (error: any) { console.error('Error fetching telemetry:', error); }
    };
    fetchTelemetry();
  }, []);

  const handleCreateAgent = useCallback(() => navigate('/agents/select-target'), [navigate]);

  const alive   = agents.filter(a => !a.killswitchActivated);
  const active  = agents.filter(a => a.status === 'active' && !a.killswitchActivated);

  const totalTasks = telemetryData?.agent_metrics?.length
    ? telemetryData.agent_metrics.filter(m => alive.some(a => a.id === m.agent_id)).reduce((s, m) => s + m.total_tasks, 0)
    : alive.reduce((s, a) => s + parseInt(a.tasks || '0'), 0);

  const relevantMetrics = telemetryData?.agent_metrics?.filter(m => alive.some(a => a.id === m.agent_id)) ?? [];
  const avgSuccessRate  = relevantMetrics.length
    ? (relevantMetrics.reduce((s, m) => s + m.overall_success_rate, 0) / relevantMetrics.length).toFixed(1)
    : '0.0';

  const stats = [
    { icon: GoPeople,       value: alive.length.toString(),  description: 'Total Agents',     sub: '+1 this month',     iconcolor: '#60A5FA', bg: '#EFF6FF',  darkBg: 'rgba(96,165,250,0.15)' },
    { icon: TiFlashOutline, value: active.length.toString(), description: 'Active Now',       sub: '75% uptime',        iconcolor: '#22C55E', bg: '#F0FDF4',  darkBg: 'rgba(34,197,94,0.15)' },
    { icon: TiTickOutline,  value: totalTasks.toString(),    description: 'Tasks Completed',  sub: '+12% vs last week', iconcolor: '#A78BFA', bg: '#F5F3FF',  darkBg: 'rgba(167,139,250,0.15)' },
    { icon: GoGraph,        value: `${avgSuccessRate}%`,     description: 'Avg Success Rate', sub: '+2.3% improvement', iconcolor: '#F97316', bg: '#FFF7ED',  darkBg: 'rgba(249,115,22,0.15)' },
  ];

  const filters = ['All', 'Production', 'Staging', 'Development', 'Inactive'];

  const getFilteredAgents = (): Agent[] => {
    switch (activeFilter) {
      case 'Production':  return agents.filter(a => !a.killswitchActivated && ['production', 'prod'].includes(a.environment?.toLowerCase() || ''));
      case 'Staging':     return agents.filter(a => !a.killswitchActivated && ['staging', 'stage'].includes(a.environment?.toLowerCase() || ''));
      case 'Development': return agents.filter(a => !a.killswitchActivated && ['development', 'dev'].includes(a.environment?.toLowerCase() || ''));
      case 'Inactive':    return agents.filter(a => a.killswitchActivated || a.status !== 'active');
      default:            return agents.filter(a => !a.killswitchActivated);
    }
  };

  const filteredAgents  = getFilteredAgents();
  const categoryOrder   = ['ping_federate', 'ping_directory', 'ping_one', 'unknown'];
  const grouped: Record<string, Agent[]> = {};
  categoryOrder.forEach(k => { grouped[k] = []; });
  filteredAgents.forEach(a => { if (!grouped[a.category]) grouped[a.category] = []; grouped[a.category].push(a); });
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
    <div className="bg-[#F9FAFB] dark:bg-[#0d1117] min-h-screen pb-8 xl:pb-12 2xl:pb-20">

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl shadow-2xl
            max-w-sm xl:max-w-md 2xl:max-w-xl
            w-full
            p-6 xl:p-8 2xl:p-12">
            <div className="flex justify-center mb-4 xl:mb-6 2xl:mb-8">
              <div className="w-12 h-12 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <FaTrash className="text-red-600 dark:text-red-400 text-xl xl:text-2xl 2xl:text-3xl" />
              </div>
            </div>
            <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">Delete Agent?</h2>
            {agentToDelete && (
              <div className="bg-gray-50 dark:bg-[#111827] rounded-xl p-3 xl:p-4 2xl:p-5 mb-4 xl:mb-6 2xl:mb-8 flex items-center gap-3 border border-gray-100 dark:border-[#1e2d45]">
                <AvatarPhoto
                  src={resolveAvatarImg(agentToDelete.avatarId, agentToDelete.avatarImg)}
                  name={agentToDelete.avatarName || agentToDelete.name}
                  size={48}
                  className="flex-shrink-0"
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm xl:text-base 2xl:text-lg">{agentToDelete.name}</p>
                  <p className="text-xs xl:text-sm 2xl:text-base text-gray-500 dark:text-slate-400">{agentToDelete.role}</p>
                  {agentToDelete.environment && (
                    <p className="text-xs 2xl:text-sm text-gray-400 dark:text-slate-500 mt-1">Env: {agentToDelete.environment}</p>
                  )}
                </div>
              </div>
            )}
            <p className="text-gray-500 dark:text-slate-400 2xl:text-base text-center mb-6 xl:mb-8 2xl:mb-10 text-xs xl:text-sm">
              This action cannot be undone. All monitoring for this agent will stop.
            </p>
            <div className="flex gap-2 xl:gap-3 2xl:gap-4">
              <button onClick={cancelDelete}
                className="flex-1 px-4 py-2.5 xl:px-6 xl:py-3 2xl:px-8 2xl:py-4 2xl:text-base bg-gray-100 dark:bg-[#111827] hover:bg-gray-200 dark:hover:bg-[#1e2d45] text-gray-700 dark:text-slate-300 rounded-xl font-medium transition-colors border border-transparent dark:border-[#1e2d45] text-sm">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 xl:px-6 xl:py-3 2xl:px-8 2xl:py-4 2xl:text-base bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors text-sm">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1920px] 2xl:max-w-[2400px] mx-auto
        px-4 xl:px-6 2xl:px-20
        pt-4 xl:pt-6 2xl:pt-10">

        <div className="flex justify-between items-start mb-6 xl:mb-8 2xl:mb-12">
          <div>
            <h1 className="text-2xl xl:text-3xl lg:text-4xl 2xl:text-5xl font-bold leading-tight tracking-tight mb-1 xl:mb-2 text-gray-900 dark:text-white">AI Agents</h1>
            <p className="text-gray-400 dark:text-slate-500 text-xs xl:text-sm 2xl:text-base mt-1">Manage and monitor your AI-powered IAM agents</p>
          </div>
          <button onClick={handleCreateAgent}
            className="bg-blue-600 hover:bg-blue-700 text-white
              px-4 xl:px-5 2xl:px-7
              h-9 xl:h-10 2xl:h-12
              text-xs xl:text-sm 2xl:text-base
              rounded-xl flex items-center gap-2 font-semibold transition-colors shadow-sm">
            <FaPlus size={12} /> Create New Agent
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4 2xl:gap-6 mb-8 xl:mb-10 2xl:mb-14">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white dark:bg-[#1a2234] rounded-2xl
                p-4 xl:p-5 2xl:p-7
                shadow-sm border border-gray-100 dark:border-[#1e2d45] flex items-center
                gap-3 xl:gap-4 2xl:gap-5">
                <div className="w-9 h-9 xl:w-11 xl:h-11 2xl:w-14 2xl:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: s.bg }}>
                  <Icon style={{ color: s.iconcolor }} size={18} />
                </div>
                <div>
                  <div className="text-xl xl:text-2xl 2xl:text-4xl font-bold text-gray-900 dark:text-white">{s.value}</div>
                  <div className="text-xs 2xl:text-sm text-gray-400 dark:text-slate-500 mt-0.5">{s.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 xl:mb-8 2xl:mb-10 bg-gray-100 dark:bg-[#1a2234] w-fit rounded-xl p-1 border border-transparent dark:border-[#1e2d45]">
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-3 xl:px-4 2xl:px-6
                py-1 xl:py-1.5 2xl:py-2
                rounded-lg text-xs xl:text-sm 2xl:text-base
                font-medium transition-all ${
                activeFilter === f
                  ? 'bg-white dark:bg-[#111827] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
              }`}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16 xl:p-24 2xl:p-36">
            <div className="animate-spin rounded-full h-6 w-6 xl:h-8 xl:w-8 2xl:h-12 2xl:w-12 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 xl:p-6 2xl:p-8 text-red-600 dark:text-red-400 text-xs xl:text-sm 2xl:text-base">{error}</div>
        ) : filteredAgents.length === 0 ? (
          <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#1e2d45] p-10 xl:p-16 2xl:p-24 text-center">
            <div className="text-3xl xl:text-4xl 2xl:text-6xl mb-4">🤖</div>
            <p className="text-gray-500 dark:text-slate-400 text-base xl:text-lg 2xl:text-2xl font-medium">
              {activeFilter === 'All' ? 'No agents configured yet.' : `No ${activeFilter.toLowerCase()} agents found.`}
            </p>
            {activeFilter === 'All' && (
              <button onClick={handleCreateAgent}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white
                  px-4 xl:px-6 2xl:px-8
                  py-2 xl:py-2.5 2xl:py-3
                  text-xs xl:text-sm 2xl:text-base
                  rounded-xl font-semibold transition-colors inline-flex items-center gap-2">
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