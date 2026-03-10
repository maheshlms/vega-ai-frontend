import React, { useCallback, useState, useEffect, useRef } from 'react'
import { FaPlus } from "react-icons/fa6";
import { GoPeople, GoGraph } from "react-icons/go";
import { TiFlashOutline, TiTickOutline } from "react-icons/ti";
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api';
import { IconType } from 'react-icons';
import { auth } from '../../utils/auth';
import AgentToggleModal from './AgentToggleModal'; // ← shared component

// ─── Per-category accent tones ────────────────────────────────────────────────
const CATEGORY_TONES: Record<string, { shadow: string; logoBg: string; headerBg: string }> = {
  ping_federate:  { shadow: 'rgba(233,71,42,0.15)',  logoBg: '#FFF5F3', headerBg: '#FFF8F7' },
  ping_directory: { shadow: 'rgba(10,133,194,0.15)', logoBg: '#F0F8FF', headerBg: '#F5FBFF' },
  ping_one:       { shadow: 'rgba(124,58,237,0.15)', logoBg: '#FAF5FF', headerBg: '#FCF9FF' },
  unknown:        { shadow: 'rgba(107,114,128,0.15)',logoBg: '#F9FAFB', headerBg: '#FAFAFA' },
};

let avatarManifest: Record<string, string> = {};
try {
  avatarManifest = require('../../data/avatarManifest.json');
} catch {
  // fall back to initials
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
  disabled?: boolean;
}

interface StatData { icon: IconType; value: string; description: string; sub: string; iconcolor: string; bg: string; }
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

// ─── Toggle Switch ────────────────────────────────────────────────────────────
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (e: React.MouseEvent) => void;
  accent: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange }) => {
  const [pressed, setPressed] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    setPressed(true);
    setTimeout(() => setPressed(false), 300);
    onChange(e);
  };

  const trackColor = enabled ? '#22C55E' : '#EF4444';
  const glowColor  = enabled ? 'rgba(34,197,94,0.40)' : 'rgba(239,68,68,0.35)';
  const ringColor  = enabled ? 'rgba(34,197,94,0.30)' : 'rgba(239,68,68,0.30)';

  return (
    <button
      onClick={handleClick}
      title={enabled ? 'Click to disable agent' : 'Click to enable agent'}
      style={{
        position: 'relative',
        flexShrink: 0,
        width: 42,
        height: 22,
        borderRadius: 9999,
        background: trackColor,
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        outline: 'none',
        transition: 'background 0.22s ease, box-shadow 0.18s ease',
        boxShadow: pressed
          ? `0 0 0 3px ${ringColor}`
          : `0 2px 8px ${glowColor}`,
        overflow: 'hidden',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: enabled ? 23 : 3,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#ffffff',
        transition: 'left 0.22s cubic-bezier(0.34,1.4,0.64,1), transform 0.14s ease',
        boxShadow: `0 1px 5px ${trackColor}88, 0 0 0 0.5px rgba(0,0,0,0.06)`,
        transform: pressed ? 'scale(0.76)' : 'scale(1)',
        zIndex: 2,
        display: 'block',
      }} />
      <span style={{
        position: 'absolute', inset: -2, borderRadius: 9999,
        border: `1.5px solid ${trackColor}`,
        opacity: pressed ? 0.5 : 0,
        transition: 'opacity 0.22s ease',
        pointerEvents: 'none',
        zIndex: 3,
      }} />
    </button>
  );
};

// ─── Avatar Photo ─────────────────────────────────────────────────────────────
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
        style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, ${accent}cc, ${accent})`, ...style }}
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

// ─── Agent Card ───────────────────────────────────────────────────────────────
interface AgentCardProps {
  agent: Agent;
  accent: string;
  category: string;
  metrics?: AgentMetrics | null;
  onToggle: (e: React.MouseEvent, agent: Agent) => void;
  onClick: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, accent, category, metrics, onToggle, onClick }) => {
  const [hovered, setHovered]             = useState(false);
  const [justToggled, setJustToggled]     = useState(false);
  const [toastVisible, setToastVisible]   = useState(false);
  const [toastMsg, setToastMsg]           = useState('');
  const [toastIsEnable, setToastIsEnable] = useState(false);

  const isDisabled  = agent.disabled || agent.killswitchActivated;
  const isActive    = agent.status === 'active' && !isDisabled;
  const resolvedImg = resolveAvatarImg(agent.avatarId, agent.avatarImg);
  const tones       = CATEGORY_TONES[category] || CATEGORY_TONES.unknown;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(e, agent);
  };

  const prevDisabled = React.useRef(isDisabled);
  useEffect(() => {
    if (prevDisabled.current !== isDisabled) {
      setJustToggled(true);
      setToastIsEnable(!isDisabled);
      setToastMsg(isDisabled ? 'Agent disabled' : 'Agent enabled');
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 1800);
      setTimeout(() => setJustToggled(false), 600);
      prevDisabled.current = isDisabled;
    }
  }, [isDisabled]);

  const cardStyle: React.CSSProperties = hovered && !isDisabled ? {
    borderColor: accent,
    boxShadow: `0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 40px -8px ${tones.shadow}`,
    transform: 'translateY(-3px)',
  } : {};

  return (
    <div
      className="agent-card bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col relative"
      data-disabled={isDisabled ? 'true' : 'false'}
      style={{
        opacity:    isDisabled ? 0.48 : 1,
        filter:     isDisabled ? 'grayscale(0.65)' : 'grayscale(0)',
        cursor:     isDisabled ? 'default' : 'pointer',
        border:     isDisabled ? '1px solid #e5e7eb' : undefined,
        transition: 'opacity 0.35s ease, filter 0.35s ease, transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
        transform:  justToggled ? 'scale(0.975)' : (hovered && !isDisabled ? 'translateY(-3px)' : 'scale(1)'),
        ...(hovered && !isDisabled && !justToggled ? cardStyle : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={!isDisabled ? onClick : undefined}
    >
      <div className="agent-accent-bar" style={{ background: accent }} />

      {/* Toast overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 20, borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        opacity: toastVisible ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}>
        <div style={{
          background: toastIsEnable ? 'rgba(34,197,94,0.90)' : 'rgba(239,68,68,0.90)',
          color: '#fff', borderRadius: 999, padding: '6px 16px',
          fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          transform: toastVisible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(4px)',
          transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <span style={{ fontSize: 14 }}>{toastIsEnable ? '▶' : '⏸'}</span>
          {toastMsg}
        </div>
      </div>

      {/* Re-enable hint */}
      {isDisabled && hovered && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 15, borderRadius: 16,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: 14, pointerEvents: 'none',
          animation: 'agent-hint-in 0.2s ease both',
        }}>
          <div style={{
            background: 'rgba(17,17,17,0.72)', color: '#fff', borderRadius: 999,
            padding: '4px 12px', fontSize: 11, fontWeight: 500,
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span>↖</span> Toggle to re-enable
          </div>
        </div>
      )}

      {/* Avatar zone */}
      <div
        className="flex items-center justify-center border-b border-gray-100 min-h-[160px] px-7 py-8 transition-colors duration-200 relative"
        style={{ background: hovered && !isDisabled ? tones.headerBg : '#FAFAFA' }}
      >
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5" style={{ pointerEvents: 'all' }} onClick={(e) => e.stopPropagation()}>
          <ToggleSwitch enabled={!isDisabled} onChange={handleToggle} accent={accent} />
        </div>

        <div
          className="w-[100px] h-[100px] rounded-full p-[3px] transition-all duration-200"
          style={{
            background: hovered && !isDisabled
              ? `linear-gradient(135deg, ${accent}88, ${accent})`
              : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
            boxShadow: hovered && !isDisabled ? `0 4px 16px ${accent}40` : 'none',
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden" style={{ background: tones.logoBg }}>
            <AvatarPhoto
              src={resolvedImg}
              name={agent.avatarName || agent.name}
              size={94}
              accent={accent}
              className="w-full h-full"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pt-5 pb-6 flex-1 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-semibold text-[#0A0A0A] tracking-tight leading-tight">{agent.name}</span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap flex-shrink-0 border
              ${isActive ? 'bg-green-50 border-green-200 text-green-700' : isDisabled ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              <span className={`agent-status-dot w-1.5 h-1.5 rounded-full inline-block ${isActive ? 'bg-green-400' : isDisabled ? 'bg-gray-300' : 'bg-amber-400'}`} />
              {isActive ? 'Active' : isDisabled ? 'Disabled' : 'Inactive'}
            </span>
          </div>
          <p className="text-[12.5px] text-gray-500 leading-relaxed font-normal m-0">{agent.role}</p>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap" style={{ background: `${accent}18`, color: accent }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} />
            {agent.type}
          </span>
          {agent.environment && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap bg-gray-100 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
              {agent.environment}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-5">
          <div className="text-center">
            <div className="text-[13px] font-bold text-[#0A0A0A]">{metrics?.total_tasks ?? 0}</div>
            <div className="text-[10px] text-gray-400 leading-tight">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-[13px] font-bold text-emerald-600">
              {metrics?.overall_success_rate != null ? `${Math.round(metrics.overall_success_rate)}%` : agent.success}
            </div>
            <div className="text-[10px] text-gray-400 leading-tight">Success</div>
          </div>
        </div>
        <div
          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-[13px] transition-all duration-150"
          style={hovered && !isDisabled ? { background: accent, borderColor: accent, color: '#fff', transform: 'translateX(2px)' } : { background: '#fff', color: '#9CA3AF' }}
        >
          →
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
  onToggle: (e: React.MouseEvent, agent: Agent) => void;
  onNavigate: (agent: Agent) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ categoryKey, agents, telemetryData, onToggle, onNavigate }) => {
  const config = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG.unknown;
  const enabledCount = agents.filter(a => !a.disabled && !a.killswitchActivated).length;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${config.accent}18` }}>
          {config.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#0A0A0A]">{config.label}</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: `${config.accent}18`, color: config.accent }}>
              {enabledCount}/{agents.length} active
            </span>
          </div>
          <p className="text-[12px] text-gray-400 mt-0.5">{config.tagline}</p>
        </div>
        <div className="flex-1 h-px ml-1" style={{ background: `linear-gradient(to right, ${config.accent}30, transparent)` }} />
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {agents.map((agent, i) => {
          const agentMetrics = telemetryData?.agent_metrics?.length
            ? telemetryData.agent_metrics.find(m => m.agent_id === agent.id)
            : null;
          return (
            <AgentCard
              key={agent.id || i}
              agent={agent}
              accent={config.accent}
              category={categoryKey}
              metrics={agentMetrics ?? null}
              onToggle={onToggle}
              onClick={() => { if (!agent.disabled && !agent.killswitchActivated) onNavigate(agent); }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sortAgents = (list: Agent[]): Agent[] => [
  ...list.filter(a => !a.disabled && !a.killswitchActivated),
  ...list.filter(a => a.disabled || a.killswitchActivated),
];

// ─── Main Page ────────────────────────────────────────────────────────────────
const Agents: React.FC = () => {
  const navigate = useNavigate();
  const [agents,        setAgents]        = useState<Agent[]>([]);
  const [loading,       setLoading]       = useState<boolean>(true);
  const [error,         setError]         = useState<string>('');
  const [activeFilter,  setActiveFilter]  = useState<string>('All');
  const [telemetryData, setTelemetryData] = useState<DashboardMetricsResponse | null>(null);

  // ── Shared modal state ──────────────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState<{
    agent: Agent;
    willDisable: boolean;
    accent: string;
    loading: boolean;
  } | null>(null);

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
            disabled:            agent.killswitch_activated || false,
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

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const refetch = async () => {
          try {
            const remoteAgents: RemoteAgent[] = await api.llmRuntime.listAgents();
            setAgents(prev => prev.map(existing => {
              const remote = remoteAgents.find(r => r.id === existing.id);
              if (!remote) return existing;
              return {
                ...existing,
                killswitchActivated: remote.killswitch_activated || false,
                disabled:            remote.killswitch_activated || false,
                status:              remote.status || existing.status,
              };
            }));
          } catch { /* silent */ }
        };
        refetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleCreateAgent = useCallback(() => navigate('/agents/select-target'), [navigate]);

  const handleToggle = useCallback((e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation();
    const isDisabled = agent.disabled || agent.killswitchActivated;
    const catConfig = CATEGORY_CONFIG[agent.category] || CATEGORY_CONFIG.unknown;
    setConfirmModal({ agent, willDisable: !isDisabled, accent: catConfig.accent, loading: false });
  }, []);

  // ── Called by AgentToggleModal onConfirm ───────────────────────────────────
  const handleConfirmToggle = useCallback(async (reason?: string) => {
    if (!confirmModal) return;
    const { agent, willDisable } = confirmModal;
    setConfirmModal(prev => prev ? { ...prev, loading: true } : null);
    try {
      if (willDisable) {
        await api.llmRuntime.activateKillswitch(agent.id, { reason: reason ?? '' });
        setAgents(prev => prev.map(a =>
          a.id === agent.id ? { ...a, disabled: true, killswitchActivated: true, status: 'disabled' } : a
        ));
      } else {
        await api.llmRuntime.updateAgent(agent.id, {
          killswitch_activated: false, killswitch_activated_at: '',
          killswitch_activated_by: '', killswitch_reason: '',
          soft_deleted: false, status: 'active',
        });
        setAgents(prev => prev.map(a =>
          a.id === agent.id ? { ...a, disabled: false, killswitchActivated: false, status: 'active' } : a
        ));
      }
    } catch (err) {
      console.error('Failed to toggle agent:', err);
      setConfirmModal(prev => prev ? { ...prev, loading: false } : null);
      return;
    }
    setConfirmModal(null);
  }, [confirmModal]);

  const handleCancelToggle = useCallback(() => {
    if (confirmModal?.loading) return;
    setConfirmModal(null);
  }, [confirmModal]);

  const alive  = agents.filter(a => !a.disabled && !a.killswitchActivated);
  const active = agents.filter(a => a.status === 'active' && !a.disabled && !a.killswitchActivated);

  const totalTasks = telemetryData?.agent_metrics?.length
    ? telemetryData.agent_metrics.filter(m => alive.some(a => a.id === m.agent_id)).reduce((s, m) => s + m.total_tasks, 0)
    : alive.reduce((s, a) => s + parseInt(a.tasks || '0'), 0);

  const relevantMetrics = telemetryData?.agent_metrics?.filter(m => alive.some(a => a.id === m.agent_id)) ?? [];
  const avgSuccessRate  = relevantMetrics.length
    ? (relevantMetrics.reduce((s, m) => s + m.overall_success_rate, 0) / relevantMetrics.length).toFixed(1)
    : '0.0';

  const stats: StatData[] = [
    { icon: GoPeople,       value: agents.length.toString(),  description: 'Total Agents',     sub: '+1 this month',     iconcolor: '#60A5FA', bg: '#EFF6FF' },
    { icon: TiFlashOutline, value: active.length.toString(),  description: 'Active Now',       sub: '75% uptime',        iconcolor: '#22C55E', bg: '#F0FDF4' },
    { icon: TiTickOutline,  value: totalTasks.toString(),     description: 'Tasks Completed',  sub: '+12% vs last week', iconcolor: '#A78BFA', bg: '#F5F3FF' },
    { icon: GoGraph,        value: `${avgSuccessRate}%`,      description: 'Avg Success Rate', sub: '+2.3% improvement', iconcolor: '#F97316', bg: '#FFF7ED' },
  ];

  const filters = ['All', 'Production', 'Staging', 'Development', 'Inactive'];
  const handleFilterChange = (f: string) => setActiveFilter(f);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToTop = () => {
      let el: HTMLElement | null = pageRef.current;
      while (el && el !== document.documentElement) {
        const { overflowY, overflow } = window.getComputedStyle(el);
        const isScrollable = (overflowY === 'auto' || overflowY === 'scroll' || overflow === 'auto' || overflow === 'scroll');
        if (isScrollable && el.scrollHeight > el.clientHeight) {
          el.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        el = el.parentElement;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    scrollToTop();
  }, [activeFilter]);

  const getFilteredAgents = (): Agent[] => {
    switch (activeFilter) {
      case 'Production':
        return sortAgents(agents.filter(a => ['production', 'prod'].includes(a.environment?.toLowerCase() || '')));
      case 'Staging':
        return sortAgents(agents.filter(a => ['staging', 'stage'].includes(a.environment?.toLowerCase() || '')));
      case 'Development':
        return sortAgents(agents.filter(a => ['development', 'dev'].includes(a.environment?.toLowerCase() || '')));
      case 'Inactive':
        return agents.filter(a => a.disabled || a.killswitchActivated);
      default:
        return sortAgents(agents);
    }
  };

  const filteredAgents  = getFilteredAgents();
  const categoryOrder   = ['ping_federate', 'ping_directory', 'ping_one', 'unknown'];
  const grouped: Record<string, Agent[]> = {};
  categoryOrder.forEach(k => { grouped[k] = []; });
  filteredAgents.forEach(a => { if (!grouped[a.category]) grouped[a.category] = []; grouped[a.category].push(a); });
  const activeCategories = categoryOrder.filter(k => grouped[k]?.length > 0);

  const handleNavigateToAgent = useCallback((agent: Agent) => {
    const tourKey = `agentTourSeen_${agent.id}`;
    const alreadySeen = localStorage.getItem(tourKey);
    navigate(`/agents/${agent.id}/chat`, { state: { agent, isNewAgent: !alreadySeen } });
  }, [navigate]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        .agents-font { font-family: 'DM Sans', sans-serif; }

        @keyframes agent-rise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .agent-card { animation: agent-rise 0.4s ease both; }
        .agent-card:nth-child(1)  { animation-delay: 0.03s; }
        .agent-card:nth-child(2)  { animation-delay: 0.06s; }
        .agent-card:nth-child(3)  { animation-delay: 0.09s; }
        .agent-card:nth-child(4)  { animation-delay: 0.12s; }
        .agent-card:nth-child(5)  { animation-delay: 0.15s; }
        .agent-card:nth-child(6)  { animation-delay: 0.18s; }

        .agent-accent-bar {
          height: 3px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        .agent-card:hover .agent-accent-bar { transform: scaleX(1); }

        @keyframes agent-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .agent-status-dot { animation: agent-pulse 2s ease infinite; }

        @keyframes agent-hint-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .agent-card[data-disabled="true"] { cursor: default !important; }
        .agent-card[data-disabled="true"]:hover { transform: none !important; box-shadow: none !important; border-color: #e5e7eb !important; }
        .agent-card[data-disabled="true"] .agent-accent-bar { transform: scaleX(0) !important; }
      `}</style>

      {/* ── Shared AgentToggleModal ─────────────────────────────────────────── */}
      {confirmModal && (
        <AgentToggleModal
          open={true}
          mode={confirmModal.willDisable ? 'disable' : 'enable'}
          agentName={confirmModal.agent.name}
          agentAvatarSrc={resolveAvatarImg(confirmModal.agent.avatarId, confirmModal.agent.avatarImg)}
          accent={confirmModal.accent}
          loading={confirmModal.loading}
          onConfirm={handleConfirmToggle}
          onCancel={handleCancelToggle}
        />
      )}

      <div ref={pageRef} className="agents-font min-h-screen bg-[#FAFAFA] text-[#111]" data-agents-scroll>

        <div className="bg-white border-b border-gray-200 px-12 max-md:px-5">
          <div className="max-w-[1400px] mx-auto pt-10 pb-8">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#0A0A0A] mb-2 max-md:text-3xl">AI Agents</h1>
            <p className="text-[15px] text-gray-500 font-normal max-w-[480px] leading-relaxed m-0">Manage and monitor your AI-powered IAM agents</p>
          </div>
        </div>

        <div className="bg-white border-b border-gray-200 px-12 sticky top-0 z-20 max-md:px-5">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6 h-14">
            <div className="flex items-center gap-0.5">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-3.5 py-1.5 rounded-md border-none text-[13px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap font-[inherit]
                    ${activeFilter === f ? 'bg-[#111] text-white' : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-[#111]'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-gray-400 whitespace-nowrap font-normal">
                {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={handleCreateAgent}
                className="bg-[#111] hover:bg-[#333] text-white px-4 h-8 rounded-lg flex items-center gap-1.5 text-[13px] font-medium transition-colors"
              >
                <FaPlus size={11} /> New Agent
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-gray-100 px-12 max-md:px-5">
          <div className="max-w-[1400px] mx-auto py-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                      <Icon style={{ color: s.iconcolor }} size={17} />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-[#0A0A0A]">{s.value}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{s.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-12 pt-10 pb-20 max-md:px-5 max-md:pt-6 max-md:pb-16">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-sm">{error}</div>
          ) : filteredAgents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <div className="text-5xl mb-4 opacity-40">🤖</div>
              <p className="text-gray-500 text-lg font-medium">
                {activeFilter === 'All' ? 'No agents configured yet.' : `No ${activeFilter.toLowerCase()} agents found.`}
              </p>
              {activeFilter === 'All' && (
                <button onClick={handleCreateAgent}
                  className="mt-4 bg-[#111] hover:bg-[#333] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2">
                  <FaPlus size={11} /> Create your first agent
                </button>
              )}
            </div>
          ) : (
            <div>
              {activeCategories.map(catKey => (
                <CategorySection
                  key={catKey}
                  categoryKey={catKey}
                  agents={grouped[catKey]}
                  telemetryData={telemetryData}
                  onToggle={handleToggle}
                  onNavigate={handleNavigateToAgent}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default Agents;