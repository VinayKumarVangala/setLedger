import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowTrendingUpIcon, 
  ExclamationTriangleIcon, 
  LightBulbIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const WelcomeDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/data');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { revenue, alerts, recommendations, stats, recentTransactions } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white"
      >
        <h1 className="text-2xl font-bold mb-2">Welcome to setLedger</h1>
        <p className="text-primary-100">Here's your business overview for today</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{revenue?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalProducts || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Invoices</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.pendingInvoices || 0}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold ml-2 text-gray-900 dark:text-white">Alerts</h3>
          </div>
          
          {alerts?.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No alerts at the moment</p>
          )}
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center mb-4">
            <LightBulbIcon className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold ml-2 text-gray-900 dark:text-white">Recommendations</h3>
          </div>
          
          {recommendations?.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{rec}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">All good! No recommendations</p>
          )}
        </motion.div>
      </div>

      {/* Recent Transactions */}
      {recentTransactions?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center mb-4">
            <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold ml-2 text-gray-900 dark:text-white">Recent Transactions</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Description</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Amount</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-sm text-gray-900 dark:text-white">{transaction.description}</td>
                    <td className={`py-3 text-sm text-right ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toLocaleString()}
                    </td>
                    <td className="py-3 text-sm text-gray-500 dark:text-gray-400 text-right">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WelcomeDashboard;