import React, { useState, useEffect } from "react";
import { IoIosSearch } from "react-icons/io";
import { MdOutlineDarkMode } from "react-icons/md";
import { GoSun } from "react-icons/go";

// Import all dropdown components
import NotificationDropdown from '../features/NotificationDropdown';
import HelpDropdown from '../features/HelpDropdown';
import SettingsDropdown from '../features/SettingsDropdown';
import ProfileDropdown from '../features/ProfileDropdown';
import SearchBox from '../features/SearchBox';

/* ===================== DARK MODE ===================== */
const DarkMode = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("darkMode") === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", dark.toString());
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-md shadow bg-white cursor-pointer"
    >
      {dark ? <GoSun size={20} /> : <MdOutlineDarkMode size={20} />}
    </button>
  );
};

/* ===================== TOP BAR ===================== */
const TopBar = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("darkMode") === "true");
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setDark(localStorage.getItem("darkMode") === "true");
    };
    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(handleStorageChange, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="sticky top-0 z-50 w-full bg-navbar border-b border-navbar-profile">

      {/* MOBILE BLOCKER */}
      <div className="md:hidden h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <p className="text-center text-lg font-semibold">
          This application is not available on mobile devices.
          <br /> Please use a laptop or desktop.
        </p>
      </div>

      {/* DESKTOP NAVBAR */}
      <div className="hidden md:flex h-18 items-center justify-between px-6 min-w-[1024px]">

        {/* LEFT - Logo */}
        <div className="flex items-center">
          <img 
            src={dark ? "/logo-dark.png" : "/logo-light.png"} 
            alt="Vega AI" 
            className="h-9" 
          />
        </div>

        {/* CENTER - Search */}
        <SearchBox icon={IoIosSearch} />

        {/* RIGHT - Actions */}
        <div className="flex items-center gap-6">
          <NotificationDropdown />
          <HelpDropdown />
          <SettingsDropdown />
          <ProfileDropdown />
          <DarkMode />
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default TopBar;