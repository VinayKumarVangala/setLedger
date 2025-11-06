import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { getExpiryStatus } from '../utils/validators';

const ExpiryBadge = ({ expiryDate, className = '' }) => {
  if (!expiryDate) return null;
  
  const status = getExpiryStatus(expiryDate);
  if (!status) return null;
  
  const getIcon = () => {
    switch (status.status) {
      case 'expired':
      case 'critical':
        return <AlertTriangle className="w-3 h-3" />;
      case 'warning':
      case 'caution':
        return <Clock className="w-3 h-3" />;
      default:
        return <CheckCircle className="w-3 h-3" />;
    }
  };
  
  const getColorClasses = () => {
    switch (status.color) {
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getColorClasses()} ${className}`}>
      {getIcon()}
      <span>{status.message}</span>
    </span>
  );
};

export default ExpiryBadge;