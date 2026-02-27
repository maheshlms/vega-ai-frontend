import React, { useState, useRef, useEffect } from 'react';
import { IoClose, IoCheckmarkDone } from 'react-icons/io5';
import { MdOutlineNotificationsNone } from "react-icons/md";

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
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = (): void => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearAll = (): void => {
    setNotifications([]);
  };

  const getTypeColor = (type: NotificationType): string => {
    const colors: Record<NotificationType, string> = {
      success: 'bg-green-50 border-green-200',
      warning: 'bg-yellow-50 border-yellow-200',
      error: 'bg-red-50 border-red-200',
      info: 'bg-blue-50 border-blue-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <MdOutlineNotificationsNone size={24} className="text-navbar-icon" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-slideDown">
          {/* Future Release Banner */}
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-400 text-[11px] font-semibold tracking-wide select-none">
              🚀 Future Release
            </span>
            <span className="text-[11px] text-gray-400">This feature is coming soon</span>
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <MdOutlineNotificationsNone className="text-gray-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IoClose className="text-xl" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-gray-500 text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full ${getTypeColor(notif.type)} flex items-center justify-center flex-shrink-0 border`}>
                      <span className="text-lg">{notif.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
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
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <IoCheckmarkDone className="text-base" />
                Mark all as read
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
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