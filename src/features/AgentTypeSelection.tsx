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
  theme: ThemeType;
  agents: Agent[];
}

interface AgentTypesData {
  [key: string]: IntegrationData;
}

type ThemeType = 'blue' | 'emerald' | 'violet';

interface ThemeColors {
  headerBg: string;
  accent: string;
  hoverBorder: string;
  hoverBg: string;
  actionText: string;
  progressBar: string;
}

type ThemeConfig = {
  [key in ThemeType]: ThemeColors;
};

const AgentTypeSelection: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const integrationType = params.integrationType;
  const targetId = params.targetId;

  const [integrationId, setIntegrationId] = useState<string>(
    integrationType || "pingfederate"
  );

  // This is the actual integration ID passed from previous screen
  const actualIntegrationId = targetId;

  useEffect(() => {
    if (integrationType) {
      const normalized = integrationType
        .toLowerCase()
        .replace(/[-_\s]/g, "");
      setIntegrationId(normalized);
    }
  }, [integrationType]);

  /* ===================== AGENT DATA (UNCHANGED) ===================== */

  const agentTypesData: AgentTypesData = {
    pingfederate: {
      title: "Ping Federate",
      subtitle: "Select the type of agent you want to create",
      theme: "blue",
      agents: [
        { id: "license", name: "License", description: "License monitoring & renewal", icon: "🎫", active: true },
        { id: "certificate", name: "Certificate", description: "SSL/TLS certificate management", icon: "📄", active: true },
        { id: "connection", name: "SP Connection", description: "Service Provider connection setup", icon: "🔗", active: true },
        { id: "adapter", name: "Adapter Config", description: "Configure authentication adapters", icon: "🔧", active: false },
        { id: "protocol", name: "Protocol", description: "Protocol handler configuration", icon: "📋", active: false },
        { id: "token", name: "Token Mgmt", description: "Token lifecycle management", icon: "🎯", active: false },
        { id: "oauth", name: "OAuth/OIDC", description: "OAuth 2.0 & OIDC setup", icon: "🔑", active: false },
        { id: "datasources", name: "Data Sources", description: "Configure data source connections", icon: "🗄️", active: false },
        { id: "ptmaster", name: "PF Master", description: "Primary authentication master", icon: "🔐", active: false }
      ]
    },

    pingdirectory: {
      title: "Ping Directory",
      subtitle: "Configure your directory services agent",
      theme: "emerald",
      agents: [
        { id: "user-mgmt", name: "User Management", description: "Create, modify, and manage directory users", icon: "👥", active: true },
        { id: "schema", name: "Schema Config", description: "Define and manage directory schema attributes", icon: "📐", active: false },
        { id: "replication", name: "Replication", description: "Set up multi-master replication topology", icon: "🔄", active: false },
        { id: "backup", name: "Backup & Restore", description: "Automated backup and recovery solutions", icon: "💾", active: false },
        { id: "security", name: "Access Control", description: "Configure ACLs and security policies", icon: "🛡️", active: false },
        { id: "monitoring", name: "Performance Monitor", description: "Real-time performance metrics and alerts", icon: "📊", active: false },
        { id: "indexing", name: "Index Management", description: "Optimize search performance with indexes", icon: "🔍", active: false },
        { id: "plugins", name: "Plugin Config", description: "Extend functionality with custom plugins", icon: "🧩", active: false },
        { id: "ldap-ops", name: "LDAP Operations", description: "Advanced LDAP query and operation tools", icon: "⚙️", active: false }
      ]
    },

    pingone: {
      title: "Ping One",
      subtitle: "Set up your cloud identity platform agent",
      theme: "violet",
      agents: [
        { id: "identity", name: "Identity Provider", description: "Configure IdP settings and attributes", icon: "🆔", active: true },
        { id: "mfa", name: "MFA Configuration", description: "Multi-factor authentication policies", icon: "🔐", active: false },
        { id: "provisioning", name: "User Provisioning", description: "Automated user lifecycle management", icon: "👤", active: false },
        { id: "sso-config", name: "SSO Setup", description: "Single sign-on for applications", icon: "🔑", active: false },
        { id: "policies", name: "Access Policies", description: "Define fine-grained access control", icon: "📋", active: false },
        { id: "risk-mgmt", name: "Risk Management", description: "Adaptive authentication and risk scoring", icon: "⚠️", active: false },
        { id: "connectors", name: "App Connectors", description: "Integrate with SaaS applications", icon: "🔌", active: false },
        { id: "workflows", name: "Workflow Automation", description: "Build identity governance workflows", icon: "🔄", active: false }
      ]
    }
  };

  const currentIntegration: IntegrationData =
    agentTypesData[integrationId] || agentTypesData.pingfederate;

  /* ===================== THEME ===================== */

  const themeConfig: ThemeConfig = {
    blue: {
      headerBg: "bg-gradient-to-br from-blue-50 to-indigo-50",
      accent: "text-blue-600",
      hoverBorder: "hover:border-blue-500",
      hoverBg: "group-hover:bg-blue-50",
      actionText: "group-hover:text-blue-600",
      progressBar: "bg-blue-600"
    },
    emerald: {
      headerBg: "bg-gradient-to-br from-emerald-50 to-teal-50",
      accent: "text-emerald-600",
      hoverBorder: "hover:border-emerald-500",
      hoverBg: "group-hover:bg-emerald-50",
      actionText: "group-hover:text-emerald-600",
      progressBar: "bg-emerald-600"
    },
    violet: {
      headerBg: "bg-gradient-to-br from-violet-50 to-purple-50",
      accent: "text-violet-600",
      hoverBorder: "hover:border-violet-500",
      hoverBg: "group-hover:bg-violet-50",
      actionText: "group-hover:text-violet-600",
      progressBar: "bg-violet-600"
    }
  };

  const theme: ThemeColors = themeConfig[currentIntegration.theme];

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className={`${theme.headerBg} border-b border-gray-100`}>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <button
            onClick={() => navigate("/agents/select-target")}
            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back to Integrations
          </button>

          <h1 className={`text-2xl font-light mt-2 ${theme.accent}`}>
            {currentIntegration.title}
          </h1>
          <p className="text-gray-600">{currentIntegration.subtitle}</p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentIntegration.agents.map((agent) => {
            const isActive = agent.active;

            return (
              <div
                key={agent.id}
                onClick={() => {
                  if (!isActive) return;
                  navigate(`/agents/create/${agent.id}`, {
                    state: {
                      integrationId: actualIntegrationId,
                      integrationType: integrationId
                    }
                  });
                }}
                className={`
                  group rounded-xl border-2 overflow-hidden transition-all duration-300
                  ${
                    isActive
                      ? `bg-white border-gray-200 ${theme.hoverBorder} hover:shadow-xl hover:-translate-y-1 cursor-pointer`
                      : `bg-gray-50 border-gray-100 opacity-50 grayscale cursor-not-allowed`
                  }
                `}
              >
                <div className="p-8">
                  {/* Icon */}
                  <div
                    className={`
                      w-14 h-14 mb-6 flex items-center justify-center rounded-xl
                      ${isActive ? `bg-gray-50 ${theme.hoverBg}` : `bg-gray-100`}
                    `}
                  >
                    <span
                      className={`text-4xl ${
                        isActive ? "group-hover:scale-110 transition-transform" : "opacity-40"
                      }`}
                    >
                      {agent.icon}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className={`text-xl font-semibold mb-3 ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                    {agent.name}
                  </h3>

                  {/* Description */}
                  <p className={`text-sm mb-6 ${isActive ? "text-gray-600" : "text-gray-400"}`}>
                    {agent.description}
                  </p>

                  {/* Action */}
                  <div className={`text-sm font-medium flex items-center ${isActive ? `text-gray-400 ${theme.actionText}` : "text-gray-300"}`}>
                    <span>{isActive ? "Create Agent" : "Coming Soon"}</span>
                    {isActive && <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>}
                  </div>
                </div>

                {isActive && (
                  <div className={`h-1 ${theme.progressBar} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgentTypeSelection;