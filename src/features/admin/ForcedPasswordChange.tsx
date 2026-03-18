import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { auth } from '../../utils/auth';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap');

  html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
  #root { width: 100% !important; min-height: 100vh !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }

  .fpc-root {
    position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
    width: 100vw !important; height: 100vh !important;
    font-family: 'DM Sans', sans-serif;
    background: #f5f5f7; overflow-y: auto; z-index: 9999 !important; box-sizing: border-box;
    display: flex; align-items: center; justify-content: center;
    padding: var(--fpc-root-p);
  }

  .fpc-card {
    background: #ffffff; border: 1px solid #e8e8ee;
    border-radius: var(--fpc-card-br);
    box-shadow: 0 8px 40px rgba(0,0,0,0.07);
    width: 100%; max-width: var(--fpc-card-max-w);
    padding: var(--fpc-card-p);
    animation: fpcFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }

  .fpc-icon-wrap {
    width: var(--fpc-icon-sz); height: var(--fpc-icon-sz);
    border-radius: var(--fpc-icon-br);
    background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--fpc-icon-fs); margin-bottom: var(--fpc-icon-mb);
  }

  .fpc-heading {
    font-size: var(--fpc-heading-fs); font-weight: 700; color: #0a0a0a;
    letter-spacing: -0.03em; margin: 0 0 var(--fpc-heading-mb); line-height: 1.15;
  }

  .fpc-sub {
    font-size: var(--fpc-sub-fs); color: #9090a8;
    margin: 0 0 var(--fpc-sub-mb); font-weight: 300; line-height: 1.6;
  }

  .fpc-sep {
    height: 1px; background: #f0f0f5; margin: var(--fpc-sep-my);
  }

  .fpc-error-box {
    background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;
    padding: var(--fpc-error-p); margin-bottom: var(--fpc-error-mb);
    font-size: var(--fpc-error-fs); color: #ef4444; font-weight: 400;
  }

  .fpc-field { margin-bottom: var(--fpc-field-mb); }

  .fpc-label {
    display: block; font-size: var(--fpc-label-fs); font-weight: 600;
    color: #4b4b6b; margin-bottom: var(--fpc-label-mb);
    text-transform: uppercase; letter-spacing: 0.06em;
  }

  .fpc-input {
    width: 100%; padding: var(--fpc-input-p);
    background: #fafafa; border: 1.5px solid #e8e8ee;
    border-radius: var(--fpc-input-br); font-family: 'DM Sans', sans-serif;
    font-size: var(--fpc-input-fs); color: #1a1a2e; outline: none;
    transition: all 0.18s; box-sizing: border-box;
  }
  .fpc-input::placeholder { color: #c8c8d8; }
  .fpc-input:focus { border-color: #7c3aed; background: #fff; box-shadow: 0 0 0 4px rgba(124,58,237,0.09); }
  .fpc-input-err { border-color: #fca5a5 !important; }
  .fpc-input-err:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 4px rgba(239,68,68,0.09) !important; }
  .fpc-field-error { font-size: var(--fpc-field-err-fs); color: #ef4444; margin-top: 5px; display: block; }

  .fpc-strength-bar-wrap {
    margin-top: var(--fpc-strength-mt); display: flex; align-items: center; gap: var(--fpc-strength-gap);
  }
  .fpc-strength-seg {
    flex: 1; height: var(--fpc-strength-h); border-radius: 4px;
    background: #e8e8ee; transition: background 0.25s;
  }
  .fpc-strength-label {
    font-size: var(--fpc-strength-lbl-fs); font-weight: 600; min-width: 44px;
    text-align: right; letter-spacing: 0.02em;
  }
  .fpc-s0 { background: #e8e8ee; }
  .fpc-s1 { background: #ef4444; }
  .fpc-s2 { background: #f59e0b; }
  .fpc-s3 { background: #3b82f6; }
  .fpc-s4 { background: #10b981; }

  .fpc-reqs {
    margin-top: var(--fpc-reqs-mt); padding: var(--fpc-reqs-p);
    background: #fafafa; border: 1px solid #f0f0f5;
    border-radius: var(--fpc-reqs-br);
  }
  .fpc-reqs-title {
    font-size: var(--fpc-reqs-title-fs); font-weight: 600; letter-spacing: 0.07em;
    text-transform: uppercase; color: #b0b0c8; margin-bottom: var(--fpc-reqs-title-mb);
  }
  .fpc-req-item {
    display: flex; align-items: center; gap: 7px;
    font-size: var(--fpc-req-fs); color: #b0b0c8; margin-bottom: var(--fpc-req-mb); transition: color 0.18s;
  }
  .fpc-req-item:last-child { margin-bottom: 0; }
  .fpc-req-item.met { color: #10b981; }
  .fpc-req-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #d1d5db; flex-shrink: 0; transition: background 0.18s;
  }
  .fpc-req-item.met .fpc-req-dot { background: #10b981; }

  .fpc-match {
    display: flex; align-items: center; gap: 7px;
    font-size: var(--fpc-match-fs); font-weight: 500; margin-top: var(--fpc-match-mt);
  }
  .fpc-match.ok { color: #10b981; }
  .fpc-match.no { color: #ef4444; }
  .fpc-match-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: currentColor; flex-shrink: 0;
  }

  .fpc-submit {
    width: 100%; margin-top: var(--fpc-submit-mt); padding: var(--fpc-submit-p);
    background: #111; border: none; border-radius: var(--fpc-submit-br);
    font-family: 'DM Sans', sans-serif; font-size: var(--fpc-submit-fs); font-weight: 600;
    color: #fff; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .fpc-submit:hover:not(:disabled) { background: #333; }
  .fpc-submit:disabled { opacity: 0.55; cursor: not-allowed; }

  @keyframes fpcFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fpcSpin { to { transform: rotate(360deg); } }
  .fpc-spin { animation: fpcSpin 0.8s linear infinite; }

  /* =====================================================================
     RESPONSIVE TOKENS — 1920×1080 is the baseline (default :root).
     This is a centered card UI so we scale card size, padding & type.
     No UI, structure, features, comments, or logic is altered.
     ===================================================================== */

  /* ── BASELINE : 1920×1080 ────────────────────────────────────────── */
  :root {
    --fpc-root-p:           32px 20px;
    --fpc-card-max-w:       480px;
    --fpc-card-p:           44px 44px 40px;
    --fpc-card-br:          24px;
    --fpc-icon-sz:          56px;
    --fpc-icon-br:          16px;
    --fpc-icon-fs:          24px;
    --fpc-icon-mb:          22px;
    --fpc-heading-fs:       30px;
    --fpc-heading-mb:       8px;
    --fpc-sub-fs:           14px;
    --fpc-sub-mb:           32px;
    --fpc-sep-my:           6px 0 28px;
    --fpc-error-p:          12px 16px;
    --fpc-error-mb:         24px;
    --fpc-error-fs:         13.5px;
    --fpc-field-mb:         20px;
    --fpc-label-fs:         13px;
    --fpc-label-mb:         7px;
    --fpc-input-p:          12px 16px;
    --fpc-input-fs:         14px;
    --fpc-input-br:         11px;
    --fpc-field-err-fs:     12px;
    --fpc-strength-mt:      10px;
    --fpc-strength-gap:     6px;
    --fpc-strength-h:       4px;
    --fpc-strength-lbl-fs:  11.5px;
    --fpc-reqs-mt:          10px;
    --fpc-reqs-p:           12px 14px;
    --fpc-reqs-br:          10px;
    --fpc-reqs-title-fs:    11px;
    --fpc-reqs-title-mb:    8px;
    --fpc-req-fs:           12.5px;
    --fpc-req-mb:           5px;
    --fpc-match-fs:         12.5px;
    --fpc-match-mt:         8px;
    --fpc-submit-p:         14px 24px;
    --fpc-submit-fs:        14px;
    --fpc-submit-br:        12px;
    --fpc-submit-mt:        8px;
  }

  /* ── LARGE DESKTOP / 4K : >1920px ───────────────────────────────── */
  @media (min-width: 1921px) {
    :root {
      --fpc-root-p:           48px 32px;
      --fpc-card-max-w:       600px;
      --fpc-card-p:           60px 60px 56px;
      --fpc-card-br:          32px;
      --fpc-icon-sz:          72px;
      --fpc-icon-br:          20px;
      --fpc-icon-fs:          32px;
      --fpc-icon-mb:          28px;
      --fpc-heading-fs:       40px;
      --fpc-heading-mb:       12px;
      --fpc-sub-fs:           17px;
      --fpc-sub-mb:           40px;
      --fpc-sep-my:           8px 0 36px;
      --fpc-error-p:          16px 20px;
      --fpc-error-mb:         30px;
      --fpc-error-fs:         16px;
      --fpc-field-mb:         26px;
      --fpc-label-fs:         15px;
      --fpc-label-mb:         9px;
      --fpc-input-p:          15px 20px;
      --fpc-input-fs:         16px;
      --fpc-input-br:         14px;
      --fpc-field-err-fs:     14px;
      --fpc-strength-mt:      13px;
      --fpc-strength-gap:     8px;
      --fpc-strength-h:       5px;
      --fpc-strength-lbl-fs:  13px;
      --fpc-reqs-mt:          13px;
      --fpc-reqs-p:           16px 18px;
      --fpc-reqs-br:          13px;
      --fpc-reqs-title-fs:    13px;
      --fpc-reqs-title-mb:    10px;
      --fpc-req-fs:           15px;
      --fpc-req-mb:           7px;
      --fpc-match-fs:         15px;
      --fpc-match-mt:         10px;
      --fpc-submit-p:         18px 28px;
      --fpc-submit-fs:        17px;
      --fpc-submit-br:        15px;
      --fpc-submit-mt:        12px;
    }
  }

  /* ── LAPTOP : 1280–1919px ─────────────────────────────────────────
     Covers MacBook Pro 14" (1512px scaled), 15"/16" (1680px scaled),
     standard 1280–1440 laptops. Card looks identical to 1920 baseline,
     just proportionally tighter.
  ─────────────────────────────────────────────────────────────────── */
  @media (min-width: 1280px) and (max-width: 1919px) {
    :root {
      --fpc-root-p:           24px 16px;
      --fpc-card-max-w:       420px;
      --fpc-card-p:           36px 36px 32px;
      --fpc-card-br:          20px;
      --fpc-icon-sz:          48px;
      --fpc-icon-br:          14px;
      --fpc-icon-fs:          20px;
      --fpc-icon-mb:          18px;
      --fpc-heading-fs:       24px;
      --fpc-heading-mb:       6px;
      --fpc-sub-fs:           13px;
      --fpc-sub-mb:           24px;
      --fpc-sep-my:           4px 0 22px;
      --fpc-error-p:          10px 14px;
      --fpc-error-mb:         20px;
      --fpc-error-fs:         12.5px;
      --fpc-field-mb:         16px;
      --fpc-label-fs:         11.5px;
      --fpc-label-mb:         6px;
      --fpc-input-p:          10px 13px;
      --fpc-input-fs:         13px;
      --fpc-input-br:         10px;
      --fpc-field-err-fs:     11px;
      --fpc-strength-mt:      8px;
      --fpc-strength-gap:     5px;
      --fpc-strength-h:       3px;
      --fpc-strength-lbl-fs:  10.5px;
      --fpc-reqs-mt:          8px;
      --fpc-reqs-p:           10px 12px;
      --fpc-reqs-br:          9px;
      --fpc-reqs-title-fs:    10px;
      --fpc-reqs-title-mb:    6px;
      --fpc-req-fs:           11.5px;
      --fpc-req-mb:           4px;
      --fpc-match-fs:         11.5px;
      --fpc-match-mt:         6px;
      --fpc-submit-p:         12px 20px;
      --fpc-submit-fs:        13px;
      --fpc-submit-br:        10px;
      --fpc-submit-mt:        6px;
    }
  }

  /* ── SMALL LAPTOP : 1024–1279px ─────────────────────────────────── */
  @media (min-width: 1024px) and (max-width: 1279px) {
    :root {
      --fpc-root-p:           20px 14px;
      --fpc-card-max-w:       400px;
      --fpc-card-p:           30px 30px 28px;
      --fpc-card-br:          18px;
      --fpc-icon-sz:          44px;
      --fpc-icon-br:          12px;
      --fpc-icon-fs:          18px;
      --fpc-icon-mb:          16px;
      --fpc-heading-fs:       22px;
      --fpc-heading-mb:       6px;
      --fpc-sub-fs:           12.5px;
      --fpc-sub-mb:           22px;
      --fpc-sep-my:           4px 0 20px;
      --fpc-error-p:          9px 13px;
      --fpc-error-mb:         18px;
      --fpc-error-fs:         12px;
      --fpc-field-mb:         15px;
      --fpc-label-fs:         11px;
      --fpc-label-mb:         5px;
      --fpc-input-p:          9px 12px;
      --fpc-input-fs:         12.5px;
      --fpc-input-br:         9px;
      --fpc-field-err-fs:     11px;
      --fpc-strength-mt:      7px;
      --fpc-strength-gap:     5px;
      --fpc-strength-h:       3px;
      --fpc-strength-lbl-fs:  10px;
      --fpc-reqs-mt:          7px;
      --fpc-reqs-p:           9px 11px;
      --fpc-reqs-br:          8px;
      --fpc-reqs-title-fs:    9.5px;
      --fpc-reqs-title-mb:    5px;
      --fpc-req-fs:           11px;
      --fpc-req-mb:           4px;
      --fpc-match-fs:         11px;
      --fpc-match-mt:         5px;
      --fpc-submit-p:         11px 18px;
      --fpc-submit-fs:        12.5px;
      --fpc-submit-br:        9px;
      --fpc-submit-mt:        5px;
    }
  }

  /* ── TABLET : 768–1023px ─────────────────────────────────────────── */
  @media (min-width: 768px) and (max-width: 1023px) {
    :root {
      --fpc-root-p:           16px 12px;
      --fpc-card-max-w:       380px;
      --fpc-card-p:           28px 28px 24px;
      --fpc-card-br:          16px;
      --fpc-icon-sz:          40px;
      --fpc-icon-br:          11px;
      --fpc-icon-fs:          17px;
      --fpc-icon-mb:          14px;
      --fpc-heading-fs:       20px;
      --fpc-heading-mb:       5px;
      --fpc-sub-fs:           12px;
      --fpc-sub-mb:           20px;
      --fpc-sep-my:           3px 0 18px;
      --fpc-error-p:          9px 12px;
      --fpc-error-mb:         16px;
      --fpc-error-fs:         11.5px;
      --fpc-field-mb:         14px;
      --fpc-label-fs:         10.5px;
      --fpc-label-mb:         5px;
      --fpc-input-p:          9px 11px;
      --fpc-input-fs:         12px;
      --fpc-input-br:         9px;
      --fpc-field-err-fs:     10.5px;
      --fpc-strength-mt:      7px;
      --fpc-strength-gap:     4px;
      --fpc-strength-h:       3px;
      --fpc-strength-lbl-fs:  10px;
      --fpc-reqs-mt:          7px;
      --fpc-reqs-p:           8px 10px;
      --fpc-reqs-br:          8px;
      --fpc-reqs-title-fs:    9px;
      --fpc-reqs-title-mb:    5px;
      --fpc-req-fs:           10.5px;
      --fpc-req-mb:           3px;
      --fpc-match-fs:         10.5px;
      --fpc-match-mt:         5px;
      --fpc-submit-p:         10px 16px;
      --fpc-submit-fs:        12px;
      --fpc-submit-br:        9px;
      --fpc-submit-mt:        5px;
    }
  }
`;

export default function ForcedPasswordChange() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);

  // Determine the page user was trying to access
  useEffect(() => {
    // Check for 'from' parameter in URL query string (e.g., ?from=/system-admin)
    const fromParam = searchParams.get('from');
    
    // Check for state passed through navigation (e.g., location.state?.from?.pathname)
    const fromLocation = (location.state as any)?.from;
    const fromState = fromLocation?.pathname || fromLocation;
    
    // Use whichever is available, prioritizing query param
    const destination = fromParam || fromState;
    
    if (destination) {
      setIntendedDestination(destination);
      console.log(`Password change required. User was trying to access: ${destination}`);
    } else {
      console.log('No previously attempted destination found. Will redirect based on role.');
    }
  }, [searchParams, location]);

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    setPasswordStrength(strength);
    return strength;
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setNewPassword(pwd);
    checkPasswordStrength(pwd);
    setErrors(prev => ({ ...prev, newPassword: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character (!@#$%^&*)';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await api.fetchWithAuth('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setGlobalError(errorData.detail || 'Failed to change password');
        setLoading(false);
        return;
      }

      // Password changed successfully
      // Clear the force password reset flag
      localStorage.removeItem('forcePasswordReset');
      
      // Update user object to reflect password change
      const user = auth.getCurrentUser();
      if (user) {
        user.force_password_reset = false;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      // Determine redirect destination
      let redirectPath = intendedDestination || '/agent_dashboard'; // Default fallback
      
      if (intendedDestination) {
        // User was trying to access a specific page
        // Verify they have permission for that page
        if (intendedDestination === '/system-admin' || intendedDestination.startsWith('/system-admin')) {
          // Trying to access admin page
          if (!auth.isAdmin()) {
            // User doesn't have admin permission, redirect to main dashboard
            console.warn('User lacks admin permission for intended destination. Redirecting to dashboard.');
            redirectPath = '/agent_dashboard';
          } else {
            redirectPath = intendedDestination;
          }
        } else {
          // For other pages (agent_dashboard, etc.), allow redirect
          redirectPath = intendedDestination;
        }
      } else {
        // No intended destination - use login source and role-based default
        const loginSource = localStorage.getItem('loginSource');
        
        // Only redirect to system-admin if:
        // 1. User logged in from system-admin-login endpoint AND
        // 2. User is actually an admin
        if (loginSource === 'system-admin-login' && auth.isAdmin()) {
          redirectPath = '/system-admin';
        } else {
          // For normal login or non-admin users, redirect to agent dashboard
          redirectPath = '/agent_dashboard';
        }
      }
      
      console.log(`Password changed successfully. Redirecting to: ${redirectPath}`);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setGlobalError(err.message || 'An error occurred while changing password');
      setLoading(false);
    }
  };

  const strengthColor = ['fpc-s0', 'fpc-s1', 'fpc-s2', 'fpc-s3', 'fpc-s4'][passwordStrength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthLabelColor = ['#b0b0c8', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][passwordStrength];

  return (
    <>
      <style>{STYLES}</style>
      <div className="fpc-root">
        <div className="fpc-card">

          {/* Icon + heading */}
          <div className="fpc-icon-wrap">🔑</div>
          <h1 className="fpc-heading">Change Your Password</h1>
          <p className="fpc-sub">You must set a new password before accessing Vega. Use your current (temporary) password to verify.</p>
          <div className="fpc-sep" />

          {/* Global error */}
          {globalError && (
            <div className="fpc-error-box">{globalError}</div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Current password */}
            <div className="fpc-field">
              <label className="fpc-label" htmlFor="currentPassword">Current Password</label>
              <input
                type="password" id="currentPassword"
                className={`fpc-input${errors.currentPassword ? ' fpc-input-err' : ''}`}
                value={currentPassword}
                placeholder="Enter your current password"
                onChange={(e) => { setCurrentPassword(e.target.value); setErrors(prev => ({ ...prev, currentPassword: '' })); }}
              />
              {errors.currentPassword && <span className="fpc-field-error">{errors.currentPassword}</span>}
            </div>

            {/* New password */}
            <div className="fpc-field">
              <label className="fpc-label" htmlFor="newPassword">New Password</label>
              <input
                type="password" id="newPassword"
                className={`fpc-input${errors.newPassword ? ' fpc-input-err' : ''}`}
                value={newPassword}
                placeholder="Enter new password"
                onChange={handleNewPasswordChange}
              />

              {/* Strength bar */}
              {newPassword && (
                <div className="fpc-strength-bar-wrap">
                  {[1,2,3,4].map(i => (
                    <div
                      key={i}
                      className="fpc-strength-seg"
                      style={{ background: i <= passwordStrength ? strengthLabelColor : undefined }}
                    />
                  ))}
                  <span className="fpc-strength-label" style={{ color: strengthLabelColor }}>{strengthLabel}</span>
                </div>
              )}

              {errors.newPassword && <span className="fpc-field-error">{errors.newPassword}</span>}

              {/* Requirements checklist */}
              <div className="fpc-reqs">
                <div className="fpc-reqs-title">Requirements</div>
                {[
                  { label: 'At least 8 characters', met: newPassword.length >= 8 },
                  { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
                  { label: 'One number', met: /[0-9]/.test(newPassword) },
                  { label: 'One special character (!@#$%^&*)', met: /[!@#$%^&*]/.test(newPassword) },
                ].map(({ label, met }) => (
                  <div key={label} className={`fpc-req-item${met ? ' met' : ''}`}>
                    <div className="fpc-req-dot" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm password */}
            <div className="fpc-field">
              <label className="fpc-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password" id="confirmPassword"
                className={`fpc-input${errors.confirmPassword ? ' fpc-input-err' : ''}`}
                value={confirmPassword}
                placeholder="Re-enter new password"
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: '' })); }}
              />
              {confirmPassword && (
                <div className={`fpc-match ${newPassword === confirmPassword ? 'ok' : 'no'}`}>
                  <div className="fpc-match-dot" />
                  {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}
              {errors.confirmPassword && <span className="fpc-field-error">{errors.confirmPassword}</span>}
            </div>

            {/* Submit */}
            <button type="submit" className="fpc-submit" disabled={loading}>
              {loading ? (
                <>
                  <svg className="fpc-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Updating...
                </>
              ) : 'Set New Password'}
            </button>

          </form>
        </div>
      </div>
    </>
  );
}