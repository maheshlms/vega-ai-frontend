import React from 'react';
import Btn from '../../components/Btn';
import MouseMove from '../../effects/MouseMove';
import FloatingDots from '../../effects/FloatingDots';
import { GoSun } from "react-icons/go";
import { MdOutlineDarkMode } from "react-icons/md";
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LoginPage: React.FC = () => {

  const [dark, setDark] = useState<boolean>(false);
  const { loginWithRedirect, isLoading } = useAuth0();
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  const handleLogin = (): void => {
    loginWithRedirect();
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
      <div className="hidden md:flex h-screen w-full items-center justify-center bg-gradient-to-l from-[#DBEAFE] via-[#F3E8FF] to-[#FCE7F3] p-6 relative" style={{ background: "var(--bg-gradient)" }}>
        <MouseMove />
        <FloatingDots />

        {/* THEME ICON */}
        <div>
          <button
            onClick={() => setDark(!dark)}
            className="absolute top-6 right-6 p-2 rounded-md shadow bg-white cursor-pointer"
          >
            {dark ? <GoSun /> : <MdOutlineDarkMode />}
          </button>
        </div>

        {/* LOGIN CARD */}
        <div className="w-[380px] relative rounded-md bg-white shadow-xl pb-6" style={{ background: "var(--card-bg)" }}>
          <div className="flex justify-center pt-6">
            <img src={dark ? "/logo-dark.png" : "/logo-light.png"} alt="Vega AI" className="h-36" />
          </div>

          <h1 className="text-center text-2xl font-bold mt-4" style={{ color: "var(--text-main)" }}>
            Welcome to Vega AI
          </h1>

          <p className="text-center text-xs font-medium text-gray-500 mb-6" style={{ color: "var(--text-belowmain)" }}>
            Your IAM AI Support Assistant
          </p>

          <div className="px-7 mb-10">
            <Btn
              onClick={handleLogin}
              value={isLoading ? "Connecting..." : "Sign In with Auth0"}
              className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA] w-full h-10 rounded-md transition-all duration-300 ease-in-out"
              disabled={isLoading}
            />
            
            <p className="text-xs text-center text-gray-400 mt-4" style={{ color: "var(--text-muted)" }}>
              You will be redirected to Auth0 to sign in securely
            </p>
          </div>

          <p className="w-full text-center text-xs text-gray-400 mt-6" style={{ color: "var(--text-muted)" }}>
            © 2026 Product of Like Minds Consulting Inc.
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;