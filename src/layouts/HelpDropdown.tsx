import React, { useState, useRef, useEffect } from 'react';
import { IoClose, IoHelpCircle } from 'react-icons/io5';
import { FaBook, FaVideo, FaQuestionCircle, FaEnvelope, FaKeyboard, FaStar, FaBug } from 'react-icons/fa';
import { IoMdHelpCircleOutline } from "react-icons/io";
import { IconType } from 'react-icons';
import { useTheme } from '../state/ThemeContext';

// Type Definitions
interface HelpItem {
  icon: IconType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  bgColorDark: string;
  action: () => void;
}

const HelpDropdown: React.FC = () => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const helpItems: HelpItem[] = [
    {
      icon: FaBook,
      label: 'Documentation',
      description: 'Comprehensive guides and references',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      bgColorDark: 'rgba(37,99,235,0.15)',
      action: () => window.open('https://docs.vega-ai.com', '_blank')
    },
    {
      icon: FaVideo,
      label: 'Video Tutorials',
      description: 'Step-by-step video guides',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      bgColorDark: 'rgba(124,58,237,0.15)',
      action: () => window.open('https://tutorials.vega-ai.com', '_blank')
    },
    {
      icon: FaQuestionCircle,
      label: 'FAQs',
      description: 'Frequently asked questions',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      bgColorDark: 'rgba(22,163,74,0.15)',
      action: () => console.log('Open FAQs')
    },
    {
      icon: FaEnvelope,
      label: 'Contact Support',
      description: 'Get help from our team',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      bgColorDark: 'rgba(234,88,12,0.15)',
      action: () => window.location.href = 'mailto:support@vega-ai.com'
    },
    {
      icon: FaKeyboard,
      label: 'Keyboard Shortcuts',
      description: 'Learn keyboard shortcuts',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      bgColorDark: 'rgba(107,114,128,0.15)',
      action: () => console.log('Show shortcuts modal')
    },
    {
      icon: FaStar,
      label: "What's New",
      description: 'Latest features and updates',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      bgColorDark: 'rgba(202,138,4,0.15)',
      action: () => console.log('Show changelog')
    },
    {
      icon: FaBug,
      label: 'Report a Bug',
      description: 'Help us improve',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      bgColorDark: 'rgba(220,38,38,0.15)',
      action: () => window.open('https://github.com/vega-ai/issues', '_blank')
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

  // Dark mode tokens
  const dropdownBg     = isDark ? '#1a2234' : 'white';
  const dropdownBorder = isDark ? '#1e2d45' : '#e5e7eb';
  const headerBorder   = isDark ? '#1e2d45' : '#e5e7eb';
  const headerIcon     = isDark ? '#94a3b8' : '#4b5563';
  const headerTitle    = isDark ? '#f1f5f9' : '#111827';
  const closeColor     = isDark ? '#475569' : '#9ca3af';
  const closeHover     = isDark ? '#94a3b8' : '#4b5563';
  const itemHoverBg    = isDark ? '#1e2d45' : '#f9fafb';
  const itemLabel      = isDark ? '#e2e8f0' : '#111827';
  const itemDesc       = isDark ? '#64748b' : '#6b7280';
  const itemArrow      = isDark ? '#475569' : '#9ca3af';
  const footerBg       = isDark ? '#111827' : '#f9fafb';
  const footerBorder   = isDark ? '#1e2d45' : '#e5e7eb';
  const footerText     = isDark ? '#64748b' : '#6b7280';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Help Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 lg:p-2 rounded-lg transition-colors"
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1e2d45' : '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        aria-label="Help & Support"
      >
        <IoMdHelpCircleOutline size={22} className="text-navbar-icon lg:text-2xl" />
      </button>

      {/* Dropdown Menu */}
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
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2.5 lg:px-4 lg:py-3 border-b"
            style={{ borderColor: headerBorder }}
          >
            <div className="flex items-center gap-2">
              <IoHelpCircle className="text-lg lg:text-xl" style={{ color: headerIcon }} />
              <h3 className="font-semibold text-sm lg:text-base" style={{ color: headerTitle }}>Help & Support</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="transition-colors"
              style={{ color: closeColor }}
              onMouseEnter={(e) => e.currentTarget.style.color = closeHover}
              onMouseLeave={(e) => e.currentTarget.style.color = closeColor}
            >
              <IoClose className="text-lg lg:text-xl" />
            </button>
          </div>

          {/* Help Items */}
          <div className="py-1 lg:py-2">
            {helpItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleItemClick(item.action)}
                  className="w-full px-3 py-2 lg:px-4 lg:py-3 transition-colors flex items-start gap-2 lg:gap-3 text-left"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = itemHoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${!isDark ? item.bgColor : ''}`}
                    style={isDark ? { backgroundColor: item.bgColorDark } : undefined}
                  >
                    <Icon className={item.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h4 className="text-xs lg:text-sm font-semibold" style={{ color: itemLabel }}>
                      {item.label}
                    </h4>
                    <p className="text-xs mt-0.5" style={{ color: itemDesc }}>
                      {item.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="mt-1.5 lg:mt-2" style={{ color: itemArrow }}>
                    <span className="text-base lg:text-lg">→</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="px-3 py-2.5 lg:px-4 lg:py-3 border-t"
            style={{ backgroundColor: footerBg, borderColor: footerBorder }}
          >
            <p className="text-xs text-center" style={{ color: footerText }}>
              Need immediate help?{' '}
              <a
                href="mailto:support@vega-ai.com"
                className="font-medium hover:text-blue-500 transition-colors"
                style={{ color: '#3b82f6' }}
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
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

export default HelpDropdown;