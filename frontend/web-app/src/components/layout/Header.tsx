import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { toggleMobileMenu, toggleCartDrawer, openModal } from '@/store/slices/uiSlice'
import { useAuth } from '@/hooks/useAuth'
import SearchBar from '../search/SearchBar'
import CartIcon from '../cart/CartIcon'
import UserMenu from '../user/UserMenu'
import NotificationButton from '../notifications/NotificationButton'
import { 
  Bars3Icon, 
  ShoppingCartIcon, 
  HeartIcon, 
  BellIcon,
  UserIcon
} from '@heroicons/react/24/outline'

const Header: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { mobileMenuOpen } = useSelector((state: RootState) => state.ui)
  const { totalItems } = useSelector((state: RootState) => state.cart)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleCartClick = () => {
    if (isAuthenticated) {
      dispatch(toggleCartDrawer())
    } else {
      dispatch(openModal('login'))
    }
  }

  const handleWatchlistClick = () => {
    if (isAuthenticated) {
      navigate('/watchlist')
    } else {
      dispatch(openModal('login'))
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={() => dispatch(toggleMobileMenu())}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-gray-900 dark:text-white">
                Mnbara
              </span>
            </Link>
          </div>

          {/* Search Bar - Hidden on mobile, shown in mobile menu */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <SearchBar />
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Sell button */}
            <Link
              to="/sell"
              className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary-500 hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
            >
              Sell
            </Link>

            {/* Watchlist */}
            <button
              onClick={handleWatchlistClick}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white relative"
            >
              <HeartIcon className="w-6 h-6" />
            </button>

            {/* Cart */}
            <button
              onClick={handleCartClick}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white relative"
            >
              <ShoppingCartIcon className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* Notifications (authenticated users only) */}
            {isAuthenticated && (
              <NotificationButton />
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.firstName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-white">
                    {user?.firstName}
                  </span>
                </button>
                
                {showUserMenu && (
                  <UserMenu onClose={() => setShowUserMenu(false)} />
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => dispatch(openModal('login'))}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Sign in
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={() => dispatch(openModal('register'))}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <SearchBar />
          </div>
        )}
      </div>
    </header>
  )
}

export default Header