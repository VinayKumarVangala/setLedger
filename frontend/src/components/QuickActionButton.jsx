import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const QuickActionButton = ({ 
  icon: Icon, 
  label, 
  href, 
  onClick, 
  shortcut, 
  color = 'blue',
  size = 'md',
  disabled = false 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (disabled) return;
    if (onClick) onClick();
    if (href) navigate(href);
  };

  const sizeClasses = {
    sm: 'p-2 text-xs',
    md: 'p-3 text-sm',
    lg: 'p-4 text-base'
  };

  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    gray: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} ${colorClasses[color]}
        text-white rounded-lg font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm hover:shadow-md
        flex items-center gap-2 min-w-0
      `}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
      {shortcut && (
        <span className="text-xs opacity-75 bg-black bg-opacity-20 px-1 rounded">
          {shortcut}
        </span>
      )}
    </motion.button>
  );
};

export default QuickActionButton;