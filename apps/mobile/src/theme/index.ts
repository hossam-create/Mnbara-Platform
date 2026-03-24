import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';

// Light Theme
export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary.main,
    background: colors.background.primary,
    card: colors.background.card,
    text: colors.text.primary,
    secondary: colors.text.secondary,
    border: colors.border.light,
    notification: colors.primary.main,
  },
  spacing,
  typography: typography.typography,
  shadows,
  colorsFull: colors,
};

// Dark Theme
export const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary.light,
    background: colors.background.dark,
    card: '#1E1E1E',
    text: colors.white,
    secondary: colors.gray[400],
    border: colors.gray[700],
    notification: colors.primary.light,
  },
  spacing,
  typography: typography.typography,
  shadows,
  colorsFull: {
    ...colors,
    background: {
      ...colors.background,
      primary: '#121212',
      card: '#1E1E1E',
    },
    text: {
      ...colors.text,
      primary: colors.white,
      secondary: colors.gray[400],
    },
  },
};

// Theme object with all properties
export const theme = {
  light: lightTheme,
  dark: darkTheme,
};

// Export individual theme for direct access
export const useTheme = () => lightTheme;

export type Theme = typeof lightTheme;

export default {
  light: lightTheme,
  dark: darkTheme,
  colors,
  typography,
  spacing,
  shadows,
};
