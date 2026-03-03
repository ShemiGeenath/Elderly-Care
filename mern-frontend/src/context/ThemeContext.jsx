// frontend/src/context/ThemeContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get saved theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Apply CSS variables based on theme
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#111827');
      root.style.setProperty('--bg-secondary', '#1f2937');
      root.style.setProperty('--bg-tertiary', '#374151');
      root.style.setProperty('--text-primary', '#f9fafb');
      root.style.setProperty('--text-secondary', '#d1d5db');
      root.style.setProperty('--text-tertiary', '#9ca3af');
      root.style.setProperty('--border-color', '#374151');
      root.style.setProperty('--card-bg', '#1f2937');
      root.style.setProperty('--input-bg', '#374151');
      root.style.setProperty('--hover-bg', '#374151');
    } else {
      // Light theme
      root.style.setProperty('--bg-primary', '#f3f4f6');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-tertiary', '#f9fafb');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#4b5563');
      root.style.setProperty('--text-tertiary', '#6b7280');
      root.style.setProperty('--border-color', '#e5e7eb');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--input-bg', '#ffffff');
      root.style.setProperty('--hover-bg', '#f3f4f6');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    console.log('Theme changed to:', theme); // For debugging
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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