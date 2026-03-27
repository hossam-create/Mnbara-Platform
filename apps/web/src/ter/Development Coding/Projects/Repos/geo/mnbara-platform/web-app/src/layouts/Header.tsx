import React, { useState } from 'react';
import { Button, Dropdown } from '../components/core';
import './Header.css';

interface HeaderProps {
  user?: {
    name: string;
    avatar?: string;
  } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  const userMenuItems = [
    { label: 'Profile', value: 'profile' },
    { label: 'Settings', value: 'settings' },
    { label: 'My Orders', value: 'orders' },
    { divider: true },
    { label: 'Sign Out', value: 'logout', danger: true },
  ];

  const handleUserMenuClick = (value: string | number) => {
    if (value === 'logout' && onLogout) {
      onLogout();
    }
  };

  return (
    <header className="mnbara-header">
      <div className="mnbara-header-container">
        {/* Logo */}
        <a href="/" className="mnbara-header-logo">
          <svg viewBox="0 0 32 32" fill="none" className="logo-icon">
            <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
            <path d="M8 12h16M8 16h12M8 20h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="logo-text">Mnbara</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="mnbara-header-nav">
          <a href="/products" className="nav-link">Products</a>
          <a href="/categories" className="nav-link">Categories</a>
          <a href="/deals" className="nav-link">Deals</a>
          <a href="/support" className="nav-link">Support</a>
        </nav>

        {/* Right Section */}
        <div className="mnbara-header-actions">
          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" className="header-action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </Button>

          {/* Language Selector */}
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" className="header-action-btn">
                <span className="lang-code">EN</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-small">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </Button>
            }
            items={[
              { label: 'English', value: 'en' },
              { label: 'العربية', value: 'ar' },
              { label: 'Français', value: 'fr' },
            ]}
          />

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="header-action-btn notification-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notifications > 0 && <span className="notification-badge">{notifications}</span>}
          </Button>

          {/* User Menu */}
          {user ? (
            <Dropdown
              trigger={
                <button className="user-avatar-btn">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="user-avatar" />
                  ) : (
                    <div className="user-avatar-placeholder">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
              }
              items={userMenuItems}
              onChange={handleUserMenuClick}
            />
          ) : (
            <div className="auth-buttons">
              <a href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </a>
              <a href="/auth/register">
                <Button variant="primary" size="sm">Sign Up</Button>
              </a>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon">
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </>
              )}
            </svg>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mnbara-mobile-menu">
          <nav className="mobile-nav">
            <a href="/products" className="mobile-nav-link">Products</a>
            <a href="/categories" className="mobile-nav-link">Categories</a>
            <a href="/deals" className="mobile-nav-link">Deals</a>
            <a href="/support" className="mobile-nav-link">Support</a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
