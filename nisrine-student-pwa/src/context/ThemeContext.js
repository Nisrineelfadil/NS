import React, { createContext, useState, useEffect, useContext } from 'react';

const THEMES = {
  bright: {
    name: 'Bright Mode',
    primary: '#FFCC00',
    secondary: '#FF9500',
    background: '#f9fafb',
    cardBg: '#ffffff',
    text: '#1f2937',
    textLight: '#6b7280',
    borderColor: '#e5e7eb',
  },
  dark: {
    name: 'Dark Mode',
    primary: '#FFCC00',
    secondary: '#FF9500',
    background: '#1a1a2e',
    cardBg: '#16213e',
    text: '#ffffff',
    textLight: '#94a3b8',
    borderColor: '#2d3748',
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('bright');
  const [theme, setTheme] = useState(THEMES.bright);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = () => {
    try {
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme && THEMES[savedTheme]) {
        setCurrentTheme(savedTheme);
        setTheme(THEMES[savedTheme]);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const changeTheme = (themeName) => {
    try {
      if (THEMES[themeName]) {
        localStorage.setItem('appTheme', themeName);
        setCurrentTheme(themeName);
        setTheme(THEMES[themeName]);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
