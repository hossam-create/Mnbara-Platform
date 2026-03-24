/**
 * Role-based Navigation Component
 * Hides admin/ops navigation items from regular users
 * Frontend guards are cosmetic only - backend authorization remains mandatory
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { 
  UserRole, 
  isAdmin, 
  isOps, 
  UserWithRole 
} from '@/types/role.types';
import styles from './RoleBasedNavigation.module.css';

interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  description?: string;
}

interface RoleBasedNavigationProps {
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'sidebar';
}

const navigationItems: NavigationItem[] = [
  // User-accessible items
  {
    path: '/',
    label: 'Home',
    icon: '🏠',
    requiredRoles: [UserRole.USER, UserRole.ADMIN, UserRole.OPS]
  },
  {
    path: '/orders',
    label: 'My Orders',
    icon: '📦',
    requiredRoles: [UserRole.USER, UserRole.ADMIN, UserRole.OPS]
  },
  {
    path: '/wallet',
    label: 'Wallet',
    icon: '💰',
    requiredRoles: [UserRole.USER, UserRole.ADMIN, UserRole.OPS]
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: '👤',
    requiredRoles: [UserRole.USER, UserRole.ADMIN, UserRole.OPS]
  },
  
  // Admin-only items
  {
    path: '/admin',
    label: 'Admin Dashboard',
    icon: '⚙️',
    requiredRoles: [UserRole.ADMIN],
    description: 'System administration'
  },
  {
    path: '/admin/users',
    label: 'User Management',
    icon: '👥',
    requiredRoles: [UserRole.ADMIN],
    description: 'Manage platform users'
  },
  {
    path: '/admin/analytics',
    label: 'Analytics',
    icon: '📊',
    requiredRoles: [UserRole.ADMIN],
    description: 'Platform analytics'
  },
  {
    path: '/admin/settings',
    label: 'Settings',
    icon: '🔧',
    requiredRoles: [UserRole.ADMIN],
    description: 'System settings'
  },
  
  // Ops-only items
  {
    path: '/ops',
    label: 'Operations Dashboard',
    icon: '🏭',
    requiredRoles: [UserRole.OPS],
    description: 'Operations management'
  },
  {
    path: '/ops/escrow',
    label: 'Escrow Management',
    icon: '🔒',
    requiredRoles: [UserRole.OPS],
    description: 'Manage escrow funds'
  },
  {
    path: '/ops/disputes',
    label: 'Dispute Resolution',
    icon: '⚖️',
    requiredRoles: [UserRole.OPS],
    description: 'Handle disputes'
  },
  {
    path: '/ops/financial',
    label: 'Financial Data',
    icon: '📈',
    requiredRoles: [UserRole.OPS],
    description: 'Financial reports'
  }
];

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  className,
  variant = 'horizontal'
}) => {
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // Filter navigation items based on user role
  const filteredItems = navigationItems.filter(item => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true; // No role restrictions
    }
    
    if (!user) {
      return false; // Not authenticated
    }
    
    // Check if user has any of the required roles
    return item.requiredRoles.includes(user.role);
  });
  
  // Group items by category
  const userItems = filteredItems.filter(item => 
    item.requiredRoles?.includes(UserRole.USER) || 
    (!item.requiredRoles && !isAdmin(user) && !isOps(user))
  );
  
  const adminItems = filteredItems.filter(item => 
    item.requiredRoles?.includes(UserRole.ADMIN)
  );
  
  const opsItems = filteredItems.filter(item => 
    item.requiredRoles?.includes(UserRole.OPS)
  );
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  const renderNavigationItem = (item: NavigationItem) => (
    <Link
      key={item.path}
      to={item.path}
      className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
      title={item.description}
    >
      {item.icon && <span className={styles.icon}>{item.icon}</span>}
      <span className={styles.label}>{item.label}</span>
    </Link>
  );
  
  const containerClass = `${styles.roleBasedNavigation} ${styles[variant]} ${className || ''}`;
  
  if (variant === 'sidebar') {
    return (
      <nav className={containerClass}>
        <div className={styles.navigationSection}>
          <h3 className={styles.sectionTitle}>General</h3>
          {userItems.map(renderNavigationItem)}
        </div>
        
        {isAdmin(user) && (
          <div className={styles.navigationSection}>
            <h3 className={styles.sectionTitle}>Administration</h3>
            {adminItems.map(renderNavigationItem)}
          </div>
        )}
        
        {isOps(user) && (
          <div className={styles.navigationSection}>
            <h3 className={styles.sectionTitle}>Operations</h3>
            {opsItems.map(renderNavigationItem)}
          </div>
        )}
      </nav>
    );
  }
  
  if (variant === 'vertical') {
    return (
      <nav className={containerClass}>
        <div className={styles.navigationGroup}>
          {userItems.map(renderNavigationItem)}
        </div>
        
        {isAdmin(user) && (
          <div className={styles.navigationGroup}>
            <div className={styles.divider} />
            <div className={styles.groupTitle}>Admin</div>
            {adminItems.map(renderNavigationItem)}
          </div>
        )}
        
        {isOps(user) && (
          <div className={styles.navigationGroup}>
            <div className={styles.divider} />
            <div className={styles.groupTitle}>Operations</div>
            {opsItems.map(renderNavigationItem)}
          </div>
        )}
      </nav>
    );
  }
  
  // Horizontal (default)
  return (
    <nav className={containerClass}>
      <div className={styles.navigationGroup}>
        {userItems.map(renderNavigationItem)}
      </div>
      
      {isAdmin(user) && (
        <div className={styles.navigationGroup}>
          {adminItems.map(renderNavigationItem)}
        </div>
      )}
      
      {isOps(user) && (
        <div className={styles.navigationGroup}>
          {opsItems.map(renderNavigationItem)}
        </div>
      )}
    </nav>
  );
};

/**
 * Role-based navigation item component
 * Can be used for individual navigation items
 */
interface RoleBasedNavItemProps {
  path: string;
  label: string;
  icon?: string;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  className?: string;
  activeClassName?: string;
}

export const RoleBasedNavItem: React.FC<RoleBasedNavItemProps> = ({
  path,
  label,
  icon,
  requiredRoles,
  className,
  activeClassName
}) => {
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // Check if user has required role
  if (requiredRoles && requiredRoles.length > 0) {
    if (!user || !requiredRoles.includes(user.role)) {
      return null; // Don't render if user doesn't have required role
    }
  }
  
  const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
  
  return (
    <Link
      to={path}
      className={`${styles.navItem} ${className || ''} ${isActive ? `${styles.active} ${activeClassName || ''}` : ''}`}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}</span>
    </Link>
  );
};

/**
 * Role-based menu component for dropdowns and mobile menus
 */
interface RoleBasedMenuProps {
  items: NavigationItem[];
  className?: string;
}

export const RoleBasedMenu: React.FC<RoleBasedMenuProps> = ({ items, className }) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  const location = useLocation();
  
  // Filter items based on user role
  const filteredItems = items.filter(item => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true;
    }
    
    if (!user) {
      return false;
    }
    
    return item.requiredRoles.includes(user.role);
  });
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  return (
    <div className={`${styles.roleBasedMenu} ${className || ''}`}>
      {filteredItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`${styles.menuItem} ${isActive(item.path) ? styles.active : ''}`}
        >
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span className={styles.label}>{item.label}</span>
          {item.description && (
            <span className={styles.description}>{item.description}</span>
          )}
        </Link>
      ))}
    </div>
  );
};