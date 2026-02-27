import React from 'react';
import Btn from '../../components/Btn';
import InputField from '../../components/InputField';
import MouseMove from '../../effects/MouseMove';
import FloatingDots from '../../effects/FloatingDots';
import { GoSun } from "react-icons/go";
import { MdOutlineDarkMode } from "react-icons/md";
import { IoSettingsSharp } from "react-icons/io5";
import { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { auth } from '../../utils/auth';

const LoginPage: React.FC = () => {

  const [dark, setDark] = useState<boolean>(false);
  const [showAdminMenu, setShowAdminMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { loginWithRedirect, isLoading: auth0Loading } = useAuth0();
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

  const handleAuth0Login = (): void => {
    loginWithRedirect();
  };

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
      {/* MOBILE BLOCKER */}
      <div className="flex md:hidden h-screen w-full items-center justify-center bg-slate-900 text-white p-6" style={{ background: "var(--bg-gradient)" }}>
        <p className="text-center text-lg font-semibold">
          This application is not available on mobile devices.
          <br />
          Please use a laptop or desktop.
        </p>
      </div>

      {/* DESKTOP UI */}
      <div className="hidden md:flex h-[110%] w-full items-center justify-center bg-gradient-to-l from-[#DBEAFE] via-[#F3E8FF] to-[#FCE7F3] p-6 relative" style={{ background: "var(--bg-gradient)" }}>
        <MouseMove />
        <FloatingDots />

        {/* THEME ICON & ADMIN SETTINGS */}
        <div className="absolute top-4 right-4 lg:top-6 lg:right-6 flex items-center gap-2">
          
          {/* THEME TOGGLE BUTTON */}
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-md shadow bg-white cursor-pointer hover:bg-gray-100 transition-all duration-200"
          >
            {dark ? <GoSun /> : <MdOutlineDarkMode />}
          </button>
        {/* ADMIN SETTINGS BUTTON */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className="p-2 rounded-md shadow bg-white cursor-pointer hover:bg-gray-100 transition-all duration-200"
              style={{ color: "var(--text-main)" }}
              title="Admin Settings"
            >
              <IoSettingsSharp size={20} />
            </button>

            {/* DROPDOWN MENU */}
            {showAdminMenu && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden z-50" style={{ background: "var(--card-bg)" }}>
                <button
                  onClick={() => {
                    navigate('/system-admin-login');
                    setShowAdminMenu(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors"
                  style={{ color: "var(--text-main)" }}
                >
                  Admin Login
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LOGIN CARD */}
        <div
          className="w-[90%] max-w-[420px] xl:max-w-[480px] 2xl:max-w-[520px] relative rounded-md bg-white shadow-xl pb-4 lg:pb-6"
          style={{ background: "var(--card-bg)" }}
        >
          <div className="flex justify-center pt-4 lg:pt-6">
            <img
              src={dark ? "/logo-dark.png" : "/logo-light.png"}
              alt="Vega AI"
              className="h-20 lg:h-32 xl:h-36 2xl:h-40"
            />
          </div>

          <h1 className="text-center text-xl lg:text-2xl xl:text-3xl font-bold mt-3 lg:mt-4" style={{ color: "var(--text-main)" }}>
            Welcome to Vega AI
          </h1>

          <p className="text-center text-xs xl:text-sm font-medium text-gray-500 mb-4 lg:mb-6" style={{ color: "var(--text-belowmain)" }}>
            Your IAM AI Support Assistant
          </p>

          {/* NATIVE LOGIN FORM */}
          <div className="px-5 lg:px-7">
            <form onSubmit={handleNativeLogin} className="space-y-3 lg:space-y-4">
              <div>
                <label className="text-sm xl:text-base font-medium mb-1 block" style={{ color: "var(--text-main)" }}>
                  Username
                </label>
                <InputField
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="text-sm xl:text-base font-medium mb-1 block" style={{ color: "var(--text-main)" }}>
                  Password
                </label>
                <InputField
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 border rounded-md"
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
                className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA] w-full h-10 xl:h-11 2xl:h-12 rounded-md transition-all duration-300 ease-in-out"
                disabled={isLoading}
              />
            </form>

            <div className="relative my-4 lg:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500" style={{ background: "var(--card-bg)", color: "var(--text-muted)" }}>
                  OR
                </span>
              </div>
            </div>

            {/* AUTH0 LOGIN BUTTON */}
            <Btn
              onClick={handleAuth0Login}
              value={auth0Loading ? "Connecting..." : "Sign In with Auth0"}
              className="bg-gray-100 hover:bg-gray-200 w-full h-10 xl:h-11 2xl:h-12 rounded-md transition-all duration-300 ease-in-out border border-gray-300"
              style={{ color: '#000000' }}
              disabled={auth0Loading || isLoading}
            />

            {/* PINGFEDERATE LOGIN BUTTON */}
            <Btn
              value="Sign In with PingFederate"
              className="bg-gray-100 hover:bg-gray-200 w-full h-10 xl:h-11 2xl:h-12 rounded-md transition-all duration-300 ease-in-out border border-gray-300 mt-3"
              style={{ color: '#000000' }}
              disabled={false}
            />
            
          </div>

          <p className="w-full text-center text-xs xl:text-sm text-gray-400 mt-4 lg:mt-6" style={{ color: "var(--text-muted)" }}>
            © 2026 Product of Like Minds Consulting Inc.
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;