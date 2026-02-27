import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaStar, FaPlug, FaShieldAlt, FaServer } from 'react-icons/fa';
import { IconType } from 'react-icons';
import api from '../../utils/api';
import { useTheme } from '../../state/ThemeContext';

const ALLOWED_INTEGRATIONS = [
  'pingfederate',
  'ping_federate',
  'pingdirectory',
  'ping_directory',
  'pingone',
  'ping_one',
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

const AvailableIntegration: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [integrationsData, setIntegrationsData] = useState<CategorizedIntegrations>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntegrations = async (): Promise<void> => {
      try {
        setLoading(true);
        const response: ApiResponse = await api.integrations.list();

        const integrationsMap: IntegrationsMap = {};
        if (Array.isArray(response.integrations)) {
          response.integrations.forEach(intg => {
            integrationsMap[intg.value] = intg;
          });
        }

        const categorized: CategorizedIntegrations = {};

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
    const map: { [key: string]: IconType } = {
      'OIDC Provider': FaShieldAlt,
      'Identity Datastores / Directories': FaServer
    };
    return map[category] || FaPlug;
  };

  const getDefaultLogo = (value: string): string | null => {
    const logos: { [key: string]: string } = {
      pingfederate: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      ping_federate: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      pingdirectory: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      ping_directory: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      pingone: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
      ping_one: 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg',
    };
    const normalized = value?.toLowerCase().replace(/[-_\s]/g, '');
    return logos[value] || logos[normalized] || null;
  };

  const handleIntegrationSelect = (id: string, name: string, value: string, authMethods: string[]): void => {
    const integrationType = value.toLowerCase().replace(/[-_\s]/g, '');
    navigate(`/agents/select-type/${integrationType}/${id}`, {
      state: { integrationName: name, integrationValue: value, authMethods }
    });
  };

  const IntegrationCard: React.FC<IntegrationCardProps> = ({ item }) => (
    <div
      onClick={() => handleIntegrationSelect(item.id, item.name, item.value, item.auth_methods)}
      style={{
        background: isDark ? '#1a2234' : '#ffffff',
        border: isDark ? '1px solid #1e2d45' : '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
          ? '0 8px 30px rgba(0,0,0,0.4)'
          : '0 8px 30px rgba(0,0,0,0.1)';
        (e.currentTarget as HTMLDivElement).style.borderColor = isDark ? '#3b82f6' : '#93c5fd';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
          ? '0 1px 3px rgba(0,0,0,0.3)'
          : '0 1px 3px rgba(0,0,0,0.05)';
        (e.currentTarget as HTMLDivElement).style.borderColor = isDark ? '#1e2d45' : '#e5e7eb';
      }}
    >
      {/* Logo + Title row */}
      <div className="flex items-start gap-3 2xl:gap-4 mb-4 2xl:mb-5">
        <div
          className="avail-card-logo w-12 h-12 2xl:w-16 2xl:h-16 rounded-lg flex items-center justify-center p-2 flex-shrink-0"
          style={{ background: isDark ? '#111827' : '#f3f4f6' }}
        >
          {item.logo ? (
            <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
          ) : (
            <FaPlug style={{ color: isDark ? '#64748b' : '#9ca3af' }} className="2xl:text-xl" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="avail-card-title font-semibold text-base 2xl:text-xl"
              style={{ color: isDark ? '#f1f5f9' : '#111827' }}
            >
              {item.name}
            </h3>
            <FaCheckCircle className="text-green-500 text-sm 2xl:text-base flex-shrink-0" />
          </div>
          <p
            className="avail-card-desc text-xs 2xl:text-sm mt-1"
            style={{ color: isDark ? '#64748b' : '#6b7280' }}
          >
            {item.description}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 2xl:gap-3">
        {item.badges.map((badge, i) => (
          <span
            key={i}
            className="avail-badge px-2.5 py-1 2xl:px-3 2xl:py-1.5 rounded-full text-xs 2xl:text-sm font-medium"
            style={{
              background: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
              color: isDark ? '#93c5fd' : '#1d4ed8',
              border: isDark ? '1px solid rgba(59,130,246,0.3)' : '1px solid #bfdbfe',
            }}
          >
            {badge}
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
          .avail-header { padding: 20px 40px !important; }
          .avail-back-btn { font-size: 0.8rem !important; }
          .avail-header h1 { font-size: 1.5rem !important; }
          .avail-header p { font-size: 0.85rem !important; }
          .avail-content { padding: 20px 40px !important; }
          .avail-section { margin-bottom: 36px !important; }
          .avail-category-header { margin-bottom: 14px !important; }
          .avail-category-icon-wrap { width: 36px !important; height: 36px !important; border-radius: 8px !important; }
          .avail-category-title { font-size: 1rem !important; }
          .avail-category-count { font-size: 0.7rem !important; }
          .avail-grid { gap: 14px !important; }
        }

        @media (max-width: 1400px) {
          .avail-header { padding: 18px 28px !important; }
          .avail-content { padding: 18px 28px !important; }
          .avail-header h1 { font-size: 1.35rem !important; }
          .avail-section { margin-bottom: 28px !important; }
          .avail-grid { gap: 12px !important; }
        }

        @media (max-width: 1200px) {
          .avail-header { padding: 16px 20px !important; }
          .avail-content { padding: 16px 20px !important; }
          .avail-header h1 { font-size: 1.2rem !important; }
          .avail-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 1024px) {
          .avail-header { padding: 14px 16px !important; }
          .avail-content { padding: 14px 16px !important; }
          .avail-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
        }

        /* ── Responsive: above 1920px ── */
        @media (min-width: 1921px) {
          .avail-header { padding: 48px 80px !important; }
          .avail-back-btn { font-size: 1rem !important; margin-bottom: 20px !important; }
          .avail-header h1 { font-size: 2.8rem !important; margin-bottom: 6px !important; }
          .avail-header p { font-size: 1.1rem !important; }
          .avail-content { padding: 48px 80px !important; }
          .avail-section { margin-bottom: 60px !important; }
          .avail-category-header { gap: 20px !important; margin-bottom: 24px !important; }
          .avail-category-icon-wrap { width: 56px !important; height: 56px !important; border-radius: 12px !important; }
          .avail-category-title { font-size: 1.5rem !important; }
          .avail-category-count { font-size: 0.9rem !important; }
          .avail-grid { gap: 24px !important; grid-template-columns: repeat(4, 1fr) !important; }
          .avail-card-logo { width: 56px !important; height: 56px !important; }
          .avail-card-title { font-size: 1.1rem !important; }
          .avail-card-desc { font-size: 0.85rem !important; }
          .avail-badge { font-size: 0.8rem !important; padding: 6px 14px !important; }
          .avail-error-box { font-size: 0.9rem !important; padding: 16px !important; }
          .avail-spinner { width: 48px !important; height: 48px !important; }
        }

        @media (min-width: 2560px) {
          .avail-header { padding: 64px 120px !important; }
          .avail-header h1 { font-size: 3.5rem !important; }
          .avail-header p { font-size: 1.3rem !important; }
          .avail-content { padding: 64px 120px !important; }
          .avail-section { margin-bottom: 80px !important; }
          .avail-category-icon-wrap { width: 70px !important; height: 70px !important; }
          .avail-category-title { font-size: 1.9rem !important; }
          .avail-grid { gap: 32px !important; grid-template-columns: repeat(5, 1fr) !important; }
          .avail-card-title { font-size: 1.3rem !important; }
          .avail-card-desc { font-size: 1rem !important; }
          .avail-badge { font-size: 0.9rem !important; }
        }
      `}</style>
      <div
        className="min-h-screen"
        style={{ background: isDark ? '#0d1117' : '#f9fafb' }}
      >

        {/* Header */}
        <div
          className="avail-header border-b px-6 2xl:px-16 py-6 2xl:py-10"
          style={{
            background: isDark ? '#1a2234' : '#ffffff',
            borderColor: isDark ? '#1e2d45' : '#e5e7eb',
          }}
        >
          <button
            className="avail-back-btn group text-sm 2xl:text-base flex items-center gap-2 transition-colors mb-3 2xl:mb-5"
            onClick={() => navigate('/agents')}
            style={{ color: isDark ? '#64748b' : '#6b7280' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#e2e8f0' : '#111827'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#64748b' : '#6b7280'}
          >
            <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back</span>
          </button>

          <h1
            className="text-2xl 2xl:text-4xl font-semibold mb-1"
            style={{ color: isDark ? '#f1f5f9' : '#111827' }}
          >
            Available Integrations
          </h1>
          <p
            className="text-sm 2xl:text-base"
            style={{ color: isDark ? '#64748b' : '#6b7280' }}
          >
            Connect Ping Identity systems and manage target integrations
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12 2xl:py-20">
            <div className="avail-spinner animate-spin h-8 w-8 2xl:h-12 2xl:w-12 border-b-2 border-blue-600 rounded-full" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="avail-content px-6 2xl:px-16 py-6">
            <div
              className="avail-error-box rounded-lg p-4 text-sm 2xl:text-base"
              style={{
                background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
                border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca',
                color: isDark ? '#fca5a5' : '#b91c1c',
              }}
            >
              Failed to load integrations: {error}
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="avail-content px-6 2xl:px-16 py-6 2xl:py-10 space-y-8 2xl:space-y-14">
            {Object.values(integrationsData).map((category, index) => {
              const Icon = category.icon;
              return (
                <div className="avail-section" key={index}>

                  {/* Category header */}
                  <div className="avail-category-header flex items-center gap-3 2xl:gap-4 mb-4 2xl:mb-6">
                    <div
                      className="avail-category-icon-wrap w-10 h-10 2xl:w-14 2xl:h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: isDark ? '#111827' : '#f3f4f6' }}
                    >
                      <Icon
                        className="text-base 2xl:text-xl"
                        style={{ color: isDark ? '#94a3b8' : '#4b5563' }}
                      />
                    </div>
                    <div>
                      <h2
                        className="avail-category-title text-lg 2xl:text-2xl font-semibold"
                        style={{ color: isDark ? '#f1f5f9' : '#111827' }}
                      >
                        {category.category}
                      </h2>
                      <p
                        className="avail-category-count text-xs 2xl:text-sm"
                        style={{ color: isDark ? '#64748b' : '#6b7280' }}
                      >
                        {category.items.length} integration{category.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="avail-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 2xl:gap-6">
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
    </>
  );
};

export default AvailableIntegration;