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
      <div className="tb-navbar hidden md:flex h-18 items-center justify-between px-6">

        {/* LEFT - Logo — flex-shrink-0 so it never compresses */}
        <div className="flex items-center flex-shrink-0">
          <img
            src={isDark ? "/logo-dark.png" : "/logo-light.png"}
            alt="Vega AI"
            className="h-9"
          />
        </div>

        {/* CENTER - Search — grows into available space but won't push siblings off-screen */}
        <div className="flex-1 flex justify-center px-4 min-w-0">
          <SearchBox icon={IoIosSearch} />
        </div>

        {/* RIGHT - Actions — flex-shrink-0 so it NEVER gets cut off */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* <NotificationDropdown /> */}
          {/* <HelpDropdown /> */}
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

        /* ═══════════════════════════════════════════════════════
           RESPONSIVE RULES — TopBar.tsx
           1920×1080 → exact current design (no changes)
           Laptop (1024–1919px) → scales padding gently
           4K / ultrawide (2560px+) → expands gently
        ═══════════════════════════════════════════════════════ */

        /* Small laptop: 1024–1279 */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .tb-navbar { padding-left: 16px; padding-right: 16px; }
        }

        /* Laptop: 1280–1439 */
        @media (min-width: 1280px) and (max-width: 1439px) {
          .tb-navbar { padding-left: 24px; padding-right: 24px; }
        }

        /* Large laptop / small desktop: 1440–1919 */
        @media (min-width: 1440px) and (max-width: 1919px) {
          .tb-navbar { padding-left: 28px; padding-right: 28px; }
        }

        /* Exact target: 1920×1080 — px-6 = 24px default already matches */

        /* 4K / ultrawide: 2560px+ */
        @media (min-width: 2560px) {
          .tb-navbar { padding-left: 80px; padding-right: 80px; }
        }
      `}</style>
    </div>
  );
};

export default TopBar;