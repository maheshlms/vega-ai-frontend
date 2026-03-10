import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface IntegrationItem {
  id: string;
  value: string;
  name: string;
  description: string;
  logo: string;
  verified: boolean;
  status: string;
  badges: string[];
  auth_methods: string[];
}

const STATIC_INTEGRATIONS: IntegrationItem[] = [
  { id: '1',  value: 'pingfederate',    name: 'Ping Federate',         description: 'Enterprise federation & SSO server',         logo: '/logos/pingfederate.png',    verified: true, status: 'connected',   badges: ['SSO', 'Enterprise'],  auth_methods: ['basic_auth', 'bearer_token'] },
  { id: '2',  value: 'okta',            name: 'Okta',                  description: 'Identity management & SSO platform',         logo: '/logos/okta.png',            verified: true, status: 'Coming Soon', badges: ['Cloud', 'Auth'],       auth_methods: ['oauth2'] },
  { id: '3',  value: 'keycloak',        name: 'Keycloak',              description: 'Open source identity & access management',   logo: '/logos/keycloak.png',        verified: true, status: 'Coming Soon', badges: ['IAM', 'Open Source'],  auth_methods: ['oauth2', 'bearer_token'] },
  { id: '4',  value: 'pingdirectory',   name: 'Ping Directory',        description: 'High-performance directory server',          logo: '/logos/pingdirectory.png',   verified: true, status: 'connected',   badges: ['LDAP', 'Directory'],   auth_methods: ['basic_auth'] },
  { id: '5',  value: 'activedirectory', name: 'Active Directory',      description: 'Microsoft domain & identity services',       logo: '/logos/activedirectory.png', verified: true, status: 'Coming Soon', badges: ['Domain', 'Microsoft'], auth_methods: ['basic_auth'] },
  { id: '6',  value: 'aws',             name: 'AWS Directory',         description: 'Amazon Web Services directory services',     logo: '/logos/aws.png',             verified: true, status: 'Coming Soon', badges: ['AWS', 'Cloud'],        auth_methods: ['bearer_token'] },
  { id: '7',  value: 'pingone',         name: 'Ping One',              description: 'Cloud identity-as-a-service platform',      logo: '/logos/pingone.png',         verified: true, status: 'connected',   badges: ['SaaS', 'IDaaS'],       auth_methods: ['oauth2'] },
  { id: '8',  value: 'azure',           name: 'Azure AD',              description: 'Microsoft cloud identity & access',         logo: '/logos/azure.png',           verified: true, status: 'Coming Soon', badges: ['Cloud', 'Microsoft'],  auth_methods: ['oauth2'] },
  { id: '9',  value: 'googlecloud',     name: 'Google Cloud Identity', description: 'Google cloud identity platform',            logo: '/logos/googlecloud.png',     verified: true, status: 'Coming Soon', badges: ['IDaaS', 'Google'],     auth_methods: ['oauth2'] },
  { id: '10', value: 'britive',         name: 'Britive',               description: 'Cloud privilege access management',         logo: '/logos/britive.png',         verified: true, status: 'Coming Soon', badges: ['Cloud', 'Auth'],       auth_methods: ['oauth2', 'api_key'] },
  { id: '11', value: 'strivacity',      name: 'Strivacity',            description: 'Customer identity platform',                logo: '/logos/strivacity.png',      verified: true, status: 'Coming Soon', badges: ['Cloud', 'Auth'],       auth_methods: ['oauth2'] },
  { id: '12', value: 'aembit',          name: 'Aembit',                description: 'Workload identity & access platform',       logo: '/logos/aembit.png',          verified: true, status: 'Coming Soon', badges: ['Cloud', 'Identity'],   auth_methods: ['oauth2', 'bearer_token'] },
];

const CARD_ACCENT_COLORS: Record<string, { border: string; shadow: string; logoBg: string; headerBg: string }> = {
  pingfederate:    { border: '#E9472A', shadow: 'rgba(233,71,42,0.15)',   logoBg: '#FFF5F3', headerBg: '#FFF8F7' },
  okta:            { border: '#007DC1', shadow: 'rgba(0,125,193,0.15)',   logoBg: '#F0F8FF', headerBg: '#F5FBFF' },
  keycloak:        { border: '#4D9BF5', shadow: 'rgba(77,155,245,0.15)',  logoBg: '#EFF6FF', headerBg: '#F5F9FF' },
  pingdirectory:   { border: '#0A85C2', shadow: 'rgba(10,133,194,0.15)',  logoBg: '#F0F8FF', headerBg: '#F5FBFF' },
  activedirectory: { border: '#00A4EF', shadow: 'rgba(0,164,239,0.15)',   logoBg: '#F0FAFF', headerBg: '#F5FCFF' },
  aws:             { border: '#FF9900', shadow: 'rgba(255,153,0,0.15)',   logoBg: '#FFFBF0', headerBg: '#FFFDF5' },
  pingone:         { border: '#7C3AED', shadow: 'rgba(124,58,237,0.15)',  logoBg: '#FAF5FF', headerBg: '#FCF9FF' },
  azure:           { border: '#0078D4', shadow: 'rgba(0,120,212,0.15)',   logoBg: '#F0F6FF', headerBg: '#F5F9FF' },
  googlecloud:     { border: '#4285F4', shadow: 'rgba(66,133,244,0.15)',  logoBg: '#EFF5FF', headerBg: '#F5F9FF' },
  britive:         { border: '#6366F1', shadow: 'rgba(99,102,241,0.15)',  logoBg: '#EEF2FF', headerBg: '#F3F5FF' },
  strivacity:      { border: '#10B981', shadow: 'rgba(16,185,129,0.15)',  logoBg: '#F0FDF4', headerBg: '#F5FDF9' },
  aembit:          { border: '#F59E0B', shadow: 'rgba(245,158,11,0.15)',  logoBg: '#FFFBEB', headerBg: '#FFFDF5' },
};

const BADGE_PALETTE: Record<string, { bg: string; text: string; dot: string }> = {
  'SSO':         { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
  'Enterprise':  { bg: '#F5F3FF', text: '#6D28D9', dot: '#7C3AED' },
  'LDAP':        { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  'Directory':   { bg: '#F9FAFB', text: '#374151', dot: '#9CA3AF' },
  'Domain':      { bg: '#F9FAFB', text: '#374151', dot: '#9CA3AF' },
  'SaaS':        { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  'IDaaS':       { bg: '#F5F3FF', text: '#6D28D9', dot: '#7C3AED' },
  'Cloud':       { bg: '#F0F9FF', text: '#0369A1', dot: '#0EA5E9' },
  'Auth':        { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
  'IAM':         { bg: '#FAF5FF', text: '#7C3AED', dot: '#A855F7' },
  'Open Source': { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  'Google':      { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
  'AWS':         { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  'Microsoft':   { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  'Identity':    { bg: '#FDF2F8', text: '#9D174D', dot: '#EC4899' },
};

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', 'SSO', 'Cloud', 'IAM', 'Enterprise', 'LDAP'];

  const filtered = filter === 'All'
    ? STATIC_INTEGRATIONS
    : STATIC_INTEGRATIONS.filter(i => i.badges.includes(filter));

  return (
    <>
      {/* Minimal CSS — only for things Tailwind cannot express */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        .int-font { font-family: 'DM Sans', sans-serif; }

        /* Card rise animation */
        @keyframes int-rise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .int-card { animation: int-rise 0.4s ease both; }
        .int-card:nth-child(1)  { animation-delay: 0.03s; }
        .int-card:nth-child(2)  { animation-delay: 0.06s; }
        .int-card:nth-child(3)  { animation-delay: 0.09s; }
        .int-card:nth-child(4)  { animation-delay: 0.12s; }
        .int-card:nth-child(5)  { animation-delay: 0.15s; }
        .int-card:nth-child(6)  { animation-delay: 0.18s; }
        .int-card:nth-child(7)  { animation-delay: 0.21s; }
        .int-card:nth-child(8)  { animation-delay: 0.24s; }
        .int-card:nth-child(9)  { animation-delay: 0.27s; }
        .int-card:nth-child(10) { animation-delay: 0.30s; }
        .int-card:nth-child(11) { animation-delay: 0.33s; }
        .int-card:nth-child(12) { animation-delay: 0.36s; }

        /* Accent bar: scaleX on hover — needs transform-origin: left */
        .int-accent-bar {
          height: 3px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        .int-card:hover .int-accent-bar { transform: scaleX(1); }

        /* Pulsing verified dot */
        @keyframes int-pulse-green {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .int-pulse { animation: int-pulse-green 2s ease infinite; }
      `}</style>

      <div className="int-font min-h-screen bg-[#FAFAFA] text-[#111]">

        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-200 px-12 max-md:px-5">
          <div className="max-w-[1400px] mx-auto pt-10 pb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#0A0A0A] max-md:text-3xl">
                Integrations Marketplace
              </h1>
              <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-gray-400 bg-gray-100 px-2 py-0.5 rounded self-center">
                Future Release
              </span>
            </div>
            <p className="text-[15px] text-gray-500 font-normal max-w-[480px] leading-relaxed m-0">
              Connect your IAM systems and manage integrations across your identity infrastructure.
            </p>
          </div>
        </div>

        {/* ── Sticky Toolbar ── */}
        <div className="bg-white border-b border-gray-200 px-12 sticky top-0 z-20 max-md:px-5">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6 h-14">
            {/* Filter buttons */}
            <div className="flex items-center gap-0.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-md border-none text-[13px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap font-[inherit]
                    ${filter === cat
                      ? 'bg-[#111] text-white'
                      : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-[#111]'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span className="text-[13px] text-gray-400 whitespace-nowrap font-normal">
              {filtered.length} integration{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="max-w-[1400px] mx-auto px-12 pt-10 pb-20 max-md:px-5 max-md:pt-6 max-md:pb-16">
          <div className="grid gap-5 max-md:grid-cols-1"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
          >
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-400 text-sm">
                <div className="text-5xl mb-4 opacity-40">🔌</div>
                <div>No integrations match this filter.</div>
              </div>
            ) : filtered.map(item => {
              const isHovered = hoveredId === item.id;
              const accent = CARD_ACCENT_COLORS[item.value];

              const cardStyle = isHovered && accent ? {
                borderColor: accent.border,
                boxShadow: `0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 40px -8px ${accent.shadow}`,
                transform: 'translateY(-3px)',
              } : {};

              const accentBarStyle: React.CSSProperties = isHovered && accent
                ? { background: accent.border }
                : { background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' };

              return (
                <div
                  key={item.id}
                  className="int-card bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer transition-all duration-[220ms] flex flex-col relative"
                  style={cardStyle}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Accent bar */}
                  <div className="int-accent-bar" style={accentBarStyle} />

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
                      <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-6 pt-5 pb-6 flex-1 flex flex-col gap-3">
                    {/* Name row */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[15px] font-semibold text-[#0A0A0A] tracking-tight leading-tight">
                          {item.name}
                        </span>
                        {item.verified && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[10.5px] font-semibold text-green-700 whitespace-nowrap flex-shrink-0">
                            <span className="int-pulse w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                            Certified
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-gray-500 leading-relaxed font-normal m-0">
                        {item.description}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {item.badges.map((badge, i) => {
                        const p = BADGE_PALETTE[badge] || { bg: '#F9FAFB', text: '#374151', dot: '#9CA3AF' };
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap"
                            style={{ background: p.bg, color: p.text }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.dot }} />
                            {badge}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
                    {item.status === 'connected' ? (
                      <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-green-700">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: isHovered && accent ? accent.border : '#22C55E' }}
                        />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        Coming Soon
                      </span>
                    )}

                    {/* Arrow button */}
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
        </div>

      </div>
    </>
  );
};

export default IntegrationsPage;