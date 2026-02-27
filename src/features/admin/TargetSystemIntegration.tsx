import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaStar, FaPlug, FaShieldAlt, FaServer } from 'react-icons/fa';
import { IconType } from 'react-icons';
import api from '../../utils/api';

/**
 * Only allow Ping products in UI
 */
const ALLOWED_INTEGRATIONS: string[] = [
  'pingfederate',
  'ping_federate',
  'pingdirectory',
  'ping_directory',
  'pingone',
  'ping_one',
  'slack'
];

interface Integration {
  _id?: string;
  id?: string;
  value: string;
  name: string;
  description: string;
  tags?: string[];
  auth_methods?: string[];
}

interface IntegrationItem {
  id: string;
  value: string;
  name: string;
  description: string;
  logo: string | null;
  verified: boolean;
  status: string;
  badges: string[];
  auth_methods: string[];
}

interface CategoryData {
  category: string;
  icon: IconType;
  items: IntegrationItem[];
}

interface IntegrationsData {
  [key: string]: CategoryData;
}

interface IntegrationsResponse {
  integrations?: Integration[];
  categories?: {
    [key: string]: Integration[];
  };
}

interface IntegrationCardProps {
  item: IntegrationItem;
}

const TargetSystemIntegration: React.FC = () => {
  const navigate = useNavigate();
  const [integrationsData, setIntegrationsData] = useState<IntegrationsData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntegrations = async (): Promise<void> => {
      try {
        setLoading(true);
        const response: IntegrationsResponse = await api.integrations.list();

        // Map integrations by value for ID lookup
        const integrationsMap: Record<string, Integration> = {};
        if (Array.isArray(response.integrations)) {
          response.integrations.forEach(intg => {
            integrationsMap[intg.value] = intg;
          });
        }

        const categorized: IntegrationsData = {};

        if (response.categories) {
          Object.entries(response.categories).forEach(([category, items]) => {
            const filteredItems = items
              .filter(item => {
                const normalized = item.value?.toLowerCase().replace(/[-_\s]/g, '');
                return ALLOWED_INTEGRATIONS.includes(normalized);
              })
              .map(item => {
                const fullIntegration = integrationsMap[item.value];
                return {
                  id: fullIntegration?._id || item._id || item.id || '',
                  value: item.value,
                  name: item.name,
                  description: item.description,
                  logo: getDefaultLogo(item.value),
                  verified: true,
                  status: 'connected',
                  badges: item.tags || [],
                  auth_methods: item.auth_methods || []
                };
              });

            if (filteredItems.length > 0) {
              categorized[category] = {
                category,
                icon: getCategoryIcon(category),
                items: filteredItems
              };
            }
          });
        }

        setIntegrationsData(categorized);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const getCategoryIcon = (category: string): IconType => {
    const map: Record<string, IconType> = {
      'OIDC Provider': FaShieldAlt,
      'Identity Datastores / Directories': FaServer
    };
    return map[category] || FaPlug;
  };

  const getDefaultLogo = (value: string): string | null => {
    const logos: Record<string, string> = {
      pingfederate: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      ping_federate: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      pingdirectory: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      ping_directory: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      pingone: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      ping_one: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      slack: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg',
    };

    const normalized = value?.toLowerCase().replace(/[-_\s]/g, '');
    return logos[value] || logos[normalized] || null;
  };

  const handleIntegrationSelect = (id: string, name: string, value: string, authMethods: string[]): void => {
    // Navigate to form creation page with integration details
    navigate(`/systems/createtarsys`, {
      state: {
        integrationId: id,
        integrationName: name,
        integrationValue: value,
        authMethods
      }
    });
  };

  const IntegrationCard: React.FC<IntegrationCardProps> = ({ item }) => (
    <div
      onClick={() => handleIntegrationSelect(item.id, item.name, item.value, item.auth_methods)}
      className="tsi-card bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-[220ms] cursor-pointer overflow-hidden"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-2 shrink-0">
          {item.logo ? (
            <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
          ) : (
            <FaPlug className="text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#0A0A0A] text-[15px]">{item.name}</h3>
            <FaCheckCircle className="text-green-500 text-sm shrink-0" />
          </div>
          <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {item.badges.map((badge, bi) => (
          <span key={bi} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
            {badge}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        .tsi-font { font-family: 'DM Sans', sans-serif; }
        @keyframes tsi-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .tsi-card { animation: tsi-rise 0.35s ease both; }
      `}</style>
      <div className="tsi-font min-h-screen bg-[#FAFAFA]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-12 max-md:px-5">
          <div className="max-w-[1400px] mx-auto pt-10 pb-8">
            <button
              onClick={() => navigate('/systems')}
              className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-700 mb-3 transition-colors"
            >
              <span>←</span>
              <span>Back to Target Systems</span>
            </button>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#0A0A0A] max-md:text-3xl mb-2">
              Available Integrations
            </h1>
            <p className="text-[15px] text-gray-500 font-normal leading-relaxed m-0">
              Choose the type of system you want to connect
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-b-2 border-gray-400 rounded-full"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-[1400px] mx-auto px-12 py-6 max-md:px-5">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              Failed to load integrations: {error}
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="max-w-[1400px] mx-auto px-12 pt-10 pb-20 max-md:px-5 space-y-12">
            {Object.values(integrationsData).map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="text-gray-600 text-sm" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-semibold text-[#0A0A0A]">{category.category}</h2>
                      <p className="text-[12px] text-gray-400">{category.items.length} integration{category.items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="grid gap-5 max-md:grid-cols-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {category.items.map((item, i) => (
                      <IntegrationCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default TargetSystemIntegration;