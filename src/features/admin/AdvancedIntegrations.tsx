import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaStar } from 'react-icons/fa';

interface Badge {
  text: string;
  color: string;
}

interface Integration {
  id: string;
  logo: string;
  title: string;
  verified: boolean;
  badges: Badge[];
}

const AdvancedIntegrations: React.FC = () => {
  const navigate = useNavigate();

  const integrations: Record<string, Integration> = {
    pingfederate: {
      id: 'pingfederate',
      logo: 'PingFederate',
      title: 'Ping Federate',
      verified: true,
      badges: [
        { text: 'SSO', color: 'blue' },
        { text: 'Enterprise', color: 'purple' }
      ]
    },
    pingdirectory: {
      id: 'pingdirectory',
      logo: 'PingDirectory',
      title: 'Ping Directory',
      verified: true,
      badges: [
        { text: 'LDAP', color: 'blue' },
        { text: 'Directory', color: 'gray' }
      ]
    },
    pingone: {
      id: 'pingone',
      logo: 'PingOne',
      title: 'Ping One',
      verified: true,
      badges: [
        { text: 'SaaS', color: 'blue' },
        { text: 'IDaaS', color: 'purple' }
      ]
    },
    slack: {
      id: 'slack',
      logo: 'slack',
      title: 'Slack',
      verified: true,
      badges: [
        { text: 'Chat', color: 'blue' },
        { text: 'Notification', color: 'purple' }
      ]
    }
  };

  const getBadgeColors = (color: string): string => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border border-blue-300',
      purple: 'bg-purple-100 text-purple-700 border border-purple-300',
      gray: 'bg-gray-100 text-gray-700 border border-gray-300',
      green: 'bg-green-100 text-green-700 border border-green-300',
      orange: 'bg-orange-100 text-orange-700 border border-orange-300'
    };
    return colors[color] || colors.gray;
  };

  const IntegrationCard: React.FC<{ item: Integration }> = ({ item }) => (
    <div
      onClick={() => navigate(`/agents/create/${item.id}`)}
      className="bg-white rounded-lg shadow-md border border-gray-200 p-5 2xl:p-8 hover:shadow-xl hover:border-blue-400 hover:scale-105 transition-all cursor-pointer"
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-12 2xl:h-20 mb-4 2xl:mb-5">
        <span className="text-xl 2xl:text-4xl font-bold text-gray-900">
          {item.logo}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-left font-semibold text-gray-900 mb-2 text-sm 2xl:text-xl">
        {item.title}
      </h3>

      {/* Badges */}
      <div className="flex items-center gap-2 2xl:gap-3 flex-wrap">
        {item.verified && (
          <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded">
            <FaCheckCircle className="text-green-600 text-xs 2xl:text-base" />
            <span className="text-xs 2xl:text-base text-green-600 font-medium">Verified</span>
          </div>
        )}
        {item.badges.map((badge, index) => (
          <span
            key={index}
            className={`px-2.5 py-0.5 2xl:px-3 2xl:py-1 rounded text-xs 2xl:text-base font-medium ${getBadgeColors(badge.color)}`}
          >
            {badge.text}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        /* ── Responsive: below 1920px ── */
        @media (max-width: 1919px) {
          .ai-header-wrap { padding: 20px 40px !important; }
          .ai-header-wrap h1 { font-size: 1.6rem !important; }
          .ai-content-wrap { padding: 20px 40px !important; }
          .ai-section { margin-bottom: 32px !important; }
          .ai-section h2 { font-size: 0.9rem !important; margin-bottom: 14px !important; }
          .ai-grid { gap: 14px !important; }
        }

        @media (max-width: 1400px) {
          .ai-header-wrap { padding: 18px 28px !important; }
          .ai-content-wrap { padding: 18px 28px !important; }
          .ai-header-wrap h1 { font-size: 1.45rem !important; }
          .ai-section { margin-bottom: 28px !important; }
        }

        @media (max-width: 1200px) {
          .ai-header-wrap { padding: 16px 20px !important; }
          .ai-content-wrap { padding: 16px 20px !important; }
          .ai-header-wrap h1 { font-size: 1.3rem !important; }
          .ai-header-wrap p { font-size: 0.8rem !important; }
          .ai-section h2 { font-size: 0.85rem !important; }
          .ai-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 1024px) {
          .ai-header-wrap { padding: 14px 16px !important; }
          .ai-content-wrap { padding: 14px 16px !important; }
          .ai-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
        }

        /* ── Responsive: above 1920px (2K, 4K) ── */
        @media (min-width: 1921px) {
          .ai-header-wrap { padding: 48px 80px !important; }
          .ai-header-icon { font-size: 1.1rem !important; }
          .ai-header-wrap h1 { font-size: 3rem !important; }
          .ai-header-wrap p { font-size: 1.1rem !important; margin-left: 28px !important; }
          .ai-content-wrap { padding: 48px 80px !important; }
          .ai-section { margin-bottom: 56px !important; }
          .ai-section h2 { font-size: 1.4rem !important; margin-bottom: 22px !important; }
          .ai-grid { gap: 28px !important; grid-template-columns: repeat(5, 1fr) !important; }
        }

        @media (min-width: 2560px) {
          .ai-header-wrap { padding: 64px 120px !important; }
          .ai-header-wrap h1 { font-size: 3.8rem !important; }
          .ai-header-wrap p { font-size: 1.3rem !important; }
          .ai-content-wrap { padding: 64px 120px !important; }
          .ai-section { margin-bottom: 72px !important; }
          .ai-section h2 { font-size: 1.7rem !important; margin-bottom: 28px !important; }
          .ai-grid { gap: 36px !important; }
        }
      `}</style>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="ai-header-wrap px-6 2xl:px-20 py-6 2xl:py-12">
            <div className="flex items-center gap-2 mb-1">
              <FaStar className="ai-header-icon text-gray-400 text-sm 2xl:text-lg" />
              <h1 className="text-2xl 2xl:text-5xl font-bold text-gray-900">
                Advanced Integrations
              </h1>
            </div>
            <p className="text-sm 2xl:text-xl text-gray-500 ml-6">
              Fully autonomous AI agents with advanced capabilities and enterprise-grade integrations
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="ai-content-wrap px-6 2xl:px-20 py-6 2xl:py-12">

          {/* OIDC Provider */}
          <div className="ai-section mb-10 2xl:mb-16">
            <h2 className="text-base 2xl:text-2xl font-semibold text-gray-900 mb-4 2xl:mb-6">
              OIDC Provider
            </h2>
            <div className="ai-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5 2xl:gap-8">
              <IntegrationCard item={integrations.pingfederate} />
            </div>
          </div>

          {/* Identity Datastores */}
          <div className="ai-section mb-10 2xl:mb-16">
            <h2 className="text-base 2xl:text-2xl font-semibold text-gray-900 mb-4 2xl:mb-6">
              Identity Datastores / Directories
            </h2>
            <div className="ai-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5 2xl:gap-8">
              <IntegrationCard item={integrations.pingdirectory} />
            </div>
          </div>

          {/* Cloud Identity */}
          <div className="ai-section mb-10 2xl:mb-16">
            <h2 className="text-base 2xl:text-2xl font-semibold text-gray-900 mb-4 2xl:mb-6">
              Cloud Identity
            </h2>
            <div className="ai-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5 2xl:gap-8">
              <IntegrationCard item={integrations.pingone} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdvancedIntegrations;