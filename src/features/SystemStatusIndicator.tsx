import React, { useState, useEffect, useRef } from 'react';
import { MdOutlineHealthAndSafety, MdCheckCircle, MdWarning, MdError } from 'react-icons/md';
import { TbWaveSawTool } from 'react-icons/tb';
import { CiServer } from 'react-icons/ci';
import { FaDatabase } from 'react-icons/fa';
import { BiNetworkChart } from 'react-icons/bi';
import { IconType } from 'react-icons';

type SystemStatusType = 'healthy' | 'warning' | 'critical';
type ServiceStatusType = 'healthy' | 'warning' | 'critical';

interface StatusConfig {
  color: string;
  bgColor: string;
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
      // TODO: Replace with actual API call
      // Example: Check if any service has issues
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
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, [services]);

  const statusConfig: Record<SystemStatusType, StatusConfig> = {
    healthy: {
      color: '#22C55E',
      bgColor: '#DCFCE7',
      text: 'All Systems Operational',
      icon: MdCheckCircle,
      description: 'All services running normally'
    },
    warning: {
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      text: 'Minor Issues Detected',
      icon: MdWarning,
      description: 'Some services require attention'
    },
    critical: {
      color: '#EF4444',
      bgColor: '#FEE2E2',
      text: 'Critical Alert',
      icon: MdError,
      description: 'Immediate action required'
    }
  };

  const getServiceStatusColor = (status: ServiceStatusType): string => {
    switch (status) {
      case 'healthy':
        return '#22C55E';
      case 'warning':
        return '#F59E0B';
      case 'critical':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const currentStatus: StatusConfig = statusConfig[systemStatus];
  const StatusIcon: IconType = currentStatus.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md shadow bg-white hover:bg-gray-50 transition-all duration-200 relative group"
        aria-label="System Status"
      >
        <MdOutlineHealthAndSafety 
          size={20} 
          style={{ color: currentStatus.color }}
          className="transition-transform group-hover:scale-110"
        />
        {/* Pulsing dot indicator */}
        <div 
          className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: currentStatus.color }}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 animate-slideDown z-50">
          {/* Header */}
          <div 
            className="p-4 rounded-t-xl border-b border-gray-100"
            style={{ backgroundColor: currentStatus.bgColor }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg bg-white/80 backdrop-blur-sm"
              >
                <StatusIcon size={24} style={{ color: currentStatus.color }} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{currentStatus.text}</h3>
                <p className="text-xs text-gray-600 mt-0.5">{currentStatus.description}</p>
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="p-3 max-h-96 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-500 px-2 mb-2">Service Status</div>
            
            <div className="space-y-2">
              {services.map((service, index) => {
                const ServiceIcon = service.icon;
                return (
                  <div
                    key={index}
                    className="p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ServiceIcon 
                          size={18} 
                          className="text-gray-600"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {service.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-2 h-2 rounded-full"
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
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Uptime:</span>
                        <span className="text-xs font-semibold text-gray-700">{service.uptime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Latency:</span>
                        <span className="text-xs font-semibold text-gray-700">{service.latency}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <button className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200">
              View Detailed Status →
            </button>
          </div>
        </div>
      )}

      {/* Styles */}
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

export default SystemStatusIndicator;