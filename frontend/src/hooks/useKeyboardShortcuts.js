import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { toggleTheme, toggleHighContrast } = useTheme();

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if user is typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const { key, ctrlKey, altKey, metaKey } = event;
      const modifier = ctrlKey || metaKey;

      // Navigation shortcuts
      if (modifier && !altKey) {
        switch (key) {
          case '1':
            event.preventDefault();
            navigate('/');
            break;
          case '2':
            event.preventDefault();
            navigate('/products');
            break;
          case '3':
            event.preventDefault();
            navigate('/invoices');
            break;
          case '4':
            event.preventDefault();
            navigate('/gst');
            break;
          case '5':
            event.preventDefault();
            navigate('/analytics');
            break;
          case '6':
            event.preventDefault();
            navigate('/reports');
            break;
          case 'k':
            event.preventDefault();
            // Focus search (if exists)
            const searchInput = document.querySelector('[data-search]');
            if (searchInput) searchInput.focus();
            break;
          case 'n':
            event.preventDefault();
            // Quick new invoice
            navigate('/invoices/new');
            break;
          case 'p':
            event.preventDefault();
            // Quick new product
            navigate('/products/new');
            break;
        }
      }

      // Theme shortcuts
      if (modifier && altKey) {
        switch (key) {
          case 't':
            event.preventDefault();
            toggleTheme();
            break;
          case 'h':
            event.preventDefault();
            toggleHighContrast();
            break;
        }
      }

      // Quick actions without modifiers
      if (!modifier && !altKey) {
        switch (key) {
          case 'Escape':
            // Close modals, clear focus
            const activeElement = document.activeElement;
            if (activeElement && activeElement.blur) {
              activeElement.blur();
            }
            break;
          case '?':
            event.preventDefault();
            // Show keyboard shortcuts help
            showShortcutsHelp();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleTheme, toggleHighContrast]);

  const showShortcutsHelp = () => {
    const shortcuts = [
      { key: 'Ctrl/Cmd + 1', action: 'Go to Dashboard' },
      { key: 'Ctrl/Cmd + 2', action: 'Go to Products' },
      { key: 'Ctrl/Cmd + 3', action: 'Go to Invoices' },
      { key: 'Ctrl/Cmd + 4', action: 'Go to GST' },
      { key: 'Ctrl/Cmd + 5', action: 'Go to Analytics' },
      { key: 'Ctrl/Cmd + 6', action: 'Go to Reports' },
      { key: 'Ctrl/Cmd + K', action: 'Focus Search' },
      { key: 'Ctrl/Cmd + N', action: 'New Invoice' },
      { key: 'Ctrl/Cmd + P', action: 'New Product' },
      { key: 'Ctrl/Cmd + Alt + T', action: 'Toggle Theme' },
      { key: 'Ctrl/Cmd + Alt + H', action: 'Toggle High Contrast' },
      { key: 'Escape', action: 'Clear Focus/Close' },
      { key: '?', action: 'Show This Help' }
    ];

    alert(`Keyboard Shortcuts:\n\n${shortcuts.map(s => `${s.key}: ${s.action}`).join('\n')}`);
  };
};