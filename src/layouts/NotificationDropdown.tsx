import React, { useState, useRef, useEffect } from 'react';
import { IoClose, IoCheckmarkDone } from 'react-icons/io5';
import { MdOutlineNotificationsNone } from "react-icons/md";
import { useTheme } from '../state/ThemeContext';

// Type Definitions
interface Notification {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  icon: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

type NotificationType = 'success' | 'warning' | 'error' | 'info';

const NotificationDropdown: React.FC = () => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'success',
      icon: '✅',
      title: 'Agent Task Completed',
      message: 'Astra successfully renewed SSL certificate',
      time: '2 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'warning',
      icon: '⚠️',
      title: 'Certificate Expiring Soon',
      message: 'SSL certificate for sso.company.com expires in 5 days',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      type: 'info',
      icon: '🔵',
      title: 'New Agent Created',
      message: 'License Agent "Production Monitor" has been created',
      time: '3 hours ago',
      read: false
    },
    {
      id: 4,
      type: 'error',
      icon: '❌',
      title: 'Task Failed',
      message: 'Nexa failed to sync user data',
      time: '5 hours ago',
      read: true
    },
    {
      id: 5,
      type: 'success',
      icon: '🎉',
      title: 'Integration Connected',
      message: 'Ping Directory integration successfully connected',
      time: '1 day ago',
      read: true
    }
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount: number = notifications.filter(n => !n.read).length;

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

  const markAsRead = (id: number): void => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const markAllAsRead = (): void => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const clearAll = (): void => {
    setNotifications([]);
  };

  const getTypeColor = (type: NotificationType): string => {
    if (isDark) {
      const colors: Record<NotificationType, string> = {
        success: 'rgba(34,197,94,0.15)',
        warning: 'rgba(245,158,11,0.15)',
        error:   'rgba(239,68,68,0.15)',
        info:    'rgba(59,130,246,0.15)'
      };
      return colors[type] || 'rgba(107,114,128,0.15)';
    }
    const colors: Record<NotificationType, string> = {
      success: 'bg-green-50 border-green-200',
      warning: 'bg-yellow-50 border-yellow-200',
      error:   'bg-red-50 border-red-200',
      info:    'bg-blue-50 border-blue-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const getTypeBorderColor = (type: NotificationType): string => {
    const colors: Record<NotificationType, string> = {
      success: isDark ? 'rgba(34,197,94,0.3)'   : '#bbf7d0',
      warning: isDark ? 'rgba(245,158,11,0.3)'  : '#fde68a',
      error:   isDark ? 'rgba(239,68,68,0.3)'   : '#fecaca',
      info:    isDark ? 'rgba(59,130,246,0.3)'  : '#bfdbfe'
    };
    return colors[type] || (isDark ? '#1e2d45' : '#e5e7eb');
  };

  // Dark mode tokens
  const dropdownBg      = isDark ? '#1a2234' : 'white';
  const dropdownBorder  = isDark ? '#1e2d45' : '#e5e7eb';
  const headerBorder    = isDark ? '#1e2d45' : '#e5e7eb';
  const headerIcon      = isDark ? '#94a3b8' : '#4b5563';
  const headerTitle     = isDark ? '#f1f5f9' : '#111827';
  const closeIcon       = isDark ? '#475569' : '#9ca3af';
  const closeIconHover  = isDark ? '#94a3b8' : '#4b5563';
  const itemBorder      = isDark ? '#1e2d45' : '#f3f4f6';
  const itemHoverBg     = isDark ? '#1e2d45' : '#f9fafb';
  const itemUnreadBg    = isDark ? 'rgba(59,130,246,0.08)' : 'rgba(219,234,254,0.5)';
  const itemTitle       = isDark ? '#f1f5f9' : '#111827';
  const itemTitleRead   = isDark ? '#94a3b8' : '#374151';
  const itemMsg         = isDark ? '#64748b' : '#4b5563';
  const itemTime        = isDark ? '#475569' : '#9ca3af';
  const footerBg        = isDark ? '#111827' : '#f9fafb';
  const footerBorder    = isDark ? '#1e2d45' : '#e5e7eb';
  const emptyText       = isDark ? '#64748b' : '#6b7280';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 lg:p-2 rounded-lg transition-colors"
        style={{ color: isDark ? '#94a3b8' : undefined }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1e2d45' : '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        aria-label="Notifications"
      >
        <MdOutlineNotificationsNone size={22} className="text-navbar-icon lg:text-2xl" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 lg:w-96 xl:w-[420px] 2xl:w-[460px] rounded-lg shadow-2xl z-50 animate-slideDown"
          style={{
            backgroundColor: dropdownBg,
            border: `1px solid ${dropdownBorder}`,
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2.5 lg:px-4 lg:py-3 border-b sticky top-0 z-10"
            style={{ borderColor: headerBorder, backgroundColor: dropdownBg }}
          >
            <div className="flex items-center gap-2">
              <MdOutlineNotificationsNone style={{ color: headerIcon }} />
              <h3 className="font-semibold text-sm lg:text-base" style={{ color: headerTitle }}>Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 lg:px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="transition-colors"
              style={{ color: closeIcon }}
              onMouseEnter={(e) => e.currentTarget.style.color = closeIconHover}
              onMouseLeave={(e) => e.currentTarget.style.color = closeIcon}
            >
              <IoClose className="text-lg lg:text-xl" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-72 lg:max-h-96 xl:max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 lg:p-8 text-center">
                <div className="text-3xl lg:text-4xl mb-2">🔔</div>
                <p className="text-sm" style={{ color: emptyText }}>No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="px-3 py-2.5 lg:px-4 lg:py-3 border-b transition-colors cursor-pointer"
                  style={{
                    borderColor: itemBorder,
                    backgroundColor: !notif.read ? itemUnreadBg : 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = !notif.read ? itemUnreadBg : itemHoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !notif.read ? itemUnreadBg : 'transparent'}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-2 lg:gap-3">
                    {/* Icon */}
                    {isDark ? (
                      <div
                        className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0 border"
                        style={{
                          backgroundColor: getTypeColor(notif.type),
                          borderColor: getTypeBorderColor(notif.type),
                        }}
                      >
                        <span className="text-base lg:text-lg">{notif.icon}</span>
                      </div>
                    ) : (
                      <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full ${getTypeColor(notif.type)} flex items-center justify-center flex-shrink-0 border`}>
                        <span className="text-base lg:text-lg">{notif.icon}</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className="text-xs lg:text-sm font-semibold"
                          style={{ color: !notif.read ? itemTitle : itemTitleRead }}
                        >
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: itemMsg }}>
                        {notif.message}
                      </p>
                      <p className="text-xs mt-1" style={{ color: itemTime }}>
                        {notif.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div
              className="px-3 py-2.5 lg:px-4 lg:py-3 border-t flex items-center justify-between sticky bottom-0"
              style={{ backgroundColor: footerBg, borderColor: footerBorder }}
            >
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-xs lg:text-sm font-medium transition-colors flex items-center gap-1 disabled:cursor-not-allowed"
                style={{ color: unreadCount === 0 ? (isDark ? '#334155' : '#9ca3af') : '#3b82f6' }}
              >
                <IoCheckmarkDone className="text-sm lg:text-base" />
                Mark all as read
              </button>
              <button
                onClick={clearAll}
                className="text-xs lg:text-sm font-medium transition-colors text-red-500"
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
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

export default NotificationDropdown;