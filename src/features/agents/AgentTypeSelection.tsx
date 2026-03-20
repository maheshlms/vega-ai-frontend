import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
}

interface IntegrationData {
  title: string;
  subtitle: string;
  agents: Agent[];
}

interface AgentTypesData {
  [key: string]: IntegrationData;
}

// Per-agent accent colours (mirrors IntegrationsPage card accents)
const AGENT_ACCENTS: Record<string, { border: string; shadow: string; headerBg: string; logoBg: string }> = {
  license:     { border: '#6366F1', shadow: 'rgba(99,102,241,0.18)',   headerBg: '#F5F3FF', logoBg: '#EEF2FF' },
  certificate: { border: '#0EA5E9', shadow: 'rgba(14,165,233,0.18)',   headerBg: '#F0F9FF', logoBg: '#E0F2FE' },
  connection:  { border: '#10B981', shadow: 'rgba(16,185,129,0.18)',   headerBg: '#F0FDF4', logoBg: '#DCFCE7' },
  adapter:     { border: '#F59E0B', shadow: 'rgba(245,158,11,0.18)',   headerBg: '#FFFBEB', logoBg: '#FEF3C7' },
  protocol:    { border: '#8B5CF6', shadow: 'rgba(139,92,246,0.18)',   headerBg: '#F5F3FF', logoBg: '#EDE9FE' },
  token:       { border: '#EC4899', shadow: 'rgba(236,72,153,0.18)',   headerBg: '#FDF2F8', logoBg: '#FCE7F3' },
  oauth:       { border: '#F97316', shadow: 'rgba(249,115,22,0.18)',   headerBg: '#FFF7ED', logoBg: '#FFEDD5' },
  datasources: { border: '#14B8A6', shadow: 'rgba(20,184,166,0.18)',   headerBg: '#F0FDFA', logoBg: '#CCFBF1' },
  ptmaster:    { border: '#6366F1', shadow: 'rgba(99,102,241,0.18)',   headerBg: '#F5F3FF', logoBg: '#EEF2FF' },
  // pingdirectory
  'user-mgmt': { border: '#10B981', shadow: 'rgba(16,185,129,0.18)',   headerBg: '#F0FDF4', logoBg: '#DCFCE7' },
  schema:      { border: '#6366F1', shadow: 'rgba(99,102,241,0.18)',   headerBg: '#F5F3FF', logoBg: '#EEF2FF' },
  replication: { border: '#0EA5E9', shadow: 'rgba(14,165,233,0.18)',   headerBg: '#F0F9FF', logoBg: '#E0F2FE' },
  backup:      { border: '#F59E0B', shadow: 'rgba(245,158,11,0.18)',   headerBg: '#FFFBEB', logoBg: '#FEF3C7' },
  security:    { border: '#EF4444', shadow: 'rgba(239,68,68,0.18)',    headerBg: '#FEF2F2', logoBg: '#FEE2E2' },
  monitoring:  { border: '#8B5CF6', shadow: 'rgba(139,92,246,0.18)',   headerBg: '#F5F3FF', logoBg: '#EDE9FE' },
  indexing:    { border: '#14B8A6', shadow: 'rgba(20,184,166,0.18)',   headerBg: '#F0FDFA', logoBg: '#CCFBF1' },
  plugins:     { border: '#F97316', shadow: 'rgba(249,115,22,0.18)',   headerBg: '#FFF7ED', logoBg: '#FFEDD5' },
  'ldap-ops':  { border: '#6B7280', shadow: 'rgba(107,114,128,0.18)', headerBg: '#F9FAFB', logoBg: '#F3F4F6' },
  // pingone
  identity:    { border: '#8B5CF6', shadow: 'rgba(139,92,246,0.18)',   headerBg: '#F5F3FF', logoBg: '#EDE9FE' },
  mfa:         { border: '#EF4444', shadow: 'rgba(239,68,68,0.18)',    headerBg: '#FEF2F2', logoBg: '#FEE2E2' },
  provisioning:{ border: '#10B981', shadow: 'rgba(16,185,129,0.18)',   headerBg: '#F0FDF4', logoBg: '#DCFCE7' },
  'sso-config':{ border: '#0EA5E9', shadow: 'rgba(14,165,233,0.18)',   headerBg: '#F0F9FF', logoBg: '#E0F2FE' },
  policies:    { border: '#6366F1', shadow: 'rgba(99,102,241,0.18)',   headerBg: '#F5F3FF', logoBg: '#EEF2FF' },
  'risk-mgmt': { border: '#F59E0B', shadow: 'rgba(245,158,11,0.18)',   headerBg: '#FFFBEB', logoBg: '#FEF3C7' },
  connectors:  { border: '#F97316', shadow: 'rgba(249,115,22,0.18)',   headerBg: '#FFF7ED', logoBg: '#FFEDD5' },
  workflows:   { border: '#14B8A6', shadow: 'rgba(20,184,166,0.18)',   headerBg: '#F0FDFA', logoBg: '#CCFBF1' },
};

const AgentTypeSelection: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const integrationType = params.integrationType;
  const targetId = params.targetId;

  const [integrationId, setIntegrationId] = useState<string>(
    integrationType || "pingfederate"
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const actualIntegrationId = targetId;

  useEffect(() => {
    if (integrationType) {
      const normalized = integrationType.toLowerCase().replace(/[-_\s]/g, "");
      setIntegrationId(normalized);
    }
  }, [integrationType]);

  /* ===================== AGENT DATA ===================== */

  const agentTypesData: AgentTypesData = {
    pingfederate: {
      title: "Ping Federate",
      subtitle: "Select the type of agent you want to create",
      agents: [
        { id: "license",     name: "License",       description: "License monitoring & renewal",              icon: "🎫", active: true },
        { id: "certificate", name: "Certificate",   description: "SSL/TLS certificate management",            icon: "📄", active: true },
        { id: "connection",  name: "SP Connection", description: "Service Provider connection setup",         icon: "🔗", active: true },
        { id: "adapter",     name: "Adapter Config",description: "Configure authentication adapters",         icon: "🔧", active: false },
        { id: "protocol",    name: "Protocol",      description: "Protocol handler configuration",            icon: "📋", active: false },
        { id: "token",       name: "Token Mgmt",    description: "Token lifecycle management",                icon: "🎯", active: false },
        { id: "oauth",       name: "OAuth/OIDC",    description: "OAuth 2.0 & OIDC setup",                   icon: "🔑", active: false },
        { id: "datasources", name: "Data Sources",  description: "Configure data source connections",         icon: "🗄️", active: false },
        { id: "ptmaster",    name: "PF Master",     description: "Primary authentication master",             icon: "🔐", active: false }
      ]
    },
    pingdirectory: {
      title: "Ping Directory",
      subtitle: "Configure your directory services agent",
      agents: [
        { id: "user-mgmt",    name: "User Management",    description: "Create, modify, and manage directory users",         icon: "👥", active: true },
        { id: "schema",       name: "Schema Config",      description: "Define and manage directory schema attributes",      icon: "📐", active: false },
        { id: "replication",  name: "Replication",        description: "Set up multi-master replication topology",           icon: "🔄", active: false },
        { id: "backup",       name: "Backup & Restore",   description: "Automated backup and recovery solutions",            icon: "💾", active: false },
        { id: "security",     name: "Access Control",     description: "Configure ACLs and security policies",               icon: "🛡️", active: false },
        { id: "monitoring",   name: "Performance Monitor",description: "Real-time performance metrics and alerts",           icon: "📊", active: false },
        { id: "indexing",     name: "Index Management",   description: "Optimize search performance with indexes",           icon: "🔍", active: false },
        { id: "plugins",      name: "Plugin Config",      description: "Extend functionality with custom plugins",           icon: "🧩", active: false },
        { id: "ldap-ops",     name: "LDAP Operations",    description: "Advanced LDAP query and operation tools",            icon: "⚙️", active: false }
      ]
    },
    pingone: {
      title: "Ping One",
      subtitle: "Set up your cloud identity platform agent",
      agents: [
        { id: "identity",     name: "Identity Provider",  description: "Configure IdP settings and attributes",             icon: "🆔", active: true },
        { id: "mfa",          name: "MFA Configuration",  description: "Multi-factor authentication policies",              icon: "🔐", active: false },
        { id: "provisioning", name: "User Provisioning",  description: "Automated user lifecycle management",               icon: "👤", active: false },
        { id: "sso-config",   name: "SSO Setup",          description: "Single sign-on for applications",                   icon: "🔑", active: false },
        { id: "policies",     name: "Access Policies",    description: "Define fine-grained access control",                icon: "📋", active: false },
        { id: "risk-mgmt",    name: "Risk Management",    description: "Adaptive authentication and risk scoring",          icon: "⚠️", active: false },
        { id: "connectors",   name: "App Connectors",     description: "Integrate with SaaS applications",                  icon: "🔌", active: false },
        { id: "workflows",    name: "Workflow Automation",description: "Build identity governance workflows",               icon: "🔄", active: false }
      ]
    }
  };

  const currentIntegration: IntegrationData =
    agentTypesData[integrationId] || agentTypesData.pingfederate;

  const activeCount  = currentIntegration.agents.filter(a => a.active).length;
  const totalCount   = currentIntegration.agents.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        .ats-font { font-family: 'DM Sans', sans-serif; }
        @keyframes ats-rise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ats-card { animation: ats-rise 0.4s ease both; }
        .ats-card:nth-child(1)  { animation-delay: 0.03s; }
        .ats-card:nth-child(2)  { animation-delay: 0.06s; }
        .ats-card:nth-child(3)  { animation-delay: 0.09s; }
        .ats-card:nth-child(4)  { animation-delay: 0.12s; }
        .ats-card:nth-child(5)  { animation-delay: 0.15s; }
        .ats-card:nth-child(6)  { animation-delay: 0.18s; }
        .ats-card:nth-child(7)  { animation-delay: 0.21s; }
        .ats-card:nth-child(8)  { animation-delay: 0.24s; }
        .ats-card:nth-child(9)  { animation-delay: 0.27s; }
        .ats-accent-bar {
          height: 3px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        .ats-card:hover .ats-accent-bar { transform: scaleX(1); }
        @keyframes ats-pulse-green {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .ats-pulse { animation: ats-pulse-green 2s ease infinite; }

        /* ═══════════════════════════════════════════════════════════════
           RESPONSIVE RULES — AgentTypeSelection
           Baseline 1920×1080 → exact current design (no changes)
           All breakpoints scale proportionally from baseline.
        ═══════════════════════════════════════════════════════════════ */

        /* ── Global safety ── */
        .ats-font {
          overflow-x: hidden;
          box-sizing: border-box;
        }
        *, *::before, *::after { box-sizing: inherit; }

        /* ── Card body text: long strings won't overflow ── */
        .ats-card p {
          overflow-wrap: break-word;
          word-break: break-word;
        }

        /* ── Card name: flex child truncation guard ── */
        .ats-card .flex.items-center.justify-between.gap-2 > span:first-child {
          min-width: 0;
        }

        /* ── Header band inner wrapper ──────────────────────────────── */
        .ats-header-wrapper {
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          padding-top: 40px;
          padding-bottom: 32px;
          box-sizing: border-box;
          width: 100%;
        }

        /* ── Toolbar band inner wrapper ─────────────────────────────── */
        .ats-toolbar-wrapper {
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 48px;
          box-sizing: border-box;
          width: 100%;
        }

        /* ── Page content wrapper ────────────────────────────────────── */
        .ats-page-wrapper {
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 48px;
          padding-right: 48px;
          padding-top: 40px;
          padding-bottom: 80px;
          box-sizing: border-box;
          width: 100%;
        }

        /* ── Outer band horizontal padding ─────────────────────────── */
        .ats-band-px {
          padding-left: clamp(16px, 3.33vw, 48px);
          padding-right: clamp(16px, 3.33vw, 48px);
        }

        /* ── H1 size — fluid ─────────────────────────────────────────── */
        .ats-h1 {
          font-size: clamp(1.5rem, 2vw, 2.25rem);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        /* ── Card grid ── */
        .ats-card-grid {
          grid-template-columns: repeat(auto-fill, minmax(clamp(220px, 18vw, 260px), 1fr));
        }

        /* ════════════════════════════
           TABLET: 768–1023px
        ════════════════════════════ */
        @media (min-width: 768px) and (max-width: 1023px) {
          .ats-band-px         { padding-left: 16px; padding-right: 16px; }
          .ats-header-wrapper  { max-width: 100%; padding-top: 16px; padding-bottom: 14px; }
          .ats-toolbar-wrapper { max-width: 100%; height: 44px; }
          .ats-page-wrapper    { max-width: 100%; padding-left: 16px; padding-right: 16px; padding-top: 20px; padding-bottom: 40px; }
          .ats-h1              { font-size: 1.5rem; }
          .ats-card-grid       { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }

          /* Touch targets */
          .ats-band-px button  { min-height: 44px; }
        }

        /* ════════════════════════════
           SMALL LAPTOP: 1024–1279px
        ════════════════════════════ */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .ats-band-px         { padding-left: 24px; padding-right: 24px; }
          .ats-header-wrapper  { max-width: 100%; padding-top: 24px; padding-bottom: 20px; }
          .ats-toolbar-wrapper { max-width: 100%; }
          .ats-page-wrapper    { max-width: 100%; padding-left: 24px; padding-right: 24px; padding-top: 28px; padding-bottom: 56px; }
          .ats-h1              { font-size: 1.75rem; }
          .ats-card-grid       { grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)) !important; }
        }

        /* ════════════════════════════
           MEDIUM LAPTOP: 1280–1439px
        ════════════════════════════ */
        @media (min-width: 1280px) and (max-width: 1439px) {
          .ats-band-px         { padding-left: 28px; padding-right: 28px; }
          .ats-header-wrapper  { max-width: 1100px; padding-top: 28px; padding-bottom: 24px; }
          .ats-toolbar-wrapper { max-width: 1100px; }
          .ats-page-wrapper    { max-width: 1100px; padding-left: 28px; padding-right: 28px; padding-top: 32px; padding-bottom: 64px; }
          .ats-h1              { font-size: 1.875rem; }
          .ats-card-grid       { grid-template-columns: repeat(auto-fill, minmax(248px, 1fr)) !important; }
        }

        /* ════════════════════════════
           LARGE LAPTOP: 1440–1919px
        ════════════════════════════ */
        @media (min-width: 1440px) and (max-width: 1919px) {
          .ats-band-px         { padding-left: 36px; padding-right: 36px; }
          .ats-header-wrapper  { max-width: 1280px; padding-top: 36px; padding-bottom: 28px; }
          .ats-toolbar-wrapper { max-width: 1280px; }
          .ats-page-wrapper    { max-width: 1280px; padding-left: 36px; padding-right: 36px; padding-top: 36px; padding-bottom: 72px; }
          .ats-h1              { font-size: 2rem; }
        }

        /* ════════════════════════════
           1920px BASELINE LOCK
        ════════════════════════════ */
        @media (min-width: 1920px) and (max-width: 2559px) {
          .ats-band-px         { padding-left: 48px; padding-right: 48px; }
          .ats-header-wrapper  { max-width: 1400px; padding-top: 40px; padding-bottom: 32px; }
          .ats-toolbar-wrapper { max-width: 1400px; height: 48px; }
          .ats-page-wrapper    { max-width: 1400px; padding-left: 48px; padding-right: 48px; padding-top: 40px; padding-bottom: 80px; }
          .ats-h1              { font-size: 2.25rem; }
          .ats-card-grid       { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important; }
        }

        /* ════════════════════════════
           QHD: 2560–3839px
        ════════════════════════════ */
        @media (min-width: 2560px) and (max-width: 3839px) {
          .ats-band-px         { padding-left: 48px; padding-right: 48px; }
          .ats-header-wrapper  { max-width: 1600px; padding-top: 52px; padding-bottom: 40px; }
          .ats-toolbar-wrapper { max-width: 1600px; height: 56px; }
          .ats-page-wrapper    { max-width: 1600px; padding-left: 48px; padding-right: 48px; padding-top: 52px; padding-bottom: 100px; }
          .ats-h1              { font-size: 2.75rem; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
          .ats-card-grid       { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important; gap: 24px !important; }
        }

        /* ════════════════════════════
           4K+: 3840px+
        ════════════════════════════ */
        @media (min-width: 3840px) {
          .ats-band-px         { padding-left: 64px; padding-right: 64px; }
          .ats-header-wrapper  { max-width: 2200px; padding-top: 72px; padding-bottom: 56px; }
          .ats-toolbar-wrapper { max-width: 2200px; height: 68px; }
          .ats-page-wrapper    { max-width: 2200px; padding-left: 64px; padding-right: 64px; padding-top: 72px; padding-bottom: 140px; }
          .ats-h1              { font-size: 3.5rem; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
          .ats-card-grid       { grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)) !important; gap: 32px !important; }
        }
      `}</style>

      <div className="ats-font min-h-screen bg-[#FAFAFA] text-[#111]">

        {/* ── Header ── */}
        <div className="ats-band-px bg-white border-b border-gray-200">
          <div className="ats-header-wrapper">
            <button
              onClick={() => navigate("/agents/select-target")}
              className="text-[13px] text-gray-400 hover:text-gray-700 mb-4 flex items-center gap-1.5 transition-colors"
            >
              ← Back to Integrations
            </button>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="ats-h1 font-bold leading-tight tracking-tight text-[#0A0A0A]">
                {currentIntegration.title}
              </h1>
              <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded self-center">
                {activeCount} Active
              </span>
            </div>
            <p className="text-[15px] text-gray-500 font-normal max-w-[480px] leading-relaxed m-0">
              {currentIntegration.subtitle}
            </p>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="ats-band-px bg-white border-b border-gray-200">
          <div className="ats-toolbar-wrapper">
            <span className="text-[13px] text-gray-400 font-normal">
              {totalCount} agent type{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="ats-page-wrapper">
          <div
            className="ats-card-grid grid gap-5"
          >
            {currentIntegration.agents.map((agent) => {
              const isHovered = hoveredId === agent.id;
              const accent    = AGENT_ACCENTS[agent.id];
              const isActive  = agent.active;

              const cardStyle: React.CSSProperties = isHovered && accent && isActive ? {
                borderColor: accent.border,
                boxShadow: `0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 40px -8px ${accent.shadow}`,
                transform: 'translateY(-3px)',
              } : {};

              const accentBarStyle: React.CSSProperties = accent
                ? { background: accent.border }
                : { background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' };

              return (
                <div
                  key={agent.id}
                  className={`ats-card bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-[220ms] flex flex-col relative ${isActive ? 'cursor-pointer' : 'opacity-55 grayscale cursor-not-allowed'}`}
                  style={cardStyle}
                  onMouseEnter={() => isActive && setHoveredId(agent.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    if (!isActive) return;
                    navigate(`/agents/create/${agent.id}`, {
                      state: { integrationId: actualIntegrationId, integrationType: integrationId }
                    });
                  }}
                >
                  {/* Accent bar */}
                  <div className="ats-accent-bar" style={accentBarStyle} />

                  {/* Icon zone */}
                  <div
                    className="flex items-center justify-center border-b border-gray-100 min-h-[140px] px-7 py-8 transition-colors duration-200"
                    style={{ background: isHovered && accent && isActive ? accent.headerBg : '#FAFAFA' }}
                  >
                    <div
                      className="w-[100px] h-[80px] rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-200"
                      style={
                        isHovered && accent && isActive
                          ? { borderColor: accent.border, boxShadow: `0 4px 16px ${accent.shadow}`, background: accent.logoBg }
                          : { background: '#fff' }
                      }
                    >
                      <span className="text-4xl select-none">{agent.icon}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-6 pt-5 pb-6 flex-1 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[15px] font-semibold text-[#0A0A0A] tracking-tight leading-tight">
                          {agent.name}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[10.5px] font-semibold text-green-700 whitespace-nowrap flex-shrink-0">
                            <span className="ats-pulse w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                            Available
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-gray-500 leading-relaxed font-normal m-0">
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
                    {isActive ? (
                      <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-green-700">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: isHovered && accent ? accent.border : '#22C55E' }}
                        />
                        Create Agent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        Coming Soon
                      </span>
                    )}
                    <div
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-[13px] transition-all duration-150"
                      style={
                        isHovered && accent && isActive
                          ? { background: accent.border, borderColor: accent.border, color: '#fff', transform: 'translateX(2px)' }
                          : { background: '#fff', color: '#9CA3AF' }
                      }
                    >
                      →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
};

export default AgentTypeSelection;