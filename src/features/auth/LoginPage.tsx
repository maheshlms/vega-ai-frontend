import React, { useState, useEffect, useRef } from 'react';
import Btn from '../../components/Btn';
import InputField from '../../components/InputField';
import MouseMove from '../../effects/MouseMove';
import FloatingDots from '../../effects/FloatingDots';
import { GoSun } from "react-icons/go";
import { MdOutlineDarkMode } from "react-icons/md";
import { IoSettingsSharp } from "react-icons/io5";
// import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { auth } from '../../utils/auth';

const LoginPage: React.FC = () => {

  const [dark, setDark] = useState<boolean>(false);
  const [showAdminMenu, setShowAdminMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // const { loginWithRedirect, isLoading: auth0Loading } = useAuth0();
  const navigate = useNavigate();
  
  // Native login state
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAdminMenu(false);
      }
    };

    if (showAdminMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAdminMenu]);

  // const handleAuth0Login = (): void => {
  //   loginWithRedirect();
  // };

  const handleNativeLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      // Call native login API
      const response = await api.nativeLogin({
        username: username.trim(),
        password: password
      });

      console.log('✅ Native login successful:', response);
      console.log('📦 Response structure - hasAccessToken:', !!response.access_token, 
                  'hasUser:', !!response.user, 'hasSession:', !!response.session,
                  'expiresIn:', response.expires_in, 'forcePasswordReset:', response.force_password_reset);

      // Store token and user info using auth utility with all response fields
      if (response.access_token && response.user) {
        auth.storeNativeAuthData(
          response.access_token, 
          response.user,
          response.expires_in,
          response.session
        );

        // Mark that user logged in from normal login endpoint
        localStorage.setItem('loginSource', 'normal-login');

        // Check if user needs to change password (from root level or user object)
        const needsPasswordChange = response.force_password_reset || response.user?.force_password_reset;
        if (needsPasswordChange) {
          navigate('/forced-password-change');
        } else {
          // Redirect to agent dashboard
          navigate('/agent_dashboard');
        }
      } else {
        setError('Login failed: Invalid response from server');
      }
    } catch (err: any) {
      console.error('❌ Native login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap');
        .lp-font, .lp-font * { font-family: 'DM Sans', sans-serif; }
        .lp-admin-menu {
          position: absolute; top: calc(100% + 6px); right: 0;
          width: 152px; background: var(--card-bg, #fff);
          border: 1px solid rgba(0,0,0,0.1); border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden; z-index: 50;
        }
        .lp-admin-menu button {
          width: 100%; padding: 9px 14px;
          font-size: 13px; font-weight: 500; color: var(--text-main, #374151);
          background: none; border: none; text-align: left;
          cursor: pointer; transition: background 0.12s;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-admin-menu button:hover { background: rgba(0,0,0,0.04); }

        /* =====================================================================
           RESPONSIVE TOKENS — 1920×1080 is the baseline (default :root).
           This is a centered card UI — we scale card width, padding & type.
           No UI, structure, features, comments, or logic is altered.
           ===================================================================== */

        /* ── BASELINE : 1920×1080 ────────────────────────────────────────── */
        :root {
          --lp-card-w:       420px;
          --lp-card-br:      16px;
          --lp-card-pb:      24px;
          --lp-logo-h:       128px;
          --lp-logo-pt:      24px;
          --lp-h1-fs:        24px;
          --lp-h1-mt:        16px;
          --lp-sub-fs:       12px;
          --lp-sub-mb:       24px;
          --lp-form-px:      28px;
          --lp-label-fs:     14px;
          --lp-input-px:     12px;
          --lp-input-py:     8px;
          --lp-btn-h:        40px;
          --lp-divider-my:   24px;
          --lp-divider-fs:   12px;
          --lp-footer-mt:    24px;
          --lp-footer-fs:    12px;
        }

        /* ── LARGE DESKTOP / 4K : >1920px ───────────────────────────────── */
        @media (min-width: 1921px) {
          :root {
            --lp-card-w:       560px;
            --lp-card-br:      22px;
            --lp-card-pb:      32px;
            --lp-logo-h:       172px;
            --lp-logo-pt:      32px;
            --lp-h1-fs:        32px;
            --lp-h1-mt:        22px;
            --lp-sub-fs:       15px;
            --lp-sub-mb:       32px;
            --lp-form-px:      40px;
            --lp-label-fs:     17px;
            --lp-input-px:     16px;
            --lp-input-py:     11px;
            --lp-btn-h:        52px;
            --lp-divider-my:   32px;
            --lp-divider-fs:   14px;
            --lp-footer-mt:    32px;
            --lp-footer-fs:    14px;
          }
        }

        /* ── LAPTOP : 1280–1919px ─────────────────────────────────────────
           Covers MacBook Pro 14" (1512px scaled), 15"/16" (1680px scaled),
           standard 1280–1440 laptops. Card looks identical to 1920 baseline.
        ─────────────────────────────────────────────────────────────────── */
        @media (min-width: 1280px) and (max-width: 1919px) {
          :root {
            --lp-card-w:       380px;
            --lp-card-br:      14px;
            --lp-card-pb:      20px;
            --lp-logo-h:       108px;
            --lp-logo-pt:      20px;
            --lp-h1-fs:        20px;
            --lp-h1-mt:        13px;
            --lp-sub-fs:       11px;
            --lp-sub-mb:       20px;
            --lp-form-px:      24px;
            --lp-label-fs:     13px;
            --lp-input-px:     10px;
            --lp-input-py:     7px;
            --lp-btn-h:        36px;
            --lp-divider-my:   20px;
            --lp-divider-fs:   11px;
            --lp-footer-mt:    20px;
            --lp-footer-fs:    11px;
          }
        }

        /* ── SMALL LAPTOP : 1024–1279px ─────────────────────────────────── */
        @media (min-width: 1024px) and (max-width: 1279px) {
          :root {
            --lp-card-w:       360px;
            --lp-card-br:      13px;
            --lp-card-pb:      18px;
            --lp-logo-h:       96px;
            --lp-logo-pt:      18px;
            --lp-h1-fs:        18px;
            --lp-h1-mt:        12px;
            --lp-sub-fs:       11px;
            --lp-sub-mb:       18px;
            --lp-form-px:      22px;
            --lp-label-fs:     12.5px;
            --lp-input-px:     10px;
            --lp-input-py:     7px;
            --lp-btn-h:        34px;
            --lp-divider-my:   18px;
            --lp-divider-fs:   10.5px;
            --lp-footer-mt:    18px;
            --lp-footer-fs:    10.5px;
          }
        }

        /* ── TABLET : 768–1023px ─────────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          :root {
            --lp-card-w:       340px;
            --lp-card-br:      12px;
            --lp-card-pb:      16px;
            --lp-logo-h:       88px;
            --lp-logo-pt:      16px;
            --lp-h1-fs:        17px;
            --lp-h1-mt:        11px;
            --lp-sub-fs:       10.5px;
            --lp-sub-mb:       16px;
            --lp-form-px:      20px;
            --lp-label-fs:     12px;
            --lp-input-px:     9px;
            --lp-input-py:     6px;
            --lp-btn-h:        32px;
            --lp-divider-my:   16px;
            --lp-divider-fs:   10px;
            --lp-footer-mt:    16px;
            --lp-footer-fs:    10px;
          }
        }

        /* ── COMPONENT STYLES — all sizing via CSS vars ──────────────────── */
        .lp-card        { width: var(--lp-card-w); border-radius: var(--lp-card-br); padding-bottom: var(--lp-card-pb); }
        .lp-logo-wrap   { display: flex; justify-content: center; padding-top: var(--lp-logo-pt); }
        .lp-logo        { height: var(--lp-logo-h); }
        .lp-h1          { font-size: var(--lp-h1-fs); margin-top: var(--lp-h1-mt); }
        .lp-sub         { font-size: var(--lp-sub-fs); margin-bottom: var(--lp-sub-mb); }
        .lp-form-px     { padding-left: var(--lp-form-px); padding-right: var(--lp-form-px); }
        .lp-label       { font-size: var(--lp-label-fs); }
        .lp-input       { padding: var(--lp-input-py) var(--lp-input-px); }
        .lp-btn-h       { height: var(--lp-btn-h); }
        .lp-divider     { margin-top: var(--lp-divider-my); margin-bottom: var(--lp-divider-my); }
        .lp-divider-fs  { font-size: var(--lp-divider-fs); }
        .lp-footer      { font-size: var(--lp-footer-fs); margin-top: var(--lp-footer-mt); }

        /* ── SAFETY: card must never overflow viewport on any screen ──────── */
        .lp-card {
          max-width: calc(100vw - 32px);
          box-sizing: border-box;
        }

        /* ── QHD (2560–3839px): card and font step up further ─────────────── */
        @media (min-width: 2560px) and (max-width: 3839px) {
          :root {
            --lp-card-w:       640px;
            --lp-card-br:      24px;
            --lp-card-pb:      40px;
            --lp-logo-h:       200px;
            --lp-logo-pt:      40px;
            --lp-h1-fs:        38px;
            --lp-h1-mt:        26px;
            --lp-sub-fs:       17px;
            --lp-sub-mb:       36px;
            --lp-form-px:      48px;
            --lp-label-fs:     19px;
            --lp-input-px:     18px;
            --lp-input-py:     13px;
            --lp-btn-h:        60px;
            --lp-divider-my:   36px;
            --lp-divider-fs:   16px;
            --lp-footer-mt:    36px;
            --lp-footer-fs:    16px;
          }
          /* Heading font-smoothing at large sizes */
          .lp-h1 { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
          /* Settings icon: larger tap target */
          .lp-font .absolute.top-6.right-6 button { padding: 10px; }
          .lp-font .absolute.top-6.right-6 { top: 32px; right: 32px; }
        }

        /* ── 4K+ (3840px+): maximum scale ─────────────────────────────────── */
        @media (min-width: 3840px) {
          :root {
            --lp-card-w:       820px;
            --lp-card-br:      30px;
            --lp-card-pb:      56px;
            --lp-logo-h:       260px;
            --lp-logo-pt:      56px;
            --lp-h1-fs:        52px;
            --lp-h1-mt:        36px;
            --lp-sub-fs:       22px;
            --lp-sub-mb:       48px;
            --lp-form-px:      64px;
            --lp-label-fs:     24px;
            --lp-input-px:     24px;
            --lp-input-py:     18px;
            --lp-btn-h:        80px;
            --lp-divider-my:   48px;
            --lp-divider-fs:   20px;
            --lp-footer-mt:    48px;
            --lp-footer-fs:    20px;
          }
          .lp-h1 { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
          .lp-font .absolute.top-6.right-6 { top: 48px; right: 48px; }
          .lp-font .absolute.top-6.right-6 button { padding: 14px; }
          .lp-admin-menu { width: 220px; border-radius: 14px; }
          .lp-admin-menu button { padding: 14px 20px; font-size: 18px; }
        }

        /* ── Tablet: touch-target safety for settings button ─────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .lp-font .absolute.top-6.right-6 button {
            min-height: 44px;
            min-width: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .lp-btn-h { min-height: 44px; }
        }
      `}</style>

      {/* MOBILE BLOCKER */}
      <div className="flex md:hidden h-screen w-full items-center justify-center bg-slate-900 text-white p-6" style={{ background: "var(--bg-gradient)" }}>
        <p className="text-center text-lg font-semibold">
          This application is not available on mobile devices.
          <br />
          Please use a laptop or desktop.
        </p>
      </div>

      {/* DESKTOP UI */}
      <div className="lp-font hidden md:flex h-screen w-full items-center justify-center bg-gradient-to-l from-[#DBEAFE] via-[#F3E8FF] to-[#FCE7F3] p-6 relative" style={{ background: "var(--bg-gradient)" }}>
        {/* <MouseMove /> */}
        <FloatingDots />

        {/* THEME ICON & ADMIN SETTINGS */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          {/* <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-md shadow bg-white cursor-pointer hover:bg-gray-100 transition-all duration-200"
          >
            {dark ? <GoSun /> : <MdOutlineDarkMode />}
          </button> */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className="p-2 rounded-md shadow bg-white cursor-pointer hover:bg-gray-100 transition-all duration-200"
              style={{ color: "var(--text-main)" }}
              title="Admin Settings"
            >
              <IoSettingsSharp size={20} />
            </button>
            {showAdminMenu && (
              <div className="lp-admin-menu">
                <button onClick={() => { navigate('/system-admin-login'); setShowAdminMenu(false); }}>
                  Admin Login
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LOGIN CARD */}
        <div className="lp-card relative bg-white shadow-xl" style={{ background: "var(--card-bg)" }}>
          <div className="lp-logo-wrap">
            <img src={dark ? "/logo-dark.png" : "/logo-light.png"} alt="Vega AI" className="lp-logo" />
          </div>

          <h1 className="lp-h1 text-center font-bold" style={{ color: "var(--text-main)" }}>
            Welcome to Vega AI
          </h1>

          <p className="lp-sub text-center font-medium text-gray-500" style={{ color: "var(--text-belowmain)" }}>
            Your IAM AI Support Assistant
          </p>

          {/* NATIVE LOGIN FORM */}
          <div className="lp-form-px">
            <form onSubmit={handleNativeLogin} className="space-y-4">
              <div>
                <label className="lp-label font-medium mb-1 block" style={{ color: "var(--text-main)" }}>
                  Username
                </label>
                <InputField
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="lp-input w-full border rounded-md"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="lp-label font-medium mb-1 block" style={{ color: "var(--text-main)" }}>
                  Password
                </label>
                <InputField
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="lp-input w-full border rounded-md"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="text-red-500 text-xs text-center bg-red-50 py-2 px-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <Btn
                type="submit"
                value={isLoading ? "Signing In..." : "Sign In"}
                className="lp-btn-h bg-gradient-to-r from-[#3B82F6] to-[#9333EA] w-full rounded-md transition-all duration-300 ease-in-out"
                disabled={isLoading}
              />
            </form>

            <div className="lp-divider relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="lp-divider-fs px-2 bg-white text-gray-500" style={{ background: "var(--card-bg)", color: "var(--text-muted)" }}>
                  OR
                </span>
              </div>
            </div>

            {/* AUTH0 LOGIN BUTTON - disabled while Auth0 is commented out */}
            {/* <Btn
              onClick={handleAuth0Login}
              value={auth0Loading ? "Connecting..." : "Sign In with Auth0"}
              className="bg-gray-100 hover:bg-gray-200 w-full h-10 rounded-md transition-all duration-300 ease-in-out border border-gray-300"
              style={{ color: '#000000' }}
              disabled={auth0Loading || isLoading}
            /> */}

             <Btn
              value="Sign In with Auth0"
              className="lp-btn-h bg-gray-100 hover:bg-gray-200 w-full rounded-md transition-all duration-300 ease-in-out border border-gray-300 mt-3"
              style={{ color: '#000000' }}
              disabled={false}
            />

            {/* PINGFEDERATE LOGIN BUTTON */}
            <Btn
              value="Sign In with PingFederate"
              className="lp-btn-h bg-gray-100 hover:bg-gray-200 w-full rounded-md transition-all duration-300 ease-in-out border border-gray-300 mt-3"
              style={{ color: '#000000' }}
              disabled={false}
            />
          </div>

          <p className="lp-footer w-full text-center text-gray-400" style={{ color: "var(--text-muted)" }}>
            © 2026 Product of Like Minds Consulting Inc.
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;