// Color palette for Mnbara app
// Following the crowdshipping/delivery brand identity

const colors = {
  // Primary brand colors
  primary: {
    light: '#4CAF50',
    main: '#2E7D32',
    dark: '#1B5E20',
    contrastText: '#FFFFFF',
  },
  
  // Secondary/Accent colors
  secondary: {
    light: '#FF7043',
    main: '#E64A19',
    dark: '#BF360C',
    contrastText: '#FFFFFF',
  },
  
  // Status colors
  success: {
    light: '#81C784',
    main: '#4CAF50',
    dark: '#388E3C',
    contrastText: '#FFFFFF',
  },
  
  warning: {
    light: '#FFB74D',
    main: '#FFA726',
    dark: '#F57C00',
    contrastText: '#000000',
  },
  
  error: {
    light: '#EF5350',
    main: '#F44336',
    dark: '#C62828',
    contrastText: '#FFFFFF',
  },
  
  info: {
    light: '#64B5F6',
    main: '#2196F3',
    dark: '#1565C0',
    contrastText: '#FFFFFF',
  },
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray scale
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    tertiary: '#FAFAFA',
    dark: '#121212',
    card: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Text colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    tertiary: '#9E9E9E',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
    hint: '#9E9E9E',
  },
  
  // Border colors
  border: {
    light: '#E0E0E0',
    main: '#BDBDBD',
    dark: '#9E9E9E',
    focus: '#2E7D32',
  },
  
  // Delivery status colors
  deliveryStatus: {
    pending: '#FFA726',
    accepted: '#2196F3',
    inTransit: '#9C27B0',
    outForDelivery: '#00BCD4',
    delivered: '#4CAF50',
    cancelled: '#F44336',
    disputed: '#795548',
  },
  
  // Rating stars
  rating: {
    filled: '#FFC107',
    empty: '#E0E0E0',
  },
  
  // Verification badges
  verification: {
    verified: '#4CAF50',
    unverified: '#9E9E9E',
    pending: '#FFA726',
  },
  
  // Map colors
  map: {
    userLocation: '#2196F3',
    travelerLocation: '#4CAF50',
    route: '#2E7D32',
    pickup: '#4CAF50',
    dropoff: '#F44336',
    destination: '#FF9800',
  },
};

export default colors;
