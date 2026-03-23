import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';

type StatusType = 'connected' | 'disconnected' | 'error' | 'pending' | string;

interface TargetSystemStatusProps {
  status?: StatusType;
}

const TargetSystemStatus: React.FC<TargetSystemStatusProps> = ({ status = 'pending' }) => {
  const getIcon = ()=> {
    switch (status) {
      case 'connected':
        return <FaCheckCircle className="text-green-500" />;
      case 'disconnected':
        return <FaTimesCircle className="text-red-500" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500 animate-spin" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusClass = (): string => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'disconnected':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'error':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  const getStatusLabel = (): string => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusClass()}`}>
      <style>{`
        .tss-badge {
          font-size: clamp(10px, 0.65vw, 12px);
          padding: clamp(2px, 0.2vw, 4px) clamp(8px, 0.65vw, 12px);
          gap: clamp(4px, 0.4vw, 8px);
          border-radius: 9999px;
          white-space: nowrap;
        }
        .tss-badge svg {
          width: clamp(10px, 0.75vw, 13px);
          height: clamp(10px, 0.75vw, 13px);
          flex-shrink: 0;
        }

        @media (min-width: 2560px) and (max-width: 3839px) {
          .tss-badge {
            font-size: 14px;
            padding: 5px 14px;
            gap: 8px;
          }
          .tss-badge svg {
            width: 15px;
            height: 15px;
          }
        }

        @media (min-width: 3840px) {
          .tss-badge {
            font-size: 18px;
            padding: 7px 20px;
            gap: 10px;
          }
          .tss-badge svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
      {getIcon()}
      <span>{getStatusLabel()}</span>
    </div>
  );
};

export default TargetSystemStatus;