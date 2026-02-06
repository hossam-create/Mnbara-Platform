/**
 * Privacy Settings Page
 * Manages user privacy settings, blocking, and data export
 */

import React, { useState } from 'react';
import type { PrivacySettings, BlockedUser } from '../../types/profile';
import { ToggleSwitch } from '../../components/settings/ToggleSwitch';
import './PrivacySettingsPage.css';

const mockPrivacySettings: PrivacySettings = {
  profileVisibility: 'public',
  showEmail: false,
  showPhoneNumber: false,
  showOnlineStatus: true,
  showLastActive: true,
  showPurchases: true,
  showSales: true,
  showReviews: true,
  allowMessagesFromStrangers: false,
  allowFriendRequests: true,
  showInSearchResults: true,
  allowDataAnalytics: true,
  personalizedAds: false,
  twoFactorAuth: true,
  loginNotifications: true,
  blockedUsers: [
    { userId: 'user-2', username: 'scammer123', blockedAt: '2024-10-15T00:00:00Z' },
    { userId: 'user-3', username: 'fake_seller', blockedAt: '2024-09-20T00:00:00Z' },
  ],
  mutedUsers: ['user-4'],
};

export const PrivacySettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySettings>(mockPrivacySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'privacy' | 'blocking' | 'data'>('privacy');

  const handleToggle = (key: keyof PrivacySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectChange = (key: keyof PrivacySettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleUnblock = (userId: string) => {
    setSettings(prev => ({
      ...prev,
      blockedUsers: prev.blockedUsers.filter(user => user.userId !== userId),
    }));
  };

  const handleUnmute = (userId: string) => {
    setSettings(prev => ({
      ...prev,
      mutedUsers: prev.mutedUsers.filter(id => id !== userId),
    }));
  };

  const handleExportData = async () => {
    // Simulate data export request
    alert('Data export request submitted. You will receive an email when ready.');
  };

  return (
    <div className="mnbara-privacy-settings-page">
      <div className="mnbara-privacy-settings-page__container">
        <header className="mnbara-privacy-settings-page__header">
          <h1 className="mnbara-privacy-settings-page__title">Privacy & Security</h1>
          <p className="mnbara-privacy-settings-page__subtitle">
            Manage your privacy settings, blocking preferences, and data
          </p>
        </header>

        <div className="mnbara-privacy-settings-page__tabs">
          <button
            className={`mnbara-privacy-settings-page__tab ${activeSection === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveSection('privacy')}
          >
            Privacy
          </button>
          <button
            className={`mnbara-privacy-settings-page__tab ${activeSection === 'blocking' ? 'active' : ''}`}
            onClick={() => setActiveSection('blocking')}
          >
            Blocking
          </button>
          <button
            className={`mnbara-privacy-settings-page__tab ${activeSection === 'data' ? 'active' : ''}`}
            onClick={() => setActiveSection('data')}
          >
            Data Export
          </button>
        </div>

        <div className="mnbara-privacy-settings-page__content">
          {activeSection === 'privacy' && (
            <div className="mnbara-privacy-settings-page__section">
              <div className="mnbara-privacy-settings-page__card">
                <h2 className="mnbara-privacy-settings-page__card-title">Profile Visibility</h2>
                
                <div className="mnbara-privacy-settings-page__field">
                  <label className="mnbara-privacy-settings-page__field-label">
                    Profile Visibility
                    <span className="mnbara-privacy-settings-page__field-hint">
                      Control who can see your profile
                    </span>
                  </label>
                  <select
                    value={settings.profileVisibility}
                    onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
                    className="mnbara-privacy-settings-page__select"
                  >
                    <option value="public">Public - Anyone can see</option>
                    <option value="friends_only">Friends Only - Friends only</option>
                    <option value="private">Private - Only you</option>
                    <option value="custom">Custom - Customize</option>
                  </select>
                </div>

                <div className="mnbara-privacy-settings-page__field">
                  <label className="mnbara-privacy-settings-page__field-label">
                    Show in Search Results
                    <span className="mnbara-privacy-settings-page__field-hint">
                      Allow your profile to appear in search results
                    </span>
                  </label>
                  <ToggleSwitch
                    checked={settings.showInSearchResults}
                    onChange={() => handleToggle('showInSearchResults')}
                  />
                </div>
              </div>

              <div className="mnbara-privacy-settings-page__card">
                <h2 className="mnbara-privacy-settings-page__card-title">Contact Information</h2>
                
                <div className="mnbara-privacy-settings-page__field">
                  <label className="mnbara-privacy-settings-page__field-label">
                    Show Email
                    <span className="mnbara-privacy-settings-page__field-hint">
                      Display your email on your profile
                    </span>
                  </label>
                  <ToggleSwitch
                    checked={settings.showEmail}
                    onChange={() => handleToggle('showEmail')}
                  />
                </div>

                <div className="mnbara-privacy-settings-page__field">
                  <label className="mnbara-privacy-settings-page__field-label">
                    Show Phone Number
                    <span className="mnbara-privacy-settings-page__field-hint">
                      Display your phone number on your profile
                    </span>
                  </label>
                  <ToggleSwitch
                    checked={settings.showPhoneNumber}
                    onChange={() => handleToggle('showPhoneNumber')}
                  />
                </div>
              </div>

              <div className="mnbara-privacy-settings-page__card">
                <h2 className="mnbara-privacy-settings-page__card-title">Activity Status</h2>
                
                <div className="mnbara-privacy-settings-page__field">
                  <label className="mnbara-privacy-settings-page__field-label">
                    Show Online Status
                    <span className="mnbara-privacy-settings-page__field-hint">
                      Let others see when you're online
                    </span>
                  </label>
                  <ToggleSwitch
                    checked={settings.showOnlineStatus}
                    onChange={() => handleToggle('showOnlineStatus')}
                  />
                </div>

                <div className="mnbara-privacy-settings-page__field">
                  <label className="mnbara-privacy-settings-page__field-label">
                    Show Last Active
                    <span className="mnbara-privacy-settings-page__field-hint">
                      Display your last active timestamp
                    </span>
                  </label>
                  <ToggleSwitch
                    checked={settings.showLastActive}
                    onChange={() => handleToggle('showLastActive')}
                  />
                </div>
              </div>

              <div className="mnbara-privacy-settings-page__card">
                <h2 className="mnbara-privacy-settings-page__card-title">Messaging</h2>
                
                <div className="mnbara-privacy-settings-page__field">
                  <label className="mnbara-privacy-settings-page__field-label">
                    Allow Messages from Strangers
                    <span className="mnbara-privacy-settings-page__field-hint">
                      Receive messages from users you haven't interacted with
                    </span>
                  </label>
                  <ToggleSwitch
                    checked={settings.allowMessagesFromStrangers}
                    onChange={() => handleToggle('allowMessagesFromStrangers')}
                  />
                </div>

                <div className="mnbara-privacy-settings-page__field">
                  <label className="mnbara-privacy-settings-page__field-label">
                    Allow Friend Requests
                    <span className="mnbara-privacy-settings-page__field-hint">
                      Let users send you friend requests
                    </span>
                  </label>
                  <ToggleSwitch
                    checked={settings.allowFriendRequests}
                    onChange={() => handleToggle('allowFriendRequests')}
                  />
                </div>
              </div>

              <div className="mnbara-privacy-settings-page__card">
                <h2 className="mnbara-privacy-settings-page__card-title">Data & Analytics</h2>
                
                <div className="mnbara-privacy-settings-page__field">
                  <label className="mnbara-privacy-settings-page__field-label">
                    Allow Data Analytics
                    <span className="mnbara-privacy-settings-page__field-hint">
                      Help improve our services with anonymous data
                    </span>
                  </label>
                  <ToggleSwitch
                    checked={settings.allowDataAnalytics}
                    onChange={() => handleToggle('allowDataAnalytics')}
                  />
                </div>

                <div className="mnbara-privacy-settings-page__field">
                  <label className="mnbara-privacy-settings-page__field-label">
                    Personalized Ads
                    <span className="mnbara-privacy-settings-page__field-hint">
                      Show ads based on your interests and activity
                    </span>
                  </label>
                  <ToggleSwitch
                    checked={settings.personalizedAds}
                    onChange={() => handleToggle('personalizedAds')}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'blocking' && (
            <div className="mnbara-privacy-settings-page__section">
              <div className="mnbara-privacy-settings-page__card">
                <h2 className="mnbara-privacy-settings-page__card-title">Blocked Users</h2>
                <p className="mnbara-privacy-settings-page__card-description">
                  Blocked users cannot see your profile, send you messages, or follow you.
                </p>

                {settings.blockedUsers.length > 0 ? (
                  <div className="mnbara-privacy-settings-page__blocked-list">
                    {settings.blockedUsers.map((user) => (
                      <div key={user.userId} className="mnbara-privacy-settings-page__blocked-item">
                        <div className="mnbara-privacy-settings-page__blocked-avatar">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="mnbara-privacy-settings-page__blocked-info">
                          <span className="mnbara-privacy-settings-page__blocked-username">
                            @{user.username}
                          </span>
                          <span className="mnbara-privacy-settings-page__blocked-date">
                            Blocked on {new Date(user.blockedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          className="mnbara-privacy-settings-page__unblock-btn"
                          onClick={() => handleUnblock(user.userId)}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mnbara-privacy-settings-page__empty">
                    <p>You haven't blocked any users yet.</p>
                  </div>
                )}
              </div>

              <div className="mnbara-privacy-settings-page__card">
                <h2 className="mnbara-privacy-settings-page__card-title">Muted Users</h2>
                <p className="mnbara-privacy-settings-page__card-description">
                  Muted users' content won't appear in your feed, but you can still see their profiles.
                </p>

                {settings.mutedUsers.length > 0 ? (
                  <div className="mnbara-privacy-settings-page__muted-list">
                    {settings.mutedUsers.map((userId) => (
                      <div key={userId} className="mnbara-privacy-settings-page__muted-item">
                        <span className="mnbara-privacy-settings-page__muted-username">
                          @{userId}
                        </span>
                        <button
                          className="mnbara-privacy-settings-page__unmute-btn"
                          onClick={() => handleUnmute(userId)}
                        >
                          Unmute
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mnbara-privacy-settings-page__empty">
                    <p>You haven't muted any users yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="mnbara-privacy-settings-page__section">
              <div className="mnbara-privacy-settings-page__card">
                <h2 className="mnbara-privacy-settings-page__card-title">Export Your Data</h2>
                <p className="mnbara-privacy-settings-page__card-description">
                  Download a copy of all your data including profile information, transactions, messages, and more.
                </p>

                <div className="mnbara-privacy-settings-page__export-options">
                  <label className="mnbara-privacy-settings-page__export-option">
                    <input type="checkbox" defaultChecked />
                    <span>Profile Information</span>
                  </label>
                  <label className="mnbara-privacy-settings-page__export-option">
                    <input type="checkbox" defaultChecked />
                    <span>Transactions & Orders</span>
                  </label>
                  <label className="mnbara-privacy-settings-page__export-option">
                    <input type="checkbox" defaultChecked />
                    <span>Messages</span>
                  </label>
                  <label className="mnbara-privacy-settings-page__export-option">
                    <input type="checkbox" />
                    <span>Activity Log</span>
                  </label>
                  <label className="mnbara-privacy-settings-page__export-option">
                    <input type="checkbox" />
                    <span>KYC Documents</span>
                  </label>
                </div>

                <button
                  className="mnbara-privacy-settings-page__export-btn"
                  onClick={handleExportData}
                >
                  Request Data Export
                </button>
                <p className="mnbara-privacy-settings-page__export-note">
                  Export will be ready within 48 hours. You'll receive an email with a download link.
                </p>
              </div>

              <div className="mnbara-privacy-settings-page__card mnbara-privacy-settings-page__card--danger">
                <h2 className="mnbara-privacy-settings-page__card-title">Delete Account</h2>
                <p className="mnbara-privacy-settings-page__card-description">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button className="mnbara-privacy-settings-page__delete-btn">
                  Delete My Account
                </button>
              </div>
            </div>
          )}

          <div className="mnbara-privacy-settings-page__actions">
            <button 
              className="mnbara-privacy-settings-page__save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsPage;
