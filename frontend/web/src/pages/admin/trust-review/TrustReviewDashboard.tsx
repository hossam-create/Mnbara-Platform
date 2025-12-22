// ============================================
// 🛡️ Trust & Review Admin Dashboard
// Role-based access control for KYC, Disputes, Guarantees, Audit
// ============================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KYCQueue } from './components/KYCQueue';
import { DisputeQueue } from './components/DisputeQueue';
import { GuaranteeLedger } from './components/GuaranteeLedger';
import { AuditExplorer } from './components/AuditExplorer';

// Role definitions
const ADMIN_ROLES = {
  REVIEWER: 'reviewer',
  LEAD_REVIEWER: 'lead_reviewer', 
  EMERGENCY_ADMIN: 'emergency_admin'
} as const;

type AdminRole = keyof typeof ADMIN_ROLES;
type TrustTab = 'kyc-queue' | 'dispute-queue' | 'guarantee-ledger' | 'audit-explorer';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  mfaEnabled: boolean;
  lastLogin: string;
}

interface DashboardStats {
  pendingKYC: number;
  pendingDisputes: number;
  totalGuarantees: number;
  recentAuditEvents: number;
  kycApprovalRate: number;
  disputeResolutionTime: number;
}

export function TrustReviewDashboard() {
  const [activeTab, setActiveTab] = useState<TrustTab>('kyc-queue');
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState(1800); // 30 minutes
  const navigate = useNavigate();

  // Mock data - replace with actual API calls
  const stats: DashboardStats = {
    pendingKYC: 89,
    pendingDisputes: 23,
    totalGuarantees: 1567,
    recentAuditEvents: 342,
    kycApprovalRate: 87.5,
    disputeResolutionTime: 2.4,
  };

  const tabs = [
    { 
      id: 'kyc-queue' as TrustTab, 
      label: 'KYC Queue', 
      icon: '🔐',
      roles: [ADMIN_ROLES.REVIEWER, ADMIN_ROLES.LEAD_REVIEWER, ADMIN_ROLES.EMERGENCY_ADMIN],
      count: stats.pendingKYC
    },
    { 
      id: 'dispute-queue' as TrustTab, 
      label: 'Dispute Queue', 
      icon: '⚖️',
      roles: [ADMIN_ROLES.LEAD_REVIEWER, ADMIN_ROLES.EMERGENCY_ADMIN],
      count: stats.pendingDisputes
    },
    { 
      id: 'guarantee-ledger' as TrustTab, 
      label: 'Guarantee Ledger', 
      icon: '💰',
      roles: [ADMIN_ROLES.LEAD_REVIEWER, ADMIN_ROLES.EMERGENCY_ADMIN],
      readOnly: true
    },
    { 
      id: 'audit-explorer' as TrustTab, 
      label: 'Audit Explorer', 
      icon: '📊',
      roles: [ADMIN_ROLES.EMERGENCY_ADMIN],
      readOnly: true
    }
  ];

  // Check user authentication and role access
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulate API call to get current user
        const user: AdminUser = {
          id: 'admin-001',
          name: 'Admin User',
          email: 'admin@mnbara.com',
          role: 'LEAD_REVIEWER',
          mfaEnabled: true,
          lastLogin: new Date().toISOString()
        };
        
        if (!user.mfaEnabled) {
          navigate('/admin/mfa-setup');
          return;
        }
        
        setCurrentUser(user);
        
        // Start session timeout
        const timer = setInterval(() => {
          setSessionTimeout(prev => {
            if (prev <= 0) {
              clearInterval(timer);
              navigate('/admin/logout');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(timer);
      } catch (error) {
        navigate('/admin/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const hasAccess = (tabRoles: string[]) => {
    return currentUser && tabRoles.includes(ADMIN_ROLES[currentUser.role]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Trust & Review Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
              🛡️
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Trust & Review Center</h1>
              <p className="text-gray-500 text-sm">Secure Admin Operations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Session: {formatTime(sessionTimeout)}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{currentUser.name}</div>
                <div className="text-gray-500 capitalize">{currentUser.role.toLowerCase().replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const accessible = hasAccess(tab.roles);
              return (
                <button
                  key={tab.id}
                  onClick={() => accessible && setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : accessible
                      ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      : 'border-transparent text-gray-300 cursor-not-allowed'
                  }`}
                  disabled={!accessible}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                  {tab.readOnly && (
                    <span className="ml-1 text-xs text-gray-400">(Read-only)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Dashboard Modules */}
          {activeTab === 'kyc-queue' && <KYCQueue />}
          {activeTab === 'dispute-queue' && <DisputeQueue />}
          {activeTab === 'guarantee-ledger' && <GuaranteeLedger />}
          {activeTab === 'audit-explorer' && <AuditExplorer />}
        </main>

      {/* Audit Log Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            All actions are logged and monitored. Session will timeout automatically for security.
          </p>
        </div>
      </footer>
    </div>
  );
}