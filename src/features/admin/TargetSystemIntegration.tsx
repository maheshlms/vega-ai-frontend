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
    navigate(`/admin/createtarsys`, {
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
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 2xl:p-8 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3 2xl:gap-4 mb-4 2xl:mb-5">
        <div className="w-12 h-12 2xl:w-16 2xl:h-16 bg-gray-100 rounded-lg flex items-center justify-center p-2 flex-shrink-0">
          {item.logo ? (
            <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
          ) : (
            <FaPlug className="text-gray-400 2xl:text-xl" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 text-sm 2xl:text-lg">{item.name}</h3>
            <FaCheckCircle className="text-green-500 text-sm 2xl:text-base flex-shrink-0" />
          </div>
          <p className="text-xs 2xl:text-sm text-gray-500 mt-1">{item.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 2xl:gap-3">
        {item.badges.map((badge, i) => (
          <span
            key={i}
            className="px-2.5 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-xs 2xl:text-sm font-medium bg-blue-100 text-blue-700 border border-blue-300"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 2xl:px-20 py-6 2xl:py-10">
        <button
          onClick={() => navigate('/admin/avatarsys')}
          className="group text-sm 2xl:text-base text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors mb-4 2xl:mb-5"
        >
          <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Target Systems</span>
        </button>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl 2xl:text-4xl font-semibold text-gray-900">Available Integrations </h1>
        </div>
        <p className="text-sm 2xl:text-base text-gray-500">
          Choose the type of system you want to connect
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12 2xl:py-20">
          <div className="animate-spin h-8 w-8 2xl:h-12 2xl:w-12 border-b-2 border-blue-600 rounded-full"></div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-6 2xl:px-20 py-6 2xl:py-10">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 2xl:p-6 text-sm 2xl:text-base text-red-700">
            Failed to load integrations: {error}
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="px-6 2xl:px-20 py-6 2xl:py-10 space-y-8 2xl:space-y-14">
          {Object.values(integrationsData).map((category, index) => {
            const Icon = category.icon;
            return (
              <div key={index}>
                <div className="flex items-center gap-3 2xl:gap-4 mb-4 2xl:mb-6">
                  <div className="w-10 h-10 2xl:w-14 2xl:h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="text-gray-600 text-base 2xl:text-xl" />
                  </div>
                  <div>
                    <h2 className="text-lg 2xl:text-2xl font-semibold text-gray-900">
                      {category.category}
                    </h2>
                    <p className="text-xs 2xl:text-sm text-gray-500">
                      {category.items.length} integration{category.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 2xl:gap-6">
                  {category.items.map(item => (
                    <IntegrationCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TargetSystemIntegration;