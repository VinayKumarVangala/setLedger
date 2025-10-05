import React from 'react';
import { motion } from 'framer-motion';
import QuickActionButton from './QuickActionButton';
import { 
  Plus, FileText, Package, Calculator, TrendingUp, 
  Users, Settings, Download, Upload, Zap 
} from 'lucide-react';

const QuickActions = () => {

  const actions = [
    { 
      label: 'New Invoice', 
      icon: FileText, 
      href: '/invoices/new', 
      color: 'blue',
      shortcut: 'Ctrl+N'
    },
    { 
      label: 'Add Product', 
      icon: Package, 
      href: '/products/new', 
      color: 'green',
      shortcut: 'Ctrl+P'
    },
    { 
      label: 'GST Report', 
      icon: Calculator, 
      href: '/gst', 
      color: 'purple'
    },
    { 
      label: 'Analytics', 
      icon: TrendingUp, 
      href: '/analytics', 
      color: 'blue',
      shortcut: 'Ctrl+5'
    },
    { 
      label: 'Team', 
      icon: Users, 
      href: '/team', 
      color: 'gray'
    },
    { 
      label: 'Settings', 
      icon: Settings, 
      href: '/settings', 
      color: 'gray'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            variants={itemVariants}
          >
            <QuickActionButton {...action} size="lg" />
          </motion.div>
        ))}
      </motion.div>

      {/* Additional Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 pt-6 border-t"
      >
        <div className="flex gap-3">
          <QuickActionButton
            icon={Upload}
            label="Import Data"
            color="gray"
            size="sm"
          />
          
          <QuickActionButton
            icon={Download}
            label="Export Data"
            color="gray"
            size="sm"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default QuickActions;