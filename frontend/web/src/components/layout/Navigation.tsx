// ============================================
// 🧭 Navigation Component - Global Header
// ============================================

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletConnectButton } from '../wallet';
import { NotificationCenter } from '../notifications';

interface NavProps {
  user?: {
    name: string;
    avatar?: string;
    role: 'buyer' | 'seller' | 'traveler';
    rewardsPoints?: number;
  } | null;
  cartCount?: number;
}

export function Navigation({ user, cartCount = 0 }: NavProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/products', label: 'Shop' },
    { path: '/auctions', label: 'Auctions', badge: 'Live' },
    { path: '/seller', label: 'Sell' },
    { path: '/traveler', label: 'Travel & Earn' },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-lg fixed top-0 left-0 right-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-pink-500 to-indigo-500 bg-clip-text text-transparent">
              Mnbara
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  isActive(link.path)
                    ? 'text-pink-500 bg-pink-50'
                    : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <button className="p-2 text-gray-500 hover:text-pink-500 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Notifications */}
            <NotificationCenter />

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-500 hover:text-pink-500 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Wallet Connect Button */}
            <WalletConnectButton variant="default" showBalance={true} />

            {/* User Menu / Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                    </div>
                    {/* Rewards Balance */}
                    <Link to="/rewards" className="block px-4 py-3 border-b border-gray-100 hover:bg-gradient-to-r hover:from-pink-50 hover:to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎁</span>
                          <span className="text-sm font-medium text-gray-700">Rewards</span>
                        </div>
                        <span className="text-sm font-bold text-pink-600">
                          {(user.rewardsPoints ?? 0).toLocaleString()} pts
                        </span>
                      </div>
                    </Link>
                    <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">My Profile</Link>
                    <Link to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">My Orders</Link>
                    {user.role === 'seller' && (
                      <Link to="/seller" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Seller Dashboard</Link>
                    )}
                    {user.role === 'traveler' && (
                      <Link to="/traveler" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Traveler Dashboard</Link>
                    )}
                    <button className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-gray-700 font-medium hover:text-pink-500 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-500 hover:text-pink-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMobileMenu ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setShowMobileMenu(false)}
                className={`block px-4 py-3 rounded-lg font-medium ${
                  isActive(link.path)
                    ? 'text-pink-500 bg-pink-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
