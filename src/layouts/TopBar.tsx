import React from "react";
import { IoIosSearch } from "react-icons/io";
import { useTheme } from '../state/ThemeContext';
import NotificationDropdown from './NotificationDropdown.js';
import HelpDropdown from './HelpDropdown.js';
import ProfileDropdown from './ProfileDropdown.js';
import SearchBox from './SearchBox.js';

/* ===================== TOP BAR ===================== */
const TopBar: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="sticky top-0 z-50 w-full bg-white dark:bg-[#0f1623] border-b border-gray-200 dark:border-gray-700">

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
            src={isDark ? "/logo-dark.png" : "/logo-light.png"}
            alt="Vega AI"
            className="h-9"
          />
        </div>

        {/* CENTER - Search */}
        <SearchBox icon={IoIosSearch} />

        {/* RIGHT - Actions */}
        <div className="flex items-center gap-4">
          <NotificationDropdown />
          <HelpDropdown />
          <ProfileDropdown />
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
