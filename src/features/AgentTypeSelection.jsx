import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const AgentTypeSelection = () => {
  const navigate = useNavigate();
  const { integrationId } = useParams();

  const agentTypesData = {
    pingfederate: {
      title: 'Ping Federate',
      subtitle: 'Select the type of agent you want to create',
      agents: [
        { id: 'ptmaster', name: 'PT Master', description: 'Primary authentication master', icon: '🔐' },
        { id: 'certificate', name: 'Certificate', description: 'SSL/TLS certificate management', icon: '📄' },
        { id: 'license', name: 'License', description: 'License monitoring & renewal', icon: '🎫' },
        { id: 'adapter', name: 'Adapter Config', description: 'Configure authentication adapters', icon: '🔧' },
        { id: 'connection', name: 'Connection', description: 'Manage federation connections', icon: '🔗' },
        { id: 'protocol', name: 'Protocol', description: 'Protocol handler configuration', icon: '📋' },
        { id: 'token', name: 'Token Mgmt', description: 'Token lifecycle management', icon: '🎯' },
        { id: 'oauth', name: 'OAuth/OIDC', description: 'OAuth 2.0 & OIDC setup', icon: '🔑' },
        { id: 'datasources', name: 'Data Sources', description: 'Configure data source connections', icon: '🗄️' }
      ]
    },
    pingdirectory: {
      title: 'Ping Directory',
      subtitle: 'Select the type of agent you want to create',
      agents: [
        { id: 'user-mgmt', name: 'User Management', description: 'Manage directory users', icon: '👥' },
        { id: 'schema', name: 'Schema Config', description: 'Directory schema management', icon: '📐' },
        { id: 'replication', name: 'Replication', description: 'Multi-master replication', icon: '🔄' },
        { id: 'backup', name: 'Backup & Restore', description: 'Automated backup solutions', icon: '💾' },
        { id: 'security', name: 'Security', description: 'Access control & security', icon: '🛡️' },
        { id: 'monitoring', name: 'Monitoring', description: 'Performance monitoring', icon: '📊' }
      ]
    },
    pingone: {
      title: 'Ping One',
      subtitle: 'Select the type of agent you want to create',
      agents: [
        { id: 'identity', name: 'Identity Provider', description: 'IdP configuration', icon: '🆔' },
        { id: 'mfa', name: 'MFA Config', description: 'Multi-factor authentication', icon: '🔐' },
        { id: 'provisioning', name: 'User Provisioning', description: 'Automated user provisioning', icon: '👤' },
        { id: 'sso-config', name: 'SSO Configuration', description: 'Single sign-on setup', icon: '🔑' },
        { id: 'policies', name: 'Access Policies', description: 'Define access policies', icon: '📋' }
      ]
    }
  };

  const currentIntegration = agentTypesData[integrationId] || agentTypesData.pingfederate;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className=" border-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <button
            onClick={() => navigate('/agents/createagent')}
            className="group text-sm text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-2 transition-colors"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Integrations</span>
          </button>
          <h1 className="text-4xl font-light text-gray-900 mb-3 tracking-tight">
            {currentIntegration.title}
          </h1>
          <p className="text-gray-500 font-light">{currentIntegration.subtitle}</p>
        </div>
      </div>

      {/* Agent Type Cards */}
      <div className="max-w-7xl mx-auto px-8 ">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentIntegration.agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => navigate(`/agents/create/${integrationId}/${agent.id}`)}
              className="group bg-white rounded-lg border border-gray-200 hover:border-gray-900 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-lg"
            >
              {/* Card Content */}
              <div className="p-8">
                {/* Icon */}
                <div className="w-10 h-10 mb-6 flex items-center justify-center bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                  <span className="text-3xl opacity-80 group-hover:opacity-100 transition-opacity">
                    {agent.icon}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-medium text-gray-900 mb-2 tracking-tight">
                  {agent.name}
                </h3>

                {/* Description */}
                <p className="text-gray-500 text-sm leading-relaxed font-light mb-6">
                  {agent.description}
                </p>

                {/* Action */}
                <div className="flex items-center text-sm text-gray-400 group-hover:text-gray-900 transition-colors">
                  <span className="font-medium">Create Agent</span>
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>

              {/* Subtle hover indicator */}
              <div className="h-1 bg-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentTypeSelection;