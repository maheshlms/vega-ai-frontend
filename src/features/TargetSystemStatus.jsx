import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const TargetSystemStatus = ({ status = 'pending' }) => {
  const getIcon = () => {
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

  const getStatusClass = () => {
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

  const getStatusLabel = () => {
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
      {getIcon()}
      <span>{getStatusLabel()}</span>
    </div>
  );
};

export default TargetSystemStatus;
