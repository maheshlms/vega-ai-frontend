import React, { useState, useRef, useEffect } from 'react';
import { IoIosClose } from 'react-icons/io';
import { IoLogOut } from 'react-icons/io5';
import { FaUser, FaCog, FaCreditCard, FaChartBar } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';

// Type Definitions
interface UserData {
  name: string;
  email: string;
  role: string;
  plan: string;
  avatar: string;
}

interface MenuItem {
  icon: IconType;
  label: string;
  action: () => void;
}

const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load user data from Auth0 on component mount
  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setUserData({
        name: currentUser.name || currentUser.username || 'User',
        email: currentUser.email || 'user@example.com',
        role: (currentUser.role || 'user').charAt(0).toUpperCase() + (currentUser.role || 'user').slice(1),
        plan: 'Pro Plan',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.email)}&background=3B82F6&color=fff`
      });
    } else {
      // Fallback if no user data
      setUserData({
        name: 'User',
        email: 'user@example.com',
        role: 'User',
        plan: 'Pro Plan',
        avatar: 'https://ui-avatars.com/api/?name=User&background=3B82F6&color=fff'
      });
    }
  }, []);

  const menuItems: MenuItem[] = [
    // {
    //   icon: FaUser,
    //   label: 'My Profile',
    //   action: () => {}
    // },
    // {
    //   icon: FaCog,
    //   label: 'Account Settings',
    //   action: () => navigate('/settings')
    // },
    // {
    //   icon: FaCreditCard,
    //   label: 'Billing',
    //   action: () => navigate('/settings?tab=billing')
    // },
    // {
    //   icon: FaChartBar,
    //   label: 'Usage & Stats',
    //   action: () => navigate('/settings?tab=usage')
    // }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (action: () => void): void => {
    action();
    setIsOpen(false);
  };

  const handleLogout = (): void => {
    setIsOpen(false);
    navigate('/logout');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {userData && (
        <>
          {/*
           * Trigger button
           * ─────────────
           * At 1920×1080 (2xl): full pill with avatar + first name  ← BASELINE (unchanged)
           * At 1280–1535px (xl / large laptop): avatar + name, slightly tighter padding
           * At 1024–1279px (lg / standard laptop): avatar only — name is hidden to save
           *   navbar real-estate; a tooltip via title keeps it accessible
           *
           * We keep px-3 py-1 at all sizes because the border/bg tokens come from
           * the design system (navbar-profile). Only padding tweaks are applied.
           */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            title={userData.name}           /* accessible label when name text is hidden */
            className="flex items-center gap-2 px-3 py-1 border border-navbar-profile rounded-md bg-navbar-profile cursor-pointer
              lg:px-2 lg:gap-1.5
              xl:px-3 xl:gap-2"
            aria-label="Profile menu"
          >
            <div className="w-7 h-7 flex items-center justify-center rounded-md bg-navbar-profile-icon overflow-hidden flex-shrink-0">
              <img
                src={userData.avatar}
                alt={userData.name}
                className="w-full h-full object-cover rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            {/*
             * Hide the first-name label on lg (laptop) viewports.
             * Show it from xl (large laptop / 1280px) upward.
             */}
            <span className="hidden xl:inline text-sm font-semibold text-navbar-profile">
              {userData.name.split(' ')[0]}
            </span>
          </button>

          {isOpen && (
            /*
             * Dropdown panel
             * ──────────────
             * Baseline (2xl / 1920): w-80 (320px) — unchanged
             * xl (1280–1535px): w-72 (288px) — slightly narrower, still spacious
             * lg (1024–1279px): w-64 (256px) — compact for laptop screens
             *
             * right-0 ensures the panel never bleeds off the right edge
             * regardless of viewport.
             */
            <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-slideDown
              w-64
              xl:w-72
              2xl:w-80">

              {/* ── Profile header ── */}
              <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="flex items-start gap-3">
                  {/*
                   * Avatar: keep 56×56 at 2xl baseline; shrink to 44×44 on smaller viewports
                   * so the email + badge row doesn't wrap awkwardly.
                   */}
                  <div className="w-11 h-11 2xl:w-14 2xl:h-14 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                    <img
                      src={userData.avatar}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SkQ8L3RleHQ+Cjwvc3ZnPg==';
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm 2xl:text-base font-bold text-gray-900 truncate">
                      {userData.name}
                    </h3>
                    <p className="text-xs 2xl:text-sm text-gray-600 truncate">
                      {userData.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        {userData.role}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        {userData.plan}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    <IoIosClose className="text-2xl" />
                  </button>
                </div>
              </div>

              {/* ── Menu items ── */}
              <div className="py-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleItemClick(item.action)}
                      className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                    >
                      <Icon className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                      <span className="ml-auto text-gray-400">→</span>
                    </button>
                  );
                })}
              </div>

              {/* ── Logout ── */}
              <div className="px-4 py-3 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                >
                  <IoLogOut className="text-lg" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

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
      `}</style>
    </div>
  );
};

export default ProfileDropdown;