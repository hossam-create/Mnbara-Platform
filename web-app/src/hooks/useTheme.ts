import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type Direction = 'ltr' | 'rtl';

interface ThemeContextValue {
  theme: Theme;
  direction: Direction;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setDirection: (direction: Direction) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = 'mnbara-theme';
const DIRECTION_KEY = 'mnbara-direction';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored as Theme;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [direction, setDirectionState] = useState<Direction>(() => {
    if (typeof window === 'undefined') return 'ltr';
    
    const stored = localStorage.getItem(DIRECTION_KEY);
    if (stored) return stored as Direction;
    
    return document.documentElement.dir || 'ltr';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('dir', direction);
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(DIRECTION_KEY, direction);
  }, [theme, direction]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const setDirection = useCallback((newDirection: Direction) => {
    setDirectionState(newDirection);
  }, []);

  const value: ThemeContextValue = {
    theme,
    direction,
    toggleTheme,
    setTheme,
    setDirection,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default useTheme;
