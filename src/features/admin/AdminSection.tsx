import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../utils/auth';

interface AdminUser {
  name?: string;
  email?: string;
}

const getSession = (): AdminUser | null => {
  try {
    // Check for native auth data (from storeNativeAuthData)
    const userStr = localStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch {
    return null;
  }
};

const clearSession = () => {
  // Use auth utility's logout function to clear all auth data
  auth.logout();
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap');

  html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow-x: hidden; }
  #root { width: 100% !important; min-height: 100vh !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }

  .as-root {
    position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
    width: 100vw !important; height: 100vh !important; font-family: 'DM Sans', sans-serif;
    background: #f5f5f7; color: #1a1a2e; overflow-y: auto; z-index: 9999 !important; box-sizing: border-box;
  }

  .as-nav {
    display: flex; align-items: center; justify-content: space-between; padding: 0 40px; height: 64px;
    background: #ffffff; border-bottom: 1px solid #e8e8ee; position: sticky; top: 0; z-index: 100;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .as-nav-brand { display: flex; align-items: center; gap: 12px; }
  .as-nav-logo {
    width: 34px; height: 34px; background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; color: #fff;
  }
  .as-nav-title { font-size: 15px; font-weight: 600; color: #1a1a2e; letter-spacing: -0.01em; }
  .as-nav-right { display: flex; align-items: center; gap: 12px; }
  .as-user-chip {
    display: flex; align-items: center; gap: 9px; background: #f5f5f7; border: 1px solid #e4e4ec;
    border-radius: 40px; padding: 5px 14px 5px 6px;
  }
  .as-user-avatar {
    width: 26px; height: 26px; background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff;
  }
  .as-user-name { font-size: 13px; font-weight: 500; color: #4b4b6b; }
  .as-nav-logout {
    display: flex; align-items: center; gap: 7px; background: none; border: 1px solid #fecaca;
    border-radius: 9px; padding: 7px 14px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; color: #ef4444; cursor: pointer; transition: all 0.18s ease;
  }
  .as-nav-logout:hover { background: #fef2f2; border-color: #fca5a5; }

  .as-body { max-width: 1000px; margin: 0 auto; padding: 48px 40px; }
  .as-header { margin-bottom: 40px; animation: asFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
  .as-header h1 {
    font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 700; color: #1a1a2e;
    margin: 0 0 6px; letter-spacing: -0.02em;
  }
  .as-header p { font-size: 14px; color: #9090a8; margin: 0; font-weight: 300; }
  .as-label {
    font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    color: #b0b0c8; margin-bottom: 16px;
  }

  .as-cards {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px;
  }
  .as-card {
    background: #ffffff; border: 1px solid #e8e8ee; border-radius: 18px; padding: 28px; cursor: pointer;
    transition: all 0.22s cubic-bezier(0.22,1,0.36,1); animation: asFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
  }
  .as-card:nth-child(1) { animation-delay: 0.08s; }
  .as-card:nth-child(2) { animation-delay: 0.16s; }
  .as-card:hover { border-color: #d4d4e4; transform: translateY(-3px); box-shadow: 0 12px 40px rgba(100,80,180,0.1); }

  .as-card-icon-wrap {
    width: 48px; height: 48px; border-radius: 13px; display: flex;
    align-items: center; justify-content: center; font-size: 20px; margin-bottom: 20px;
  }
  .as-card-users .as-card-icon-wrap { background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.15); }
  .as-card-tokens .as-card-icon-wrap { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15); }

  .as-card h2 { font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 0 0 7px; letter-spacing: -0.01em; }
  .as-card p { font-size: 13px; color: #9090a8; margin: 0 0 24px; line-height: 1.6; font-weight: 300; }

  .as-card-bottom { display: flex; align-items: center; justify-content: space-between; }
  .as-card-stat-val { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; }
  .as-card-users .as-card-stat-val { color: #7c3aed; }
  .as-card-tokens .as-card-stat-val { color: #10b981; }
  .as-card-stat-lbl { font-size: 11px; color: #b0b0c8; margin-top: 2px; font-weight: 400; }

  .as-card-btn {
    display: flex; align-items: center; gap: 6px; border: none; border-radius: 9px;
    padding: 9px 16px; font-family: 'DM Sans', sans-serif; font-size: 12px;
    font-weight: 600; cursor: pointer; transition: all 0.18s;
  }
  .as-card-users .as-card-btn { background: rgba(124,58,237,0.08); color: #7c3aed; }
  .as-card-users .as-card-btn:hover { background: rgba(124,58,237,0.15); }
  .as-card-tokens .as-card-btn { background: rgba(16,185,129,0.08); color: #10b981; }
  .as-card-tokens .as-card-btn:hover { background: rgba(16,185,129,0.15); }

  .as-logout-box {
    background: #ffffff; border: 1px solid #fecaca; border-radius: 18px; padding: 24px 28px;
    display: flex; align-items: center; justify-content: space-between; gap: 24px;
    animation: asFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.24s both;
  }
  .as-logout-left { display: flex; align-items: center; gap: 16px; }
  .as-logout-icon {
    width: 44px; height: 44px; border-radius: 12px; background: #fef2f2;
    border: 1px solid #fecaca; display: flex; align-items: center;
    justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  .as-logout-text h3 { font-size: 14px; font-weight: 600; color: #ef4444; margin: 0 0 3px; }
  .as-logout-text p { font-size: 12.5px; color: #9090a8; margin: 0; font-weight: 300; line-height: 1.5; }
  .as-logout-text p strong { font-weight: 500; color: #6b7280; }
  .as-persist-badge {
    display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #10b981;
    background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
    border-radius: 20px; padding: 2px 8px; font-weight: 500; margin-left: 4px;
  }
  .as-logout-cta {
    display: flex; align-items: center; gap: 8px; background: #fef2f2;
    border: 1px solid #fecaca; border-radius: 11px; padding: 11px 22px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    color: #ef4444; cursor: pointer; transition: all 0.18s; white-space: nowrap; flex-shrink: 0;
  }
  .as-logout-cta:hover {
    background: #fee2e2; border-color: #fca5a5; transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239,68,68,0.15);
  }

  @keyframes asFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 640px) {
    .as-nav { padding: 0 20px; }
    .as-body { padding: 32px 20px; }
    .as-logout-box { flex-direction: column; align-items: flex-start; }
    .as-user-name { display: none; }
  }
`;

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const AdminSection: React.FC = () => {
  const navigate = useNavigate();
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
      <style>{STYLES}</style>
      <div className="as-root">
        <nav className="as-nav">
          <div className="as-nav-brand">
            <div className="as-nav-logo">A</div>
            <span className="as-nav-title">Admin Panel</span>
          </div>
          <div className="as-nav-right">
            <div className="as-user-chip">
              <div className="as-user-avatar">{initials}</div>
              <span className="as-user-name">{user?.name || "Admin"}</span>
            </div>
            <button className="as-nav-logout" onClick={handleLogout}>
              <LogoutIcon /> Sign Out
            </button>
          </div>
        </nav>

        <main className="as-body">
          <div className="as-header">
            <h1>Hello, {user?.name?.split(" ")[0] || "Admin"} 👋</h1>
            <p>Welcome to your admin dashboard. Manage your users and tokens below.</p>
          </div>

          <p className="as-label">Management</p>
          <div className="as-cards">
            <div className="as-card as-card-users" onClick={() => navigate("/system-admin/users")}>
              <div className="as-card-icon-wrap">👥</div>
              <h2>User Management</h2>
              <p>View, manage and control all registered accounts, roles and permissions in your system.</p>
              <div className="as-card-bottom">
                <button className="as-card-btn" onClick={(e) => { e.stopPropagation(); navigate("/system-admin/users"); }}>
                  Manage →
                </button>
              </div>
            </div>

            <div className="as-card as-card-tokens" onClick={() => navigate("/system-admin/tokens")}>
              <div className="as-card-icon-wrap">🔑</div>
              <h2>Token Management</h2>
              <p>Generate, revoke and monitor API tokens and authentication keys for your integrations.</p>
              <div className="as-card-bottom">
                <button className="as-card-btn" onClick={(e) => { e.stopPropagation(); navigate("/system-admin/tokens"); }}>
                  Manage →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminSection;
