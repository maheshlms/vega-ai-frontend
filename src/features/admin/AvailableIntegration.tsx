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
      `}</style>

      <div className="avint-font min-h-screen bg-[#FAFAFA] text-[#111]">

        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-200 px-12 max-md:px-5">
          <div className="max-w-[1400px] mx-auto pt-10 pb-8">
            <button
              onClick={() => navigate('/agents')}
              className="text-[13px] text-gray-400 hover:text-gray-700 mb-4 flex items-center gap-1.5 transition-colors"
            >
              ← Back to Agents
            </button>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#0A0A0A] max-md:text-3xl">
                Available Integrations
              </h1>
            </div>
            <p className="text-[15px] text-gray-500 font-normal max-w-[480px] leading-relaxed m-0">
              Connect Ping Identity systems and manage target integrations
            </p>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white border-b border-gray-200 px-12 max-md:px-5">
          <div className="max-w-[1400px] mx-auto flex items-center justify-end h-12">
            <span className="text-[13px] text-gray-400 font-normal">
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
          <div className="max-w-[1400px] mx-auto px-12 pt-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              Failed to load integrations: {error}
            </div>
          </div>
        )}

        {/* ── Grid ── */}
        {!loading && !error && (
          <div className="max-w-[1400px] mx-auto px-12 pt-10 pb-20 max-md:px-5 max-md:pt-6 max-md:pb-16">
            {items.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                <div className="text-5xl mb-4 opacity-40">🔌</div>
                <div>No integrations available.</div>
              </div>
            ) : (
              <div
                className="grid gap-5 max-md:grid-cols-1"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
              >
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
                        className="flex items-center justify-center border-b border-gray-100 min-h-[160px] px-7 py-8 transition-colors duration-200"
                        style={{ background: isHovered && accent ? accent.headerBg : '#FAFAFA' }}
                      >
                        <div
                          className="w-[140px] h-[100px] rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-200 p-4"
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
                      <div className="px-6 pt-5 pb-6 flex-1 flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[15px] font-semibold text-[#0A0A0A] tracking-tight leading-tight">
                              {item.name}
                            </span>
                            {item.verified && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[10.5px] font-semibold text-green-700 whitespace-nowrap flex-shrink-0">
                                <span className="avint-pulse w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-[12.5px] text-gray-500 leading-relaxed font-normal m-0">
                            {item.description}
                          </p>
                        </div>

                        {/* Badges */}
                        {item.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-auto">
                            {item.badges.map((badge, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap bg-gray-100 text-gray-600"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-green-700">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isHovered && accent ? accent.border : '#22C55E' }}
                          />
                          Connected
                        </span>
                        <div
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-[13px] transition-all duration-150"
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
