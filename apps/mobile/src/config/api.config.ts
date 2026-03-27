export default {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  WS_PORT: parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3002'),
  
  // Service endpoints
  services: {
    auth: '/api/auth',
    user: '/api/users',
    wallet: '/api/wallet',
    delivery: '/api/deliveries',
    trips: '/api/trips',
    matching: '/api/matching',
    chat: '/api/chat',
    payments: '/api/payments',
    notifications: '/api/notifications',
  },
  
  // Timeouts
  timeout: 30000,
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    delay: 1000,
  },
};
