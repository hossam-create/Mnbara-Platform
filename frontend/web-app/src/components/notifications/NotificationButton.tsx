import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationAPI } from '../../services/api/notificationAPI';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';

const NotificationButton: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      
      // Connect to WebSocket for real-time updates
      const ws = notificationAPI.connectWebSocket(user.id, () => {
        setUnreadCount(prev => prev + 1);
      });

      return () => {
        ws.close();
      };
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;
    
    try {
      const stats = await notificationAPI.getStats();
      setUnreadCount(stats.unread);
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  };

  const handleClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reload count when closing to reflect any changes
    loadUnreadCount();
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter isOpen={isOpen} onClose={handleClose} />
    </>
  );
};

export default NotificationButton;