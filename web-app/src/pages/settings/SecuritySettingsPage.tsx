/**
 * Security Settings Page
 * Manages password, MFA, sessions, and connected accounts
 */

import React, { useState } from 'react';
import type { SecuritySettings, LoginSession, ConnectedAccount } from '../../types/profile';
import { ToggleSwitch } from '../../components/settings/ToggleSwitch';
import './SecuritySettingsPage.css';

const mockSecuritySettings: SecuritySettings = {
  passwordLastChanged: '2024-09-15T00:00:00Z',
  mfaEnabled: true,
  mfaMethod: 'totp',
  mfaVerified: true,
  loginHistory: [
    { id: '1', deviceType: 'desktop', browser: 'Chrome', os: 'Windows', ipAddress: '192.168.1.1', location: 'New York, US', isCurrentSession: true, createdAt: '2024-12-01T10:00:00Z', lastActiveAt: new Date().toISOString() },
    { id: '2', deviceType: 'mobile', browser: 'Safari', os: 'iOS', ipAddress: '192.168.1.2', location: 'New York, US', isCurrentSession: false, createdAt: '2024-11-28T14:30:00Z', lastActiveAt: '2024-12-01T09:00:00Z' },
    { id: '3', deviceType: 'tablet', browser: 'Firefox', os: 'Android', ipAddress: '192.168.1.3', location: 'Los Angeles, US', isCurrentSession: false, createdAt: '2024-11-15T08:00:00Z', lastActiveAt: '2024-11-20T16:00:00Z' },
  ],
  activeSessions: [
    { id: '1', deviceType: 'desktop', browser: 'Chrome', os: 'Windows', ipAddress: '192.168.1.1', location: 'New York, US', isCurrentSession: true, createdAt: '2024-12-01T10:00:00Z', lastActiveAt: new Date().toISOString() },
  ],
  connectedAccounts: [
    { id: '1', provider: 'google', email: 'john.doe@gmail.com', connectedAt: '2022-03-15T00:00:00Z', scope: ['profile', 'email'] },
    { id: '2', provider: 'facebook', email: 'john.doe@facebook.com', connectedAt: '2023-06-20T00:00:00Z', scope: ['public_profile', 'email'] },
  ],
  securityNotifications: {
    loginAlerts: true,
    passwordChanges: true,
    mfaChanges: true,
    accountModifications: true,
    suspiciousActivity: true,
  },
};

export const SecuritySettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettings>(mockSecuritySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'password' | 'mfa' | 'sessions' | 'accounts'>('password');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleToggle = (key: keyof SecuritySettings['securityNotifications']) => {
    setSettings(prev => ({
      ...prev,
      securityNotifications: {
        ...prev.securityNotifications,
        [key]: !prev.securityNotifications[key],
      },
    }));
  };

  const handleTerminateSession = async (sessionId: string) => {
    setSettings(prev => ({
      ...prev,
      loginHistory: prev.loginHistory.filter(s => s.id !== sessionId),
    }));
  };

  const handleTerminateAllSessions = async () => {
    setSettings(prev => ({
      ...prev,
      loginHistory: prev.loginHistory.filter(s => s.isCurrentSession),
    }));
  };

  const handleDisconnectAccount = (accountId: string) => {
    setSettings(prev => ({
      ...prev,
      connectedAccounts: prev.connectedAccounts.filter(a => a.id !== accountId),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop': return '💻';
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      default: return '💻';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return '🔵';
      case 'facebook': return '🔵';
      case 'twitter': return '🐦';
      case 'apple': return '⚫';
      default: return '🔗';
    }
  };

  return (
    <div className="mnbara-security-settings-page">
      <div className="mnbara-security-settings-page__container">
        <header className="mnbara-security-settings-page__header">
          <h1 className="mnbara-security-settings-page__title">Security Settings</h1>
          <p className="mnbara-security-settings-page__subtitle">
            Manage your password, two-factor authentication, and session security
          </p>
        </header>

        <div className="mnbara-security-settings-page__tabs">
          <button
            className={`mnbara-security-settings-page__tab ${activeSection === 'password' ? 'active' : ''}`}
            onClick={() => setActiveSection('password')}
          >
            Password
          </button>
          <button
            className={`mnbara-security-settings-page__tab ${activeSection === 'mfa' ? 'active' : ''}`}
            onClick={() => setActiveSection('mfa')}
          >
            Two-Factor Auth
          </button>
          <button
            className={`mnbara-security-settings-page__tab ${activeSection === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveSection('sessions')}
          >
            Sessions
          </button>
          <button
            className={`mnbara-security-settings-page__tab ${activeSection === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveSection('accounts')}
          >
            Connected Accounts
          </button>
        </div>

        <div className="mnbara-security-settings-page__content">
          {activeSection === 'password' && (
            <div className="mnbara-security-settings-page__section">
              <div className="mnbara-security-settings-page__card">
                <h2 className="mnbara-security-settings-page__card-title">Change Password</h2>
                <p className="mnbara-security-settings-page__card-description">
                  Last changed: {formatDate(settings.passwordLastChanged)}
                </p>

                <button
                  className="mnbara-security-settings-page__btn-primary"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </button>
              </div>

              <div className="mnbara-security-settings-page__card">
                <h2 className="mnbara-security-settings-page__card-title">Password Requirements</h2>
                <ul className="mnbara-security-settings-page__requirements">
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase and lowercase letters</li>
                  <li>Contains at least one number</li>
                  <li>Contains at least one special character</li>
                  <li>Not used in the last 12 passwords</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'mfa' && (
            <div className="mnbara-security-settings-page__section">
              <div className="mnbara-security-settings-page__card">
                <div className="mnbara-security-settings-page__mfa-header">
                  <div>
                    <h2 className="mnbara-security-settings-page__card-title">Two-Factor Authentication</h2>
                    <p className="mnbara-security-settings-page__card-description">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={settings.mfaEnabled}
                    onChange={() => setSettings(prev => ({ ...prev, mfaEnabled: !prev.mfaEnabled }))}
                  />
                </div>

                {settings.mfaEnabled && (
                  <div className="mnbara-security-settings-page__mfa-status">
                    <span className="mnbara-security-settings-page__mfa-badge">
                      ✅ {settings.mfaMethod === 'totp' ? 'Authenticator App' : 'SMS'} Enabled
                    </span>
                    <span className="mnbara-security-settings-page__mfa-text">
                      Your account is protected with two-factor authentication.
                    </span>
                  </div>
                )}

                <div className="mnbara-security-settings-page__mfa-methods">
                  <h3 className="mnbara-security-settings-page__mfa-title">Available Methods</h3>
                  
                  <label className="mnbara-security-settings-page__mfa-method">
                    <input
                      type="radio"
                      name="mfaMethod"
                      checked={settings.mfaMethod === 'totp'}
                      onChange={() => setSettings(prev => ({ ...prev, mfaMethod: 'totp' }))}
                    />
                    <div className="mnbara-security-settings-page__mfa-method-content">
                      <span className="mnbara-security-settings-page__mfa-method-icon">📱</span>
                      <div>
                        <span className="mnbara-security-settings-page__mfa-method-name">Authenticator App</span>
                        <span className="mnbara-security-settings-page__mfa-method-desc">Google Authenticator, Authy, etc.</span>
                      </div>
                    </div>
                  </label>

                  <label className="mnbara-security-settings-page__mfa-method">
                    <input
                      type="radio"
                      name="mfaMethod"
                      checked={settings.mfaMethod === 'sms'}
                      onChange={() => setSettings(prev => ({ ...prev, mfaMethod: 'sms' }))}
                    />
                    <div className="mnbara-security-settings-page__mfa-method-content">
                      <span className="mnbara-security-settings-page__mfa-method-icon">💬</span>
                      <div>
                        <span className="mnbara-security-settings-page__mfa-method-name">SMS Codes</span>
                        <span className="mnbara-security-settings-page__mfa-method-desc">Receive codes via text message</span>
                      </div>
                    </div>
                  </label>

                  <label className="mnbara-security-settings-page__mfa-method">
                    <input
                      type="radio"
                      name="mfaMethod"
                      checked={settings.mfaMethod === 'email'}
                      onChange={() => setSettings(prev => ({ ...prev, mfaMethod: 'email' }))}
                    />
                    <div className="mnbara-security-settings-page__mfa-method-content">
                      <span className="mnbara-security-settings-page__mfa-method-icon">📧</span>
                      <div>
                        <span className="mnbara-security-settings-page__mfa-method-name">Email Codes</span>
                        <span className="mnbara-security-settings-page__mfa-method-desc">Receive codes via email</span>
                      </div>
                    </div>
                  </label>
                </div>

                <button className="mnbara-security-settings-page__btn-secondary">
                  {settings.mfaEnabled ? 'Update MFA Settings' : 'Enable Two-Factor Authentication'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'sessions' && (
            <div className="mnbara-security-settings-page__section">
              <div className="mnbara-security-settings-page__card">
                <div className="mnbara-security-settings-page__sessions-header">
                  <h2 className="mnbara-security-settings-page__card-title">Active Sessions</h2>
                  <button
                    className="mnbara-security-settings-page__btn-danger"
                    onClick={handleTerminateAllSessions}
                  >
                    Terminate All Other Sessions
                  </button>
                </div>

                <p className="mnbara-security-settings-page__card-description">
                  Manage devices that are logged into your account
                </p>

                <div className="mnbara-security-settings-page__sessions-list">
                  {settings.loginHistory.map((session) => (
                    <div key={session.id} className="mnbara-security-settings-page__session-item">
                      <div className="mnbara-security-settings-page__session-icon">
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div className="mnbara-security-settings-page__session-info">
                        <div className="mnbara-security-settings-page__session-device">
                          <span className="mnbara-security-settings-page__session-browser">
                            {session.browser} on {session.os}
                          </span>
                          {session.isCurrentSession && (
                            <span className="mnbara-security-settings-page__session-current">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="mnbara-security-settings-page__session-meta">
                          <span>{session.location}</span>
                          <span>•</span>
                          <span>IP: {session.ipAddress}</span>
                          <span>•</span>
                          <span>Last active: {new Date(session.lastActiveAt).toLocaleString()}</span>
                        </div>
                      </div>
                      {!session.isCurrentSession && (
                        <button
                          className="mnbara-security-settings-page__session-terminate"
                          onClick={() => handleTerminateSession(session.id)}
                        >
                          Terminate
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'accounts' && (
            <div className="mnbara-security-settings-page__section">
              <div className="mnbara-security-settings-page__card">
                <h2 className="mnbara-security-settings-page__card-title">Connected Accounts</h2>
                <p className="mnbara-security-settings-page__card-description">
                  Link your social accounts for easier sign-in
                </p>

                {settings.connectedAccounts.length > 0 ? (
                  <div className="mnbara-security-settings-page__accounts-list">
                    {settings.connectedAccounts.map((account) => (
                      <div key={account.id} className="mnbara-security-settings-page__account-item">
                        <div className="mnbara-security-settings-page__account-icon">
                          {getProviderIcon(account.provider)}
                        </div>
                        <div className="mnbara-security-settings-page__account-info">
                          <span className="mnbara-security-settings-page__account-provider">
                            {account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}
                          </span>
                          <span className="mnbara-security-settings-page__account-email">
                            {account.email}
                          </span>
                          <span className="mnbara-security-settings-page__account-date">
                            Connected on {formatDate(account.connectedAt)}
                          </span>
                        </div>
                        <button
                          className="mnbara-security-settings-page__account-disconnect"
                          onClick={() => handleDisconnectAccount(account.id)}
                        >
                          Disconnect
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mnbara-security-settings-page__empty">
                    <p>No connected accounts yet.</p>
                  </div>
                )}
              </div>

              <div className="mnbara-security-settings-page__card">
                <h2 className="mnbara-security-settings-page__card-title">Connect New Account</h2>
                <div className="mnbara-security-settings-page__connect-options">
                  <button className="mnbara-security-settings-page__connect-btn">
                    <span className="mnbara-security-settings-page__connect-icon">🔵</span>
                    Connect Google
                  </button>
                  <button className="mnbara-security-settings-page__connect-btn">
                    <span className="mnbara-security-settings-page__connect-icon">🔵</span>
                    Connect Facebook
                  </button>
                  <button className="mnbara-security-settings-page__connect-btn">
                    <span className="mnbara-security-settings-page__connect-icon">🐦</span>
                    Connect Twitter
                  </button>
                  <button className="mnbara-security-settings-page__connect-btn">
                    <span className="mnbara-security-settings-page__connect-icon">⚫</span>
                    Connect Apple
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mnbara-security-settings-page__actions">
            <button 
              className="mnbara-security-settings-page__save-btn"
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

export default SecuritySettingsPage;
