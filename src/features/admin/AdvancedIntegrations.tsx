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
      className="integration-card bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-xl hover:border-blue-400 hover:scale-105 transition-all cursor-pointer"
    >
      {/* Logo */}
      <div className="card-logo-wrapper flex items-center justify-center">
        <span className="card-logo-text font-bold text-gray-900">
          {item.logo}
        </span>
      </div>

      {/* Title */}
      <h3 className="card-title text-left font-semibold text-gray-900">
        {item.title}
      </h3>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {item.verified && (
          <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded">
            <FaCheckCircle className="verified-icon text-green-600" />
            <span className="badge-text text-green-600 font-medium">Verified</span>
          </div>
        )}
        {item.badges.map((badge, index) => (
          <span
            key={index}
            className={`badge-pill rounded font-medium ${getBadgeColors(badge.color)}`}
          >
            {badge.text}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/*
        Responsive Strategy:
        ─────────────────────────────────────────────────────
        Baseline  : 1920×1080  → exact current UI (no 2xl classes needed)
        Laptop    : 1024–1919px → same proportions, smaller spacing/text
        Large/4K  : >1920px    → scales up via clamp() & 2xl breakpoints
        Tablet    : 768–1023px → 2-col grid, condensed padding
        ─────────────────────────────────────────────────────
        We use a <style> block with CSS custom properties anchored at 1920px,
        plus media queries for below-1920 (laptop/tablet) and above-1920 (large).
        All Tailwind layout classes remain; only sizing tokens change.
      */}
      <style>{`
        /* ── TOKEN DEFAULTS: 1920×1080 baseline ─────────────────── */
        :root {
          --page-px:        24px;
          --page-py:        24px;
          --header-px:      24px;
          --header-py:      24px;
          --section-mb:     40px;
          --section-gap:    20px;
          --card-p:         20px;
          --card-logo-h:    48px;
          --card-logo-fs:   18px;
          --card-title-fs:  14px;
          --card-title-mb:  8px;
          --badge-px:       10px;
          --badge-py:       2px;
          --badge-fs:       12px;
          --verified-fs:    12px;
          --verified-icon:  12px;
          --h1-fs:          24px;
          --h1-icon:        14px;
          --subtitle-fs:    14px;
          --section-h2-fs:  16px;
          --section-h2-mb:  16px;
          --grid-cols:      3;     /* lg default */
          --card-min-w:     180px;
          --card-max-w:     240px;
        }

        /* ── LARGE DESKTOP / 4K : >1920px ───────────────────────── */
        @media (min-width: 1921px) {
          :root {
            --page-px:        80px;
            --page-py:        48px;
            --header-px:      80px;
            --header-py:      48px;
            --section-mb:     64px;
            --section-gap:    32px;
            --card-p:         32px;
            --card-logo-h:    80px;
            --card-logo-fs:   32px;
            --card-title-fs:  20px;
            --card-title-mb:  10px;
            --badge-px:       12px;
            --badge-py:       4px;
            --badge-fs:       16px;
            --verified-fs:    16px;
            --verified-icon:  16px;
            --h1-fs:          48px;
            --h1-icon:        20px;
            --subtitle-fs:    20px;
            --section-h2-fs:  24px;
            --section-h2-mb:  24px;
            --grid-cols:      5;
            --card-min-w:     260px;
            --card-max-w:     360px;
          }
        }

        /* ── LAPTOP : 1280–1919px ────────────────────────────────── */
        @media (min-width: 1280px) and (max-width: 1919px) {
          :root {
            --page-px:        24px;
            --page-py:        20px;
            --header-px:      24px;
            --header-py:      20px;
            --section-mb:     32px;
            --section-gap:    16px;
            --card-p:         16px;
            --card-logo-h:    44px;
            --card-logo-fs:   16px;
            --card-title-fs:  13px;
            --card-title-mb:  6px;
            --badge-px:       8px;
            --badge-py:       2px;
            --badge-fs:       11px;
            --verified-fs:    11px;
            --verified-icon:  11px;
            --h1-fs:          22px;
            --h1-icon:        13px;
            --subtitle-fs:    13px;
            --section-h2-fs:  14px;
            --section-h2-mb:  14px;
            --grid-cols:      3;
            --card-min-w:     160px;
            --card-max-w:     220px;
          }
        }

        /* ── SMALL LAPTOP / LARGE TABLET : 1024–1279px ──────────── */
        @media (min-width: 1024px) and (max-width: 1279px) {
          :root {
            --page-px:        20px;
            --page-py:        18px;
            --header-px:      20px;
            --header-py:      18px;
            --section-mb:     28px;
            --section-gap:    14px;
            --card-p:         14px;
            --card-logo-h:    40px;
            --card-logo-fs:   15px;
            --card-title-fs:  12px;
            --card-title-mb:  6px;
            --badge-px:       8px;
            --badge-py:       2px;
            --badge-fs:       10px;
            --verified-fs:    10px;
            --verified-icon:  10px;
            --h1-fs:          20px;
            --h1-icon:        12px;
            --subtitle-fs:    12px;
            --section-h2-fs:  13px;
            --section-h2-mb:  12px;
            --grid-cols:      3;
            --card-min-w:     150px;
            --card-max-w:     200px;
          }
        }

        /* ── TABLET : 768–1023px ─────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          :root {
            --page-px:        16px;
            --page-py:        16px;
            --header-px:      16px;
            --header-py:      16px;
            --section-mb:     24px;
            --section-gap:    12px;
            --card-p:         14px;
            --card-logo-h:    40px;
            --card-logo-fs:   14px;
            --card-title-fs:  12px;
            --card-title-mb:  6px;
            --badge-px:       8px;
            --badge-py:       1px;
            --badge-fs:       10px;
            --verified-fs:    10px;
            --verified-icon:  10px;
            --h1-fs:          18px;
            --h1-icon:        12px;
            --subtitle-fs:    12px;
            --section-h2-fs:  13px;
            --section-h2-mb:  12px;
            --grid-cols:      2;
            --card-min-w:     140px;
            --card-max-w:     100%;
          }
        }

        /* ── QHD : 2560–3839px ───────────────────────────────────── */
        @media (min-width: 2560px) and (max-width: 3839px) {
          :root {
            --page-px:        96px;
            --page-py:        64px;
            --header-px:      96px;
            --header-py:      64px;
            --section-mb:     80px;
            --section-gap:    40px;
            --card-p:         40px;
            --card-logo-h:    100px;
            --card-logo-fs:   40px;
            --card-title-fs:  24px;
            --card-title-mb:  14px;
            --badge-px:       16px;
            --badge-py:       6px;
            --badge-fs:       18px;
            --verified-fs:    18px;
            --verified-icon:  18px;
            --h1-fs:          60px;
            --h1-icon:        26px;
            --subtitle-fs:    24px;
            --section-h2-fs:  30px;
            --section-h2-mb:  30px;
            --grid-cols:      5;
            --card-min-w:     300px;
            --card-max-w:     420px;
          }
        }

        /* ── 4K+ : ≥3840px ───────────────────────────────────────── */
        @media (min-width: 3840px) {
          :root {
            --page-px:        128px;
            --page-py:        80px;
            --header-px:      128px;
            --header-py:      80px;
            --section-mb:     100px;
            --section-gap:    52px;
            --card-p:         52px;
            --card-logo-h:    130px;
            --card-logo-fs:   52px;
            --card-title-fs:  30px;
            --card-title-mb:  18px;
            --badge-px:       20px;
            --badge-py:       8px;
            --badge-fs:       22px;
            --verified-fs:    22px;
            --verified-icon:  22px;
            --h1-fs:          80px;
            --h1-icon:        34px;
            --subtitle-fs:    30px;
            --section-h2-fs:  38px;
            --section-h2-mb:  38px;
            --grid-cols:      6;
            --card-min-w:     380px;
            --card-max-w:     540px;
          }
        }

        /* ── COMPONENT STYLES ────────────────────────────────────── */
        .ai-page-header {
          border-bottom: 1px solid #e5e7eb;
          background: #fff;
          padding: var(--header-py) var(--header-px);
          box-sizing: border-box;
        }

        .ai-page-content {
          padding: var(--page-py) var(--page-px);
          box-sizing: border-box;
        }

        .ai-section {
          margin-bottom: var(--section-mb);
        }

        .ai-section-title {
          font-size: var(--section-h2-fs);
          font-weight: 600;
          color: #111827;
          margin-bottom: var(--section-h2-mb);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          line-height: 1.3;
        }

        .ai-grid {
          display: grid;
          grid-template-columns: repeat(var(--grid-cols), minmax(0, 1fr));
          gap: var(--section-gap);
        }

        /* Single card always takes only as many columns as it needs */
        .ai-grid-auto {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(var(--card-min-w), var(--card-max-w)));
          gap: var(--section-gap);
        }

        .integration-card {
          padding: var(--card-p);
          box-sizing: border-box;
          min-width: 0;
        }

        .card-logo-wrapper {
          height: var(--card-logo-h);
          margin-bottom: 16px;
          min-width: 0;
        }

        .card-logo-text {
          font-size: var(--card-logo-fs);
          overflow-wrap: break-word;
          word-break: break-word;
          text-align: center;
          line-height: 1.2;
        }

        .card-title {
          font-size: var(--card-title-fs);
          margin-bottom: var(--card-title-mb);
          line-height: 1.4;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .badge-pill {
          padding: var(--badge-py) var(--badge-px);
          font-size: var(--badge-fs);
          line-height: 1.4;
          white-space: nowrap;
        }

        .badge-text {
          font-size: var(--verified-fs);
          line-height: 1.4;
        }

        .verified-icon {
          font-size: var(--verified-icon) !important;
          flex-shrink: 0;
        }

        .h1-text {
          font-size: var(--h1-fs);
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        .h1-icon {
          font-size: var(--h1-icon);
          color: #9ca3af;
          flex-shrink: 0;
        }

        .subtitle-text {
          font-size: var(--subtitle-fs);
          color: #6b7280;
          line-height: 1.5;
        }

        /* ── Touch targets at tablet ─────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .integration-card {
            min-height: 44px;
          }
        }

        /* ── Global safety ───────────────────────────────────────── */
        .min-h-screen {
          box-sizing: border-box;
        }
      `}</style>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="ai-page-header">
          <div className="flex items-center gap-2 mb-1">
            <FaStar className="h1-icon" />
            <h1 className="h1-text">Advanced Integrations</h1>
          </div>
          <p className="subtitle-text ml-6">
            Fully autonomous AI agents with advanced capabilities and enterprise-grade integrations
          </p>
        </div>

        {/* Content */}
        <div className="ai-page-content">

          {/* OIDC Provider */}
          <div className="ai-section">
            <h2 className="ai-section-title">OIDC Provider</h2>
            <div className="ai-grid-auto">
              <IntegrationCard item={integrations.pingfederate} />
            </div>
          </div>

          {/* Identity Datastores */}
          <div className="ai-section">
            <h2 className="ai-section-title">Identity Datastores / Directories</h2>
            <div className="ai-grid-auto">
              <IntegrationCard item={integrations.pingdirectory} />
            </div>
          </div>

          {/* Cloud Identity */}
          <div className="ai-section">
            <h2 className="ai-section-title">Cloud Identity</h2>
            <div className="ai-grid-auto">
              <IntegrationCard item={integrations.pingone} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdvancedIntegrations;