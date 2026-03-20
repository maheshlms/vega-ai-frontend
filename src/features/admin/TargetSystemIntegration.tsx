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
      className="tsi-card bg-white rounded-2xl border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-[220ms] cursor-pointer overflow-hidden tsi-card-p"
    >
      <div className="flex items-start gap-3 tsi-card-header-mb">
        <div className="tsi-logo-box bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-2 shrink-0">
          {item.logo ? (
            <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
          ) : (
            <FaPlug className="text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#0A0A0A] tsi-card-title">{item.name}</h3>
            <FaCheckCircle className="text-green-500 tsi-check-icon shrink-0" />
          </div>
          <p className="tsi-card-desc text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {item.badges.map((badge, bi) => (
          <span key={bi} className="inline-flex items-center gap-1 tsi-badge-p rounded-md bg-gray-50 border border-gray-100 tsi-badge-fs font-medium text-gray-600">
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

        /* =====================================================================
           RESPONSIVE TOKENS — 1920×1080 is the baseline (default :root).
           Only spacing / sizing tokens change across breakpoints.
           No UI, structure, features, comments, or logic is altered.
           ===================================================================== */

        /* ── BASELINE : 1920×1080 ────────────────────────────────────────── */
        :root {
          --tsi-page-max-w:       1400px;
          --tsi-page-px:          48px;
          --tsi-header-pt:        40px;
          --tsi-header-pb:        32px;
          --tsi-back-fs:          13px;
          --tsi-back-mb:          12px;
          --tsi-h1-fs:            36px;
          --tsi-h1-mb:            8px;
          --tsi-subtitle-fs:      15px;
          --tsi-content-pt:       40px;
          --tsi-content-pb:       80px;
          --tsi-section-gap:      48px;
          --tsi-cat-icon-sz:      36px;
          --tsi-cat-icon-fs:      14px;
          --tsi-cat-title-fs:     15px;
          --tsi-cat-count-fs:     12px;
          --tsi-cat-header-mb:    24px;
          --tsi-grid-gap:         20px;
          --tsi-card-min-w:       280px;
          --tsi-card-p:           24px;
          --tsi-card-header-mb:   16px;
          --tsi-logo-sz:          44px;
          --tsi-card-title-fs:    15px;
          --tsi-check-icon-fs:    14px;
          --tsi-card-desc-fs:     12px;
          --tsi-badge-px:         10px;
          --tsi-badge-py:         4px;
          --tsi-badge-fs:         11px;
        }

        /* ── QHD : 2560–3839px ───────────────────────────────────────────── */
        @media (min-width: 2560px) and (max-width: 3839px) {
          :root {
            --tsi-page-max-w:       1600px;
            --tsi-page-px:          64px;
            --tsi-header-pt:        52px;
            --tsi-header-pb:        40px;
            --tsi-back-fs:          14px;
            --tsi-back-mb:          16px;
            --tsi-h1-fs:            46px;
            --tsi-h1-mb:            10px;
            --tsi-subtitle-fs:      17px;
            --tsi-content-pt:       52px;
            --tsi-content-pb:       96px;
            --tsi-section-gap:      60px;
            --tsi-cat-icon-sz:      44px;
            --tsi-cat-icon-fs:      17px;
            --tsi-cat-title-fs:     17px;
            --tsi-cat-count-fs:     13px;
            --tsi-cat-header-mb:    30px;
            --tsi-grid-gap:         26px;
            --tsi-card-min-w:       320px;
            --tsi-card-p:           30px;
            --tsi-card-header-mb:   20px;
            --tsi-logo-sz:          54px;
            --tsi-card-title-fs:    17px;
            --tsi-check-icon-fs:    16px;
            --tsi-card-desc-fs:     13px;
            --tsi-badge-px:         12px;
            --tsi-badge-py:         5px;
            --tsi-badge-fs:         12px;
          }
        }

        /* ── 4K AND ULTRAWIDE : 3840px+ ──────────────────────────────────── */
        @media (min-width: 3840px) {
          :root {
            --tsi-page-max-w:       2200px;
            --tsi-page-px:          80px;
            --tsi-header-pt:        64px;
            --tsi-header-pb:        52px;
            --tsi-back-fs:          16px;
            --tsi-back-mb:          20px;
            --tsi-h1-fs:            60px;
            --tsi-h1-mb:            14px;
            --tsi-subtitle-fs:      20px;
            --tsi-content-pt:       64px;
            --tsi-content-pb:       120px;
            --tsi-section-gap:      80px;
            --tsi-cat-icon-sz:      56px;
            --tsi-cat-icon-fs:      22px;
            --tsi-cat-title-fs:     22px;
            --tsi-cat-count-fs:     16px;
            --tsi-cat-header-mb:    40px;
            --tsi-grid-gap:         36px;
            --tsi-card-min-w:       400px;
            --tsi-card-p:           40px;
            --tsi-card-header-mb:   28px;
            --tsi-logo-sz:          72px;
            --tsi-card-title-fs:    22px;
            --tsi-check-icon-fs:    20px;
            --tsi-card-desc-fs:     17px;
            --tsi-badge-px:         16px;
            --tsi-badge-py:         8px;
            --tsi-badge-fs:         15px;
          }
        }

        /* ── LARGE LAPTOP : 1440–1919px ──────────────────────────────────── */
        @media (min-width: 1440px) and (max-width: 1919px) {
          :root {
            --tsi-page-max-w:       1280px;
            --tsi-page-px:          36px;
            --tsi-header-pt:        32px;
            --tsi-header-pb:        26px;
            --tsi-back-fs:          12.5px;
            --tsi-back-mb:          11px;
            --tsi-h1-fs:            32px;
            --tsi-h1-mb:            7px;
            --tsi-subtitle-fs:      14px;
            --tsi-content-pt:       32px;
            --tsi-content-pb:       72px;
            --tsi-section-gap:      44px;
            --tsi-cat-icon-sz:      33px;
            --tsi-cat-icon-fs:      13px;
            --tsi-cat-title-fs:     14px;
            --tsi-cat-count-fs:     11.5px;
            --tsi-cat-header-mb:    22px;
            --tsi-grid-gap:         18px;
            --tsi-card-min-w:       260px;
            --tsi-card-p:           22px;
            --tsi-card-header-mb:   15px;
            --tsi-logo-sz:          40px;
            --tsi-card-title-fs:    14px;
            --tsi-check-icon-fs:    13px;
            --tsi-card-desc-fs:     11.5px;
            --tsi-badge-px:         9px;
            --tsi-badge-py:         3.5px;
            --tsi-badge-fs:         10.5px;
          }
        }

        /* ── MEDIUM LAPTOP : 1280–1439px ─────────────────────────────────── */
        @media (min-width: 1280px) and (max-width: 1439px) {
          :root {
            --tsi-page-max-w:       1100px;
            --tsi-page-px:          28px;
            --tsi-header-pt:        26px;
            --tsi-header-pb:        20px;
            --tsi-back-fs:          12px;
            --tsi-back-mb:          10px;
            --tsi-h1-fs:            26px;
            --tsi-h1-mb:            6px;
            --tsi-subtitle-fs:      13px;
            --tsi-content-pt:       26px;
            --tsi-content-pb:       56px;
            --tsi-section-gap:      36px;
            --tsi-cat-icon-sz:      30px;
            --tsi-cat-icon-fs:      12px;
            --tsi-cat-title-fs:     13px;
            --tsi-cat-count-fs:     11px;
            --tsi-cat-header-mb:    18px;
            --tsi-grid-gap:         16px;
            --tsi-card-min-w:       240px;
            --tsi-card-p:           18px;
            --tsi-card-header-mb:   13px;
            --tsi-logo-sz:          36px;
            --tsi-card-title-fs:    13px;
            --tsi-check-icon-fs:    12px;
            --tsi-card-desc-fs:     11px;
            --tsi-badge-px:         8px;
            --tsi-badge-py:         3px;
            --tsi-badge-fs:         10px;
          }
        }

        /* ── SMALL LAPTOP : 1024–1279px ─────────────────────────────────── */
        @media (min-width: 1024px) and (max-width: 1279px) {
          :root {
            --tsi-page-max-w:       100%;
            --tsi-page-px:          24px;
            --tsi-header-pt:        22px;
            --tsi-header-pb:        18px;
            --tsi-back-fs:          11.5px;
            --tsi-back-mb:          9px;
            --tsi-h1-fs:            24px;
            --tsi-h1-mb:            6px;
            --tsi-subtitle-fs:      13px;
            --tsi-content-pt:       24px;
            --tsi-content-pb:       48px;
            --tsi-section-gap:      32px;
            --tsi-cat-icon-sz:      28px;
            --tsi-cat-icon-fs:      11px;
            --tsi-cat-title-fs:     13px;
            --tsi-cat-count-fs:     10.5px;
            --tsi-cat-header-mb:    16px;
            --tsi-grid-gap:         14px;
            --tsi-card-min-w:       220px;
            --tsi-card-p:           16px;
            --tsi-card-header-mb:   12px;
            --tsi-logo-sz:          34px;
            --tsi-card-title-fs:    13px;
            --tsi-check-icon-fs:    11px;
            --tsi-card-desc-fs:     10.5px;
            --tsi-badge-px:         7px;
            --tsi-badge-py:         3px;
            --tsi-badge-fs:         10px;
          }
        }

        /* ── TABLET : 768–1023px ─────────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          :root {
            --tsi-page-max-w:       100%;
            --tsi-page-px:          16px;
            --tsi-header-pt:        18px;
            --tsi-header-pb:        14px;
            --tsi-back-fs:          11px;
            --tsi-back-mb:          8px;
            --tsi-h1-fs:            22px;
            --tsi-h1-mb:            5px;
            --tsi-subtitle-fs:      12.5px;
            --tsi-content-pt:       20px;
            --tsi-content-pb:       40px;
            --tsi-section-gap:      28px;
            --tsi-cat-icon-sz:      26px;
            --tsi-cat-icon-fs:      10px;
            --tsi-cat-title-fs:     13px;
            --tsi-cat-count-fs:     10px;
            --tsi-cat-header-mb:    14px;
            --tsi-grid-gap:         12px;
            --tsi-card-min-w:       200px;
            --tsi-card-p:           14px;
            --tsi-card-header-mb:   11px;
            --tsi-logo-sz:          32px;
            --tsi-card-title-fs:    13px;
            --tsi-check-icon-fs:    11px;
            --tsi-card-desc-fs:     10px;
            --tsi-badge-px:         7px;
            --tsi-badge-py:         2px;
            --tsi-badge-fs:         9.5px;
          }

          /* Force 2-column grid at tablet so cards don't become slivers */
          .tsi-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          /* Touch targets: all interactive elements min 44×44px */
          .tsi-card {
            min-height: 44px;
          }
          .tsi-back-btn {
            min-height: 44px;
            display: flex;
            align-items: center;
          }
        }

        /* ── COMPONENT STYLES — all sizing via CSS vars ──────────────────── */
        .tsi-page-wrap {
          max-width: var(--tsi-page-max-w);
          margin: 0 auto;
          padding-left: var(--tsi-page-px);
          padding-right: var(--tsi-page-px);
          box-sizing: border-box;
          width: 100%;
        }
        .tsi-header-inner {
          padding-top: var(--tsi-header-pt);
          padding-bottom: var(--tsi-header-pb);
        }
        .tsi-back-btn {
          font-size: var(--tsi-back-fs);
          margin-bottom: var(--tsi-back-mb);
        }
        .tsi-h1 { font-size: var(--tsi-h1-fs); margin-bottom: var(--tsi-h1-mb); }
        .tsi-subtitle { font-size: var(--tsi-subtitle-fs); }
        .tsi-content-wrap {
          padding-top: var(--tsi-content-pt);
          padding-bottom: var(--tsi-content-pb);
          display: flex;
          flex-direction: column;
          gap: var(--tsi-section-gap);
        }
        .tsi-cat-icon {
          width: var(--tsi-cat-icon-sz);
          height: var(--tsi-cat-icon-sz);
          font-size: var(--tsi-cat-icon-fs);
        }
        .tsi-cat-title { font-size: var(--tsi-cat-title-fs); }
        .tsi-cat-count { font-size: var(--tsi-cat-count-fs); }
        .tsi-cat-header { margin-bottom: var(--tsi-cat-header-mb); }
        .tsi-grid {
          display: grid;
          gap: var(--tsi-grid-gap);
          grid-template-columns: repeat(auto-fill, minmax(var(--tsi-card-min-w), 1fr));
        }
        .tsi-card-p { padding: var(--tsi-card-p); }
        .tsi-card-header-mb { margin-bottom: var(--tsi-card-header-mb); }
        .tsi-logo-box { width: var(--tsi-logo-sz); height: var(--tsi-logo-sz); }
        .tsi-card-title { font-size: var(--tsi-card-title-fs); }
        .tsi-check-icon { font-size: var(--tsi-check-icon-fs); }
        .tsi-card-desc { font-size: var(--tsi-card-desc-fs); }
        .tsi-badge-p { padding: var(--tsi-badge-py) var(--tsi-badge-px); }
        .tsi-badge-fs { font-size: var(--tsi-badge-fs); }

        /* ── GLOBAL SAFETY NETS ──────────────────────────────────────────── */

        /* Prevent horizontal overflow at all sizes */
        .tsi-font {
          overflow-x: hidden;
        }

        /* Flex children with truncated text must be able to shrink */
        .tsi-card .flex-1 {
          min-width: 0;
        }

        /* Card description: long unbreakable strings won't blow out */
        .tsi-card-desc {
          overflow-wrap: break-word;
          word-break: break-word;
        }

        /* Card title truncation guard */
        .tsi-card-title {
          overflow-wrap: break-word;
          word-break: break-word;
        }

        /* Images inside logo box scale correctly */
        .tsi-logo-box img {
          max-width: 100%;
          height: auto;
        }

        /* SVG icons inside logo box */
        .tsi-logo-box svg {
          width: 50%;
          height: 50%;
        }

        /* Ensure box-sizing is sane across all tsi elements */
        .tsi-page-wrap,
        .tsi-header-inner,
        .tsi-content-wrap,
        .tsi-grid,
        .tsi-card {
          box-sizing: border-box;
        }

        /* 4K font rendering quality */
        @media (min-width: 2560px) {
          .tsi-h1,
          .tsi-cat-title,
          .tsi-card-title {
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
        }
      `}</style>
      <div className="tsi-font min-h-screen bg-[#FAFAFA]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="tsi-page-wrap tsi-header-inner">
            <button
              onClick={() => navigate('/systems')}
              className="tsi-back-btn flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <span>←</span>
              <span>Back to Target Systems</span>
            </button>
            <h1 className="tsi-h1 font-bold leading-tight tracking-tight text-[#0A0A0A]">
              Available Integrations
            </h1>
            <p className="tsi-subtitle text-gray-500 font-normal leading-relaxed m-0">
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
          <div className="tsi-page-wrap py-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              Failed to load integrations: {error}
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="tsi-page-wrap tsi-content-wrap">
            {Object.values(integrationsData).map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index}>
                  <div className="tsi-cat-header flex items-center gap-3">
                    <div className="tsi-cat-icon bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="text-gray-600" />
                    </div>
                    <div>
                      <h2 className="tsi-cat-title font-semibold text-[#0A0A0A]">{category.category}</h2>
                      <p className="tsi-cat-count text-gray-400">{category.items.length} integration{category.items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="tsi-grid">
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