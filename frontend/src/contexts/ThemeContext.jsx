import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [orgTheme, setOrgTheme] = useState('light');
  const [highContrast, setHighContrast] = useState(false);

  // Load theme preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    setTheme(savedTheme);
    setHighContrast(savedHighContrast);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    
    const root = document.documentElement;
    const activeTheme = highContrast ? 'high-contrast' : (orgTheme !== 'light' ? orgTheme : theme);
    
    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(activeTheme);
    
    localStorage.setItem('theme', theme);
    localStorage.setItem('highContrast', highContrast);
  }, [theme, orgTheme, highContrast]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleHighContrast = () => {
    const newHighContrast = !highContrast;
    setHighContrast(newHighContrast);
    localStorage.setItem('highContrast', newHighContrast);
  };

  const setOrgThemePreference = (newOrgTheme) => {
    setOrgTheme(newOrgTheme);
    localStorage.setItem('orgTheme', newOrgTheme);
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');

  return (
    <ThemeContext.Provider value={{
      theme,
      orgTheme,
      highContrast,
      toggleTheme,
      toggleHighContrast,
      setOrgThemePreference,
      setLightTheme,
      setDarkTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};