import React, { useState } from "react";
import { FaInfoCircle, FaCog, FaServer } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTheme } from '../../state/ThemeContext';

/*
  Responsive strategy (desktop-only — mobile not targeted):
  ─────────────────────────────────────────────────────────
  768–1023px  : tablet / small laptop
  1024–1279px : laptop
  1280–1535px : standard desktop
  1536–1919px : large desktop / 1440p
  1920px      : REFERENCE — no change
  2560px+     : 2K / 4K scale-up
  3840px+     : 4K max
*/
const buildResponsiveStyles = (isDark: boolean) => `
  @keyframes blob {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(30px,-50px) scale(1.1); }
    66%      { transform: translate(-20px,20px) scale(0.9); }
  }
  @keyframes fadeIn {
    from { opacity:0; transform: translateY(8px); }
    to   { opacity:1; transform: translateY(0); }
  }

  .animate-blob { animation: blob 7s infinite; }
  .animation-delay-2000 { animation-delay: 2s; }
  .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }

  .admin-card {
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1),
                box-shadow 0.3s ease,
                border-color 0.3s ease;
  }
  .admin-card:hover {
    transform: scale(1.02) !important;
    box-shadow: ${isDark ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(0,0,0,0.12)'} !important;
  }
  .admin-card-target:hover  { border-color: ${isDark ? '#1d4ed8' : 'rgba(147,197,253,0.5)'} !important; }
  .admin-card-settings:hover { border-color: ${isDark ? '#7e22ce' : 'rgba(196,181,253,0.5)'} !important; }

  .admin-card .bottom-bar { transform: scaleX(0); transition: transform 0.5s ease; }
  .admin-card:hover .bottom-bar { transform: scaleX(1) !important; }

  .admin-card .icon-inner { transition: all 0.3s ease; }
  .admin-card:hover .icon-inner { transform: scale(1.1) rotate(3deg) !important; }

  .admin-card .hover-overlay { opacity: 0; transition: opacity 0.3s; }
  .admin-card:hover .hover-overlay { opacity: 1 !important; }

  .info-btn { transition: all 0.3s ease; }
  .info-btn:hover { transform: scale(1.1) !important; }

  /* ── Base shell ── */
  .asc-root * { box-sizing: border-box; }
  .asc-inner  { padding: 32px 40px; width: 100%; height: 100vh; box-sizing: border-box; background: ${isDark ? '#1a2234' : '#ffffff'}; }

  /* ── Tablet (768–1023px) ── */
  @media (min-width: 768px) and (max-width: 1023px) {
    .asc-inner      { padding: 20px 20px !important; height: auto !important; min-height: 100vh; }
    .asc-heading    { font-size: 1.5rem !important; }
    .asc-cards-wrap { gap: 20px !important; }
    .asc-card       { width: calc(50% - 10px) !important; height: 180px !important; }
    .asc-card-icon  { width: 48px !important; height: 48px !important; border-radius: 12px !important; margin-bottom: 10px !important; }
    .asc-card-icon svg { font-size: 18px !important; }
    .asc-card-title  { font-size: 16px !important; }
    .asc-card-sub    { font-size: 11px !important; }
    .asc-info-btn    { width: 26px !important; height: 26px !important; top: 10px !important; right: 10px !important; }
    .asc-header-mb   { margin-bottom: 24px !important; }
  }

  /* ── Laptop (1024–1279px) ── */
  @media (min-width: 1024px) and (max-width: 1279px) {
    .asc-inner      { padding: 24px 28px !important; }
    .asc-heading    { font-size: 1.75rem !important; }
    .asc-cards-wrap { gap: 24px !important; }
    .asc-card       { width: 280px !important; height: 200px !important; }
    .asc-header-mb  { margin-bottom: 30px !important; }
  }

  /* ── Standard desktop (1280–1535px) ── */
  @media (min-width: 1280px) and (max-width: 1535px) {
    .asc-inner   { padding: 28px 36px !important; }
    .asc-heading { font-size: 1.875rem !important; }
    .asc-card    { width: 300px !important; height: 208px !important; }
  }

  /* ── 1536–1919px (near-reference) ── */
  @media (min-width: 1536px) and (max-width: 1919px) {
    .asc-inner { padding: 30px 38px !important; }
    .asc-card  { width: 310px !important; }
  }

  /* ── 2K / 4K (2560px+) ── */
  @media (min-width: 2560px) {
    .asc-inner       { padding: 48px 60px !important; }
    .asc-heading     { font-size: 3rem !important; }
    .asc-header-mb   { margin-bottom: 56px !important; }
    .asc-cards-wrap  { gap: 44px !important; }
    .asc-card        { width: 420px !important; height: 300px !important; border-radius: 22px !important; }
    .asc-card-icon   { width: 84px !important; height: 84px !important; border-radius: 20px !important; margin-bottom: 22px !important; }
    .asc-card-icon svg { font-size: 32px !important; }
    .asc-card-title  { font-size: 26px !important; }
    .asc-card-sub    { font-size: 16px !important; }
    .asc-info-btn    { width: 42px !important; height: 42px !important; top: 20px !important; right: 20px !important; }
    .asc-bottom-bar  { height: 4px !important; }
  }

  /* ── 4K max (3840px+) ── */
  @media (min-width: 3840px) {
    .asc-inner       { padding: 64px 80px !important; }
    .asc-heading     { font-size: 4rem !important; }
    .asc-header-mb   { margin-bottom: 72px !important; }
    .asc-cards-wrap  { gap: 60px !important; }
    .asc-card        { width: 560px !important; height: 380px !important; border-radius: 28px !important; }
    .asc-card-icon   { width: 108px !important; height: 108px !important; border-radius: 26px !important; margin-bottom: 28px !important; }
    .asc-card-icon svg { font-size: 42px !important; }
    .asc-card-title  { font-size: 34px !important; }
    .asc-card-sub    { font-size: 20px !important; }
    .asc-info-btn    { width: 54px !important; height: 54px !important; top: 26px !important; right: 26px !important; }
    .asc-bottom-bar  { height: 5px !important; }
  }
`;

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const handleNavigate = (type: string): void => {
    if (type === "target") navigate("/admin/avatarsys");
    else if (type === "settings") navigate("/settings");
  };

  /* ─── Card base shared style ─── */
  const cardBase: React.CSSProperties = {
    width: '320px',
    height: '224px',
    background: isDark ? '#1a2234' : '#ffffff',
    border: isDark ? '1px solid #1e2d45' : '1px solid rgba(226,232,240,0.5)',
    borderRadius: '16px',
    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.06)',
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', cursor: 'pointer',
  };

  return (
    <div className="asc-root" style={{
      minHeight: '100vh',
      background: isDark
        ? '#0d1117'
        : 'linear-gradient(135deg, #f8fafc, rgba(241,245,249,0.2), rgba(243,244,246,0.2))',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{buildResponsiveStyles(isDark)}</style>

      {/* Decorative blobs — light mode only */}
      {!isDark && (
        <>
          <div style={{
            position: 'fixed', top: 0, left: '25%',
            width: '384px', height: '384px',
            background: '#dbeafe', borderRadius: '50%',
            mixBlendMode: 'multiply', filter: 'blur(64px)', opacity: 0.2, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'fixed', top: 0, right: '25%',
            width: '384px', height: '384px',
            background: '#ede9fe', borderRadius: '50%',
            mixBlendMode: 'multiply', filter: 'blur(64px)', opacity: 0.2, pointerEvents: 'none',
          }} />
        </>
      )}

      <div className="asc-inner" style={{ position: 'relative', zIndex: 10 }}>

        {/* ── Header ── */}
        <div className="asc-header-mb" style={{ paddingTop: '16px', marginBottom: '40px' }}>
          <h1
            className="asc-heading font-bold leading-tight tracking-tight mb-2"
            style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)',
              color: isDark ? '#f1f5f9' : '#1e293b',
            }}
          >
            Admin Control Center
          </h1>
        </div>

        {/* ── Cards row ── */}
        <div className="asc-cards-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>

          {/* ─── TARGET SYSTEM CARD ─── */}
          <div
            className="admin-card admin-card-target asc-card"
            style={cardBase}
            onClick={() => handleNavigate("target")}
          >
            {/* Hover overlay */}
            <div className="hover-overlay" style={{
              position: 'absolute', inset: 0,
              background: isDark
                ? 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(14,165,233,0.08))'
                : 'linear-gradient(135deg, rgba(239,246,255,0.5), rgba(240,249,255,0.5))',
              pointerEvents: 'none',
            }} />

            {/* Info button */}
            <button
              className="info-btn asc-info-btn"
              style={{
                position: 'absolute', top: '16px', right: '16px',
                width: '32px', height: '32px', borderRadius: '50%',
                background: isDark ? '#111827' : 'rgba(255,255,255,0.9)',
                border: isDark ? '1px solid #1e2d45' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveCard(activeCard === "target" ? null : "target");
              }}
            >
              <FaInfoCircle style={{
                color: '#60a5fa', fontSize: '14px',
                transform: activeCard === "target" ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.3s',
              }} />
            </button>

            {/* Card content */}
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px' }}>
              <div
                className="icon-inner asc-card-icon"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #3b82f6, #38bdf8)',
                  marginBottom: '16px',
                  boxShadow: '0 8px 20px rgba(59,130,246,0.35)',
                }}
              >
                <FaServer style={{ color: '#fff', fontSize: '24px' }} />
              </div>

              <div
                key={activeCard === "target" ? "info" : "normal"}
                className="animate-fadeIn"
                style={{ opacity: 0 }}
              >
                {activeCard === "target" ? (
                  <div>
                    <p className="asc-card-title" style={{
                      fontSize: '17px', fontWeight: 700,
                      color: isDark ? '#f1f5f9' : '#1e293b',
                      marginBottom: '8px',
                    }}>Target System</p>
                    <p className="asc-card-sub" style={{
                      fontSize: '13px',
                      color: isDark ? '#94a3b8' : '#64748b',
                      lineHeight: 1.6, margin: 0,
                    }}>
                      Create, configure, and manage your target systems securely from here.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="asc-card-title" style={{
                      fontSize: '20px', fontWeight: 700,
                      color: isDark ? '#f1f5f9' : '#1e293b',
                      margin: '0 0 6px',
                    }}>Target System</p>
                    <p className="asc-card-sub" style={{
                      fontSize: '13px',
                      color: isDark ? '#64748b' : '#94a3b8',
                      margin: 0,
                    }}>Manage your systems</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="bottom-bar asc-bottom-bar" style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
              background: 'linear-gradient(90deg, #3b82f6, #38bdf8)',
            }} />
          </div>

          {/* ─── SETTINGS CARD ─── */}
          <div
            className="admin-card admin-card-settings asc-card"
            style={cardBase}
          >
            {/* Hover overlay */}
            <div className="hover-overlay" style={{
              position: 'absolute', inset: 0,
              background: isDark
                ? 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.08))'
                : 'linear-gradient(135deg, rgba(245,243,255,0.5), rgba(253,242,248,0.5))',
              pointerEvents: 'none',
            }} />

            {/* Info button */}
            <button
              className="info-btn asc-info-btn"
              style={{
                position: 'absolute', top: '16px', right: '16px',
                width: '32px', height: '32px', borderRadius: '50%',
                background: isDark ? '#111827' : 'rgba(255,255,255,0.9)',
                border: isDark ? '1px solid #1e2d45' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveCard(activeCard === "settings" ? null : "settings");
              }}
            >
              <FaInfoCircle style={{
                color: '#c084fc', fontSize: '14px',
                transform: activeCard === "settings" ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.3s',
              }} />
            </button>

            {/* Card content */}
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px' }}>
              <div
                className="icon-inner asc-card-icon"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  marginBottom: '16px',
                  boxShadow: '0 8px 20px rgba(168,85,247,0.35)',
                }}
              >
                <FaCog style={{ color: '#fff', fontSize: '24px' }} />
              </div>

              <div
                key={activeCard === "settings" ? "info" : "normal"}
                className="animate-fadeIn"
                style={{ opacity: 0 }}
              >
                {activeCard === "settings" ? (
                  <div>
                    <p className="asc-card-title" style={{
                      fontSize: '17px', fontWeight: 700,
                      color: isDark ? '#f1f5f9' : '#1e293b',
                      marginBottom: '8px',
                    }}>Settings</p>
                    <p className="asc-card-sub" style={{
                      fontSize: '13px',
                      color: isDark ? '#94a3b8' : '#64748b',
                      lineHeight: 1.6, margin: 0,
                    }}>
                      Configure system settings and manage configurations.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="asc-card-title" style={{
                      fontSize: '20px', fontWeight: 700,
                      color: isDark ? '#f1f5f9' : '#1e293b',
                      margin: '0 0 6px',
                    }}>Settings</p>
                    <p className="asc-card-sub" style={{
                      fontSize: '13px',
                      color: isDark ? '#64748b' : '#94a3b8',
                      margin: 0,
                    }}>System configuration</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="bottom-bar asc-bottom-bar" style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
              background: 'linear-gradient(90deg, #a855f7, #ec4899)',
            }} />
          </div>

        </div>{/* end cards wrap */}
      </div>
    </div>
  );
};

export default AdminSidebar;