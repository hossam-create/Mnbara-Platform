import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationCenter } from '../NotificationCenter';
import * as NotificationContext from '../../../context/NotificationContext';
import type { Notification } from '../../../types';

// Mock the useNotifications hook
vi.mock('../../../context/NotificationContext', async () => {
  const actual = await vi.importActual('../../../context/NotificationContext');
  return {
    ...actual,
    useNotifications: vi.fn(),
  };
});

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'order_update',
    title: 'Order Shipped',
    message: 'Your order #123 has been shipped',
    read: false,
    createdAt: new Date().toISOString(),
    data: { orderId: 'order-123' },
  },
  {
    id: 'notif-2',
    type: 'bid_outbid',
    title: 'You were outbid',
    message: 'Someone placed a higher bid',
    read: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    data: { auctionId: 'auction-456' },
  },
];

const mockUseNotifications = {
  notifications: mockNotifications,
  unreadCount: 1,
  isLoading: false,
  hasMore: false,
  loadMore: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  fetchNotifications: vi.fn(),
  addNotification: vi.fn(),
};

const renderNotificationCenter = () => {
  return render(
    <BrowserRouter>
      <NotificationCenter />
    </BrowserRouter>
  );
};

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(NotificationContext.useNotifications).mockReturnValue(mockUseNotifications);
  });

  describe('Bell Button', () => {
    it('should render the notification bell button', () => {
      renderNotificationCenter();
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });

    it('should display unread count badge when there are unread notifications', () => {
      renderNotificationCenter();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display 9+ when unread count exceeds 9', () => {
      vi.mocked(NotificationContext.useNotifications).mockReturnValue({
        ...mockUseNotifications,
        unreadCount: 15,
      });
      renderNotificationCenter();
      expect(screen.getByText('9+')).toBeInTheDocument();
    });

    it('should not display badge when there are no unread notifications', () => {
      vi.mocked(NotificationContext.useNotifications).mockReturnValue({
        ...mockUseNotifications,
        unreadCount: 0,
      });
      renderNotificationCenter();
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('Dropdown', () => {
    it('should open dropdown when bell button is clicked', async () => {
      renderNotificationCenter();
      
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      renderNotificationCenter();
      
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);
      
      await waitFor(() => {
        expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when pressing Escape', async () => {
      renderNotificationCenter();
      
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
      });
    });
  });

  describe('Notification Display', () => {
    it('should display notification items', async () => {
      renderNotificationCenter();
      
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Order Shipped')).toBeInTheDocument();
        expect(screen.getByText('You were outbid')).toBeInTheDocument();
      });
    });

    it('should display empty state when no notifications', async () => {
      vi.mocked(NotificationContext.useNotifications).mockReturnValue({
        ...mockUseNotifications,
        notifications: [],
        unreadCount: 0,
      });
      
      renderNotificationCenter();
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      
      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      });
    });

    it('should show "Mark all as read" button when there are unread notifications', async () => {
      renderNotificationCenter();
      
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Mark all as read')).toBeInTheDocument();
      });
    });

    it('should call markAllAsRead when clicking "Mark all as read"', async () => {
      renderNotificationCenter();
      
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      await waitFor(() => {
        expect(screen.getByText('Mark all as read')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Mark all as read'));
      
      expect(mockUseNotifications.markAllAsRead).toHaveBeenCalled();
    });
  });

  describe('Load More', () => {
    it('should show load more button when hasMore is true', async () => {
      vi.mocked(NotificationContext.useNotifications).mockReturnValue({
        ...mockUseNotifications,
        hasMore: true,
      });
      
      renderNotificationCenter();
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Load more')).toBeInTheDocument();
      });
    });

    it('should call loadMore when clicking load more button', async () => {
      vi.mocked(NotificationContext.useNotifications).mockReturnValue({
        ...mockUseNotifications,
        hasMore: true,
      });
      
      renderNotificationCenter();
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Load more')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Load more'));
      
      expect(mockUseNotifications.loadMore).toHaveBeenCalled();
    });

    it('should show loading state when loading more', async () => {
      vi.mocked(NotificationContext.useNotifications).mockReturnValue({
        ...mockUseNotifications,
        hasMore: true,
        isLoading: true,
      });
      
      renderNotificationCenter();
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });

  describe('View All Link', () => {
    it('should have a link to view all notifications', async () => {
      renderNotificationCenter();
      
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      
      await waitFor(() => {
        const viewAllLink = screen.getByText('View all notifications');
        expect(viewAllLink).toBeInTheDocument();
        expect(viewAllLink.closest('a')).toHaveAttribute('href', '/notifications');
      });
    });
  });
});
