import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { 
  SunIcon, 
  MoonIcon, 
  EyeIcon 
} from '@heroicons/react/24/outline';

const OrgThemeSettings = () => {
  const { orgTheme, setOrgThemePreference } = useTheme();

  const themes = [
    { id: 'light', name: 'Light', icon: SunIcon, description: 'Clean and bright interface' },
    { id: 'dark', name: 'Dark', icon: MoonIcon, description: 'Easy on the eyes' },
    { id: 'high-contrast', name: 'High Contrast', icon: EyeIcon, description: 'Maximum accessibility' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Organization Theme
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Set the default theme for your organization. Members can override this in their personal settings.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isSelected = orgTheme === theme.id;
          
          return (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setOrgThemePreference(theme.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <Icon className={`h-8 w-8 mb-2 ${
                  isSelected ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <h4 className={`font-medium mb-1 ${
                  isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'
                }`}>
                  {theme.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {theme.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default OrgThemeSettings;