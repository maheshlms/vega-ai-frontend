import React, { useState, useRef, useEffect } from 'react';
import { IoClose, IoSettings } from 'react-icons/io5';
import { FaUser, FaPalette, FaBell, FaGlobe, FaPlug, FaKey, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { IoSettingsOutline } from "react-icons/io5";
import { IconType } from 'react-icons';

interface SettingsItem {
  icon: IconType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  action: () => void;
}

const SettingsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const settingsItems: SettingsItem[] = [
    {
      icon: FaUser,
      label: 'Account Settings',
      description: 'Manage your profile and preferences',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => navigate('/settings')
    },
    {
      icon: FaPalette,
      label: 'Appearance',
      description: 'Theme, colors, and display',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => navigate('/settings?tab=appearance')
    },
    {
      icon: FaBell,
      label: 'Notifications',
      description: 'Manage notification preferences',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => navigate('/settings?tab=notifications')
    },
    {
      icon: FaGlobe,
      label: 'Language',
      description: 'Change language and region',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => navigate('/settings?tab=language')
    },
    {
      icon: FaPlug,
      label: 'Integrations',
      description: 'Connect external services',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      action: () => navigate('/integration')
    },
    {
      icon: FaKey,
      label: 'API Keys',
      description: 'Manage API access',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      action: () => navigate('/settings?tab=api')
    },
    {
      icon: FaCog,
      label: 'Advanced Settings',
      description: 'Developer and advanced options',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      action: () => navigate('/settings?tab=advanced')
    }
  ];

  // Close dropdown when clicking outside
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Settings"
      >
        <IoSettingsOutline size={24} className="text-navbar-icon" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-slideDown">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <IoSettings className="text-gray-600 text-xl" />
              <h3 className="font-semibold text-gray-900">Settings</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IoClose className="text-xl" />
            </button>
          </div>

          {/* Settings Items */}
          <div className="py-2 max-h-96 overflow-y-auto">
            {settingsItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleItemClick(item.action)}
                  className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 text-left"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`${item.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {item.label}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-400 mt-2">
                    <span className="text-lg">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
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

export default SettingsDropdown;
