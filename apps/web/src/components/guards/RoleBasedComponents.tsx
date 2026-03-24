/**
 * Role-based UI Component Wrappers
 * Common UI components with role-based visibility
 * Frontend guards are cosmetic only - backend authorization remains mandatory
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { 
  UserRole, 
  Permission, 
  hasPermission,
  UserWithRole,
  isAdmin,
  isOps
} from '@/types/role.types';
import { AdminGuard, PermissionGuard } from './RoleGuards';
import styles from './RoleBasedComponents.module.css';

interface RoleBasedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  requiredPermission?: Permission;
  requiredRoles?: UserRole[];
  variant?: 'primary' | 'secondary' | 'danger' | 'admin' | 'ops';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  title?: string;
  loading?: boolean;
}

/**
 * Role-based button component
 * Only renders if user has required permissions
 */
export const RoleBasedButton: React.FC<RoleBasedButtonProps> = ({
  children,
  onClick,
  requiredPermission,
  requiredRoles,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  title,
  loading = false
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // Check permission requirement
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return null;
  }
  
  // Check role requirement
  if (requiredRoles && requiredRoles.length > 0) {
    if (!user || !requiredRoles.includes(user.role)) {
      return null;
    }
  }
  
  const buttonClass = `${styles.roleBasedButton} ${styles[variant]} ${styles[size]} ${className} ${loading ? styles.loading : ''}`;
  
  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
    >
      {loading && <span className={styles.spinner}></span>}
      {children}
    </button>
  );
};

interface RoleBasedCardProps {
  children: React.ReactNode;
  title?: string;
  requiredPermission?: Permission;
  requiredRoles?: UserRole[];
  variant?: 'default' | 'admin' | 'ops' | 'danger' | 'warning';
  className?: string;
}

/**
 * Role-based card component
 * Only renders if user has required permissions
 */
export const RoleBasedCard: React.FC<RoleBasedCardProps> = ({
  children,
  title,
  requiredPermission,
  requiredRoles,
  variant = 'default',
  className = ''
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // Check permission requirement
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return null;
  }
  
  // Check role requirement
  if (requiredRoles && requiredRoles.length > 0) {
    if (!user || !requiredRoles.includes(user.role)) {
      return null;
    }
  }
  
  const cardClass = `${styles.roleBasedCard} ${styles[variant]} ${className}`;
  
  return (
    <div className={cardClass}>
      {title && (
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
        </div>
      )}
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
};

interface RoleBasedSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  requiredPermission?: Permission;
  requiredRoles?: UserRole[];
  variant?: 'default' | 'admin' | 'ops';
  className?: string;
}

/**
 * Role-based section component
 * Only renders if user has required permissions
 */
export const RoleBasedSection: React.FC<RoleBasedSectionProps> = ({
  children,
  title,
  description,
  requiredPermission,
  requiredRoles,
  variant = 'default',
  className = ''
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // Check permission requirement
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return null;
  }
  
  // Check role requirement
  if (requiredRoles && requiredRoles.length > 0) {
    if (!user || !requiredRoles.includes(user.role)) {
      return null;
    }
  }
  
  const sectionClass = `${styles.roleBasedSection} ${styles[variant]} ${className}`;
  
  return (
    <section className={sectionClass}>
      {(title || description) && (
        <div className={styles.sectionHeader}>
          {title && <h2 className={styles.sectionTitle}>{title}</h2>}
          {description && <p className={styles.sectionDescription}>{description}</p>}
        </div>
      )}
      <div className={styles.sectionContent}>
        {children}
      </div>
    </section>
  );
};

interface RoleBasedMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  requiredPermission?: Permission;
  requiredRoles?: UserRole[];
  variant?: 'default' | 'danger' | 'admin' | 'ops';
  className?: string;
}

/**
 * Role-based menu item component
 * Only renders if user has required permissions
 */
export const RoleBasedMenuItem: React.FC<RoleBasedMenuItemProps> = ({
  children,
  onClick,
  requiredPermission,
  requiredRoles,
  variant = 'default',
  className = ''
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // Check permission requirement
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return null;
  }
  
  // Check role requirement
  if (requiredRoles && requiredRoles.length > 0) {
    if (!user || !requiredRoles.includes(user.role)) {
      return null;
    }
  }
  
  const itemClass = `${styles.roleBasedMenuItem} ${styles[variant]} ${className}`;
  
  return (
    <div className={itemClass} onClick={onClick}>
      {children}
    </div>
  );
};

interface RoleBasedBadgeProps {
  text: string;
  requiredPermission?: Permission;
  requiredRoles?: UserRole[];
  variant?: 'admin' | 'ops' | 'user' | 'danger' | 'warning' | 'success';
  className?: string;
}

/**
 * Role-based badge component
 * Only renders if user has required permissions
 */
export const RoleBasedBadge: React.FC<RoleBasedBadgeProps> = ({
  text,
  requiredPermission,
  requiredRoles,
  variant = 'user',
  className = ''
}) => {
  const user = useSelector((state: RootState) => state.auth.user) as UserWithRole | null;
  
  // Check permission requirement
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return null;
  }
  
  // Check role requirement
  if (requiredRoles && requiredRoles.length > 0) {
    if (!user || !requiredRoles.includes(user.role)) {
      return null;
    }
  }
  
  const badgeClass = `${styles.roleBasedBadge} ${styles[variant]} ${className}`;
  
  return (
    <span className={badgeClass}>
      {text}
    </span>
  );
};

/**
 * Admin-only button component
 * Only renders for users with ADMIN role
 */
export const AdminButton: React.FC<Omit<RoleBasedButtonProps, 'requiredRoles'>> = (props) => {
  return <RoleBasedButton {...props} requiredRoles={['ADMIN']} />;
};

/**
 * Ops-only button component
 * Only renders for users with OPS role
 */
export const OpsButton: React.FC<Omit<RoleBasedButtonProps, 'requiredRoles'>> = (props) => {
  return <RoleBasedButton {...props} requiredRoles={['OPS']} />;
};

/**
 * Admin-only card component
 * Only renders for users with ADMIN role
 */
export const AdminCard: React.FC<Omit<RoleBasedCardProps, 'requiredRoles'>> = (props) => {
  return <RoleBasedCard {...props} requiredRoles={['ADMIN']} />;
};

/**
 * Ops-only card component
 * Only renders for users with OPS role
 */
export const OpsCard: React.FC<Omit<RoleBasedCardProps, 'requiredRoles'>> = (props) => {
  return <RoleBasedCard {...props} requiredRoles={['OPS']} />;
};

/**
 * Admin-only section component
 * Only renders for users with ADMIN role
 */
export const AdminSection: React.FC<Omit<RoleBasedSectionProps, 'requiredRoles'>> = (props) => {
  return <RoleBasedSection {...props} requiredRoles={['ADMIN']} />;
};

/**
 * Ops-only section component
 * Only renders for users with OPS role
 */
export const OpsSection: React.FC<Omit<RoleBasedSectionProps, 'requiredRoles'>> = (props) => {
  return <RoleBasedSection {...props} requiredRoles={['OPS']} />;
};