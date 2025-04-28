import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  themeColor: string;
  setThemeColor: (color: string) => void;
  darkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColor] = useState('#5B21B6'); // Default to deep purple
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  // Load theme preferences from localStorage on initial render
  useEffect(() => {
    const savedColor = localStorage.getItem('themeColor');
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedColor) {
      setThemeColor(savedColor);
    }
    
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Apply the theme color to the body as a gradient background
  useEffect(() => {
    // Create a gradient background with the theme color
    document.body.style.background = `radial-gradient(circle at top right, ${themeColor}, rgba(0, 0, 0, 0.9))`;
    
    // Apply dark mode class
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Clean up when component unmounts
    return () => {
      document.body.style.background = '';
    };
  }, [themeColor, darkMode]);

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
