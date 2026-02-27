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
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800';
      case 'disconnected':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-600';
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
    <div
      className={`inline-flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-0.5 xl:py-1 rounded-full text-[11px] xl:text-xs 2xl:text-sm font-medium ${getStatusClass()}`}
    >
      {getIcon()}
      <span>{getStatusLabel()}</span>
    </div>
  );
};

export default TargetSystemStatus;