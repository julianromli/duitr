
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, default to light for Notion-style theme
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    return savedTheme || 'light';
  });

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem('theme', theme);
    
    // Update document classes for proper theme application
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Update meta theme color for better mobile experience
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const themeColor = theme === 'dark' ? '#0D0D0D' : '#FAFAFA'; // Notion-style light background
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = themeColor;
      document.head.appendChild(meta);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
