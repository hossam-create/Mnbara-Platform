// ============================================
// 🎯 React Context - Real-time & Auth Provider
// ============================================

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { wsService, chatEvents, notificationEvents } from '../services/websocket';
import { pushService, type AppNotification } from '../services/notifications';
import type { UserProfile, Wallet } from '../types/chat-wallet';

// ============================================
// 🔐 Auth Context
// ============================================

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token and get user
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token: string) => {
    try {
      // Mock user for demo
      setUser({
        id: 'me',
        email: 'user@example.com',
        fullName: 'Demo User',
        role: 'hybrid',
        kycStatus: 'verified',
        kycLevel: 2,
        rating: 4.9,
        totalReviews: 128,
        memberSince: '2023-03-15',
        lastActive: new Date().toISOString(),
        isVerified: true,
        badges: [],
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Simulate login
    const token = 'mock_token_' + Date.now();
    localStorage.setItem('auth_token', token);
    await fetchCurrentUser(token);
    
    // Connect WebSocket after login
    wsService.connect(token);
  };

  const register = async (data: { email: string; password: string; name: string; role: string }) => {
    // Simulate registration
    const token = 'mock_token_' + Date.now();
    localStorage.setItem('auth_token', token);
    await fetchCurrentUser(token);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    wsService.disconnect();
    setUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// ============================================
// 🔔 Notifications Context
// ============================================

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Initialize push service
    pushService.init().then(() => {
      setPermission(pushService.permission);
    });

    // Listen for real-time notifications
    const unsubscribe = notificationEvents.onNotification((data) => {
      const notification = data as AppNotification;
      setNotifications(prev => [notification, ...prev]);
      
      // Show push notification if permission granted
      if (pushService.permission === 'granted') {
        pushService.showNotification({
          title: notification.title,
          body: notification.message,
          data: { link: notification.link },
        });
      }
    });

    return unsubscribe;
  }, []);

  const requestPermission = async () => {
    const result = await pushService.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      await pushService.subscribe();
    }
    
    return result;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      permission,
      requestPermission,
      markAsRead,
      markAllAsRead,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

// ============================================
// 💰 Wallet Context
// ============================================

interface WalletContextType {
  wallet: Wallet | null;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    try {
      // Mock wallet data
      setWallet({
        id: 'w1',
        userId: 'me',
        balance: 2840.50,
        currency: 'USD',
        pendingBalance: 350.00,
        frozenBalance: 1200.00,
        totalEarnings: 8540.00,
        totalSpent: 3250.00,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <WalletContext.Provider value={{ wallet, isLoading, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

// ============================================
// 🌐 Combined Provider
// ============================================

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <WalletProvider>
          {children}
        </WalletProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default AppProviders;
