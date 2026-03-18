import React, { useState } from "react";
import { FaInfoCircle, FaCog, FaServer } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const handleNavigate = (type: string): void => {
    if (type === "target") {
      navigate("/systems");
    } else if (type === "settings") {
      navigate("/settings");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/20 to-gray-100/20 relative overflow-hidden">
      {/* Subtle Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 2xl:px-10 pb-8 2xl:pb-12 w-full h-screen bg-white dark:bg-[#1a2234]">
        {/* Header */}
        <div className="pt-4 2xl:pt-8">
          <h1 className="adm-sb-heading text-2xl 2xl:text-4xl font-bold text-slate-800 dark:text-white">
            Admin Control Center
          </h1>
        </div>

        {/* Cards Grid */}
        <div className="adm-sb-cards flex flex-wrap gap-4 2xl:gap-8 mt-6 2xl:mt-10">

          {/* TARGET SYSTEM CARD */}
          <div
            className="
              adm-sb-card
              w-80 h-56 2xl:w-[28rem] 2xl:h-72
              bg-white/80 backdrop-blur-sm rounded-2xl dark:border-[#1e2d45] dark:bg-[#1a2234] border-slate-200/50
              shadow-lg hover:shadow-xl relative flex items-center justify-center
              overflow-hidden cursor-pointer group
              transition-all duration-300 hover:scale-[1.02] hover:border-blue-200/50
            "
            onClick={() => handleNavigate("target")}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-sky-50/50 opacity-0
                           group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Info button */}
            <button
              className="adm-sb-info-btn absolute top-4 right-4 w-8 h-8 2xl:w-10 2xl:h-10 rounded-full bg-white/90 dark:bg-[#1a2234] backdrop-blur-sm
                       flex items-center justify-center z-20
                       hover:bg-white hover:scale-110 transition-all duration-300
                       shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCard(activeCard === "target" ? null : "target");
              }}
            >
              <FaInfoCircle className={`text-blue-400 2xl:text-lg transition-transform duration-300 
                                      ${activeCard === "target" ? "rotate-180" : ""}`} />
            </button>

            {/* Content */}
            <div className="relative z-10 text-center px-6 2xl:px-10">
              {/* Icon */}
              <div className="adm-sb-icon-wrap inline-flex items-center justify-center w-16 h-16 2xl:w-20 2xl:h-20 rounded-2xl
                           bg-gradient-to-br from-blue-400 to-sky-400 mb-4 2xl:mb-6 shadow-lg
                           group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FaServer className="adm-sb-icon text-white text-2xl 2xl:text-3xl" />
              </div>

              {/* Text */}
              <div
                key={activeCard === "target" ? "info" : "normal"}
                className="opacity-0 animate-fadeIn"
              >
                {activeCard === "target" ? (
                  <div>
                    <p className="adm-sb-card-title-info text-lg 2xl:text-xl font-bold text-slate-800 mb-2 dark:text-white">
                      Target System
                    </p>
                    <p className="adm-sb-card-desc text-sm 2xl:text-base text-slate-600 leading-relaxed dark:text-white">
                      Create, configure, and manage your target systems securely
                      from here.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="adm-sb-card-title text-xl 2xl:text-2xl font-bold text-slate-800 dark:text-white">
                      Target System
                    </p>
                    <p className="adm-sb-card-sub text-sm 2xl:text-base text-slate-500 dark:text-white mt-2">
                      Manage your systems
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 to-sky-300
                           transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>

          {/* SETTINGS CARD */}
          <div
            className="
              adm-sb-card
              w-80 h-56 2xl:w-[28rem] 2xl:h-72
              bg-white/80 dark:bg-[#1a2234] backdrop-blur-sm rounded-2xl dark:border-[#1e2d45] border-slate-200/50
              shadow-lg hover:shadow-xl relative flex items-center justify-center
              overflow-hidden cursor-pointer group
              transition-all duration-300 hover:scale-[1.02] hover:border-purple-200/50
            "
            // onClick={() => handleNavigate("settings")}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 opacity-0
                           group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Info button */}
            <button
              className="adm-sb-info-btn absolute top-4 right-4 w-8 h-8 2xl:w-10 2xl:h-10 rounded-full bg-white/90 dark:bg-[#1a2234] backdrop-blur-sm
                       flex items-center justify-center z-20
                       hover:bg-white hover:scale-110 transition-all duration-300
                       shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCard(activeCard === "settings" ? null : "settings");
              }}
            >
              <FaInfoCircle className={`text-purple-400 2xl:text-lg transition-transform duration-300 
                                      ${activeCard === "settings" ? "rotate-180" : ""}`} />
            </button>

            {/* Content */}
            <div className="relative z-10 text-center px-6 2xl:px-10">
              {/* Icon */}
              <div className="adm-sb-icon-wrap inline-flex items-center justify-center w-16 h-16 2xl:w-20 2xl:h-20 rounded-2xl
                           bg-gradient-to-br from-purple-400 to-pink-400 mb-4 2xl:mb-6 shadow-lg
                           group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FaCog className="adm-sb-icon text-white text-2xl 2xl:text-3xl" />
              </div>

              {/* Text */}
              <div
                key={activeCard === "settings" ? "info" : "normal"}
                className="opacity-0 animate-fadeIn"
              >
                {activeCard === "settings" ? (
                  <div>
                    <p className="adm-sb-card-title-info text-lg 2xl:text-xl font-bold text-slate-800 dark:text-white mb-2">
                      Settings
                    </p>
                    <p className="adm-sb-card-desc text-sm 2xl:text-base text-slate-600 dark:text-white leading-relaxed">
                      Configure system settings and manage configurations.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="adm-sb-card-title text-xl 2xl:text-2xl font-bold text-slate-800 dark:text-white">
                      Settings
                    </p>
                    <p className="adm-sb-card-sub text-sm 2xl:text-base text-slate-500 dark:text-white mt-2">
                      System configuration
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-300 to-pink-300
                           transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        /* ─── Responsive breakpoints ───
           Baseline: 1920×1080 — Tailwind's 2xl (≥1536px) classes already handle
           the upper range; we add targeted overrides below that for:
           1600px–1919px : large desktops, near-baseline
           1366px–1599px : medium desktops
           768px–1365px  : laptops (MacBook 13"/14"/15" and similar)
           All values scaled proportionally from the 1920px baseline.
        ─────────────────────────────── */

        /* 1920px+ — exact baseline, Tailwind 2xl handles it, no overrides needed */

        /* 1600px–1919px — large desktops, near-baseline */
        @media (min-width: 1600px) and (max-width: 1919px) {
          .adm-sb-heading   { font-size: 2rem !important; }
          .adm-sb-cards     { gap: 1.5rem !important; margin-top: 2rem !important; }
          .adm-sb-card      { width: 22rem !important; height: 15rem !important; }
          .adm-sb-icon-wrap { width: 4.25rem !important; height: 4.25rem !important; margin-bottom: 1.25rem !important; }
          .adm-sb-icon      { font-size: 1.625rem !important; }
          .adm-sb-card-title      { font-size: 1.25rem !important; }
          .adm-sb-card-title-info { font-size: 1.125rem !important; }
          .adm-sb-card-sub  { font-size: 0.875rem !important; }
          .adm-sb-card-desc { font-size: 0.875rem !important; }
          .adm-sb-info-btn  { width: 2.25rem !important; height: 2.25rem !important; }
        }

        /* 1366px–1599px — medium desktops */
        @media (min-width: 1366px) and (max-width: 1599px) {
          .adm-sb-heading   { font-size: 1.75rem !important; }
          .adm-sb-cards     { gap: 1.25rem !important; margin-top: 1.5rem !important; }
          .adm-sb-card      { width: 20rem !important; height: 14rem !important; }
          .adm-sb-icon-wrap { width: 3.75rem !important; height: 3.75rem !important; margin-bottom: 1rem !important; }
          .adm-sb-icon      { font-size: 1.375rem !important; }
          .adm-sb-card-title      { font-size: 1.125rem !important; }
          .adm-sb-card-title-info { font-size: 1rem !important; }
          .adm-sb-card-sub  { font-size: 0.8125rem !important; }
          .adm-sb-card-desc { font-size: 0.8125rem !important; }
          .adm-sb-info-btn  { width: 2rem !important; height: 2rem !important; }
        }

        /* 768px–1365px — laptops (MacBook 13"/14"/15" and similar) */
        @media (min-width: 768px) and (max-width: 1365px) {
          .adm-sb-heading   { font-size: 1.375rem !important; }
          .adm-sb-cards     { gap: 1rem !important; margin-top: 1.25rem !important; }
          .adm-sb-card      { width: 17rem !important; height: 12.5rem !important; }
          .adm-sb-icon-wrap { width: 3.25rem !important; height: 3.25rem !important; margin-bottom: 0.875rem !important; border-radius: 0.875rem !important; }
          .adm-sb-icon      { font-size: 1.125rem !important; }
          .adm-sb-card-title      { font-size: 1rem !important; }
          .adm-sb-card-title-info { font-size: 0.9375rem !important; }
          .adm-sb-card-sub  { font-size: 0.75rem !important; margin-top: 0.375rem !important; }
          .adm-sb-card-desc { font-size: 0.75rem !important; }
          .adm-sb-info-btn  { width: 1.75rem !important; height: 1.75rem !important; top: 0.75rem !important; right: 0.75rem !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminSidebar;