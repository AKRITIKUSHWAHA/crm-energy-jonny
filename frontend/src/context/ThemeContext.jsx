import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    // Enterprise dark navy is the approved and enforced portal theme.
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_theme', 'dark');
      } catch (e) {
        // Ignore storage access errors
      }
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    try {
      localStorage.setItem('app_theme', 'dark');
    } catch (e) {
      // Ignore storage access errors
    }
  }, [theme]);

  const setTheme = () => {
    setThemeState('dark');
  };

  const toggleTheme = () => {
    setThemeState('dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
