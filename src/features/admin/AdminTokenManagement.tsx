import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../utils/auth';
import { useTheme } from '../../state/ThemeContext';

interface TokenConfig {
  endpointUrl: string;
  clientId: string;
  clientSecret: string;
  grantType: 'client_credentials' | 'authorization_code' | 'password' | 'jwt_bearer';
  scope: string;
  introspectionUrl: string;
  introspectionClientId: string;
  introspectionClientSecret: string;
  issuer?: string;
  audience?: string;
  groups?: string[];
}

interface KeypairStatus {
  secretsFolderExists: boolean;
  privateKeyExists: boolean;
  publicKeyExists: boolean;
  keypairComplete: boolean;
  success: boolean;
}

const DEFAULTS: TokenConfig = {
  endpointUrl: "", clientId: "", clientSecret: "", grantType: "client_credentials",
  scope: "", introspectionUrl: "", introspectionClientId: "", introspectionClientSecret: "",
  issuer: "", audience: "", groups: ["Vega_Admins"]
};

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const AdminTokenManagement: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [form, setForm] = useState<TokenConfig>(DEFAULTS);
  const [showSecret, setShowSecret] = useState(false);
  const [showIntrospectionSecret, setShowIntrospectionSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [keypairStatus, setKeypairStatus] = useState<KeypairStatus | null>(null);
  const [jwksString, setJwksString] = useState<string | null>(null);
  const [showJwksModal, setShowJwksModal] = useState(false);
  const [loadingKeypair, setLoadingKeypair] = useState(false);
  const [generatingJwks, setGeneratingJwks] = useState(false);
  const [showKeypairConfirmation, setShowKeypairConfirmation] = useState(false);

  const c = {
    bg: isDark ? '#0d1117' : '#f5f5f7',
    surface: isDark ? '#1a2234' : '#ffffff',
    surfaceAlt: isDark ? '#111827' : '#fafafa',
    border: isDark ? '#1e2d45' : '#e8e8ee',
    borderFocus: '#10b981',
    text: isDark ? '#e2e8f0' : '#1a1a2e',
    textMuted: isDark ? '#64748b' : '#9090a8',
    textSub: isDark ? '#94a3b8' : '#4b4b6b',
    navBg: isDark ? '#1a2234' : '#ffffff',
    navShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
    inputBg: isDark ? '#111827' : '#fafafa',
    inputText: isDark ? '#e2e8f0' : '#1a1a2e',
    inputDisabledBg: isDark ? '#0d1117' : '#f0f0f5',
    instructionsBg: isDark ? 'rgba(16,185,129,0.05)' : 'linear-gradient(135deg,#f0fdf4,#f0fef9)',
    instructionsBorder: isDark ? 'rgba(16,185,129,0.2)' : '#d1fae5',
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = auth.getToken();
        if (!token) return;
        const response = await fetch("/api/v1/token-provider-config", {
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) setForm(result.data);
        }
      } catch {}
    };
    const fetchKeypairStatus = async () => {
      try {
        const token = auth.getToken();
        if (!token) return;
        const response = await fetch("/api/v1/keys/status", {
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        });
        if (response.ok) {
          const result = await response.json();
          setKeypairStatus(result);
        }
      } catch {}
    };
    fetchConfig();
    fetchKeypairStatus();
  }, []);

  const set = (key: keyof TokenConfig, val: string) => setForm(f => ({ ...f, [key]: val }));

  const showToast = (msg: string, icon = "✅") => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.endpointUrl || !form.clientId || !form.clientSecret || !form.scope || !form.introspectionUrl || !form.introspectionClientId || !form.introspectionClientSecret) {
      showToast("All required fields must be filled.", "⚠️"); return;
    }
    const token = auth.getToken();
    if (!token) { showToast("Not authenticated.", "🔐"); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/v1/token-provider-config", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, groups: form.groups || ["Vega_Admins"] })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) showToast("Configuration saved successfully.");
      } else {
        const error = await response.json();
        showToast(`Error: ${error.detail || "Failed to save"}`, "❌");
      }
    } catch { showToast("Error saving configuration.", "❌"); }
    finally { setLoading(false); }
  };

  const handleReset = () => { setForm(DEFAULTS); showToast("Form cleared.", "🔄"); };

  const handleTest = async () => {
    const token = auth.getToken();
    if (!token) { showToast("Not authenticated.", "🔐"); return; }
    if (!form.endpointUrl || !form.clientId || !form.clientSecret || !form.scope || !form.introspectionUrl || !form.introspectionClientId || !form.introspectionClientSecret) {
      showToast("All required fields must be filled before testing.", "⚠️"); return;
    }
    setTestLoading(true);
    try {
      const response = await fetch("/api/v1/token-provider-config/test", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) showToast("Token exchange test passed!", "✅");
      } else {
        const error = await response.json();
        showToast(`Test failed: ${error.detail || "Unknown error"}`, "❌");
      }
    } catch { showToast("Error testing token exchange.", "❌"); }
    finally { setTestLoading(false); }
  };

  const handleGenerateKeypair = async () => {
    const token = auth.getToken();
    if (!token) { showToast("Not authenticated.", "🔐"); return; }
    try {
      const statusResponse = await fetch("/api/v1/keys/status", {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        if (statusResult.success) { setShowKeypairConfirmation(true); return; }
      }
    } catch {}
    await proceedWithKeypairGeneration(token, false);
  };

  const proceedWithKeypairGeneration = async (token: string, overwrite: boolean) => {
    setLoadingKeypair(true);
    try {
      const response = await fetch("/api/v1/keys/generate", {
        method: overwrite ? "PUT" : "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setKeypairStatus({ ...result, success: true });
          showToast(overwrite ? "RSA keypair rotated!" : "RSA keypair generated!", "✅");
          setShowKeypairConfirmation(false);
        }
      } else {
        const error = await response.json();
        showToast(`Error: ${error.detail || "Failed to generate keypair"}`, "❌");
      }
    } catch { showToast("Error generating keypair.", "❌"); }
    finally { setLoadingKeypair(false); setShowKeypairConfirmation(false); }
  };

  const handleGenerateJwks = async () => {
    const token = auth.getToken();
    if (!token) { showToast("Not authenticated.", "🔐"); return; }
    setGeneratingJwks(true);
    try {
      const response = await fetch("/api/v1/keys/jwks", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setJwksString(JSON.stringify(result.data || result.jwks));
          setShowJwksModal(true);
          showToast("JWKS generated!", "✅");
        }
      }
    } catch { showToast("Error generating JWKS.", "❌"); }
    finally { setGeneratingJwks(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 18px',
    background: c.inputBg, border: `1.5px solid ${c.border}`,
    borderRadius: '12px', fontFamily: "'DM Sans', sans-serif",
    fontSize: '14.5px', color: c.inputText, outline: 'none',
    transition: 'all 0.18s', boxSizing: 'border-box',
  };

  const fieldLabel: React.CSSProperties = {
    fontSize: '13.5px', fontWeight: 500, color: c.textSub,
    display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '9px',
  };

  const reqDot = <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />;

  const sectionTitle: React.CSSProperties = {
    fontSize: '15px', fontWeight: 600, color: c.text,
    margin: '20px 0 16px', paddingTop: '8px', display: 'block',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0 !important; padding: 0 !important; }
        #root { min-height: 100vh !important; max-width: none !important; }
        .tm-input:focus { border-color: #10b981 !important; background: ${isDark ? '#0d1117' : '#fff'} !important; box-shadow: 0 0 0 4px rgba(16,185,129,0.09) !important; }
        .tm-input::placeholder { color: ${isDark ? '#334155' : '#c8c8d8'}; }
        .tm-eye:hover { color: #10b981 !important; }
        .tm-btn-reset:hover { background: ${isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'} !important; border-color: ${isDark ? '#7f1d1d' : '#fecaca'} !important; color: #ef4444 !important; }
        .tm-btn-submit:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(16,185,129,0.36) !important; }
        .tm-btn-test:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(59,130,246,0.4) !important; }
        .tm-btn-action:hover { background: ${isDark ? '#1e2d45' : '#ebebf0'} !important; }
        .tm-back-btn:hover { background: ${isDark ? '#1e2d45' : '#ebebf0'} !important; }
        @keyframes tmFadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes tmSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .tm-anim { animation: tmFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .tm-anim-1 { animation: tmFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.08s both; }
        .tm-toast-anim { animation: tmSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        .instructions-header:hover { background: ${isDark ? 'rgba(16,185,129,0.03)' : 'rgba(16,185,129,0.02)'} !important; }

        /* ── Responsive: below 1920px (tablets, laptops) ── */
        @media (max-width: 1919px) {
          .tm-nav { padding: 0 32px !important; height: 60px !important; }
          .tm-main { padding: 40px 32px 60px !important; }
          .tm-header-icon { width: 52px !important; height: 52px !important; border-radius: 14px !important; font-size: 22px !important; }
          .tm-header h1 { font-size: 26px !important; }
          .tm-header p { font-size: 14px !important; }
          .tm-card { border-radius: 18px !important; }
          .tm-instructions-header { padding: 20px 32px !important; }
          .tm-instructions-body { padding: 0 32px !important; }
          .tm-instructions-body-open { padding: 0 32px 22px !important; }
          .tm-form { padding: 32px 32px 8px !important; gap: 22px !important; }
          .tm-actions { padding: 22px 32px 28px !important; }
          .tm-keypair-row { flex-wrap: wrap !important; gap: 8px !important; }
        }

        @media (max-width: 1400px) {
          .tm-nav { padding: 0 24px !important; }
          .tm-main { padding: 32px 24px 48px !important; max-width: 800px !important; }
          .tm-header-icon { width: 48px !important; height: 48px !important; font-size: 20px !important; }
          .tm-header h1 { font-size: 24px !important; }
          .tm-form { padding: 28px 28px 8px !important; }
          .tm-actions { padding: 20px 28px 24px !important; gap: 10px !important; }
          .tm-instructions-header { padding: 18px 28px !important; }
          .tm-instructions-body { padding: 0 28px !important; }
          .tm-instructions-body-open { padding: 0 28px 18px !important; }
        }

        @media (max-width: 1200px) {
          .tm-nav { padding: 0 20px !important; height: 56px !important; }
          .tm-main { padding: 28px 20px 40px !important; max-width: 100% !important; }
          .tm-nav-brand span { display: none; }
          .tm-form { padding: 22px 22px 8px !important; gap: 18px !important; }
          .tm-actions { padding: 18px 22px 22px !important; flex-wrap: wrap !important; }
          .tm-actions button { flex: 1 1 auto !important; justify-content: center !important; }
          .tm-instructions-header { padding: 16px 22px !important; }
          .tm-instructions-body { padding: 0 22px !important; }
          .tm-instructions-body-open { padding: 0 22px 16px !important; }
        }

        /* ── Responsive: above 1920px (2K, 4K, ultrawide) ── */
        @media (min-width: 1921px) {
          .tm-nav { padding: 0 80px !important; height: 80px !important; }
          .tm-nav-brand-logo { width: 42px !important; height: 42px !important; font-size: 18px !important; }
          .tm-nav-brand span { font-size: 18px !important; }
          .tm-nav-breadcrumb { font-size: 16px !important; }
          .tm-back-btn { font-size: 15px !important; padding: 10px 20px !important; border-radius: 11px !important; }
          .tm-main { padding: 80px 80px 100px !important; max-width: 1200px !important; }
          .tm-header-icon { width: 80px !important; height: 80px !important; border-radius: 22px !important; font-size: 36px !important; }
          .tm-header { gap: 28px !important; margin-bottom: 52px !important; }
          .tm-header h1 { font-size: 42px !important; }
          .tm-header p { font-size: 18px !important; }
          .tm-card { border-radius: 28px !important; }
          .tm-instructions-header { padding: 36px 56px !important; }
          .tm-instructions-header h2 { font-size: 20px !important; }
          .tm-instructions-body { padding: 0 56px !important; }
          .tm-instructions-body-open { padding: 0 56px 36px !important; }
          .tm-instructions-body p,
          .tm-instructions-body li { font-size: 16px !important; }
          .tm-form { padding: 56px 56px 8px !important; gap: 34px !important; }
          .tm-field-label { font-size: 15px !important; }
          .tm-input { padding: 17px 22px !important; font-size: 16px !important; border-radius: 14px !important; }
          .tm-section-title { font-size: 18px !important; }
          .tm-actions { padding: 36px 56px 48px !important; gap: 16px !important; }
          .tm-actions button { padding: 15px 40px !important; font-size: 16px !important; border-radius: 13px !important; }
          .tm-keypair-btn { padding: 12px 20px !important; font-size: 14px !important; border-radius: 12px !important; }
          .tm-input-hint { font-size: 14px !important; }
          .tm-toast { padding: 18px 28px !important; font-size: 15px !important; border-radius: 16px !important; }
          .tm-jwks-modal { max-width: 760px !important; padding: 40px !important; border-radius: 22px !important; }
          .tm-jwks-modal h3 { font-size: 22px !important; }
          .tm-jwks-modal p { font-size: 15px !important; }
          .tm-jwks-code { font-size: 14px !important; border-radius: 14px !important; }
          .tm-confirm-modal { max-width: 600px !important; padding: 40px !important; border-radius: 22px !important; }
          .tm-confirm-modal h3 { font-size: 22px !important; }
          .tm-confirm-modal p { font-size: 16px !important; }
        }

        @media (min-width: 2560px) {
          .tm-nav { padding: 0 120px !important; height: 96px !important; }
          .tm-main { padding: 100px 120px 120px !important; max-width: 1600px !important; }
          .tm-header-icon { width: 96px !important; height: 96px !important; font-size: 44px !important; }
          .tm-header h1 { font-size: 52px !important; }
          .tm-header p { font-size: 20px !important; }
          .tm-instructions-header { padding: 44px 72px !important; }
          .tm-instructions-body { padding: 0 72px !important; }
          .tm-instructions-body-open { padding: 0 72px 44px !important; }
          .tm-form { padding: 72px 72px 8px !important; gap: 40px !important; }
          .tm-input { padding: 20px 26px !important; font-size: 17px !important; }
          .tm-actions { padding: 44px 72px 60px !important; }
          .tm-actions button { padding: 18px 48px !important; font-size: 17px !important; }
          .tm-jwks-modal { max-width: 900px !important; }
        }
      `}</style>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', fontFamily: "'DM Sans', sans-serif", background: c.bg, overflowY: 'auto', zIndex: 9999 }}>

        {/* NAV */}
        <nav className="tm-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: '68px', background: c.navBg, borderBottom: `1px solid ${c.border}`, position: 'sticky', top: 0, zIndex: 100, boxShadow: c.navShadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="tm-back-btn"
              onClick={() => navigate("/system-admin")}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', background: isDark ? '#111827' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '9px', padding: '8px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 500, color: c.textSub, cursor: 'pointer', transition: 'all 0.18s' }}
            ><BackIcon /> Back</button>
            <div style={{ width: '1px', height: '22px', background: c.border }} />
            <div className="tm-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
              <div className="tm-nav-brand-logo" style={{ width: '33px', height: '33px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff' }}>A</div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: c.text }}>Admin Panel</span>
            </div>
          </div>
          <div className="tm-nav-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', color: c.textMuted }}>
            <span style={{ color: isDark ? '#334155' : '#b0b0c8' }}>Dashboard</span>
            <span style={{ color: isDark ? '#334155' : '#b0b0c8' }}>›</span>
            <strong style={{ color: '#10b981', fontWeight: 500 }}>Token Management</strong>
          </div>
        </nav>

        <main className="tm-main" style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 48px 80px' }}>
          {/* Header */}
          <div className="tm-anim tm-header" style={{ display: 'flex', alignItems: 'center', gap: '22px', marginBottom: '40px' }}>
            <div className="tm-header-icon" style={{ width: '64px', height: '64px', borderRadius: '18px', background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)', border: `1px solid ${isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.18)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>🔑</div>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 700, color: c.text, margin: '0 0 5px', letterSpacing: '-0.02em' }}>Token Management</h1>
              <p style={{ fontSize: '15px', color: c.textMuted, margin: 0, fontWeight: 300 }}>Configure your token provider credentials and endpoint settings.</p>
            </div>
          </div>

          {/* Card */}
          <div className="tm-anim-1 tm-card" style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '22px', overflow: 'hidden', boxShadow: isDark ? '0 6px 32px rgba(0,0,0,0.3)' : '0 6px 32px rgba(0,0,0,0.05)' }}>

            {/* Instructions collapsible */}
            <div style={{ background: isDark ? 'rgba(16,185,129,0.04)' : 'linear-gradient(135deg,#f0fdf4,#f0fef9)', borderBottom: `1.5px solid ${isDark ? 'rgba(16,185,129,0.15)' : '#d1fae5'}` }}>
              <div
                className="instructions-header tm-instructions-header"
                onClick={() => setShowInstructions(!showInstructions)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 44px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: isDark ? '#34d399' : '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>📚 Instructions</h2>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowInstructions(!showInstructions); }}
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                >{showInstructions ? '−' : '+'}</button>
              </div>
              <div className={showInstructions ? 'tm-instructions-body-open' : 'tm-instructions-body'} style={{ maxHeight: showInstructions ? '1200px' : '0', overflow: 'hidden', opacity: showInstructions ? 1 : 0, transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out', padding: showInstructions ? '0 44px 28px' : '0 44px' }}>
                <div style={{ fontSize: '13.8px', color: isDark ? '#94a3b8' : '#1f4b3b', lineHeight: 1.75 }}>
                  <p>The Vega AI application uses a <strong style={{ color: isDark ? '#34d399' : '#065f46' }}>Token Exchange (RFC 8693)</strong> architecture to provide secure, identity-propagated access to target systems.</p>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#10b981' : '#047857', margin: '18px 0 10px' }}>Prerequisites</h3>
                  <ul style={{ margin: '8px 0 8px 32px', padding: 0 }}>
                    <li>Vega AI requires a dedicated <strong>public/private key pair</strong> to sign identity assertions.</li>
                    <li><strong>Vega AI Side:</strong> Signs a JWT using the private key (per RFC 7523).</li>
                    <li><strong>IdP Side:</strong> Requires the corresponding public key in <code style={{ background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '12.5px', color: isDark ? '#34d399' : '#047857' }}>JWKS</code> format to verify the assertion.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Form */}
            <form className="tm-form" style={{ padding: '44px 44px 8px', display: 'flex', flexDirection: 'column', gap: '28px' }} onSubmit={handleSubmit}>

              <span className="tm-section-title" style={sectionTitle}>🔐 Vega AI JWT Generation:</span>

              <div>
                <label className="tm-field-label" style={fieldLabel}>Issuer</label>
                <input className="tm-input" style={inputStyle} type="text" placeholder="e.g., vega-ai" value={form.issuer || ""} onChange={e => set("issuer", e.target.value)} />
                <span className="tm-input-hint" style={{ fontSize: '12px', color: c.textMuted, marginTop: '6px', display: 'block' }}>Your Vega AI instance issuer ID</span>
              </div>

              <div>
                <label className="tm-field-label" style={fieldLabel}>Audience</label>
                <input className="tm-input" style={inputStyle} type="text" placeholder="e.g., https://auth.example.com" value={form.audience || ""} onChange={e => set("audience", e.target.value)} />
                <span className="tm-input-hint" style={{ fontSize: '12px', color: c.textMuted, marginTop: '6px', display: 'block' }}>Your identity provider audience identifier</span>
              </div>

              {/* Keypair actions */}
              <div className="tm-keypair-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '20px 0', borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, marginBottom: '4px' }}>
                <button type="button" className="tm-btn-action tm-keypair-btn" disabled={loadingKeypair} onClick={handleGenerateKeypair}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: isDark ? '#111827' : '#f5f5f7', border: `1.5px solid ${c.border}`, borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: c.textSub, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {loadingKeypair ? "🔄 Generating…" : "🔑 Generate Keypair"}
                </button>
                <button type="button" className="tm-btn-action tm-keypair-btn" disabled={generatingJwks} onClick={handleGenerateJwks}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 3px 10px rgba(59,130,246,0.3)' }}>
                  {generatingJwks ? "🔄 Generating…" : "📋 Generate JWKS"}
                </button>
              </div>

              <span className="tm-section-title" style={sectionTitle}>🔑 Token Provider Configuration:</span>

              <div>
                <label className="tm-field-label" style={fieldLabel}>{reqDot} Token Provider Endpoint</label>
                <input className="tm-input" style={inputStyle} type="url" placeholder="https://auth.example.com/oauth2/token" value={form.endpointUrl} onChange={e => set("endpointUrl", e.target.value)} />
              </div>
              <div>
                <label className="tm-field-label" style={fieldLabel}>{reqDot} Client ID</label>
                <input className="tm-input" style={inputStyle} placeholder="your-client-id" value={form.clientId} onChange={e => set("clientId", e.target.value)} />
              </div>
              <div>
                <label className="tm-field-label" style={fieldLabel}>{reqDot} Client Secret</label>
                <div style={{ position: 'relative' }}>
                  <input className="tm-input" style={{ ...inputStyle, paddingRight: '50px' }} type={showSecret ? "text" : "password"} placeholder="••••••••••••••••" value={form.clientSecret} onChange={e => set("clientSecret", e.target.value)} />
                  <button type="button" className="tm-eye" onClick={() => setShowSecret(s => !s)}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#475569' : '#b0b0c8', padding: '3px', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}>
                    <EyeIcon open={showSecret} />
                  </button>
                </div>
              </div>
              <div>
                <label className="tm-field-label" style={fieldLabel}>{reqDot} Scope</label>
                <input className="tm-input" style={inputStyle} placeholder="urn:vega:admin" value={form.scope} onChange={e => set("scope", e.target.value)} />
                <span className="tm-input-hint" style={{ fontSize: '12px', color: c.textMuted, marginTop: '6px', display: 'block' }}>Space-separated OAuth scopes</span>
              </div>

              <div style={{ height: '1px', background: c.border, margin: '4px 0' }} />
              <span className="tm-section-title" style={sectionTitle}>🔍 Token Introspection Configuration:</span>

              <div>
                <label className="tm-field-label" style={fieldLabel}>{reqDot} Introspection Endpoint URL</label>
                <input className="tm-input" style={inputStyle} type="url" placeholder="https://auth.example.com/oauth2/introspect" value={form.introspectionUrl} onChange={e => set("introspectionUrl", e.target.value)} />
              </div>
              <div>
                <label className="tm-field-label" style={fieldLabel}>{reqDot} Introspection Client ID</label>
                <input className="tm-input" style={inputStyle} placeholder="introspection-client-id" value={form.introspectionClientId} onChange={e => set("introspectionClientId", e.target.value)} />
              </div>
              <div>
                <label className="tm-field-label" style={fieldLabel}>{reqDot} Introspection Client Secret</label>
                <div style={{ position: 'relative' }}>
                  <input className="tm-input" style={{ ...inputStyle, paddingRight: '50px' }} type={showIntrospectionSecret ? "text" : "password"} placeholder="••••••••••••••••" value={form.introspectionClientSecret} onChange={e => set("introspectionClientSecret", e.target.value)} />
                  <button type="button" className="tm-eye" onClick={() => setShowIntrospectionSecret(s => !s)}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#475569' : '#b0b0c8', padding: '3px', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}>
                    <EyeIcon open={showIntrospectionSecret} />
                  </button>
                </div>
              </div>
            </form>

            {/* Actions */}
            <div className="tm-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '28px 44px 36px' }}>
              <button type="button" className="tm-btn-reset" onClick={handleReset}
                style={{ padding: '12px 24px', background: isDark ? '#111827' : '#fff', border: `1.5px solid ${c.border}`, borderRadius: '11px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: c.textSub, cursor: 'pointer', transition: 'all 0.18s' }}>
                Reset
              </button>
              <button type="button" className="tm-btn-test" disabled={testLoading} onClick={handleTest}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', borderRadius: '11px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(59,130,246,0.3)', opacity: testLoading ? 0.6 : 1 }}>
                {testLoading ? "Testing…" : "🧪 Test Token Exchange"}
              </button>
              <button type="submit" className="tm-btn-submit" disabled={loading} onClick={handleSubmit}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none', borderRadius: '11px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', opacity: loading ? 0.6 : 1 }}>
                {loading ? "Saving…" : "💾 Save Configuration"}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="tm-toast-anim tm-toast" style={{ position: 'fixed', bottom: '32px', right: '32px', background: isDark ? '#1a2234' : '#1a1a2e', color: '#fff', borderRadius: '13px', padding: '15px 22px', fontSize: '13.5px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 10000, border: isDark ? `1px solid ${c.border}` : 'none' }}>
          <span>{toast.icon}</span>{toast.msg}
        </div>
      )}

      {/* JWKS Modal */}
      {showJwksModal && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000 }} onClick={() => setShowJwksModal(false)} />
          <div className="tm-jwks-modal" style={{ position: 'fixed', top: '25%', left: '30%', transform: 'translate(-50%,-50%)', background: c.surface, borderRadius: '18px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', zIndex: 10001, border: `1px solid ${c.border}` }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: c.text }}>🗝️ JWKS JSON Web Key Set</h3>
              <p style={{ margin: 0, fontSize: '13.5px', color: c.textMuted }}>Share this public key configuration with your identity provider.</p>
            </div>
            <div className="tm-jwks-code" style={{ background: isDark ? '#0d1117' : '#f9f9fb', border: `1px solid ${c.border}`, borderRadius: '12px', padding: '16px', fontFamily: 'monospace', fontSize: '12.5px', color: isDark ? '#94a3b8' : '#4b4b6b', overflowX: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{jwksString}</div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => { if (jwksString) { navigator.clipboard.writeText(jwksString); showToast("Copied!", "📋"); } }} style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 12px rgba(16,185,129,0.3)' }}>📋 Copy to Clipboard</button>
              <button onClick={() => setShowJwksModal(false)} style={{ padding: '10px 20px', background: isDark ? '#111827' : '#f5f5f7', color: c.textSub, border: `1px solid ${c.border}`, borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* Keypair confirmation modal */}
      {showKeypairConfirmation && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000 }} onClick={() => setShowKeypairConfirmation(false)} />
          <div className="tm-confirm-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: c.surface, borderRadius: '18px', padding: '32px', maxWidth: '500px', width: '90%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', zIndex: 10001, border: `1px solid ${c.border}` }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: c.text }}>⚠️ Overwrite RSA Keypair?</h3>
            <p style={{ margin: '8px 0', fontSize: '14px', color: c.textMuted }}>A keypair already exists. This action is <strong style={{ color: '#ef4444' }}>IRREVOCABLE</strong>. Identity providers will need to be updated with the new JWKS.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowKeypairConfirmation(false)} disabled={loadingKeypair} style={{ padding: '10px 20px', background: isDark ? '#111827' : '#f5f5f7', color: c.textSub, border: `1px solid ${c.border}`, borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => proceedWithKeypairGeneration(auth.getToken() || "", true)} disabled={loadingKeypair} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 12px rgba(239,68,68,0.3)' }}>
                {loadingKeypair ? "🔄 Generating…" : "Yes, Overwrite"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdminTokenManagement;