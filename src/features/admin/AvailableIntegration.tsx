import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlug } from 'react-icons/fa';
import api from '../../utils/api';

const ALLOWED_INTEGRATIONS = [
  'pingfederate', 'ping_federate',
  'pingdirectory', 'ping_directory',
  'pingone', 'ping_one',
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

interface IntegrationsMap {
  [key: string]: Integration;
}

interface ApiResponse {
  integrations?: Integration[];
  categories?: { [key: string]: Integration[] };
}

// Per-integration accent colours (same palette as IntegrationsPage)
const CARD_ACCENT_COLORS: Record<string, { border: string; shadow: string; headerBg: string; logoBg: string }> = {
  pingfederate:   { border: '#E9472A', shadow: 'rgba(233,71,42,0.18)',   headerBg: '#FFF5F2', logoBg: '#FEE8E2' },
  pingdirectory:  { border: '#0A85C2', shadow: 'rgba(10,133,194,0.18)',  headerBg: '#F0F8FF', logoBg: '#DAEEFF' },
  pingone:        { border: '#8B5CF6', shadow: 'rgba(139,92,246,0.18)',  headerBg: '#F5F3FF', logoBg: '#EDE9FE' },
};

const getDefaultLogo = (value: string): string | null => {
  const pingLogo = 'https://www.pingidentity.com/content/dam/ping-6-2-assets/topnav-json-configs/Ping-Logo.svg';
  const logos: Record<string, string> = {
    pingfederate: pingLogo, ping_federate: pingLogo,
    pingdirectory: pingLogo, ping_directory: pingLogo,
    pingone: pingLogo, ping_one: pingLogo,
  };
  const normalized = value?.toLowerCase().replace(/[-_\s]/g, '');
  return logos[value] || logos[normalized] || null;
};

const getAccentKey = (value: string): string =>
  value?.toLowerCase().replace(/[-_\s]/g, '').replace('ping', 'ping') as string;

const AvailableIntegration: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntegrations = async (): Promise<void> => {
      try {
        setLoading(true);
        const response: ApiResponse = await api.integrations.list();

        const integrationsMap: IntegrationsMap = {};
        if (Array.isArray(response.integrations)) {
          response.integrations.forEach(intg => { integrationsMap[intg.value] = intg; });
        }

        const flat: IntegrationItem[] = [];
        const seen = new Set<string>();

        if (response.categories) {
          Object.values(response.categories).forEach(catItems => {
            catItems
              .filter(item => {
                const norm = item.value?.toLowerCase().replace(/[-_\s]/g, '');
                return ALLOWED_INTEGRATIONS.some(a => a.replace(/[-_\s]/g, '') === norm);
              })
              .forEach(item => {
                const norm = item.value?.toLowerCase().replace(/[-_\s]/g, '');
                if (seen.has(norm)) return;
                seen.add(norm);
                const full = integrationsMap[item.value];
                flat.push({
                  id: full?._id || (item as any)._id || (item as any).id || norm,
                  value: item.value,
                  name: item.name,
                  description: item.description,
                  logo: getDefaultLogo(item.value),
                  verified: true,
                  status: 'connected',
                  badges: (item as any).tags || [],
                  auth_methods: item.auth_methods || [],
                });
              });
          });
        }

        setItems(flat);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchIntegrations();
  }, []);

  const handleSelect = (item: IntegrationItem): void => {
    const integrationType = item.value.toLowerCase().replace(/[-_\s]/g, '');
    navigate(`/agents/select-type/${integrationType}/${item.id}`, {
      state: { integrationName: item.name, integrationValue: item.value, authMethods: item.auth_methods }
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        .avint-font { font-family: 'DM Sans', sans-serif; }
        @keyframes avint-rise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .avint-card { animation: avint-rise 0.4s ease both; }
        .avint-card:nth-child(1) { animation-delay: 0.03s; }
        .avint-card:nth-child(2) { animation-delay: 0.06s; }
        .avint-card:nth-child(3) { animation-delay: 0.09s; }
        .avint-accent-bar {
          height: 3px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        .avint-card:hover .avint-accent-bar { transform: scaleX(1); }
        @keyframes avint-pulse-green {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .avint-pulse { animation: avint-pulse-green 2s ease infinite; }

        /* =====================================================================
           RESPONSIVE TOKENS — 1920×1080 is the baseline (default :root).
           Only spacing / sizing / layout tokens change across breakpoints.
           No UI, structure, features, or logic is altered.
           ===================================================================== */

        /* ── BASELINE: 1920×1080 ─────────────────────────────────────────── */
        :root {
          --avint-page-max-w:      1400px;
          --avint-page-px:         48px;
          --avint-header-pt:       40px;
          --avint-header-pb:       32px;
          --avint-h1-fs:           36px;
          --avint-subtitle-fs:     15px;
          --avint-subtitle-max-w:  480px;
          --avint-toolbar-h:       48px;
          --avint-toolbar-fs:      13px;
          --avint-grid-pt:         40px;
          --avint-grid-pb:         80px;
          --avint-grid-gap:        20px;
          --avint-card-min-w:      260px;
          --avint-logo-zone-minh:  160px;
          --avint-logo-zone-px:    28px;
          --avint-logo-zone-py:    32px;
          --avint-logo-w:          140px;
          --avint-logo-h:          100px;
          --avint-logo-br:         16px;
          --avint-body-px:         24px;
          --avint-body-pt:         20px;
          --avint-body-pb:         24px;
          --avint-body-gap:        12px;
          --avint-name-fs:         15px;
          --avint-desc-fs:         12.5px;
          --avint-badge-px:        10px;
          --avint-badge-py:        4px;
          --avint-badge-fs:        11px;
          --avint-footer-px:       24px;
          --avint-footer-py:       12px;
          --avint-footer-fs:       11.5px;
          --avint-arrow-sz:        28px;
          --avint-verified-fs:     10.5px;
          --avint-back-fs:         13px;
          --avint-back-mb:         16px;
        }

        /* ── LARGE DESKTOP / 4K : >1920px ───────────────────────────────── */
        @media (min-width: 1921px) {
          :root {
            --avint-page-max-w:      1800px;
            --avint-page-px:         80px;
            --avint-header-pt:       56px;
            --avint-header-pb:       44px;
            --avint-h1-fs:           52px;
            --avint-subtitle-fs:     18px;
            --avint-subtitle-max-w:  600px;
            --avint-toolbar-h:       64px;
            --avint-toolbar-fs:      16px;
            --avint-grid-pt:         56px;
            --avint-grid-pb:         100px;
            --avint-grid-gap:        28px;
            --avint-card-min-w:      320px;
            --avint-logo-zone-minh:  200px;
            --avint-logo-zone-px:    36px;
            --avint-logo-zone-py:    40px;
            --avint-logo-w:          180px;
            --avint-logo-h:          130px;
            --avint-logo-br:         20px;
            --avint-body-px:         30px;
            --avint-body-pt:         26px;
            --avint-body-pb:         30px;
            --avint-body-gap:        16px;
            --avint-name-fs:         18px;
            --avint-desc-fs:         15px;
            --avint-badge-px:        13px;
            --avint-badge-py:        6px;
            --avint-badge-fs:        13px;
            --avint-footer-px:       30px;
            --avint-footer-py:       16px;
            --avint-footer-fs:       13.5px;
            --avint-arrow-sz:        36px;
            --avint-verified-fs:     13px;
            --avint-back-fs:         15px;
            --avint-back-mb:         22px;
          }
        }

        /* ── LAPTOP : 1280–1919px ─────────────────────────────────────────
           Covers MacBook Pro 14" (1512px scaled), 15"/16" (1680px scaled),
           standard 1280–1440 laptops. UI is proportionally identical to 1920.
        ─────────────────────────────────────────────────────────────────── */
        @media (min-width: 1280px) and (max-width: 1919px) {
          :root {
            --avint-page-max-w:      1200px;
            --avint-page-px:         36px;
            --avint-header-pt:       28px;
            --avint-header-pb:       22px;
            --avint-h1-fs:           28px;
            --avint-subtitle-fs:     13.5px;
            --avint-subtitle-max-w:  420px;
            --avint-toolbar-h:       40px;
            --avint-toolbar-fs:      12px;
            --avint-grid-pt:         28px;
            --avint-grid-pb:         60px;
            --avint-grid-gap:        16px;
            --avint-card-min-w:      220px;
            --avint-logo-zone-minh:  130px;
            --avint-logo-zone-px:    22px;
            --avint-logo-zone-py:    24px;
            --avint-logo-w:          110px;
            --avint-logo-h:          80px;
            --avint-logo-br:         12px;
            --avint-body-px:         18px;
            --avint-body-pt:         16px;
            --avint-body-pb:         18px;
            --avint-body-gap:        10px;
            --avint-name-fs:         13.5px;
            --avint-desc-fs:         11.5px;
            --avint-badge-px:        8px;
            --avint-badge-py:        3px;
            --avint-badge-fs:        10px;
            --avint-footer-px:       18px;
            --avint-footer-py:       10px;
            --avint-footer-fs:       10.5px;
            --avint-arrow-sz:        24px;
            --avint-verified-fs:     9.5px;
            --avint-back-fs:         12px;
            --avint-back-mb:         13px;
          }
        }

        /* ── SMALL LAPTOP : 1024–1279px ─────────────────────────────────── */
        @media (min-width: 1024px) and (max-width: 1279px) {
          :root {
            --avint-page-max-w:      100%;
            --avint-page-px:         28px;
            --avint-header-pt:       24px;
            --avint-header-pb:       18px;
            --avint-h1-fs:           24px;
            --avint-subtitle-fs:     13px;
            --avint-subtitle-max-w:  380px;
            --avint-toolbar-h:       38px;
            --avint-toolbar-fs:      11.5px;
            --avint-grid-pt:         24px;
            --avint-grid-pb:         48px;
            --avint-grid-gap:        14px;
            --avint-card-min-w:      200px;
            --avint-logo-zone-minh:  120px;
            --avint-logo-zone-px:    18px;
            --avint-logo-zone-py:    20px;
            --avint-logo-w:          100px;
            --avint-logo-h:          70px;
            --avint-logo-br:         10px;
            --avint-body-px:         16px;
            --avint-body-pt:         14px;
            --avint-body-pb:         16px;
            --avint-body-gap:        9px;
            --avint-name-fs:         13px;
            --avint-desc-fs:         11px;
            --avint-badge-px:        7px;
            --avint-badge-py:        3px;
            --avint-badge-fs:        10px;
            --avint-footer-px:       16px;
            --avint-footer-py:       9px;
            --avint-footer-fs:       10px;
            --avint-arrow-sz:        22px;
            --avint-verified-fs:     9px;
            --avint-back-fs:         11.5px;
            --avint-back-mb:         12px;
          }
        }

        /* ── TABLET : 768–1023px ─────────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          :root {
            --avint-page-max-w:      100%;
            --avint-page-px:         20px;
            --avint-header-pt:       20px;
            --avint-header-pb:       16px;
            --avint-h1-fs:           22px;
            --avint-subtitle-fs:     12.5px;
            --avint-subtitle-max-w:  340px;
            --avint-toolbar-h:       36px;
            --avint-toolbar-fs:      11px;
            --avint-grid-pt:         20px;
            --avint-grid-pb:         40px;
            --avint-grid-gap:        12px;
            --avint-card-min-w:      180px;
            --avint-logo-zone-minh:  110px;
            --avint-logo-zone-px:    16px;
            --avint-logo-zone-py:    18px;
            --avint-logo-w:          90px;
            --avint-logo-h:          64px;
            --avint-logo-br:         10px;
            --avint-body-px:         14px;
            --avint-body-pt:         13px;
            --avint-body-pb:         14px;
            --avint-body-gap:        8px;
            --avint-name-fs:         13px;
            --avint-desc-fs:         11px;
            --avint-badge-px:        7px;
            --avint-badge-py:        2px;
            --avint-badge-fs:        10px;
            --avint-footer-px:       14px;
            --avint-footer-py:       8px;
            --avint-footer-fs:       10px;
            --avint-arrow-sz:        22px;
            --avint-verified-fs:     9px;
            --avint-back-fs:         11px;
            --avint-back-mb:         10px;
          }
        }

        /* ── QHD : 2560–3839px ───────────────────────────────────────────────
           clamp() ceilings all hit at 1920px; the >1920px block fires from
           1921px but 1800px max-width starts to feel narrow by 2560px.
           Override here for intentionally spacious QHD layout.
        ─────────────────────────────────────────────────────────────────────── */
        @media (min-width: 2560px) and (max-width: 3839px) {
          :root {
            --avint-page-max-w:      2200px;
            --avint-page-px:         96px;
            --avint-header-pt:       72px;
            --avint-header-pb:       56px;
            --avint-h1-fs:           68px;
            --avint-subtitle-fs:     24px;
            --avint-subtitle-max-w:  760px;
            --avint-toolbar-h:       80px;
            --avint-toolbar-fs:      20px;
            --avint-grid-pt:         72px;
            --avint-grid-pb:         128px;
            --avint-grid-gap:        36px;
            --avint-card-min-w:      400px;
            --avint-logo-zone-minh:  260px;
            --avint-logo-zone-px:    48px;
            --avint-logo-zone-py:    52px;
            --avint-logo-w:          230px;
            --avint-logo-h:          168px;
            --avint-logo-br:         26px;
            --avint-body-px:         40px;
            --avint-body-pt:         34px;
            --avint-body-pb:         40px;
            --avint-body-gap:        20px;
            --avint-name-fs:         24px;
            --avint-desc-fs:         19px;
            --avint-badge-px:        18px;
            --avint-badge-py:        8px;
            --avint-badge-fs:        17px;
            --avint-footer-px:       40px;
            --avint-footer-py:       20px;
            --avint-footer-fs:       17px;
            --avint-arrow-sz:        48px;
            --avint-verified-fs:     17px;
            --avint-back-fs:         20px;
            --avint-back-mb:         28px;
          }
        }

        /* ── 4K+ : ≥3840px ───────────────────────────────────────────────────
           Maximum layout expansion — intentionally spacious, not a narrow strip.
        ─────────────────────────────────────────────────────────────────────── */
        @media (min-width: 3840px) {
          :root {
            --avint-page-max-w:      3200px;
            --avint-page-px:         128px;
            --avint-header-pt:       96px;
            --avint-header-pb:       72px;
            --avint-h1-fs:           88px;
            --avint-subtitle-fs:     32px;
            --avint-subtitle-max-w:  1000px;
            --avint-toolbar-h:       104px;
            --avint-toolbar-fs:      26px;
            --avint-grid-pt:         96px;
            --avint-grid-pb:         160px;
            --avint-grid-gap:        48px;
            --avint-card-min-w:      520px;
            --avint-logo-zone-minh:  340px;
            --avint-logo-zone-px:    64px;
            --avint-logo-zone-py:    68px;
            --avint-logo-w:          300px;
            --avint-logo-h:          220px;
            --avint-logo-br:         32px;
            --avint-body-px:         52px;
            --avint-body-pt:         44px;
            --avint-body-pb:         52px;
            --avint-body-gap:        26px;
            --avint-name-fs:         30px;
            --avint-desc-fs:         24px;
            --avint-badge-px:        24px;
            --avint-badge-py:        10px;
            --avint-badge-fs:        22px;
            --avint-footer-px:       52px;
            --avint-footer-py:       26px;
            --avint-footer-fs:       22px;
            --avint-arrow-sz:        62px;
            --avint-verified-fs:     22px;
            --avint-back-fs:         26px;
            --avint-back-mb:         36px;
          }
        }

        /* =====================================================================
           COMPONENT STYLES — all sizing via CSS vars, structure unchanged
           ===================================================================== */

        .avint-page-wrap {
          max-width: var(--avint-page-max-w);
          margin: 0 auto;
          padding-left: var(--avint-page-px);
          padding-right: var(--avint-page-px);
          box-sizing: border-box;
        }

        .avint-header-inner {
          padding-top: var(--avint-header-pt);
          padding-bottom: var(--avint-header-pb);
        }

        .avint-back-btn {
          font-size: var(--avint-back-fs);
          margin-bottom: var(--avint-back-mb);
        }

        .avint-h1 {
          font-size: var(--avint-h1-fs);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          line-height: 1.15;
        }

        .avint-subtitle {
          font-size: var(--avint-subtitle-fs);
          max-width: var(--avint-subtitle-max-w);
          line-height: 1.6;
        }

        .avint-toolbar-inner {
          height: var(--avint-toolbar-h);
        }

        .avint-toolbar-count {
          font-size: var(--avint-toolbar-fs);
        }

        .avint-grid-wrap {
          padding-top: var(--avint-grid-pt);
          padding-bottom: var(--avint-grid-pb);
        }

        .avint-grid {
          display: grid;
          gap: var(--avint-grid-gap);
          grid-template-columns: repeat(auto-fill, minmax(var(--avint-card-min-w), 1fr));
        }

        .avint-logo-zone {
          min-height: var(--avint-logo-zone-minh);
          padding: var(--avint-logo-zone-py) var(--avint-logo-zone-px);
        }

        .avint-logo-box {
          width: var(--avint-logo-w);
          height: var(--avint-logo-h);
          border-radius: var(--avint-logo-br);
          max-width: 100%;
        }

        .avint-logo-box img {
          max-width: 100%;
          height: auto;
        }

        .avint-card-body {
          padding: var(--avint-body-pt) var(--avint-body-px) var(--avint-body-pb);
          gap: var(--avint-body-gap);
        }

        .avint-name {
          font-size: var(--avint-name-fs);
          line-height: 1.3;
          min-width: 0;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .avint-desc {
          font-size: var(--avint-desc-fs);
          line-height: 1.6;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .avint-badge {
          padding: var(--avint-badge-py) var(--avint-badge-px);
          font-size: var(--avint-badge-fs);
          line-height: 1.4;
        }

        .avint-card-footer {
          padding: var(--avint-footer-py) var(--avint-footer-px);
        }

        .avint-footer-status {
          font-size: var(--avint-footer-fs);
          line-height: 1.4;
        }

        .avint-arrow {
          width: var(--avint-arrow-sz);
          height: var(--avint-arrow-sz);
          flex-shrink: 0;
        }

        .avint-verified {
          font-size: var(--avint-verified-fs);
          line-height: 1.4;
          flex-shrink: 0;
        }

        /* ── Touch targets at tablet ─────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .avint-back-btn {
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            box-sizing: border-box;
          }
          .avint-card {
            min-height: 44px;
          }
        }

        /* ── Global safety ───────────────────────────────────────────────── */
        .avint-card {
          box-sizing: border-box;
          min-width: 0;
        }
        .avint-card-body {
          min-width: 0;
        }
        .avint-logo-zone {
          overflow: hidden;
        }
      `}</style>

      <div className="avint-font min-h-screen bg-[#FAFAFA] text-[#111]">

        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-200">
          <div className="avint-page-wrap avint-header-inner">
            <button
              onClick={() => navigate('/agents')}
              className="avint-back-btn text-gray-400 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              ← Back to Agents
            </button>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="avint-h1 font-bold leading-tight tracking-tight text-[#0A0A0A]">
                Available Integrations
              </h1>
            </div>
            <p className="avint-subtitle text-gray-500 font-normal leading-relaxed m-0">
              Connect Ping Identity systems and manage target integrations
            </p>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white border-b border-gray-200">
          <div className="avint-page-wrap avint-toolbar-inner flex items-center justify-end">
            <span className="avint-toolbar-count text-gray-400 font-normal">
              {items.length} integration{items.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-9 h-9 border-[3px] border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="avint-page-wrap pt-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              Failed to load integrations: {error}
            </div>
          </div>
        )}

        {/* ── Grid ── */}
        {!loading && !error && (
          <div className="avint-page-wrap avint-grid-wrap">
            {items.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                <div className="text-5xl mb-4 opacity-40">🔌</div>
                <div>No integrations available.</div>
              </div>
            ) : (
              <div className="avint-grid">
                {items.map(item => {
                  const isHovered = hoveredId === item.id;
                  const accentKey = getAccentKey(item.value);
                  const accent    = CARD_ACCENT_COLORS[accentKey];

                  const cardStyle: React.CSSProperties = isHovered && accent ? {
                    borderColor: accent.border,
                    boxShadow: `0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 40px -8px ${accent.shadow}`,
                    transform: 'translateY(-3px)',
                  } : {};

                  const accentBarStyle: React.CSSProperties = accent
                    ? { background: accent.border }
                    : { background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' };

                  return (
                    <div
                      key={item.id}
                      className="avint-card bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer transition-all duration-[220ms] flex flex-col relative"
                      style={cardStyle}
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleSelect(item)}
                    >
                      {/* Accent bar */}
                      <div className="avint-accent-bar" style={accentBarStyle} />

                      {/* Logo zone */}
                      <div
                        className="avint-logo-zone flex items-center justify-center border-b border-gray-100 transition-colors duration-200"
                        style={{ background: isHovered && accent ? accent.headerBg : '#FAFAFA' }}
                      >
                        <div
                          className="avint-logo-box border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-200 p-4"
                          style={
                            isHovered && accent
                              ? { borderColor: accent.border, boxShadow: `0 4px 16px ${accent.shadow}`, background: accent.logoBg }
                              : { background: '#fff' }
                          }
                        >
                          {item.logo ? (
                            <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <FaPlug className="text-gray-300 text-3xl" />
                          )}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="avint-card-body flex-1 flex flex-col">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="avint-name font-semibold text-[#0A0A0A] tracking-tight leading-tight">
                              {item.name}
                            </span>
                            {/* {item.verified && (
                              <span className="avint-verified flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 font-semibold text-green-700 whitespace-nowrap flex-shrink-0">
                                <span className="avint-pulse w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                                Verified
                              </span>
                            )} */}
                          </div>
                          <p className="avint-desc text-gray-500 leading-relaxed font-normal m-0">
                            {item.description}
                          </p>
                        </div>

                        {/* Badges */}
                        {item.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-auto">
                            {item.badges.map((badge, i) => (
                              <span
                                key={i}
                                className="avint-badge inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap bg-gray-100 text-gray-600"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="avint-card-footer border-t border-gray-100 flex items-center justify-between">
                        <span className="avint-footer-status flex items-center gap-1.5 font-medium text-green-700">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isHovered && accent ? accent.border : '#22C55E' }}
                          />
                          Connected
                        </span>
                        <div
                          className="avint-arrow rounded-lg border border-gray-200 flex items-center justify-center text-[13px] transition-all duration-150"
                          style={
                            isHovered && accent
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
            )}
          </div>
        )}

      </div>
    </>
  );
};

export default AvailableIntegration;