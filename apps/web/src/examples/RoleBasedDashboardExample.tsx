/**
 * Role-based Dashboard Example
 * Demonstrates how to use role-based UI guards
 * Frontend guards are cosmetic only - backend authorization remains mandatory
 */

import React from 'react';
import { 
  AdminGuard, 
  OpsGuard, 
  PermissionGuard,
  AdminButton,
  OpsButton,
  AdminCard,
  OpsCard,
  AdminSection,
  OpsSection,
  RoleBasedNavigation,
  Permission
} from '../components/guards';

/**
 * Example of a dashboard with role-based components
 */
export const RoleBasedDashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h1>Platform Dashboard</h1>
      
      {/* User section - visible to all authenticated users */}
      <section className="user-section">
        <h2>My Dashboard</h2>
        <p>Welcome to your personal dashboard</p>
        
        {/* User actions */}
        <div className="user-actions">
          <button>View Orders</button>
          <button>Manage Wallet</button>
          <button>Profile Settings</button>
        </div>
      </section>

      {/* Admin section - only visible to ADMIN role */}
      <AdminGuard>
        <AdminSection 
          title="Admin Dashboard" 
          description="System administration and management"
        >
          <div className="admin-stats">
            <AdminCard title="User Management">
              <p>Manage platform users and their permissions</p>
              <AdminButton 
                onClick={() => console.log('Navigate to user management')}
                variant="admin"
              >
                Manage Users
              </AdminButton>
            </AdminCard>
            
            <AdminCard title="System Analytics">
              <p>View platform-wide analytics and reports</p>
              <AdminButton 
                onClick={() => console.log('Navigate to analytics')}
                variant="admin"
              >
                View Analytics
              </AdminButton>
            </AdminCard>
            
            <AdminCard title="Platform Settings">
              <p>Configure system-wide settings and policies</p>
              <AdminButton 
                onClick={() => console.log('Navigate to settings')}
                variant="admin"
              >
                Configure Settings
              </AdminButton>
            </AdminCard>
          </div>
        </AdminSection>
      </AdminGuard>

      {/* Ops section - only visible to OPS role */}
      <OpsGuard>
        <OpsSection 
          title="Operations Dashboard" 
          description="Daily operations and financial management"
        >
          <div className="ops-stats">
            <OpsCard title="Escrow Management">
              <p>Monitor and manage escrow funds</p>
              <OpsButton 
                onClick={() => console.log('Navigate to escrow management')}
                variant="ops"
              >
                Manage Escrow
              </OpsButton>
            </OpsCard>
            
            <OpsCard title="Dispute Resolution">
              <p>Handle buyer-seller disputes</p>
              <OpsButton 
                onClick={() => console.log('Navigate to dispute resolution')}
                variant="ops"
              >
                Handle Disputes
              </OpsButton>
            </OpsCard>
            
            <OpsCard title="Financial Reports">
              <p>View financial data and generate reports</p>
              <OpsButton 
                onClick={() => console.log('Navigate to financial reports')}
                variant="ops"
              >
                View Reports
              </OpsButton>
            </OpsCard>
          </div>
        </OpsSection>
      </OpsGuard>

      {/* Permission-based components */}
      <PermissionGuard permission={Permission.VIEW_ANALYTICS}>
        <div className="analytics-section">
          <h3>Analytics Overview</h3>
          <p>Platform performance metrics</p>
          {/* Analytics content */}
        </div>
      </PermissionGuard>

      <PermissionGuard permission={Permission.MANAGE_DISPUTES}>
        <div className="disputes-section">
          <h3>Active Disputes</h3>
          <p>Disputes requiring attention</p>
          {/* Disputes content */}
        </div>
      </PermissionGuard>

      {/* Fallback example - show alternative content for unauthorized users */}
      <AdminGuard fallback={
        <div className="admin-teaser">
          <h3>Admin Features</h3>
          <p>Admin features are available to platform administrators only.</p>
          <p>Contact support if you need administrative access.</p>
        </div>
      }>
        {/* This content is only shown to admins */}
        <div className="admin-exclusive">
          <p>Welcome, Administrator! You have full access to platform management.</p>
        </div>
      </AdminGuard>
    </div>
  );
};

/**
 * Example of role-based navigation
 */
export const RoleBasedNavigationExample: React.FC = () => {
  return (
    <div className="navigation-example">
      <h2>Role-based Navigation</h2>
      
      {/* Horizontal navigation */}
      <div className="navigation-section">
        <h3>Main Navigation</h3>
        <RoleBasedNavigation variant="horizontal" />
      </div>
      
      {/* Vertical navigation */}
      <div className="navigation-section">
        <h3>Sidebar Navigation</h3>
        <RoleBasedNavigation variant="vertical" />
      </div>
      
      {/* Sidebar navigation */}
      <div className="navigation-section">
        <h3>Admin Sidebar</h3>
        <RoleBasedNavigation variant="sidebar" />
      </div>
    </div>
  );
};

/**
 * Example of role-based forms and actions
 */
export const RoleBasedActionsExample: React.FC = () => {
  const handleAdminAction = () => {
    console.log('Admin action performed');
  };
  
  const handleOpsAction = () => {
    console.log('Ops action performed');
  };
  
  return (
    <div className="actions-example">
      <h2>Role-based Actions</h2>
      
      <div className="action-buttons">
        {/* Regular user actions */}
        <button className="user-action">User Action</button>
        
        {/* Admin-only actions */}
        <AdminButton 
          onClick={handleAdminAction}
          variant="admin"
          size="medium"
        >
          Admin Action
        </AdminButton>
        
        {/* Ops-only actions */}
        <OpsButton 
          onClick={handleOpsAction}
          variant="ops"
          size="medium"
        >
          Ops Action
        </OpsButton>
      </div>
      
      {/* Permission-based actions */}
      <PermissionGuard permission={Permission.MANAGE_USERS}>
        <div className="permission-action">
          <button onClick={() => console.log('Managing users...')}>
            Manage Users (Permission Required)
          </button>
        </div>
      </PermissionGuard>
      
      <PermissionGuard permission={Permission.PROCESS_REFUNDS}>
        <div className="permission-action">
          <button onClick={() => console.log('Processing refunds...')}>
            Process Refunds (Permission Required)
          </button>
        </div>
      </PermissionGuard>
    </div>
  );
};

/**
 * Example of role-based data display
 */
export const RoleBasedDataExample: React.FC = () => {
  return (
    <div className="data-example">
      <h2>Role-based Data Display</h2>
      
      {/* User data */}
      <div className="data-section">
        <h3>User Data</h3>
        <p>Order history, profile information, etc.</p>
      </div>
      
      {/* Admin data */}
      <AdminCard title="System Statistics">
        <div className="admin-data">
          <p>Total Users: 1,234</p>
          <p>Active Orders: 567</p>
          <p>Revenue: $89,012</p>
          <p>Disputes: 23</p>
        </div>
      </AdminCard>
      
      {/* Ops data */}
      <OpsCard title="Financial Overview">
        <div className="ops-data">
          <p>Escrow Balance: $45,678</p>
          <p>Pending Refunds: $1,234</p>
          <p>Dispute Escrow: $5,678</p>
          <p>Processing Fees: $890</p>
        </div>
      </OpsCard>
      
      {/* Permission-based data */}
      <PermissionGuard permission={Permission.VIEW_FINANCIAL_DATA}>
        <div className="financial-data">
          <h3>Financial Data</h3>
          <p>Detailed financial information...</p>
        </div>
      </PermissionGuard>
    </div>
  );
};

/**
 * Complete role-based application example
 */
export const RoleBasedAppExample: React.FC = () => {
  return (
    <div className="role-based-app">
      <header className="app-header">
        <RoleBasedNavigation variant="horizontal" />
      </header>
      
      <main className="app-main">
        <RoleBasedDashboard />
        <RoleBasedActionsExample />
        <RoleBasedDataExample />
      </main>
      
      <footer className="app-footer">
        <p>© 2024 MNbarh Platform - Role-based Access Control</p>
      </footer>
    </div>
  );
};