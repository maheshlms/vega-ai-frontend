import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../utils/auth';

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

const DEFAULTS: TokenConfig = { endpointUrl: "", clientId: "", clientSecret: "", grantType: "client_credentials", scope: "", introspectionUrl: "", introspectionClientId: "", introspectionClientSecret: "", issuer: "", audience: "", groups: ["Vega_Admins"] };

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap');

  html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
  #root { width: 100% !important; min-height: 100vh !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }

  .tm-root {
    position: fixed !important;
    top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
    width: 100vw !important; 
    height: 100vh !important;
    font-family: 'DM Sans', sans-serif;
    background: #f5f5f7;
    overflow-y: auto;
    z-index: 9999 !important;
    box-sizing: border-box;
  }

  .tm-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 68px; background: #ffffff;
    border-bottom: 1px solid #e8e8ee; position: sticky; top: 0; z-index: 100;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .tm-nav-left { display: flex; align-items: center; gap: 16px; }
  .tm-back-btn {
    display: flex; align-items: center; gap: 7px;
    background: #f5f5f7; border: 1px solid #e4e4ec; border-radius: 9px;
    padding: 8px 16px; font-family: 'DM Sans', sans-serif;
    font-size: 13.5px; font-weight: 500; color: #4b4b6b; cursor: pointer;
    transition: all 0.18s;
  }
  .tm-back-btn:hover { background: #ebebf0; border-color: #d4d4e4; }
  .tm-nav-divider { width: 1px; height: 22px; background: #e4e4ec; }
  .tm-nav-brand { display: flex; align-items: center; gap: 11px; }
  .tm-nav-logo {
    width: 33px; height: 33px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: 9px; display: flex; align-items: center;
    justify-content: center; font-size: 14px; font-weight: 700; color: #fff;
  }
  .tm-nav-title { font-size: 15px; font-weight: 600; color: #1a1a2e; }
  .tm-breadcrumb { display: flex; align-items: center; gap: 7px; font-size: 13.5px; color: #9090a8; }
  .tm-breadcrumb span { color: #b0b0c8; }
  .tm-breadcrumb strong { color: #10b981; font-weight: 500; }

  .tm-body { max-width: 900px; margin: 0 auto; padding: 60px 48px 80px; }

  .tm-header {
    display: flex; align-items: center; gap: 22px;
    margin-bottom: 40px;
    animation: tmFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }
  .tm-header-icon {
    width: 64px; height: 64px; border-radius: 18px;
    background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.18);
    display: flex; align-items: center; justify-content: center; font-size: 28px;
    flex-shrink: 0;
  }
  .tm-header-text h1 {
    font-family: 'DM Sans', sans-serif;
    font-size: 36px; font-weight: 700; color: #1a1a2e;
    margin: 0 0 5px; letter-spacing: -0.03em;
  }
  .tm-header-text p { font-size: 15px; color: #9090a8; margin: 0; font-weight: 300; }

  .tm-card {
    background: #ffffff; border: 1px solid #e8e8ee;
    border-radius: 22px; overflow: hidden;
    box-shadow: 0 6px 32px rgba(0,0,0,0.05);
    animation: tmFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.08s both;
  }

  .tm-form { padding: 44px 44px 8px; display: flex; flex-direction: column; gap: 28px; }

  .tm-field { display: flex; flex-direction: column; gap: 9px; }
  .tm-field label {
    font-size: 13.5px; font-weight: 500; color: #4b4b6b;
    display: flex; align-items: center; gap: 7px;
  }
  .tm-req { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; flex-shrink: 0; }
  .tm-hint { font-size: 12px; color: #b8b8cc; font-weight: 300; }

  .tm-input, .tm-select {
    width: 100%; padding: 14px 18px;
    background: #fafafa; border: 1.5px solid #e8e8ee;
    border-radius: 12px; font-family: 'DM Sans', sans-serif;
    font-size: 14.5px; color: #1a1a2e; outline: none;
    transition: all 0.18s; box-sizing: border-box;
  }
  .tm-input::placeholder { color: #c8c8d8; }
  .tm-input:focus, .tm-select:focus {
    border-color: #10b981; background: #fff;
    box-shadow: 0 0 0 4px rgba(16,185,129,0.09);
  }
  .tm-input:disabled, .tm-input[readonly] {
    background: #f0f0f5; color: #9090a8; cursor: not-allowed; border-color: #e0e0e8;
  }
  .tm-select {
    appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%239090a8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 16px center; padding-right: 44px;
  }

  .tm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }

  .tm-secret-wrap { position: relative; }
  .tm-secret-wrap .tm-input { padding-right: 50px; }
  .tm-eye {
    position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #b0b0c8;
    padding: 3px; display: flex; align-items: center; transition: color 0.15s;
  }
  .tm-eye:hover { color: #10b981; }

  .tm-divider { height: 1px; background: #f0f0f5; margin: 4px 0; }

  .tm-section-title {
    font-size: 15px; font-weight: 600; color: #1a1a2e;
    margin: 20px 0 16px 0; padding-top: 8px; display: block;
  }

  .tm-actions {
    display: flex; align-items: center; justify-content: flex-end;
    gap: 12px; padding: 28px 44px 36px;
  }

  .tm-instructions {
    background: linear-gradient(135deg, #f0fdf4, #f0fef9);
    border: 1.5px solid #d1fae5;
    border-radius: 13px;
    padding: 28px;
    margin-bottom: 28px;
    font-size: 13.8px;
    color: #1f4b3b;
    line-height: 1.75;
  }
  .tm-instructions h2 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #065f46;
    display: flex; align-items: center; gap: 8px;
  }
  .tm-instructions h3 {
    margin: 18px 0 10px 0;
    font-size: 14px;
    font-weight: 600;
    color: #047857;
    padding-left: 24px;
    position: relative;
  }
  .tm-instructions h3::before {
    content: '';
    position: absolute; left: 0; top: 50%;
    transform: translateY(-50%);
    width: 6px; height: 6px;
    background: #10b981;
    border-radius: 50%;
  }
  .tm-instructions ol, .tm-instructions ul {
    margin: 8px 0 8px 32px;
    padding: 0;
  }
  .tm-instructions li {
    margin: 6px 0;
    padding-left: 8px;
  }
  .tm-instructions strong {
    color: #065f46;
  }
  .tm-instructions code {
    background: rgba(16, 185, 129, 0.08);
    padding: 3px 7px;
    border-radius: 5px;
    font-family: 'Courier New', monospace;
    font-size: 12.5px;
    color: #047857;
  }
  .tm-instructions em {
    color: #0d7557;
  }

  .tm-instructions-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 28px 44px;
    border-bottom: 1.5px solid #d1fae5;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tm-instructions-header:hover {
    background: rgba(16, 185, 129, 0.02);
  }
  .tm-instructions-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #065f46;
  }
  .tm-instructions-toggle {
    background: linear-gradient(135deg, #059669, #10b981);
    border: none;
    border-radius: 8px;
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font-size: 20px; font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .tm-instructions-toggle:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  .tm-instructions-content {
    padding: 28px 44px;
    max-height: 1200px;
    overflow: hidden;
    transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, padding 0.3s ease-in-out;
    opacity: 1;
  }
  .tm-instructions-content.collapsed {
    max-height: 0;
    padding: 0 44px;
    opacity: 0;
  }

  .tm-actions {
    display: flex; align-items: center; justify-content: flex-end;
    gap: 12px; padding: 28px 44px 36px;
  }
  .tm-btn-reset {
    padding: 12px 24px; background: #fff;
    border: 1.5px solid #e4e4ec; border-radius: 11px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    font-weight: 500; color: #6b6b8a; cursor: pointer; transition: all 0.18s;
  }
  .tm-btn-reset:hover { background: #fef2f2; border-color: #fecaca; color: #ef4444; }
  .tm-btn-submit {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 32px;
    background: linear-gradient(135deg, #059669, #10b981);
    border: none; border-radius: 11px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    font-weight: 600; color: #fff; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 4px 16px rgba(16,185,129,0.3);
  }
  .tm-btn-submit:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(16,185,129,0.36); }
  .tm-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .tm-btn-test {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 32px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border: none; border-radius: 11px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    font-weight: 600; color: #fff; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 4px 16px rgba(59,130,246,0.3);
  }
  .tm-btn-test:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(59,130,246,0.4); }
  .tm-btn-test:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .tm-keypair-actions {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 20px 0; border-top: 1px solid #e8e8ee; border-bottom: 1px solid #e8e8ee; margin-bottom: 20px;
  }
  .tm-btn-action {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 16px; background: #f5f5f7; border: 1.5px solid #e4e4ec;
    border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    color: #4b4b6b; cursor: pointer; transition: all 0.2s;
  }
  .tm-btn-action:hover { background: #ebebf0; border-color: #d4d4e4; }
  .tm-btn-action:disabled { opacity: 0.6; cursor: not-allowed; }
  .tm-btn-action.active { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; border-color: #1d4ed8; }
  .tm-btn-action.active:hover { transform: translateY(-1px); box-shadow: 0 3px 12px rgba(59,130,246,0.3); }
  .tm-jwks-modal {
    position: fixed;
    top: 25%;
    left: 30%;
    transform: translate(-50%, -50%);
    background: #ffffff;
    border-radius: 18px;
    padding: 32px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
    z-index: 10001;
    animation: tmFadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }
  .tm-jwks-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.4); z-index: 10000;
  }
  .tm-jwks-header { margin-bottom: 20px; }
  .tm-jwks-header h3 { margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1a1a2e; }
  .tm-jwks-header p { margin: 0; font-size: 13.5px; color: #9090a8; }
  .tm-jwks-content { background: #f9f9fb; border: 1px solid #e8e8ee; border-radius: 12px; padding: 16px;
    font-family: 'Courier New', monospace; font-size: 12.5px; color: #4b4b6b; overflow-x: auto; line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
  .tm-jwks-actions { display: flex; gap: 12px; margin-top: 20px; justify-content: flex-end; }
  .tm-jwks-actions button { padding: 10px 20px; border: none; border-radius: 10px; font-size: 13.5px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; }
  .tm-jwks-copy { background: #10b981; color: #fff; box-shadow: 0 3px 12px rgba(16,185,129,0.3); }
  .tm-jwks-copy:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(16,185,129,0.4); }
  .tm-jwks-close { background: #f5f5f7; color: #4b4b6b; border: 1px solid #e4e4ec; }
  .tm-jwks-close:hover { background: #ebebf0; }

  .tm-confirmation-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.4); z-index: 10000;
  }
  .tm-confirmation-modal {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #ffffff; border-radius: 18px; padding: 32px; max-width: 500px;
    width: 90%; box-shadow: 0 25px 50px rgba(0,0,0,0.25);
    z-index: 10001; animation: tmFadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both;
  }
  .tm-confirmation-header { margin-bottom: 16px; }
  .tm-confirmation-header h3 { margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1a1a2e; }
  .tm-confirmation-content { margin-bottom: 24px; }
  .tm-confirmation-content p { margin: 8px 0; font-size: 14px; color: #4b4b6b; line-height: 1.6; }
  .tm-confirmation-content .warning { color: #ef4444; font-weight: 600; }
  .tm-confirmation-actions { display: flex; gap: 12px; justify-content: flex-end; }
  .tm-confirmation-actions button { padding: 10px 20px; border: none; border-radius: 10px; font-size: 13.5px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; }
  .tm-confirmation-confirm { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; box-shadow: 0 3px 12px rgba(239,68,68,0.3); }
  .tm-confirmation-confirm:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(239,68,68,0.4); }
  .tm-confirmation-cancel { background: #f5f5f7; color: #4b4b6b; border: 1px solid #e4e4ec; }
  .tm-confirmation-cancel:hover { background: #ebebf0; }

  .tm-toast {
    position: fixed; bottom: 32px; right: 32px;
    background: #1a1a2e; color: #fff; border-radius: 13px;
    padding: 15px 22px; font-size: 13.5px; font-weight: 500;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    animation: tmSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both; z-index: 10000;
  }
  @keyframes tmSlideIn { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
  @keyframes tmFadeUp   { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }

  @media (max-width: 700px) {
    .tm-nav { padding: 0 20px; }
    .tm-body { padding: 32px 20px; }
    .tm-breadcrumb { display: none; }
    .tm-form { padding: 28px 24px 8px; gap: 22px; }
    .tm-actions { padding: 22px 24px 30px; }
    .tm-grid-2 { grid-template-columns: 1fr; gap: 22px; }
  }
`;

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const AdminTokenManagement: React.FC = () => {
  const navigate = useNavigate();
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

  // Fetch existing configuration on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = auth.getToken();
        if (!token) {
          console.warn("No access token found - user may not be authenticated");
          return;
        }
        const response = await fetch("/api/v1/token-provider-config", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setForm(result.data);
          }
        }
      } catch (error) {
        console.error("Error loading token configuration:", error);
        // Silently fail - use default form
      }
    };

    const fetchKeypairStatus = async () => {
      try {
        const token = auth.getToken();
        if (!token) return;
        const response = await fetch("/api/v1/keys/status", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (response.ok) {
          const result = await response.json();
          setKeypairStatus(result);
        }
      } catch (error) {
        console.error("Error fetching keypair status:", error);
      }
    };

    fetchConfig();
    fetchKeypairStatus();
  }, []);

  const set = (key: keyof TokenConfig, val: string) => setForm(f => ({ ...f, [key]: val }));

  const showToast = (msg: string, icon = "✅") => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.endpointUrl || !form.clientId || !form.clientSecret || !form.scope || !form.introspectionUrl || !form.introspectionClientId || !form.introspectionClientSecret) {
      showToast("All required fields must be filled.", "⚠️");
      return;
    }

    const token = auth.getToken();
    if (!token) {
      showToast("Not authenticated. Please login first.", "🔐");
      return;
    }

    setLoading(true);
    try {
      const formData = { ...form, groups: form.groups || ["Vega_Admins"] };
      const response = await fetch("/api/v1/token-provider-config", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showToast("Configuration saved to database successfully.");
        }
      } else {
        try {
          const error = await response.json();
          showToast(`Error: ${error.detail || "Failed to save configuration"}`, "❌");
        } catch (jsonError) {
          showToast(`Error: HTTP ${response.status} - Failed to save configuration`, "❌");
        }
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      showToast("Error saving configuration. Please try again.", "❌");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(DEFAULTS);
    showToast("Form cleared.", "🔄");
  };

  const handleTest = async () => {
    const token = auth.getToken();
    if (!token) {
      showToast("Not authenticated. Please login first.", "🔐");
      return;
    }

    if (!form.endpointUrl || !form.clientId || !form.clientSecret || !form.scope || !form.introspectionUrl || !form.introspectionClientId || !form.introspectionClientSecret) {
      showToast("All required fields must be filled before testing.", "⚠️");
      return;
    }

    setTestLoading(true);
    try {
      const response = await fetch("/api/v1/token-provider-config/test", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showToast("✅ Token exchange test passed! All steps successful.", "✅");
        }
      } else {
        try {
          const error = await response.json();
          showToast(`Test failed: ${error.detail || "Token exchange test failed"}`, "❌");
        } catch (jsonError) {
          showToast(`Test failed: HTTP ${response.status}`, "❌");
        }
      }
    } catch (error) {
      console.error("Error testing token exchange:", error);
      showToast("Error testing token exchange. Please try again.", "❌");
    } finally {
      setTestLoading(false);
    }
  };

  const handleGenerateKeypair = async () => {
    const token = auth.getToken();
    if (!token) {
      showToast("Not authenticated. Please login first.", "🔐");
      return;
    }

    // Check current keypair status first
    try {
      const statusResponse = await fetch("/api/v1/keys/status", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        
        // If keys already exist, show confirmation dialog
        if (statusResult.success) {
          setShowKeypairConfirmation(true);
          return;
        }
      }
    } catch (error) {
      console.error("Error checking keypair status:", error);
    }

    // Keys don't exist, proceed with generation
    await proceedWithKeypairGeneration(token, false);
  };

  const proceedWithKeypairGeneration = async (token: string, overwrite: boolean) => {
    setLoadingKeypair(true);
    try {
      const method = overwrite ? "PUT" : "POST";
      const response = await fetch("/api/v1/keys/generate", {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setKeypairStatus({ ...result, success: true });
          showToast(overwrite ? "🔐 RSA keypair rotated successfully!" : "🔐 RSA keypair generated successfully!", "✅");
          setShowKeypairConfirmation(false);
        }
      } else {
        const error = await response.json();
        showToast(`Error: ${error.detail || "Failed to generate keypair"}`, "❌");
      }
    } catch (error) {
      console.error("Error generating keypair:", error);
      showToast("Error generating keypair. Please try again.", "❌");
    } finally {
      setLoadingKeypair(false);
      setShowKeypairConfirmation(false);
    }
  };

  const handleGenerateJwks = async () => {
    const token = auth.getToken();
    if (!token) {
      showToast("Not authenticated. Please login first.", "🔐");
      return;
    }

    setGeneratingJwks(true);
    try {
      const response = await fetch("/api/v1/keys/jwks", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setJwksString(JSON.stringify(result.data || result.jwks));
          setShowJwksModal(true);
          showToast("🗝️ JWKS generated successfully!", "✅");
        }
      } else {
        const error = await response.json();
        showToast(`Error: ${error.detail || "Failed to generate JWKS"}`, "❌");
      }
    } catch (error) {
      console.error("Error generating JWKS:", error);
      showToast("Error generating JWKS. Please try again.", "❌");
    } finally {
      setGeneratingJwks(false);
    }
  };

  const handleCopyJwks = () => {
    if (jwksString) {
      navigator.clipboard.writeText(jwksString);
      showToast("JWKS copied to clipboard!", "📋");
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="tm-root">
        <nav className="tm-nav">
          <div className="tm-nav-left">
            <button className="tm-back-btn" onClick={() => navigate("/system-admin")}><BackIcon /> Back</button>
            <div className="tm-nav-divider" />
            <div className="tm-nav-brand">
              <div className="tm-nav-logo">A</div>
              <span className="tm-nav-title">Admin Panel</span>
            </div>
          </div>
          <div className="tm-breadcrumb">
            <span>Dashboard</span><span>›</span><strong>Token Management</strong>
          </div>
        </nav>

        <main className="tm-body">
          <div className="tm-header">
            <div className="tm-header-icon">🔑</div>
            <div className="tm-header-text">
              <h1>Token Management</h1>
              <p>Configure your token provider credentials and endpoint settings.</p>
            </div>
          </div>

          <div className="tm-card">
            <div className="tm-instructions">
              <div className="tm-instructions-header" onClick={() => setShowInstructions(!showInstructions)}>
                <h2>📚 Instructions</h2>
                <button 
                  type="button"
                  className="tm-instructions-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInstructions(!showInstructions);
                  }}
                  aria-expanded={showInstructions}
                >
                  {showInstructions ? '−' : '+'}
                </button>
              </div>
              <div className={`tm-instructions-content ${!showInstructions ? 'collapsed' : ''}`}>
                <h2 style={{margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px'}}>🔐 Token Exchange (RFC 8693) Architecture</h2>
                <p>The Vega AI application uses a Token Exchange (RFC 8693) architecture to provide secure, identity-propagated access to target systems. This flow allows Vega to exchange a locally signed JWT (representing the authenticated user) for a provider-issued Access Token.</p>

                <h3>Prerequisites</h3>
                <ul>
                  <li>Vega AI requires a dedicated <strong>public/private key pair</strong> to sign identity assertions.</li>
                  <li><strong>Vega AI Side:</strong> Signs a JWT using the private key (per RFC 7523).</li>
                  <li><strong>IdP Side:</strong> Requires the corresponding public key in <code>JWKS</code> format (or via a JWKS URL) to verify the assertion.</li>
                </ul>

                <h3>Identity Provider (IdP) Configuration</h3>
                <p style={{marginTop: '8px'}}>Regardless of your provider (PingFederate, PingOne, Azure AD, Okta), configure the following components:</p>

                <h3 style={{marginTop: '14px'}}>A. Token Processor / Trust Anchor</h3>
                <p style={{marginLeft: '24px', marginTop: '6px'}}>Configure the IdP to trust Vega AI as a <em>"Token Issuer."</em></p>
                <ul style={{marginTop: '6px'}}>
                  <li><strong>Issuer ID:</strong> Set this to the unique ID provided in your Vega AI instance.</li>
                  <li><strong>Validation:</strong> Upload the Vega AI <code>JWKS</code> to allow the IdP to validate the incoming signed JWT.</li>
                </ul>

                <h3>B. The Exchange Client (Grant Client)</h3>
                <p style={{marginLeft: '24px', marginTop: '6px'}}>Create an OAuth client used by Vega AI to request tokens.</p>
                <ul style={{marginTop: '6px'}}>
                  <li><strong>Allowed Grant Type:</strong> <code>urn:ietf:params:oauth:grant-type:token-exchange</code></li>
                  <li><strong>Authentication Method:</strong> Client ID and Client Secret.</li>
                  <li><strong>Attributes:</strong> Ensure this client is mapped to a Token Manager that includes <code>sub</code> (subject), <code>groups</code> (roles), and <code>scope</code> in the issued Access Token.</li>
                </ul>

                <h3>C. The Introspection Client</h3>
                <p style={{marginLeft: '24px', marginTop: '6px'}}>Create a separate, restricted client used by Target Systems to validate tokens.</p>
                <ul style={{marginTop: '6px'}}>
                  <li><strong>Allowed Operations:</strong> Token Introspection (<code>/introspect</code>).</li>
                  <li><strong>Authentication Method:</strong> Client ID and Client Secret.</li>
                </ul>
              </div>
            </div>

            <form className="tm-form" onSubmit={handleSubmit}>
              <h3 className="tm-section-title">🔐 Vega AI JWT Generation:</h3>
              <div className="tm-field">
                <label>Issuer</label>
                <input
                  className="tm-input"
                  type="text"
                  placeholder="e.g., vega-ai"
                  value={form.issuer || ""}
                  onChange={e => set("issuer", e.target.value)}
                />
                <span className="tm-hint">Your Vega AI instance issuer ID (shown to identity provider)</span>
              </div>

              <div className="tm-field">
                <label>Audience</label>
                <input
                  className="tm-input"
                  type="text"
                  placeholder="e.g., https://auth.example.com"
                  value={form.audience || ""}
                  onChange={e => set("audience", e.target.value)}
                />
                <span className="tm-hint">Your identity provider audience identifier</span>
              </div>

              <div className="tm-keypair-actions">
                <button 
                  type="button" 
                  className="tm-btn-action" 
                  disabled={loadingKeypair}
                  onClick={handleGenerateKeypair}
                >
                  {loadingKeypair ? "🔄 Generating…" : "🔑 Generate Keypair"}
                </button>
                <button 
                  type="button" 
                  className="tm-btn-action active" 
                  disabled={generatingJwks}
                  onClick={handleGenerateJwks}
                >
                  {generatingJwks ? "🔄 Generating…" : "📋 Generate JWKS"}
                </button>
              </div>

              <div className="tm-divider" />

              <h3 className="tm-section-title">🔑 Token Provider Configuration:</h3>
              <div className="tm-field">
                <label><span className="tm-req" />Token Provider Endpoint</label>
                <input
                  className="tm-input"
                  type="url"
                  placeholder="https://auth.example.com/oauth2/token"
                  value={form.endpointUrl}
                  onChange={e => set("endpointUrl", e.target.value)}
                />
                <span className="tm-hint">The token endpoint URL of your identity provider.</span>
              </div>

              <div className="tm-field">
                <label><span className="tm-req" />Client ID</label>
                <input
                  className="tm-input"
                  placeholder="your-client-id"
                  value={form.clientId}
                  onChange={e => set("clientId", e.target.value)}
                />
              </div>

              <div className="tm-field">
                <label><span className="tm-req" />Client Secret</label>
                <div className="tm-secret-wrap">
                  <input
                    className="tm-input"
                    type={showSecret ? "text" : "password"}
                    placeholder="••••••••••••••••••••"
                    value={form.clientSecret}
                    onChange={e => set("clientSecret", e.target.value)}
                  />
                  <button type="button" className="tm-eye" onClick={() => setShowSecret(s => !s)}>
                    <EyeIcon open={showSecret} />
                  </button>
                </div>
              </div>
                <div className="tm-field">
                  <label><span className="tm-req" />Scope</label>
                  <input
                    className="tm-input"
                    placeholder="urn:vega:admin"
                    value={form.scope}
                    onChange={e => set("scope", e.target.value)}
                  />
                  <span className="tm-hint">Space-separated OAuth scopes</span>
                </div>

              <div className="tm-divider" />

              <h3 className="tm-section-title">🔍 Token Introspection Configuration:</h3>
              <div className="tm-field">
                <label><span className="tm-req" />Introspection Endpoint URL</label>
                <input
                  className="tm-input"
                  type="url"
                  placeholder="https://auth.example.com/oauth2/introspect"
                  value={form.introspectionUrl}
                  onChange={e => set("introspectionUrl", e.target.value)}
                />
                <span className="tm-hint">The introspection endpoint URL of your identity provider.</span>
              </div>

              <div className="tm-field">
                <label><span className="tm-req" />Introspection Client ID</label>
                <input
                  className="tm-input"
                  placeholder="introspection-client-id"
                  value={form.introspectionClientId}
                  onChange={e => set("introspectionClientId", e.target.value)}
                />
              </div>

              <div className="tm-field">
                <label><span className="tm-req" />Introspection Client Secret</label>
                <div className="tm-secret-wrap">
                  <input
                    className="tm-input"
                    type={showIntrospectionSecret ? "text" : "password"}
                    placeholder="••••••••••••••••••••"
                    value={form.introspectionClientSecret}
                    onChange={e => set("introspectionClientSecret", e.target.value)}
                  />
                  <button type="button" className="tm-eye" onClick={() => setShowIntrospectionSecret(s => !s)}>
                    <EyeIcon open={showIntrospectionSecret} />
                  </button>
                </div>
              </div>
            </form>

            <div className="tm-actions">
              <button type="button" className="tm-btn-reset" onClick={handleReset}>Reset</button>
              <button type="button" className="tm-btn-test" disabled={testLoading} onClick={handleTest}>
                {testLoading ? "Testing…" : "🧪 Test Token Exchange"}
              </button>
              <button type="submit" className="tm-btn-submit" disabled={loading} onClick={handleSubmit}>
                {loading ? "Saving…" : "💾 Save Configuration"}
              </button>
            </div>
          </div>
        </main>
      </div>

      {toast && <div className="tm-toast"><span>{toast.icon}</span>{toast.msg}</div>}

      {showJwksModal && (
        <>
          <div className="tm-jwks-overlay" onClick={() => setShowJwksModal(false)} />
          <div className="tm-jwks-modal">
            <div className="tm-jwks-header">
              <h3>🗝️ JWKS JSON Web Key Set</h3>
              <p>Share this public key configuration with your identity provider.</p>
            </div>
            <div className="tm-jwks-content">
              {jwksString}
            </div>
            <div className="tm-jwks-actions">
              <button type="button" className="tm-jwks-copy" onClick={handleCopyJwks}>
                📋 Copy to Clipboard
              </button>
              <button type="button" className="tm-jwks-close" onClick={() => setShowJwksModal(false)}>
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {showKeypairConfirmation && (
        <>
          <div className="tm-confirmation-overlay" onClick={() => setShowKeypairConfirmation(false)} />
          <div className="tm-confirmation-modal">
            <div className="tm-confirmation-header">
              <h3>⚠️ Overwrite RSA Keypair?</h3>
            </div>
            <div className="tm-confirmation-content">
              <p>A keypair already exists in the system. Generating a new keypair will:</p>
              <p className="warning">⚠️ Permanently replace the existing keypair</p>
              <p>This action is <strong>IRREVOCABLE</strong>. Any existing JWTs signed with the old key will no longer be valid. Identity providers will need to be updated with the new JWKS.</p>
              <p>Are you sure you want to proceed?</p>
            </div>
            <div className="tm-confirmation-actions">
              <button 
                type="button" 
                className="tm-confirmation-cancel" 
                onClick={() => setShowKeypairConfirmation(false)}
                disabled={loadingKeypair}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="tm-confirmation-confirm" 
                onClick={() => proceedWithKeypairGeneration(auth.getToken() || "", true)}
                disabled={loadingKeypair}
              >
                {loadingKeypair ? "🔄 Generating…" : "Yes, Overwrite Keypair"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdminTokenManagement;
