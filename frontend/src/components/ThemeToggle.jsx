import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Contrast } from 'lucide-react';

const ThemeToggle = ({ showLabels = false }) => {
  const { theme, highContrast, toggleTheme, toggleHighContrast } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme (Ctrl+Alt+T)`}
      >
        <motion.div
          initial={false}
          animate={{ rotate: theme === 'dark' ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {theme === 'light' ? (
            <Sun className="h-4 w-4 text-yellow-600" />
          ) : (
            <Moon className="h-4 w-4 text-blue-400" />
          )}
        </motion.div>
      </motion.button>

      {/* High Contrast Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleHighContrast}
        className={`p-2 rounded-lg transition-colors ${
          highContrast 
            ? 'bg-black text-white' 
            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={`${highContrast ? 'Disable' : 'Enable'} high contrast (Ctrl+Alt+H)`}
      >
        <Contrast className="h-4 w-4" />
      </motion.button>

      {showLabels && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <div>Ctrl+Alt+T: Theme</div>
          <div>Ctrl+Alt+H: Contrast</div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;