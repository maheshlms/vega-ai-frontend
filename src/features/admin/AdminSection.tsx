import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoSun } from "react-icons/go";
import { MdOutlineDarkMode } from "react-icons/md";
import { auth } from '../../utils/auth';
import { useTheme } from '../../state/ThemeContext';

/*
  Responsive strategy (desktop-only — mobile not targeted):
  ─────────────────────────────────────────────────────────
  768–1023px  : tablet / small laptop  — compact nav, tighter body
  1024–1279px : laptop                 — 960px body max-width
  1280–1535px : standard desktop       — slight reduction
  1536–1919px : large desktop / 1440p  — near-reference
  1920px      : REFERENCE              — no change
  2560px+     : 2K / 4K               — scale up fonts, layout
  3840px+     : 4K max                 — full scale
*/
const responsiveStyles = (isDark: boolean) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap');

  /* ── Hover states ── */
  .as-card-users:hover {
    border-color: ${isDark ? '#3730a3' : '#d4d4e4'} !important;
    transform: translateY(-3px);
    box-shadow: ${isDark ? '0 12px 40px rgba(124,58,237,0.2)' : '0 12px 40px rgba(100,80,180,0.1)'} !important;
  }
  .as-card-tokens:hover {
    border-color: ${isDark ? '#065f46' : '#d4d4e4'} !important;
    transform: translateY(-3px);
    box-shadow: ${isDark ? '0 12px 40px rgba(16,185,129,0.2)' : '0 12px 40px rgba(100,80,180,0.1)'} !important;
  }
  .as-theme-btn:hover { background: ${isDark ? '#1e2d45' : '#ebebf0'} !important; transform: scale(1.08); }
  .as-logout-btn:hover { background: ${isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'} !important; }

  @keyframes asFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .as-anim   { animation: asFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
  .as-anim-1 { animation: asFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.08s both; }
  .as-anim-2 { animation: asFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.16s both; }
  .as-anim-3 { animation: asFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.24s both; }

  /* ── Base responsive resets ── */
  .as-root   { box-sizing: border-box; }
  .as-root * { box-sizing: border-box; }

  /* ── Tablet (768–1023px) ── */
  @media (min-width: 768px) and (max-width: 1023px) {
    .as-nav        { padding: 0 20px !important; height: 56px !important; }
    .as-nav-title  { font-size: 13px !important; }
    .as-user-chip  { padding: 4px 10px 4px 5px !important; }
    .as-user-name  { font-size: 12px !important; }
    .as-body       { padding: 28px 20px !important; max-width: 100% !important; }
    .as-heading    { font-size: 22px !important; }
    .as-sub        { font-size: 13px !important; }
    .as-label-txt  { font-size: 10px !important; }
    .as-cards      { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
    .as-card       { padding: 20px !important; }
    .as-card-icon  { width: 38px !important; height: 38px !important; font-size: 16px !important; margin-bottom: 14px !important; }
    .as-card-h2    { font-size: 14px !important; }
    .as-card-p     { font-size: 12px !important; margin-bottom: 16px !important; }
    .as-logout-box { padding: 18px 20px !important; flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
    .as-logout-box-btn { align-self: flex-end !important; }
    .as-nav-logo   { width: 28px !important; height: 28px !important; font-size: 13px !important; border-radius: 7px !important; }
    .as-logout-icon-box { width: 38px !important; height: 38px !important; font-size: 16px !important; }
    .as-theme-btn-el { width: 30px !important; height: 30px !important; }
    .as-logout-nav-btn { padding: 6px 10px !important; font-size: 12px !important; }
  }

  /* ── Laptop (1024–1279px) ── */
  @media (min-width: 1024px) and (max-width: 1279px) {
    .as-nav        { padding: 0 28px !important; }
    .as-body       { padding: 36px 28px !important; max-width: 880px !important; }
    .as-heading    { font-size: 26px !important; }
    .as-cards      { gap: 16px !important; }
    .as-card       { padding: 22px !important; }
    .as-logout-box { padding: 20px 24px !important; }
  }

  /* ── Standard desktop (1280–1535px) ── */
  @media (min-width: 1280px) and (max-width: 1535px) {
    .as-body { padding: 40px 32px !important; max-width: 940px !important; }
    .as-cards { gap: 18px !important; }
  }

  /* ── 1536–1919px (near-reference) ── */
  @media (min-width: 1536px) and (max-width: 1919px) {
    .as-body { padding: 44px 36px !important; }
  }

  /* ── 2K / 4K (2560px+) ── */
  @media (min-width: 2560px) {
    .as-nav         { height: 80px !important; padding: 0 60px !important; }
    .as-nav-logo    { width: 44px !important; height: 44px !important; font-size: 19px !important; border-radius: 12px !important; }
    .as-nav-title   { font-size: 19px !important; }
    .as-user-avatar { width: 34px !important; height: 34px !important; font-size: 14px !important; }
    .as-user-name   { font-size: 16px !important; }
    .as-user-chip   { padding: 7px 18px 7px 8px !important; gap: 12px !important; }
    .as-theme-btn-el { width: 44px !important; height: 44px !important; border-radius: 12px !important; }
    .as-logout-nav-btn { padding: 10px 20px !important; font-size: 16px !important; border-radius: 12px !important; }
    .as-body        { padding: 64px 56px !important; max-width: 1300px !important; }
    .as-heading     { font-size: 40px !important; margin-bottom: 8px !important; }
    .as-sub         { font-size: 17px !important; }
    .as-label-txt   { font-size: 13px !important; margin-bottom: 22px !important; }
    .as-cards       { gap: 28px !important; margin-bottom: 56px !important; }
    .as-card        { padding: 38px !important; border-radius: 24px !important; }
    .as-card-icon   { width: 64px !important; height: 64px !important; font-size: 26px !important; border-radius: 17px !important; margin-bottom: 26px !important; }
    .as-card-h2     { font-size: 21px !important; margin-bottom: 10px !important; }
    .as-card-p      { font-size: 16px !important; margin-bottom: 30px !important; }
    .as-card-btn    { font-size: 14px !important; padding: 12px 22px !important; border-radius: 12px !important; }
    .as-logout-box  { padding: 32px 38px !important; border-radius: 24px !important; }
    .as-logout-icon-box { width: 58px !important; height: 58px !important; font-size: 24px !important; border-radius: 16px !important; }
    .as-logout-h3   { font-size: 18px !important; }
    .as-logout-p    { font-size: 16px !important; }
    .as-logout-box-btn { padding: 14px 28px !important; font-size: 16px !important; border-radius: 14px !important; }
  }

  /* ── 4K max (3840px+) ── */
  @media (min-width: 3840px) {
    .as-nav       { height: 100px !important; padding: 0 80px !important; }
    .as-nav-logo  { width: 56px !important; height: 56px !important; font-size: 24px !important; }
    .as-nav-title { font-size: 24px !important; }
    .as-body      { padding: 80px 72px !important; max-width: 1700px !important; }
    .as-heading   { font-size: 54px !important; }
    .as-sub       { font-size: 20px !important; }
    .as-cards     { gap: 36px !important; }
    .as-card      { padding: 52px !important; border-radius: 28px !important; }
    .as-card-icon { width: 80px !important; height: 80px !important; font-size: 32px !important; margin-bottom: 32px !important; }
    .as-card-h2   { font-size: 26px !important; }
    .as-card-p    { font-size: 18px !important; }
    .as-logout-box { padding: 44px 52px !important; border-radius: 28px !important; }
    .as-logout-icon-box { width: 72px !important; height: 72px !important; font-size: 30px !important; }
    .as-logout-h3 { font-size: 22px !important; }
    .as-logout-p  { font-size: 18px !important; }
  }
`;

interface AdminUser {
  name?: string;
  email?: string;
}

const getSession = (): AdminUser | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);
    return null;
  } catch {
    return null;
  }
};

const clearSession = () => { auth.logout(); };

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const AdminSection: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const user = getSession();

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = () => {
    clearSession();
    navigate("/system-admin-login");
  };

  return (
    <>
      <style>{responsiveStyles(isDark)}</style>
      <div className="as-root" style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw', height: '100vh',
        fontFamily: "'DM Sans', sans-serif",
        background: isDark ? '#0d1117' : '#f5f5f7',
        color: isDark ? '#e2e8f0' : '#1a1a2e',
        overflowY: 'auto',
        zIndex: 9999,
      }}>
        {/* NAV */}
        <nav className="as-nav" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          height: '64px',
          background: isDark ? '#1a2234' : '#ffffff',
          borderBottom: isDark ? '1px solid #1e2d45' : '1px solid #e8e8ee',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="as-nav-logo" style={{
              width: '34px', height: '34px',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              borderRadius: '9px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: '#fff',
              flexShrink: 0,
            }}>A</div>
            <span className="as-nav-title" style={{ fontSize: '15px', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1a1a2e' }}>Admin Panel</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* User chip */}
            <div className="as-user-chip" style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              background: isDark ? '#111827' : '#f5f5f7',
              border: isDark ? '1px solid #1e2d45' : '1px solid #e4e4ec',
              borderRadius: '40px', padding: '5px 14px 5px 6px',
            }}>
              <div className="as-user-avatar" style={{
                width: '26px', height: '26px',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff',
                flexShrink: 0,
              }}>{initials}</div>
              <span className="as-user-name" style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#94a3b8' : '#4b4b6b', whiteSpace: 'nowrap' }}>
                {user?.name || "Admin"}
              </span>
            </div>

            {/* Theme toggle */}
            <button
              className="as-theme-btn as-theme-btn-el"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '34px', height: '34px',
                background: isDark ? '#111827' : '#f5f5f7',
                border: isDark ? '1px solid #1e2d45' : '1px solid #e4e4ec',
                borderRadius: '9px',
                color: isDark ? '#fbbf24' : '#6b7280',
                cursor: 'pointer', transition: 'all 0.18s ease', flexShrink: 0,
              }}
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <GoSun size={15} /> : <MdOutlineDarkMode size={15} />}
            </button>

            {/* Logout button */}
            <button
              className="as-logout-btn as-logout-nav-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: 'none',
                border: isDark ? '1px solid #7f1d1d' : '1px solid #fecaca',
                borderRadius: '9px', padding: '7px 14px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500,
                color: '#ef4444', cursor: 'pointer', transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
              }}
              onClick={handleLogout}
            >
              <LogoutIcon /> Sign Out
            </button>
          </div>
        </nav>

        {/* BODY */}
        <main className="as-body" style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 40px' }}>

          {/* Header */}
          <div className="as-anim" style={{ marginBottom: '40px' }}>
            <h1 className="as-heading" style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '30px', fontWeight: 700,
              color: isDark ? '#f1f5f9' : '#1a1a2e',
              margin: '0 0 6px', letterSpacing: '-0.02em',
            }}>
              Hello, {user?.name?.split(" ")[0] || "Admin"} 👋
            </h1>
            <p className="as-sub" style={{ fontSize: '14px', color: isDark ? '#64748b' : '#9090a8', margin: 0, fontWeight: 300 }}>
              Welcome to your admin dashboard. Manage your users and tokens below.
            </p>
          </div>

          {/* Section label */}
          <span className="as-label-txt" style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isDark ? '#334155' : '#b0b0c8', marginBottom: '16px', display: 'block',
          }}>
            Management
          </span>

          {/* Cards grid */}
          <div className="as-cards" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px', marginBottom: '40px',
          }}>

            {/* Users card */}
            <div
              className="as-card-users as-anim-1 as-card"
              style={{
                background: isDark ? '#1a2234' : '#ffffff',
                border: isDark ? '1px solid #1e2d45' : '1px solid #e8e8ee',
                borderRadius: '18px', padding: '28px', cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
              }}
              onClick={() => navigate("/system-admin/users")}
            >
              <div className="as-card-icon" style={{
                width: '48px', height: '48px', borderRadius: '13px',
                background: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
                border: isDark ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(124,58,237,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', marginBottom: '20px',
              }}>👥</div>
              <h2 className="as-card-h2" style={{
                fontSize: '16px', fontWeight: 600,
                color: isDark ? '#f1f5f9' : '#1a1a2e',
                margin: '0 0 7px', letterSpacing: '-0.01em',
              }}>
                User Management
              </h2>
              <p className="as-card-p" style={{
                fontSize: '13px', color: isDark ? '#64748b' : '#9090a8',
                margin: '0 0 24px', lineHeight: 1.6, fontWeight: 300,
              }}>
                View, manage and control all registered accounts, roles and permissions in your system.
              </p>
              <button
                className="as-card-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
                  border: 'none', borderRadius: '9px', padding: '9px 16px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600,
                  color: '#7c3aed', cursor: 'pointer',
                }}
                onClick={(e) => { e.stopPropagation(); navigate("/system-admin/users"); }}
              >Manage →</button>
            </div>

            {/* Tokens card */}
            <div
              className="as-card-tokens as-anim-2 as-card"
              style={{
                background: isDark ? '#1a2234' : '#ffffff',
                border: isDark ? '1px solid #1e2d45' : '1px solid #e8e8ee',
                borderRadius: '18px', padding: '28px', cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
              }}
              onClick={() => navigate("/system-admin/tokens")}
            >
              <div className="as-card-icon" style={{
                width: '48px', height: '48px', borderRadius: '13px',
                background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
                border: isDark ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(16,185,129,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', marginBottom: '20px',
              }}>🔑</div>
              <h2 className="as-card-h2" style={{
                fontSize: '16px', fontWeight: 600,
                color: isDark ? '#f1f5f9' : '#1a1a2e',
                margin: '0 0 7px', letterSpacing: '-0.01em',
              }}>
                Token Management
              </h2>
              <p className="as-card-p" style={{
                fontSize: '13px', color: isDark ? '#64748b' : '#9090a8',
                margin: '0 0 24px', lineHeight: 1.6, fontWeight: 300,
              }}>
                Generate, revoke and monitor API tokens and authentication keys for your integrations.
              </p>
              <button
                className="as-card-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
                  border: 'none', borderRadius: '9px', padding: '9px 16px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600,
                  color: '#10b981', cursor: 'pointer',
                }}
                onClick={(e) => { e.stopPropagation(); navigate("/system-admin/tokens"); }}
              >Manage →</button>
            </div>
          </div>

          {/* Logout box */}
          <div className="as-logout-box as-anim-3" style={{
            background: isDark ? '#1a2234' : '#ffffff',
            border: isDark ? '1px solid #7f1d1d' : '1px solid #fecaca',
            borderRadius: '18px', padding: '24px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 auto', minWidth: 0 }}>
              <div className="as-logout-icon-box" style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                border: isDark ? '1px solid #7f1d1d' : '1px solid #fecaca',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', flexShrink: 0,
              }}>🚪</div>
              <div style={{ minWidth: 0 }}>
                <h3 className="as-logout-h3" style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444', margin: '0 0 3px' }}>Sign Out</h3>
                <p className="as-logout-p" style={{ fontSize: '12.5px', color: isDark ? '#64748b' : '#9090a8', margin: 0, fontWeight: 300, lineHeight: 1.5 }}>
                  End your current admin session and return to login.
                </p>
              </div>
            </div>
            <button
              className="as-logout-box-btn"
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                border: isDark ? '1px solid #7f1d1d' : '1px solid #fecaca',
                borderRadius: '11px', padding: '11px 22px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
                color: '#ef4444', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              <LogoutIcon /> Sign Out
            </button>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminSection;