import React, { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  UserIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  HeartIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface UserMenuProps {
  onClose: () => void
}

const UserMenu: React.FC<UserMenuProps> = ({ onClose }) => {
  const { user, logout } = useAuth()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleLogout = async () => {
    try {
      await logout()
      onClose()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuItems = [
    {
      icon: UserIcon,
      label: 'My Profile',
      href: '/profile'
    },
    {
      icon: ShoppingBagIcon,
      label: 'My Orders',
      href: '/orders'
    },
    {
      icon: HeartIcon,
      label: 'Watchlist',
      href: '/watchlist'
    },
    {
      icon: ChartBarIcon,
      label: 'Seller Dashboard',
      href: '/seller'
    },
    {
      icon: Cog6ToothIcon,
      label: 'Settings',
      href: '/settings'
    }
  ]

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
    >
      <div className="py-1">
        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user?.email}
          </p>
        </div>

        {/* Menu items */}
        {menuItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={onClose}
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <item.icon className="w-4 h-4 mr-3" />
            {item.label}
          </Link>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-600"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default UserMenu