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

  const actualIntegrationId = targetId;

  useEffect(() => {
    if (integrationType) {
      const normalized = integrationType
        .toLowerCase()
        .replace(/[-_\s]/g, "");
      setIntegrationId(normalized);
    }
  }, [integrationType]);

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

  const themeConfig: ThemeConfig = {
    blue: {
      headerBg: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#0d1117] dark:to-[#0d1117]",
      accent: "text-blue-600 dark:text-blue-400",
      hoverBorder: "hover:border-blue-500 dark:hover:border-blue-400",
      hoverBg: "group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20",
      actionText: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
      progressBar: "bg-blue-600 dark:bg-blue-500"
    },
    emerald: {
      headerBg: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#0d1117] dark:to-[#0d1117]",
      accent: "text-emerald-600 dark:text-emerald-400",
      hoverBorder: "hover:border-emerald-500 dark:hover:border-emerald-400",
      hoverBg: "group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20",
      actionText: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
      progressBar: "bg-emerald-600 dark:bg-emerald-500"
    },
    violet: {
      headerBg: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-[#0d1117] dark:to-[#0d1117]",
      accent: "text-violet-600 dark:text-violet-400",
      hoverBorder: "hover:border-violet-500 dark:hover:border-violet-400",
      hoverBg: "group-hover:bg-violet-50 dark:group-hover:bg-violet-900/20",
      actionText: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
      progressBar: "bg-violet-600 dark:bg-violet-500"
    }
  };

  const theme: ThemeColors = themeConfig[currentIntegration.theme];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117]">
      {/* Header */}
      <div className={`${theme.headerBg} border-b border-gray-100 dark:border-[#1e2d45]`}>
        <div className="max-w-5xl xl:max-w-7xl 2xl:max-w-[1920px] mx-auto
          px-4 xl:px-8 2xl:px-20
          py-5 xl:py-8 2xl:py-12">
          <button
            onClick={() => navigate("/agents/select-target")}
            className="text-xs xl:text-sm 2xl:text-base text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
          >
            ← Back to Integrations
          </button>

          <h1 className={`text-xl xl:text-2xl 2xl:text-4xl font-light mt-2 2xl:mt-3 ${theme.accent}`}>
            {currentIntegration.title}
          </h1>
          <p className="text-sm xl:text-base text-gray-600 dark:text-slate-400 2xl:text-lg">{currentIntegration.subtitle}</p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-5xl xl:max-w-7xl 2xl:max-w-[1920px] mx-auto
        px-4 xl:px-8 2xl:px-20
        py-8 xl:py-12 2xl:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6 2xl:gap-8">
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
                      ? `bg-white dark:bg-[#1a2234] border-gray-200 dark:border-[#1e2d45] ${theme.hoverBorder} hover:shadow-xl hover:-translate-y-1 cursor-pointer`
                      : `bg-gray-50 dark:bg-[#111827] border-gray-100 dark:border-[#1e2d45] opacity-50 grayscale cursor-not-allowed`
                  }
                `}
              >
                <div className="p-5 xl:p-8 2xl:p-10">
                  {/* Icon */}
                  <div
                    className={`
                      w-11 h-11 xl:w-14 xl:h-14 2xl:w-18 2xl:h-18
                      mb-4 xl:mb-6 2xl:mb-7
                      flex items-center justify-center rounded-xl
                      ${isActive ? `bg-gray-50 dark:bg-[#111827] ${theme.hoverBg}` : `bg-gray-100 dark:bg-[#1e2d45]`}
                    `}
                  >
                    <span
                      className={`text-3xl xl:text-4xl 2xl:text-5xl ${
                        isActive ? "group-hover:scale-110 transition-transform" : "opacity-40"
                      }`}
                    >
                      {agent.icon}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className={`text-lg xl:text-xl 2xl:text-2xl font-semibold mb-2 xl:mb-3 2xl:mb-4 ${isActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-600"}`}>
                    {agent.name}
                  </h3>

                  {/* Description */}
                  <p className={`text-xs xl:text-sm 2xl:text-base mb-4 xl:mb-6 2xl:mb-7 ${isActive ? "text-gray-600 dark:text-slate-400" : "text-gray-400 dark:text-slate-600"}`}>
                    {agent.description}
                  </p>

                  {/* Action */}
                  <div className={`text-xs xl:text-sm 2xl:text-base font-medium flex items-center ${isActive ? `text-gray-400 dark:text-slate-500 ${theme.actionText}` : "text-gray-300 dark:text-slate-700"}`}>
                    <span>{isActive ? "Create Agent" : "Coming Soon"}</span>
                    {isActive && <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>}
                  </div>
                </div>

                {isActive && (
                  <div className={`h-1 2xl:h-1.5 ${theme.progressBar} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`} />
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