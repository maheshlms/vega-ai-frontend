import React, { useState } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(null);

  const handleNavigate = (type) => {
    if (type === "target") {
      navigate("/admin/avatarsys"); // Navigate to TargetSystemShow
    } else if (type === "settings") {
      navigate("/settings");
    }
  };

  return (
    <div className="px-4 pb-8">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-slate-800">
          Admin Control Center
        </h1>

        <div className="flex gap-4 mt-6">
          {/* TARGET SYSTEM CARD */}
          <div
            className="w-64 h-40 bg-white rounded-xl border border-slate-200
                       shadow-sm relative flex items-center justify-center
                       overflow-hidden cursor-pointer
                       hover:shadow-md transition-shadow"
            onClick={() => handleNavigate("target")}
          >
            <FaInfoCircle
              className="absolute top-3 right-3 text-blue-600 cursor-pointer
                         hover:text-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCard(activeCard === "target" ? null : "target");
              }}
            />

            <div
              key={activeCard === "target"}
              className="text-center px-4
                         transition-all duration-200 ease-out
                         opacity-0 translate-y-2 animate-text"
            >
              {activeCard === "target" ? (
                <>
                  <p className="text-sm font-semibold text-slate-800">
                    Target System
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Create, configure, and manage your target systems securely
                    from here.
                  </p>
                </>
              ) : (
                <p className="text-slate-800 text-lg font-semibold">
                  Target System
                </p>
              )}
            </div>
          </div>

          {/* SETTINGS CARD */}
          <div
            className="w-64 h-40 bg-white rounded-xl border border-slate-200
                       shadow-sm relative flex items-center justify-center
                       overflow-hidden cursor-pointer
                       hover:shadow-md transition-shadow"
            onClick={() => handleNavigate("settings")}
          >
            <FaInfoCircle
              className="absolute top-3 right-3 text-blue-600 cursor-pointer
                         hover:text-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCard(activeCard === "settings" ? null : "settings");
              }}
            />

            <div
              key={activeCard === "settings"}
              className="text-center px-4
                         transition-all duration-200 ease-out
                         opacity-0 translate-y-2 animate-text"
            >
              {activeCard === "settings" ? (
                <>
                  <p className="text-sm font-semibold text-slate-800">
                    Settings
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Configure system settings and manage configurations.
                  </p>
                </>
              ) : (
                <p className="text-slate-800 text-lg font-semibold">
                  Settings
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes text {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-text {
          animation: text 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AdminSidebar;