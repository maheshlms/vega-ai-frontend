import React, { useState, useRef, useEffect } from 'react';
import { IoIosClose } from 'react-icons/io';
import { IoLogOut } from 'react-icons/io5';
import { FaUser, FaCog, FaCreditCard, FaChartBar } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';
import { useTheme } from '../state/ThemeContext';

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
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load user data from Auth0 on component mount
  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setUserData({
        name: currentUser.username || 'User',
        email: currentUser.email || 'user@example.com',
        role: (currentUser.role || 'user').charAt(0).toUpperCase() + (currentUser.role || 'user').slice(1),
        plan: 'Pro Plan',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.email)}&background=3B82F6&color=fff`
      });
    } else {
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
    { icon: FaUser,       label: 'My Profile',       action: () => navigate('/profile') },
    { icon: FaCog,        label: 'Account Settings',  action: () => navigate('/settings') },
    { icon: FaCreditCard, label: 'Billing',            action: () => navigate('/settings?tab=billing') },
    { icon: FaChartBar,   label: 'Usage & Stats',      action: () => navigate('/settings?tab=usage') }
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

  // Dark mode tokens
  const dropdownBg      = isDark ? '#1a2234' : 'white';
  const dropdownBorder  = isDark ? '#1e2d45' : '#e5e7eb';
  const headerBg        = isDark ? 'linear-gradient(to bottom right, rgba(37,99,235,0.15), rgba(124,58,237,0.15))' : 'linear-gradient(to bottom right, #eff6ff, #f5f3ff)';
  const headerBorder    = isDark ? '#1e2d45' : '#e5e7eb';
  const nameText        = isDark ? '#f1f5f9' : '#111827';
  const emailText       = isDark ? '#94a3b8' : '#4b5563';
  const menuItemHoverBg = isDark ? '#1e2d45' : '#f9fafb';
  const menuItemText    = isDark ? '#cbd5e1' : '#374151';
  const menuIconColor   = isDark ? '#64748b' : '#4b5563';
  const menuArrowColor  = isDark ? '#475569' : '#9ca3af';
  const dividerColor    = isDark ? '#1e2d45' : '#e5e7eb';
  const footerBg        = isDark ? '#111827' : 'white';

  return (
    <div className="relative" ref={dropdownRef}>
      {userData && (
        <>
          {/* Trigger button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 lg:gap-2 px-2 py-1 lg:px-3 border border-navbar-profile rounded-md bg-navbar-profile cursor-pointer"
            aria-label="Profile menu"
          >
            <div className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-md bg-navbar-profile-icon overflow-hidden">
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
            <span className="text-xs lg:text-sm font-semibold text-navbar-profile">
              {userData.name}
            </span>
          </button>

          {isOpen && (
            <div
              className="absolute right-0 mt-2 w-64 lg:w-80 xl:w-[340px] 2xl:w-[380px] rounded-lg shadow-2xl z-50 animate-slideDown"
              style={{
                backgroundColor: dropdownBg,
                border: `1px solid ${dropdownBorder}`,
                maxHeight: 'calc(100vh - 80px)',
                overflowY: 'auto',
              }}
            >
              {/* Profile Header */}
              <div
                className="px-3 py-3 lg:px-4 lg:py-4 border-b"
                style={{ background: headerBg, borderColor: headerBorder }}
              >
                <div className="flex items-start gap-2 lg:gap-3">
                  <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
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
                    <h3 className="text-sm lg:text-base font-bold truncate" style={{ color: nameText }}>
                      {userData.name}
                    </h3>
                    <p className="text-xs lg:text-sm truncate" style={{ color: emailText }}>
                      {userData.email}
                    </p>
                    <div className="flex items-center gap-1.5 lg:gap-2 mt-1 flex-wrap">
                      <span className="px-1.5 lg:px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        {userData.role}
                      </span>
                      <span className="px-1.5 lg:px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        {userData.plan}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="transition-colors flex-shrink-0"
                    style={{ color: isDark ? '#475569' : '#9ca3af' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#94a3b8' : '#4b5563'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#475569' : '#9ca3af'}
                  >
                    <IoIosClose className="text-xl lg:text-2xl" />
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1 lg:py-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleItemClick(item.action)}
                      className="w-full px-3 py-2.5 lg:px-4 lg:py-3 transition-colors flex items-center gap-2 lg:gap-3 text-left"
                      style={{ color: menuItemText }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = menuItemHoverBg}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Icon style={{ color: menuIconColor }} />
                      <span className="text-xs lg:text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="ml-auto" style={{ color: menuArrowColor }}>→</span>
                    </button>
                  );
                })}
              </div>

              {/* Logout */}
              <div
                className="px-3 py-2.5 lg:px-4 lg:py-3 border-t"
                style={{ borderColor: dividerColor, backgroundColor: footerBg }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg font-medium transition-colors text-red-600"
                  style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'}
                >
                  <IoLogOut className="text-base lg:text-lg" />
                  <span className="text-xs lg:text-sm">Logout</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default ProfileDropdown;