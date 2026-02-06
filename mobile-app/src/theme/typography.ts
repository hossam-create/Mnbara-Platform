import { Platform } from 'react-native';

const fontFamily = {
  // Primary font family
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto Bold',
    default: 'System',
  }),
  
  // Custom fonts (if available)
  heading: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  body: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  caption: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
};

const fontSize = {
  // Headings
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  h6: 16,
  
  // Body text
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  
  // Caption text
  captionLarge: 14,
  captionMedium: 12,
  captionSmall: 10,
  
  // Special
  button: 16,
  overline: 10,
  input: 16,
};

const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
};

export const typography = {
  // Headings
  h1: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.h1 * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.h2 * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.h3 * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h4: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.h4 * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h5,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.h5 * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.h6 * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  
  // Body text
  bodyLarge: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.bodyLarge * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodyMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodyMedium,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.bodyMedium * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.bodySmall * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  
  // Caption text
  captionLarge: {
    fontFamily: fontFamily.caption,
    fontSize: fontSize.captionLarge,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.captionLarge * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  captionMedium: {
    fontFamily: fontFamily.caption,
    fontSize: fontSize.captionMedium,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.captionMedium * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  captionSmall: {
    fontFamily: fontFamily.caption,
    fontSize: fontSize.captionSmall,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.captionSmall * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  
  // Button text
  button: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.button,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.button * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
    textTransform: 'uppercase' as const,
  },
  
  // Input text
  input: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.input,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.input * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
};

export default {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  typography,
};
