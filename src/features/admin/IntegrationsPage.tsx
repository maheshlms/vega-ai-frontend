import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaStar, FaPlug, FaShieldAlt, FaServer } from 'react-icons/fa';
import { IconType } from 'react-icons';
import api from '../../utils/api';

// Type Definitions
interface Integration {
  _id?: string;
  id?: string;
  value: string;
  name: string;
  description: string;
  icon?: string;
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

interface IntegrationsMap {
  [key: string]: Integration;
}

interface CategorizedIntegrations {
  [key: string]: CategoryData;
}

interface ApiResponse {
  integrations?: Integration[];
  categories?: {
    [key: string]: Integration[];
  };
}

interface IntegrationCardProps {
  item: IntegrationItem;
}

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [integrationsData, setIntegrationsData] = useState<CategorizedIntegrations>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch integrations from backend
  useEffect(() => {
    const fetchIntegrations = async (): Promise<void> => {
      try {
        setLoading(true);
        const response: ApiResponse = await api.integrations.list();

        console.log('Full integrations response:', response);
        console.log('Integrations array:', response.integrations);

        const integrationsMap: IntegrationsMap = {};
        if (response.integrations && Array.isArray(response.integrations)) {
          response.integrations.forEach(integration => {
            console.log(`Integration "${integration.name}" _id:`, integration._id);
            integrationsMap[integration.value] = integration;
          });
        }

        const categorized: CategorizedIntegrations = {};
        if (response.categories) {
          Object.entries(response.categories).forEach(([category, items]) => {
            console.log(`Category "${category}" items:`, items);
            categorized[category] = {
              category,
              icon: getCategoryIcon(category),
              items: items.map(item => {
                const fullIntegration = integrationsMap[item.value];
                const itemId = fullIntegration?._id || item._id || item.id || '';
                const logoUrl = getDefaultLogo(item.value);
                console.log(`Item "${item.name}" (value: ${item.value}) ID:`, itemId);
                console.log(`  -> Logo URL:`, logoUrl);
                console.log(`  -> Backend icon:`, item.icon);
                return {
                  id: itemId,
                  value: item.value,
                  name: item.name,
                  description: item.description,
                  logo: logoUrl || item.icon || null,
                  verified: true,
                  status: 'connected',
                  badges: item.tags || [],
                  auth_methods: item.auth_methods || []
                };
              })
            };
          });
        }

        setIntegrationsData(categorized);
      } catch (err) {
        console.error('Failed to fetch integrations:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const getCategoryIcon = (category: string): IconType => {
    const iconMap: { [key: string]: IconType } = {
      'OIDC Provider': FaShieldAlt,
      'Identity Datastores / Directories': FaServer,
      'Cloud Identity': FaPlug,
      'Messaging & Notifications': FaPlug
    };
    return iconMap[category] || FaPlug;
  };

  const getDefaultLogo = (value: string): string | null => {
    const logoMap: { [key: string]: string } = {
      'ping_federate': 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      'ping_directory': 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      'ping_one': 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      'pingfederate': 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      'pingdirectory': 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      'pingone': 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      'activedirectory': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
      'active_directory': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
      'azure_ad': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
      'azuread': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
      'azure': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
      'microsoft_ad': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
      'teams': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iNTAlIiB4Mj0iNTAlIiB5MT0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNWE2MmM1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNDA0N2IzIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMTYuNSIgY3k9IjUuNSIgcj0iMy41IiBmaWxsPSIjN2I4M2ViIi8+PGNpcmNsZSBjeD0iMTkiIGN5PSIxMiIgcj0iMi41IiBmaWxsPSI1YTYyYzUiLz48cGF0aCBmaWxsPSJ1cmwoI2EpIiBkPSJNMiAzaDEydjEySDB6Ii8+PHRleHQgeD0iOCIgeT0iMTMiIGZpbGw9IiNmZmYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlQ8L3RleHQ+PHBhdGggZmlsbD0iIzdhODJlYiIgZD0iTTE0LjUgMTRoNXY3aC01eiIvPjxwYXRoIGZpbGw9IiM1YTYyYzUiIGQ9Ik0xNi41IDE2LjVoNXY0LjVoLTV6Ii8+PC9zdmc+',
      'microsoft_teams': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iNTAlIiB4Mj0iNTAlIiB5MT0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNWE2MmM1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNDA0N2IzIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMTYuNSIgY3k9IjUuNSIgcj0iMy41IiBmaWxsPSIjN2I4M2ViIi8+PGNpcmNsZSBjeD0iMTkiIGN5PSIxMiIgcj0iMi41IiBmaWxsPSI1YTYyYzUiLz48cGF0aCBmaWxsPSJ1cmwoI2EpIiBkPSJNMiAzaDEydjEySDB6Ii8+PHRleHQgeD0iOCIgeT0iMTMiIGZpbGw9IiNmZmYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlQ8L3RleHQ+PHBhdGggZmlsbD0iIzdhODJlYiIgZD0iTTE0LjUgMTRoNXY3aC01eiIvPjxwYXRoIGZpbGw9IiM1YTYyYzUiIGQ9Ik0xNi41IDE2LjVoNXY0LjVoLTV6Ii8+PC9zdmc+',
      'microsoftteams': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iNTAlIiB4Mj0iNTAlIiB5MT0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNWE2MmM1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNDA0N2IzIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMTYuNSIgY3k9IjUuNSIgcj0iMy41IiBmaWxsPSIjN2I4M2ViIi8+PGNpcmNsZSBjeD0iMTkiIGN5PSIxMiIgcj0iMi41IiBmaWxsPSI1YTYyYzUiLz48cGF0aCBmaWxsPSJ1cmwoI2EpIiBkPSJNMiAzaDEydjEySDB6Ii8+PHRleHQgeD0iOCIgeT0iMTMiIGZpbGw9IiNmZmYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlQ8L3RleHQ+PHBhdGggZmlsbD0iIzdhODJlYiIgZD0iTTE0LjUgMTRoNXY3aC01eiIvPjxwYXRoIGZpbGw9IiM1YTYyYzUiIGQ9Ik0xNi41IDE2LjVoNXY0LjVoLTV6Ii8+PC9zdmc+',
      'ldap': 'https://cdn-icons-png.flaticon.com/512/2906/2906274.png',
      'openldap': 'https://cdn-icons-png.flaticon.com/512/2906/2906274.png',
      'ldap_directory': 'https://cdn-icons-png.flaticon.com/512/2906/2906274.png',
      'okta': 'https://www.okta.com/sites/default/files/Okta_Logo_BrightBlue_Medium.png',
      'auth0': 'https://cdn.auth0.com/website/new-homepage/dark-favicon.png',
      'google': 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
      'google_workspace': 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
      'gsuite': 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
      'slack': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg',
      'custom': 'https://cdn-icons-png.flaticon.com/512/3524/3524388.png',
      'custom_integration': 'https://cdn-icons-png.flaticon.com/512/3524/3524388.png',
      'api': 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
      'webhook': 'https://cdn-icons-png.flaticon.com/512/8099/8099231.png',
      'saml': 'https://cdn-icons-png.flaticon.com/512/6195/6195699.png',
      'oidc': 'https://cdn-icons-png.flaticon.com/512/9068/9068642.png',
      'oauth': 'https://cdn-icons-png.flaticon.com/512/9068/9068699.png',
    };

    const normalizedValue = value?.toLowerCase().replace(/[-_\s]/g, '');

    if (logoMap[value]) return logoMap[value];

    for (const [key, url] of Object.entries(logoMap)) {
      if (key.toLowerCase().replace(/[-_\s]/g, '') === normalizedValue) {
        return url;
      }
    }

    return null;
  };

  const getBadgeColors = (badge: string): string => {
    const colors: { [key: string]: string } = {
      'SSO': 'bg-blue-100 text-blue-700 border-blue-300',
      'Enterprise': 'bg-purple-100 text-purple-700 border-purple-300',
      'SAML': 'bg-green-100 text-green-700 border-green-300',
      'LDAP': 'bg-blue-100 text-blue-700 border-blue-300',
      'Directory': 'bg-gray-100 text-gray-700 border-gray-300',
      'Sync': 'bg-cyan-100 text-cyan-700 border-cyan-300',
      'Windows': 'bg-blue-100 text-blue-700 border-blue-300',
      'SaaS': 'bg-blue-100 text-blue-700 border-blue-300',
      'IDaaS': 'bg-purple-100 text-purple-700 border-purple-300',
      'Cloud': 'bg-sky-100 text-sky-700 border-sky-300',
      'OAuth': 'bg-orange-100 text-orange-700 border-orange-300',
      'OIDC': 'bg-pink-100 text-pink-700 border-pink-300',
      'Chat': 'bg-green-100 text-green-700 border-green-300',
      'Notifications': 'bg-yellow-100 text-yellow-700 border-yellow-300'
    };
    return colors[badge] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const handleIntegrationSelect = (integrationId: string, integrationName: string, integrationValue: string, authMethods: string[]): void => {
    navigate(`/integration/target-systems/${integrationId}`, {
      state: { integrationName, integrationValue, authMethods }
    });
  };

  const IntegrationCard: React.FC<IntegrationCardProps> = ({ item }) => {
    console.log(`Rendering card for ${item.name}, logo:`, item.logo);

    return (
      <div
        // onClick={() => handleIntegrationSelect(item.id, item.name, item.value, item.auth_methods)}   commented for some external use
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 2xl:p-8 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
      >
        <div className="flex items-start gap-3 2xl:gap-4 mb-4 2xl:mb-5">
          {/* Logo */}
          <div className="w-12 h-12 2xl:w-16 2xl:h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center overflow-hidden p-2.5 flex-shrink-0">
            {item.logo ? (
              <img
                src={item.logo}
                alt={`${item.name} logo`}
                className="w-full h-full object-contain"
                onLoad={() => {
                  console.log(`✓ Logo loaded successfully for ${item.name}:`, item.logo);
                }}
                onError={(e) => {
                  console.error(`✗ Logo failed to load for ${item.name}:`, item.logo);
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.style.display = 'none';
                  const fallbackIcon = document.createElement('div');
                  fallbackIcon.className = 'w-full h-full flex items-center justify-center text-gray-400';
                  fallbackIcon.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>';
                  target.parentElement?.appendChild(fallbackIcon);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <FaPlug className="w-6 h-6 2xl:w-8 2xl:h-8" />
              </div>
            )}
          </div>

          {/* Title + Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm 2xl:text-lg">
                {item.name}
              </h3>
              {item.verified && (
                <FaCheckCircle className="text-green-500 text-sm 2xl:text-base flex-shrink-0" />
              )}
            </div>
            <p className="text-xs 2xl:text-sm text-gray-500 mt-0.5">
              {item.description}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 2xl:gap-3">
          {item.badges.map((badge, index) => (
            <span
              key={index}
              className={`px-2.5 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-xs 2xl:text-sm font-medium border ${getBadgeColors(badge)}`}
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — unchanged at 1920×1080, scales at 2xl (2560+) */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 2xl:px-20 py-6 2xl:py-10">
          <div className="flex items-center gap-2 mb-1">
            <FaStar className="text-yellow-500 2xl:text-xl" />
            <h1 className="text-2xl 2xl:text-4xl font-bold text-gray-900">
              Integrations MarketPlace
            </h1>
            <h2 className="text-gray-600 2xl:text-xl">&nbsp;(Future Release)</h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm 2xl:text-base text-gray-500">
              Connect your IAM systems and manage integrations
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="px-6 2xl:px-20 py-12 2xl:py-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 2xl:h-12 2xl:w-12 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-6 2xl:px-20 py-6 2xl:py-10">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm 2xl:text-base text-red-700">
            Failed to load integrations: {error}
          </div>
        </div>
      )}

      {/* Integration Categories */}
      {!loading && !error && (
        <div className="px-6 2xl:px-20 py-6 2xl:py-10">
          {Object.keys(integrationsData).length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 2xl:p-20 text-center">
              <p className="text-gray-500 2xl:text-lg">No integrations available</p>
            </div>
          ) : (
            <div className="space-y-8 2xl:space-y-14">
              {Object.values(integrationsData).map((category, index) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={index}>
                    {/* Category Header */}
                    <div className="flex items-center gap-3 2xl:gap-4 mb-4 2xl:mb-6">
                      <div className="w-10 h-10 2xl:w-14 2xl:h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CategoryIcon className="text-gray-600 text-base 2xl:text-xl" />
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

                    {/* Cards Grid — 3 cols at 1920×1080, 4 cols at 2560+ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 2xl:gap-6">
                      {category.items.map((item) => (
                        <IntegrationCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage;