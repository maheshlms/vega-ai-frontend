import React from "react";
import { IoIosSearch } from "react-icons/io";
import { MdOutlineDarkMode } from "react-icons/md";
import { GoSun } from "react-icons/go";
import { useTheme } from '../state/ThemeContext';
import NotificationDropdown from './NotificationDropdown.js';
import HelpDropdown from './HelpDropdown.js';
import ProfileDropdown from './ProfileDropdown.js';
import SearchBox from './SearchBox.js';
import SystemStatusIndicator from './SystemStatusIndicator.js';

/* ===================== DARK MODE BUTTON ===================== */
const DarkMode: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 lg:p-2 rounded-md cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: isDark ? '#1a2234' : 'white',
        border: `1px solid ${isDark ? '#1e2d45' : '#e5e7eb'}`,
        boxShadow: isDark
          ? '0 1px 3px rgba(0,0,0,0.4)'
          : '0 1px 3px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isDark ? '#1e2d45' : '#f9fafb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isDark ? '#1a2234' : 'white';
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark
        ? <GoSun size={18} className="text-yellow-400 lg:text-xl" />
        : <MdOutlineDarkMode size={18} className="text-gray-600 lg:text-xl" />
      }
    </button>
  );
};

/* ===================== TOP BAR ===================== */
const TopBar: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div
      className="sticky top-0 z-50 w-full border-b transition-colors duration-300"
      style={{
        backgroundColor: isDark ? '#0f1623' : 'white',
        borderColor: isDark ? '#1e2d45' : '#e5e7eb',
      }}
    >

      {/* MOBILE BLOCKER */}
      <div className="md:hidden h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <p className="text-center text-lg font-semibold">
          This application is not available on mobile devices.
          <br /> Please use a laptop or desktop.
        </p>
      </div>

      {/* DESKTOP NAVBAR */}
      <div className="hidden md:flex h-14 lg:h-18 xl:h-20 2xl:h-22 items-center justify-between px-3 lg:px-6 xl:px-8 2xl:px-10 min-w-[768px] lg:min-w-[1024px]">

        {/* LEFT - Logo */}
        <div className="flex items-center flex-shrink-0">
          <img
            src={isDark ? "/logo-dark.png" : "/logo-light.png"}
            alt="Vega AI"
            className="h-7 lg:h-9 xl:h-10 2xl:h-11"
          />
        </div>

        {/* CENTER - Search */}
        <div className="flex-1 flex justify-center px-4 lg:px-6 xl:px-8">
          <SearchBox icon={IoIosSearch} />
        </div>

        {/* RIGHT - Actions */}
        <div className="flex items-center gap-2 lg:gap-4 xl:gap-5 2xl:gap-6 flex-shrink-0">
          <SystemStatusIndicator />
          <NotificationDropdown />
          <HelpDropdown />
          <ProfileDropdown />
          <DarkMode />
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
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