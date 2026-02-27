import React, { useState, useEffect, useRef } from 'react';
import { MdOutlineHealthAndSafety, MdCheckCircle, MdWarning, MdError } from 'react-icons/md';
import { TbWaveSawTool } from 'react-icons/tb';
import { CiServer } from 'react-icons/ci';
import { FaDatabase } from 'react-icons/fa';
import { BiNetworkChart } from 'react-icons/bi';
import { IconType } from 'react-icons';
import { useTheme } from '../state/ThemeContext';

type SystemStatusType = 'healthy' | 'warning' | 'critical';
type ServiceStatusType = 'healthy' | 'warning' | 'critical';

interface StatusConfig {
  color: string;
  bgColor: string;
  bgColorDark: string;
  text: string;
  icon: IconType;
  description: string;
}

interface Service {
  name: string;
  status: ServiceStatusType;
  icon: IconType;
  uptime: string;
  latency: string;
}

const SystemStatusIndicator: React.FC = () => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatusType>('healthy');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // System services status (replace with real data)
  const services: Service[] = [
    {
      name: 'Authentication Service',
      status: 'healthy',
      icon: TbWaveSawTool,
      uptime: '99.9%',
      latency: '45ms'
    },
    {
      name: 'Database Cluster',
      status: 'healthy',
      icon: FaDatabase,
      uptime: '100%',
      latency: '12ms'
    },
    {
      name: 'API Gateway',
      status: 'warning',
      icon: BiNetworkChart,
      uptime: '98.5%',
      latency: '120ms'
    },
    {
      name: 'Server Nodes',
      status: 'healthy',
      icon: CiServer,
      uptime: '99.8%',
      latency: '28ms'
    }
  ];

  // Simulate fetching system status (replace with real API call)
  useEffect(() => {
    const fetchSystemStatus = (): void => {
      const hasWarnings = services.some(s => s.status === 'warning');
      const hasCritical = services.some(s => s.status === 'critical');
      
      if (hasCritical) {
        setSystemStatus('critical');
      } else if (hasWarnings) {
        setSystemStatus('warning');
      } else {
        setSystemStatus('healthy');
      }
    };

    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, [services]);

  const statusConfig: Record<SystemStatusType, StatusConfig> = {
    healthy: {
      color: '#22C55E',
      bgColor: '#DCFCE7',
      bgColorDark: 'rgba(34,197,94,0.15)',
      text: 'All Systems Operational',
      icon: MdCheckCircle,
      description: 'All services running normally'
    },
    warning: {
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      bgColorDark: 'rgba(245,158,11,0.15)',
      text: 'Minor Issues Detected',
      icon: MdWarning,
      description: 'Some services require attention'
    },
    critical: {
      color: '#EF4444',
      bgColor: '#FEE2E2',
      bgColorDark: 'rgba(239,68,68,0.15)',
      text: 'Critical Alert',
      icon: MdError,
      description: 'Immediate action required'
    }
  };

  const getServiceStatusColor = (status: ServiceStatusType): string => {
    switch (status) {
      case 'healthy':  return '#22C55E';
      case 'warning':  return '#F59E0B';
      case 'critical': return '#EF4444';
      default:         return '#6B7280';
    }
  };

  const currentStatus: StatusConfig = statusConfig[systemStatus];
  const StatusIcon: IconType = currentStatus.icon;

  // Dark mode tokens
  const dropdownBg     = isDark ? '#1a2234' : 'white';
  const dropdownBorder = isDark ? '#1e2d45' : '#e5e7eb';
  const headerBg       = isDark ? currentStatus.bgColorDark : currentStatus.bgColor;
  const headerBorder   = isDark ? '#1e2d45' : '#f3f4f6';
  const titleText      = isDark ? '#f1f5f9' : '#111827';
  const descText       = isDark ? '#94a3b8' : '#4b5563';
  const sectionLabel   = isDark ? '#64748b' : '#6b7280';
  const cardBg         = isDark ? '#0d1117' : 'white';
  const cardBorder     = isDark ? '#1e2d45' : '#f3f4f6';
  const cardHoverBg    = isDark ? '#1e2d45' : '#f9fafb';
  const serviceName    = isDark ? '#e2e8f0' : '#111827';
  const metricLabel    = isDark ? '#64748b' : '#6b7280';
  const metricValue    = isDark ? '#cbd5e1' : '#374151';
  const footerBg       = isDark ? '#111827' : '#f9fafb';
  const footerBorder   = isDark ? '#1e2d45' : '#f3f4f6';
  const btnBg          = isDark ? '#1a2234' : 'white';
  const serviceIconColor = isDark ? '#94a3b8' : '#4b5563';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 lg:p-2 rounded-md shadow transition-all duration-200 relative group"
        style={{
          backgroundColor: isDark ? '#1a2234' : 'white',
          border: `1px solid ${isDark ? '#1e2d45' : 'transparent'}`,
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1e2d45' : '#f9fafb'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1a2234' : 'white'}
        aria-label="System Status"
      >
        <MdOutlineHealthAndSafety
          size={18}
          style={{ color: currentStatus.color }}
          className="transition-transform group-hover:scale-110 lg:text-xl"
        />
        {/* Pulsing dot indicator */}
        <div
          className="absolute top-1 right-1 w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full animate-pulse"
          style={{ backgroundColor: currentStatus.color }}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 lg:w-80 xl:w-[340px] 2xl:w-[380px] rounded-xl shadow-2xl animate-slideDown z-50"
          style={{
            backgroundColor: dropdownBg,
            border: `1px solid ${dropdownBorder}`,
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            className="p-3 lg:p-4 rounded-t-xl border-b"
            style={{ backgroundColor: headerBg, borderColor: headerBorder }}
          >
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)' }}>
                <StatusIcon size={20} style={{ color: currentStatus.color }} className="lg:text-2xl" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm lg:text-base truncate" style={{ color: titleText }}>{currentStatus.text}</h3>
                <p className="text-xs mt-0.5" style={{ color: descText }}>{currentStatus.description}</p>
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="p-2 lg:p-3 max-h-64 lg:max-h-96 xl:max-h-[420px] overflow-y-auto">
            <div className="text-xs font-semibold px-2 mb-2" style={{ color: sectionLabel }}>Service Status</div>

            <div className="space-y-1.5 lg:space-y-2">
              {services.map((service, index) => {
                const ServiceIcon = service.icon;
                return (
                  <div
                    key={index}
                    className="p-2.5 lg:p-3 rounded-lg transition-colors duration-200"
                    style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = cardHoverBg}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = cardBg}
                  >
                    <div className="flex items-center justify-between mb-1.5 lg:mb-2">
                      <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                        <ServiceIcon size={16} style={{ color: serviceIconColor }} className="flex-shrink-0 lg:text-[18px]" />
                        <span className="text-xs lg:text-sm font-medium truncate" style={{ color: serviceName }}>
                          {service.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 lg:gap-1.5 flex-shrink-0 ml-2">
                        <div
                          className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full"
                          style={{ backgroundColor: getServiceStatusColor(service.status) }}
                        />
                        <span
                          className="text-xs font-semibold capitalize"
                          style={{ color: getServiceStatusColor(service.status) }}
                        >
                          {service.status}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-3 lg:gap-4 mt-1.5 lg:mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={{ color: metricLabel }}>Uptime:</span>
                        <span className="text-xs font-semibold" style={{ color: metricValue }}>{service.uptime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={{ color: metricLabel }}>Latency:</span>
                        <span className="text-xs font-semibold" style={{ color: metricValue }}>{service.latency}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div
            className="p-2.5 lg:p-3 border-t rounded-b-xl"
            style={{ backgroundColor: footerBg, borderColor: footerBorder }}
          >
            <button
              className="w-full py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors duration-200"
              style={{ color: '#3b82f6' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              View Detailed Status →
            </button>
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

export default SystemStatusIndicator;