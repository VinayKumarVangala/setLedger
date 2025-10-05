import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

const DashboardCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  icon: Icon, 
  color = 'blue', 
  href,
  description,
  loading = false 
}) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
    green: 'from-green-500 to-green-600 text-green-600 bg-green-50',
    purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
    orange: 'from-orange-500 to-orange-600 text-orange-600 bg-orange-50',
    red: 'from-red-500 to-red-600 text-red-600 bg-red-50'
  };

  const handleClick = () => {
    if (href) navigate(href);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`bg-white rounded-xl shadow-sm border p-6 ${href ? 'cursor-pointer' : ''} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        
        {href && (
          <motion.div
            whileHover={{ x: 4 }}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </motion.div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
        
        {change && (
          <div className="flex items-center gap-1">
            {changeType === 'positive' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change}
            </span>
            <span className="text-sm text-gray-500">from last month</span>
          </div>
        )}
        
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardCard;