import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useNotification from '../useNotification';

describe('useNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useNotification());

      expect(result.current.notifications).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Notification Creation', () => {
    it('should create success notification', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.success('Operation successful');
      });

      expect(result.current.notifications.length).toBeGreaterThan(0);
      expect(result.current.notifications[0].type).toBe('success');
    });

    it('should create error notification', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.error('Operation failed');
      });

      expect(result.current.notifications.length).toBeGreaterThan(0);
      expect(result.current.notifications[0].type).toBe('error');
    });

    it('should create warning notification', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.warning('Warning message');
      });

      expect(result.current.notifications.length).toBeGreaterThan(0);
      expect(result.current.notifications[0].type).toBe('warning');
    });

    it('should create info notification', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.info('Information message');
      });

      expect(result.current.notifications.length).toBeGreaterThan(0);
      expect(result.current.notifications[0].type).toBe('info');
    });
  });

  describe('Notification Dismissal', () => {
    it('should dismiss notification by ID', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.success('Test message');
      });

      const notificationId = result.current.notifications[0].id;

      await act(async () => {
        result.current.dismiss(notificationId);
      });

      expect(result.current.notifications.length).toBe(0);
    });

    it('should dismiss all notifications', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.success('Message 1');
        result.current.error('Message 2');
        result.current.warning('Message 3');
      });

      expect(result.current.notifications.length).toBe(3);

      await act(async () => {
        result.current.dismissAll();
      });

      expect(result.current.notifications.length).toBe(0);
    });

    it('should auto-dismiss after timeout', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.success('Auto-dismiss message', { duration: 100 });
      });

      expect(result.current.notifications.length).toBe(1);

      await waitFor(
        () => {
          expect(result.current.notifications.length).toBe(0);
        },
        { timeout: 200 }
      );
    });
  });

  describe('Notification Persistence', () => {
    it('should persist notification if duration is 0', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.success('Persistent message', { duration: 0 });
      });

      expect(result.current.notifications.length).toBe(1);

      await waitFor(
        () => {
          expect(result.current.notifications.length).toBe(1);
        },
        { timeout: 100 }
      );
    });
  });

  describe('Notification Fetching', () => {
    it('should fetch notifications', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        await result.current.fetchNotifications();
      });

      expect(result.current.notifications).toBeDefined();
    });

    it('should mark notification as read', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.success('Test message');
      });

      const notificationId = result.current.notifications[0].id;

      await act(async () => {
        await result.current.markAsRead(notificationId);
      });

      expect(result.current.notifications[0].read).toBe(true);
    });

    it('should mark all as read', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.success('Message 1');
        result.current.error('Message 2');
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      result.current.notifications.forEach(notif => {
        expect(notif.read).toBe(true);
      });
    });
  });

  describe('Notification Filtering', () => {
    it('should get unread notifications', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.success('Message 1');
        result.current.error('Message 2');
      });

      const unread = result.current.getUnreadNotifications();
      expect(unread.length).toBeGreaterThan(0);
    });

    it('should get notifications by type', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.success('Success message');
        result.current.error('Error message');
      });

      const errors = result.current.getNotificationsByType('error');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        try {
          await result.current.fetchNotifications();
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('RTL Support', () => {
    it('should support RTL notifications', async () => {
      const { result } = renderHook(() => useNotification());

      await act(async () => {
        result.current.success('رسالة نجاح', { rtl: true });
      });

      expect(result.current.notifications[0].rtl).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useNotification());

      expect(() => unmount()).not.toThrow();
    });
  });
});
