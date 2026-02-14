import React, { useState } from "react";
import { FaInfoCircle, FaCog, FaServer } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const handleNavigate = (type: string): void => {
    if (type === "target") {
      navigate("/admin/avatarsys");
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
      <div className="relative z-10 px-4 pb-8">
        {/* Header */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-slate-800">
            Admin Control Center
          </h1>
        </div>

        {/* Cards Grid */}
        <div className="flex gap-4 mt-6">
          {/* TARGET SYSTEM CARD */}
          <div
            className="w-80 h-56 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50
                       shadow-lg hover:shadow-xl relative flex items-center justify-center
                       overflow-hidden cursor-pointer group
                       transition-all duration-300 hover:scale-[1.02] hover:border-blue-200/50"
            onClick={() => handleNavigate("target")}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-sky-50/50 opacity-0 
                           group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Info button */}
            <button
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm
                       flex items-center justify-center z-20
                       hover:bg-white hover:scale-110 transition-all duration-300
                       shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCard(activeCard === "target" ? null : "target");
              }}
            >
              <FaInfoCircle className={`text-blue-400 transition-transform duration-300 
                                      ${activeCard === "target" ? "rotate-180" : ""}`} />
            </button>

            {/* Content */}
            <div className="relative z-10 text-center px-6">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                           bg-gradient-to-br from-blue-400 to-sky-400 mb-4 shadow-lg
                           group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FaServer className="text-white text-2xl" />
              </div>

              {/* Text */}
              <div
                key={activeCard === "target" ? "info" : "normal"}
                className="opacity-0 animate-fadeIn"
              >
                {activeCard === "target" ? (
                  <div>
                    <p className="text-lg font-bold text-slate-800 mb-2">
                      Target System
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Create, configure, and manage your target systems securely
                      from here.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-bold text-slate-800">
                      Target System
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
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
            className="w-80 h-56 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50
                       shadow-lg hover:shadow-xl relative flex items-center justify-center
                       overflow-hidden cursor-pointer group
                       transition-all duration-300 hover:scale-[1.02] hover:border-purple-200/50"
            onClick={() => handleNavigate("settings")}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 opacity-0 
                           group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Info button */}
            <button
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm
                       flex items-center justify-center z-20
                       hover:bg-white hover:scale-110 transition-all duration-300
                       shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCard(activeCard === "settings" ? null : "settings");
              }}
            >
              <FaInfoCircle className={`text-purple-400 transition-transform duration-300 
                                      ${activeCard === "settings" ? "rotate-180" : ""}`} />
            </button>

            {/* Content */}
            <div className="relative z-10 text-center px-6">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                           bg-gradient-to-br from-purple-400 to-pink-400 mb-4 shadow-lg
                           group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FaCog className="text-white text-2xl" />
              </div>

              {/* Text */}
              <div
                key={activeCard === "settings" ? "info" : "normal"}
                className="opacity-0 animate-fadeIn"
              >
                {activeCard === "settings" ? (
                  <div>
                    <p className="text-lg font-bold text-slate-800 mb-2">
                      Settings
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Configure system settings and manage configurations.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-bold text-slate-800">
                      Settings
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
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

      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default AdminSidebar;