import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationSettingsPage } from '../NotificationSettingsPage';
import * as AuthContext from '../../../context/AuthContext';

// Mock the useAuth hook
vi.mock('../../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../../context/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

const renderSettingsPage = () => {
  return render(
    <BrowserRouter>
      <NotificationSettingsPage />
    </BrowserRouter>
  );
};

describe('NotificationSettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Authentication Required', () => {
    it('should show sign in required message when not authenticated', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        mfaRequired: false,
        mfaPendingUserId: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        refreshToken: vi.fn(),
        verifyMfa: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithApple: vi.fn(),
      });

      renderSettingsPage();
      
      expect(screen.getByText('Sign in required')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  describe('Preference Display', () => {
    beforeEach(() => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        isAuthenticated: true,
        user: { id: 'user-1', email: 'test@test.com' },
        isLoading: false,
        mfaRequired: false,
        mfaPendingUserId: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        refreshToken: vi.fn(),
        verifyMfa: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithApple: vi.fn(),
      } as any);
    });

    it('should display notification preferences page when authenticated', () => {
      renderSettingsPage();
      
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText('Choose how you want to be notified')).toBeInTheDocument();
    });

    it('should display email notification section', () => {
      renderSettingsPage();
      
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Receive updates via email')).toBeInTheDocument();
    });

    it('should display push notification section', () => {
      renderSettingsPage();
      
      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
      expect(screen.getByText('Real-time alerts in your browser')).toBeInTheDocument();
    });

    it('should display all email preference options', () => {
      renderSettingsPage();
      
      expect(screen.getAllByText('Order Updates').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Auction Alerts').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Outbid Notifications').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Auction Won').length).toBeGreaterThan(0);
      expect(screen.getAllByText('New Messages').length).toBeGreaterThan(0);
      expect(screen.getByText('Price Drops')).toBeInTheDocument();
      expect(screen.getByText('New Reviews')).toBeInTheDocument();
      expect(screen.getByText('Rewards Updates')).toBeInTheDocument();
      expect(screen.getByText('Promotions & Deals')).toBeInTheDocument();
      expect(screen.getByText('Newsletter')).toBeInTheDocument();
    });
  });

  describe('Preference Updates', () => {
    beforeEach(() => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        isAuthenticated: true,
        user: { id: 'user-1', email: 'test@test.com' },
        isLoading: false,
        mfaRequired: false,
        mfaPendingUserId: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        refreshToken: vi.fn(),
        verifyMfa: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithApple: vi.fn(),
      } as any);
    });

    it('should toggle preference when clicking toggle switch', async () => {
      renderSettingsPage();
      
      // Find the toggle buttons (they are buttons with role button)
      const toggleButtons = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('rounded-full')
      );
      
      // Click the first toggle (Order Updates email)
      const firstToggle = toggleButtons[0];
      const initialClass = firstToggle.className;
      
      fireEvent.click(firstToggle);
      
      // The class should change (toggle state changed)
      await waitFor(() => {
        expect(firstToggle.className).not.toBe(initialClass);
      });
    });

    it('should save preferences when clicking save button', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      
      renderSettingsPage();
      
      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Preferences saved successfully')).toBeInTheDocument();
      });
      
      expect(setItemSpy).toHaveBeenCalledWith(
        'notification_preferences',
        expect.any(String)
      );
    });

    it('should show success message after saving', async () => {
      renderSettingsPage();
      
      const saveButton = screen.getByText('Save Preferences');
      fireEvent.click(saveButton);
      
      // Should show success message after save completes
      await waitFor(() => {
        expect(screen.getByText('Preferences saved successfully')).toBeInTheDocument();
      });
      
      // Button should return to normal state
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    it('should load saved preferences from localStorage', async () => {
      const savedPreferences = {
        email: {
          orderUpdates: false,
          auctionAlerts: false,
          outbidNotifications: true,
          auctionWon: true,
          newMessages: true,
          promotions: true,
          newsletter: true,
          priceDrops: true,
          newReviews: true,
          rewardsUpdates: true,
        },
        push: {
          orderUpdates: false,
          auctionAlerts: true,
          outbidNotifications: true,
          auctionWon: true,
          newMessages: true,
        },
      };
      
      localStorage.setItem('notification_preferences', JSON.stringify(savedPreferences));
      
      renderSettingsPage();
      
      // The toggles should reflect the saved state
      // Since orderUpdates is false, the toggle should be in off state (bg-gray-200)
      await waitFor(() => {
        const toggleButtons = screen.getAllByRole('button').filter(
          btn => btn.classList.contains('rounded-full')
        );
        // First toggle (Order Updates email) should be off (gray)
        expect(toggleButtons[0]).toHaveClass('bg-gray-200');
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        isAuthenticated: true,
        user: { id: 'user-1', email: 'test@test.com' },
        isLoading: false,
        mfaRequired: false,
        mfaPendingUserId: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        refreshToken: vi.fn(),
        verifyMfa: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithApple: vi.fn(),
      } as any);
    });

    it('should have back to settings link', () => {
      renderSettingsPage();
      
      const backLink = screen.getByText('Back to Settings');
      expect(backLink.closest('a')).toHaveAttribute('href', '/settings');
    });
  });
});
