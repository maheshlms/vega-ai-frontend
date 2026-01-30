import React, { useState, useRef, useEffect } from 'react';
import { IoClose, IoHelpCircle } from 'react-icons/io5';
import { FaBook, FaVideo, FaQuestionCircle, FaEnvelope, FaKeyboard, FaStar, FaBug } from 'react-icons/fa';
import { IoMdHelpCircleOutline } from "react-icons/io";

const HelpDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const helpItems = [
    {
      icon: FaBook,
      label: 'Documentation',
      description: 'Comprehensive guides and references',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => window.open('https://docs.vega-ai.com', '_blank')
    },
    {
      icon: FaVideo,
      label: 'Video Tutorials',
      description: 'Step-by-step video guides',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => window.open('https://tutorials.vega-ai.com', '_blank')
    },
    {
      icon: FaQuestionCircle,
      label: 'FAQs',
      description: 'Frequently asked questions',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => console.log('Open FAQs')
    },
    {
      icon: FaEnvelope,
      label: 'Contact Support',
      description: 'Get help from our team',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => window.location.href = 'mailto:support@vega-ai.com'
    },
    {
      icon: FaKeyboard,
      label: 'Keyboard Shortcuts',
      description: 'Learn keyboard shortcuts',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      action: () => console.log('Show shortcuts modal')
    },
    {
      icon: FaStar,
      label: "What's New",
      description: 'Latest features and updates',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      action: () => console.log('Show changelog')
    },
    {
      icon: FaBug,
      label: 'Report a Bug',
      description: 'Help us improve',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => window.open('https://github.com/vega-ai/issues', '_blank')
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

  const handleItemClick = (action) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Help Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Help & Support"
      >
        <IoMdHelpCircleOutline size={24} className="text-navbar-icon" />

      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-slideDown">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <IoHelpCircle className="text-gray-600 text-xl" />
              <h3 className="font-semibold text-gray-900">Help & Support</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IoClose className="text-xl" />
            </button>
          </div>

          {/* Help Items */}
          <div className="py-2">
            {helpItems.map((item, index) => {
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

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Need immediate help?{' '}
              <a
                href="mailto:support@vega-ai.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact us
              </a>
            </p>
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

export default HelpDropdown;
