import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'modern' | 'cyberpunk' | 'egyptian' | 'hacker';

interface ControlCenterThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  // Helpers for current theme styles
  colors: {
    primary: string;
    secondary: string;
    background: string;
    panel: string;
    text: string;
    accent: string;
    danger: string;
  };
}

const ControlCenterThemeContext = createContext<ControlCenterThemeContextType | undefined>(undefined);

const THEME_CONFIGS = {
  modern: {
    primary: '#3b82f6', // blue-500
    secondary: '#64748b', // slate-500
    background: '#0f172a', // slate-900
    panel: 'rgba(30, 41, 59, 0.8)', // slate-800 with opacity
    text: '#f1f5f9', // slate-100
    accent: '#38bdf8', // sky-400
    danger: '#ef4444', // red-500
  },
  cyberpunk: {
    primary: '#00f3ff', // neon-blue
    secondary: '#bc13fe', // neon-pink
    background: '#050505', // cyber-black
    panel: 'rgba(20, 20, 30, 0.9)', 
    text: '#e0f2fe',
    accent: '#0aff0a', // neon-green
    danger: '#ff003c',
  },
  egyptian: {
    primary: '#ffd700', // gold
    secondary: '#003366', // lapis
    background: '#1a1a10', // sand-black
    panel: 'rgba(26, 26, 16, 0.9)',
    text: '#f5e6d3', // parchment
    accent: '#ff4500', // sunset-orange
    danger: '#8b0000', // dark red
  },
  hacker: {
    primary: '#0aff0a', // matrix-green
    secondary: '#003300', // dark-green
    background: '#000000', // black
    panel: 'rgba(0, 20, 0, 0.9)',
    text: '#0aff0a',
    accent: '#00ff00',
    danger: '#ff0000',
  }
};

export function ControlCenterThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('modern');

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('control-center-theme') as ThemeMode;
    if (savedTheme && Object.keys(THEME_CONFIGS).includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('control-center-theme', newTheme);
    
    // Apply global class for specifics
    document.documentElement.setAttribute('data-control-theme', newTheme);
  };

  const value = {
    theme,
    setTheme: handleSetTheme,
    colors: THEME_CONFIGS[theme]
  };

  return (
    <ControlCenterThemeContext.Provider value={value}>
      {children}
    </ControlCenterThemeContext.Provider>
  );
}

export function useControlCenterTheme() {
  const context = useContext(ControlCenterThemeContext);
  if (context === undefined) {
    throw new Error('useControlCenterTheme must be used within a ControlCenterThemeProvider');
  }
  return context;
}
