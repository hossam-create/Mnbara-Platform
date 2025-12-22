// ============================================
// 🔔 Notification Settings Page - Email Preferences
// ============================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ============================================
// Types
// ============================================

interface NotificationPreferences {
  email: {
    orderUpdates: boolean;
    auctionAlerts: boolean;
    outbidNotifications: boolean;
    auctionWon: boolean;
    newMessages: boolean;
    promotions: boolean;
    newsletter: boolean;
    priceDrops: boolean;
    newReviews: boolean;
    rewardsUpdates: boolean;
  };
  push: {
    orderUpdates: boolean;
    auctionAlerts: boolean;
    outbidNotifications: boolean;
    auctionWon: boolean;
    newMessages: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  email: {
    orderUpdates: true,
    auctionAlerts: true,
    outbidNotifications: true,
    auctionWon: true,
    newMessages: true,
    promotions: false,
    newsletter: false,
    priceDrops: true,
    newReviews: true,
    rewardsUpdates: true,
  },
  push: {
    orderUpdates: true,
    auctionAlerts: true,
    outbidNotifications: true,
    auctionWon: true,
    newMessages: true,
  },
};

// ============================================
// Toggle Switch Component
// ============================================

function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-pink-500' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ============================================
// Preference Row Component
// ============================================

function PreferenceRow({
  icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  );
}

// ============================================
// Notification Settings Page Component
// ============================================

export function NotificationSettingsPage() {
  const { isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load preferences from API
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // In a real app, fetch from API
        const saved = localStorage.getItem('notification_preferences');
        if (saved) {
          setPreferences(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Update email preference
  const updateEmailPref = (key: keyof NotificationPreferences['email'], value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      email: { ...prev.email, [key]: value },
    }));
    setSaveSuccess(false);
  };

  // Update push preference
  const updatePushPref = (key: keyof NotificationPreferences['push'], value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      push: { ...prev.push, [key]: value },
    }));
    setSaveSuccess(false);
  };

  // Save preferences
  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // In a real app, save to API
      localStorage.setItem('notification_preferences', JSON.stringify(preferences));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <span className="text-6xl">🔒</span>
          <h2 className="text-xl font-semibold text-gray-900 mt-4">Sign in required</h2>
          <p className="text-gray-500 mt-2">Please sign in to manage your notification preferences</p>
          <Link
            to="/login"
            className="inline-block mt-6 px-6 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-medium rounded-lg"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/settings" className="text-pink-500 hover:text-pink-600 text-sm font-medium flex items-center gap-1 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-gray-500 mt-1">Choose how you want to be notified</p>
        </div>

        {/* Email Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-indigo-100 flex items-center justify-center">
              <span className="text-xl">📧</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Email Notifications</h2>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            <PreferenceRow
              icon="📦"
              title="Order Updates"
              description="Get notified about order status changes, shipping updates, and delivery confirmations"
              enabled={preferences.email.orderUpdates}
              onChange={(v) => updateEmailPref('orderUpdates', v)}
            />
            <PreferenceRow
              icon="🔨"
              title="Auction Alerts"
              description="Receive alerts when auctions you're watching are about to end"
              enabled={preferences.email.auctionAlerts}
              onChange={(v) => updateEmailPref('auctionAlerts', v)}
            />
            <PreferenceRow
              icon="⚠️"
              title="Outbid Notifications"
              description="Get notified immediately when someone outbids you"
              enabled={preferences.email.outbidNotifications}
              onChange={(v) => updateEmailPref('outbidNotifications', v)}
            />
            <PreferenceRow
              icon="🎉"
              title="Auction Won"
              description="Receive confirmation when you win an auction"
              enabled={preferences.email.auctionWon}
              onChange={(v) => updateEmailPref('auctionWon', v)}
            />
            <PreferenceRow
              icon="💬"
              title="New Messages"
              description="Get notified when you receive new messages"
              enabled={preferences.email.newMessages}
              onChange={(v) => updateEmailPref('newMessages', v)}
            />
            <PreferenceRow
              icon="🏷️"
              title="Price Drops"
              description="Get alerts when items in your wishlist drop in price"
              enabled={preferences.email.priceDrops}
              onChange={(v) => updateEmailPref('priceDrops', v)}
            />
            <PreferenceRow
              icon="⭐"
              title="New Reviews"
              description="Get notified when you receive new reviews"
              enabled={preferences.email.newReviews}
              onChange={(v) => updateEmailPref('newReviews', v)}
            />
            <PreferenceRow
              icon="🎁"
              title="Rewards Updates"
              description="Receive updates about your rewards points and redemptions"
              enabled={preferences.email.rewardsUpdates}
              onChange={(v) => updateEmailPref('rewardsUpdates', v)}
            />
            <PreferenceRow
              icon="📢"
              title="Promotions & Deals"
              description="Receive special offers, discounts, and promotional content"
              enabled={preferences.email.promotions}
              onChange={(v) => updateEmailPref('promotions', v)}
            />
            <PreferenceRow
              icon="📰"
              title="Newsletter"
              description="Weekly digest of trending items and platform updates"
              enabled={preferences.email.newsletter}
              onChange={(v) => updateEmailPref('newsletter', v)}
            />
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-indigo-100 flex items-center justify-center">
              <span className="text-xl">🔔</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Push Notifications</h2>
              <p className="text-sm text-gray-500">Real-time alerts in your browser</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            <PreferenceRow
              icon="📦"
              title="Order Updates"
              description="Real-time order status notifications"
              enabled={preferences.push.orderUpdates}
              onChange={(v) => updatePushPref('orderUpdates', v)}
            />
            <PreferenceRow
              icon="🔨"
              title="Auction Alerts"
              description="Get notified when auctions are ending soon"
              enabled={preferences.push.auctionAlerts}
              onChange={(v) => updatePushPref('auctionAlerts', v)}
            />
            <PreferenceRow
              icon="⚠️"
              title="Outbid Notifications"
              description="Instant alerts when you're outbid"
              enabled={preferences.push.outbidNotifications}
              onChange={(v) => updatePushPref('outbidNotifications', v)}
            />
            <PreferenceRow
              icon="🎉"
              title="Auction Won"
              description="Celebrate when you win an auction"
              enabled={preferences.push.auctionWon}
              onChange={(v) => updatePushPref('auctionWon', v)}
            />
            <PreferenceRow
              icon="💬"
              title="New Messages"
              description="Real-time message notifications"
              enabled={preferences.push.newMessages}
              onChange={(v) => updatePushPref('newMessages', v)}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <div>
            {saveSuccess && (
              <p className="text-green-600 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Preferences saved successfully
              </p>
            )}
          </div>
          <button
            onClick={savePreferences}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationSettingsPage;
