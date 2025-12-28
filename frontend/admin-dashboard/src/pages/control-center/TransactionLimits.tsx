import React, { useState } from 'react';
import styles from './ControlCenter.module.css';
import { KpiCard, Panel } from './ControlWidgets';

// Types
interface UserLimits {
  userId: string;
  email: string;
  tier: 'basic' | 'verified' | 'premium' | 'enterprise';
  limits: {
    daily: { limit: number; used: number };
    weekly: { limit: number; used: number };
    monthly: { limit: number; used: number };
    perTransaction: number;
  };
  customLimits?: boolean;
  lastUpdated: string;
}

interface LimitTier {
  name: string;
  color: string;
  daily: number;
  weekly: number;
  monthly: number;
  perTransaction: number;
}

// Default tier configurations
const tierConfigs: Record<string, LimitTier> = {
  basic: {
    name: 'Basic',
    color: '#6b7280',
    daily: 1000,
    weekly: 5000,
    monthly: 15000,
    perTransaction: 500
  },
  verified: {
    name: 'Verified',
    color: '#3b82f6',
    daily: 5000,
    weekly: 25000,
    monthly: 75000,
    perTransaction: 2500
  },
  premium: {
    name: 'Premium',
    color: '#a855f7',
    daily: 25000,
    weekly: 100000,
    monthly: 300000,
    perTransaction: 10000
  },
  enterprise: {
    name: 'Enterprise',
    color: '#f59e0b',
    daily: 100000,
    weekly: 500000,
    monthly: 1500000,
    perTransaction: 50000
  }
};

// Mock user data
const mockUsers: UserLimits[] = [
  {
    userId: 'user-001',
    email: 'ahmed@example.com',
    tier: 'premium',
    limits: {
      daily: { limit: 25000, used: 12500 },
      weekly: { limit: 100000, used: 45000 },
      monthly: { limit: 300000, used: 180000 },
      perTransaction: 10000
    },
    lastUpdated: new Date().toISOString()
  },
  {
    userId: 'user-002',
    email: 'fatima@business.com',
    tier: 'enterprise',
    limits: {
      daily: { limit: 100000, used: 85000 },
      weekly: { limit: 500000, used: 320000 },
      monthly: { limit: 1500000, used: 890000 },
      perTransaction: 50000
    },
    customLimits: true,
    lastUpdated: new Date(Date.now() - 86400000).toISOString()
  },
  {
    userId: 'user-003',
    email: 'buyer@shop.com',
    tier: 'verified',
    limits: {
      daily: { limit: 5000, used: 4800 },
      weekly: { limit: 25000, used: 18000 },
      monthly: { limit: 75000, used: 62000 },
      perTransaction: 2500
    },
    lastUpdated: new Date(Date.now() - 3600000).toISOString()
  }
];

const kpis = [
  { icon: '📊', label: 'Avg Limit Utilization', value: '62%', trend: { value: '+8%' } },
  { icon: '⚠️', label: 'Near Limit Users', value: '28', trend: { value: '+5', direction: 'up' as const } },
  { icon: '🔧', label: 'Custom Limits', value: '12', trend: { value: '+2' } },
  { icon: '🌍', label: 'Blocked Countries', value: '5', trend: { value: '0' } },
];

const TransactionLimits: React.FC = () => {
  const [users, setUsers] = useState<UserLimits[]>(mockUsers);
  const [selectedUser, setSelectedUser] = useState<UserLimits | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedLimits, setEditedLimits] = useState<{
    daily: number;
    weekly: number;
    monthly: number;
    perTransaction: number;
  } | null>(null);

  const getUsagePercent = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return '#ef4444';
    if (percent >= 70) return '#f59e0b';
    return '#22c55e';
  };

  const handleEditStart = (user: UserLimits) => {
    setSelectedUser(user);
    setEditedLimits({
      daily: user.limits.daily.limit,
      weekly: user.limits.weekly.limit,
      monthly: user.limits.monthly.limit,
      perTransaction: user.limits.perTransaction
    });
    setEditMode(true);
  };

  const handleSave = () => {
    if (selectedUser && editedLimits) {
      setUsers(prev => prev.map(u => 
        u.userId === selectedUser.userId
          ? {
              ...u,
              limits: {
                daily: { ...u.limits.daily, limit: editedLimits.daily },
                weekly: { ...u.limits.weekly, limit: editedLimits.weekly },
                monthly: { ...u.limits.monthly, limit: editedLimits.monthly },
                perTransaction: editedLimits.perTransaction
              },
              customLimits: true,
              lastUpdated: new Date().toISOString()
            }
          : u
      ));
      setEditMode(false);
      setSelectedUser(null);
    }
  };

  const handleResetToTier = (user: UserLimits) => {
    const tierConfig = tierConfigs[user.tier];
    setUsers(prev => prev.map(u =>
      u.userId === user.userId
        ? {
            ...u,
            limits: {
              daily: { ...u.limits.daily, limit: tierConfig.daily },
              weekly: { ...u.limits.weekly, limit: tierConfig.weekly },
              monthly: { ...u.limits.monthly, limit: tierConfig.monthly },
              perTransaction: tierConfig.perTransaction
            },
            customLimits: false,
            lastUpdated: new Date().toISOString()
          }
        : u
    ));
  };

  return (
    <div className={styles.page}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📏 Transaction Limits Management
        </h1>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>
          Configure user transaction limits and monitor usage
        </p>
      </header>

      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Tier Overview */}
      <Panel title="Limit Tiers" subtitle="Default limits by user tier">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '0.5rem' }}>
          {Object.entries(tierConfigs).map(([key, tier]) => (
            <div 
              key={key}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '1rem',
                borderTop: `3px solid ${tier.color}`
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: tier.color }}>
                {tier.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a0a0a0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div>Daily: ${tier.daily.toLocaleString()}</div>
                <div>Weekly: ${tier.weekly.toLocaleString()}</div>
                <div>Monthly: ${tier.monthly.toLocaleString()}</div>
                <div>Per Txn: ${tier.perTransaction.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className={styles.panels} style={{ marginTop: '1rem' }}>
        {/* Users List */}
        <Panel title="User Limits" subtitle="Click to edit user limits">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' }}>
            {users.map(user => {
              const dailyPercent = getUsagePercent(user.limits.daily.used, user.limits.daily.limit);
              const tierConfig = tierConfigs[user.tier];
              
              return (
                <div
                  key={user.userId}
                  onClick={() => setSelectedUser(user)}
                  style={{
                    background: selectedUser?.userId === user.userId 
                      ? 'rgba(59, 130, 246, 0.15)' 
                      : 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: 'pointer',
                    border: `1px solid ${selectedUser?.userId === user.userId ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 500 }}>{user.email}</span>
                        <span 
                          style={{ 
                            background: tierConfig.color,
                            color: 'white',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.6rem',
                            fontWeight: 600
                          }}
                        >
                          {tierConfig.name}
                        </span>
                        {user.customLimits && (
                          <span style={{ 
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#a78bfa',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.6rem'
                          }}>
                            Custom
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                        {user.userId}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 600,
                        color: getUsageColor(dailyPercent)
                      }}>
                        {dailyPercent}%
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#666' }}>Daily usage</div>
                    </div>
                  </div>

                  {/* Usage Bars */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                      { label: 'D', used: user.limits.daily.used, limit: user.limits.daily.limit },
                      { label: 'W', used: user.limits.weekly.used, limit: user.limits.weekly.limit },
                      { label: 'M', used: user.limits.monthly.used, limit: user.limits.monthly.limit }
                    ].map(item => {
                      const percent = getUsagePercent(item.used, item.limit);
                      return (
                        <div key={item.label} style={{ flex: 1 }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '0.6rem', 
                            color: '#666',
                            marginBottom: '2px'
                          }}>
                            <span>{item.label}</span>
                            <span>{percent}%</span>
                          </div>
                          <div style={{ 
                            height: '4px', 
                            background: 'rgba(255,255,255,0.1)', 
                            borderRadius: '2px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${percent}%`, 
                              height: '100%', 
                              background: getUsageColor(percent),
                              borderRadius: '2px'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Edit Panel */}
        {selectedUser && (
          <Panel 
            title={editMode ? 'Edit Limits' : 'User Details'} 
            subtitle={selectedUser.email}
          >
            <div style={{ padding: '0.5rem' }}>
              {!editMode ? (
                <>
                  {/* Current Limits Display */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem' }}>CURRENT LIMITS</h4>
                    {[
                      { label: 'Daily Limit', value: selectedUser.limits.daily.limit, used: selectedUser.limits.daily.used },
                      { label: 'Weekly Limit', value: selectedUser.limits.weekly.limit, used: selectedUser.limits.weekly.used },
                      { label: 'Monthly Limit', value: selectedUser.limits.monthly.limit, used: selectedUser.limits.monthly.used },
                      { label: 'Per Transaction', value: selectedUser.limits.perTransaction }
                    ].map(item => (
                      <div key={item.label} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: '0.5rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '6px',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{ color: '#a0a0a0', fontSize: '0.85rem' }}>{item.label}</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 500 }}>${item.value.toLocaleString()}</span>
                          {'used' in item && (
                            <div style={{ fontSize: '0.7rem', color: '#666' }}>
                              Used: ${item.used.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEditStart(selectedUser)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: '#3b82f6',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Edit Limits
                    </button>
                    {selectedUser.customLimits && (
                      <button
                        onClick={() => handleResetToTier(selectedUser)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ↩️ Reset to Tier
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Edit Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { key: 'daily', label: 'Daily Limit' },
                      { key: 'weekly', label: 'Weekly Limit' },
                      { key: 'monthly', label: 'Monthly Limit' },
                      { key: 'perTransaction', label: 'Per Transaction' }
                    ].map(item => (
                      <div key={item.key}>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '0.75rem', 
                          color: '#a0a0a0',
                          marginBottom: '0.25rem'
                        }}>
                          {item.label}
                        </label>
                        <input
                          type="number"
                          value={editedLimits?.[item.key as keyof typeof editedLimits] || 0}
                          onChange={(e) => setEditedLimits(prev => 
                            prev ? { ...prev, [item.key]: parseInt(e.target.value) || 0 } : null
                          )}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1rem'
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Save/Cancel Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleSave}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: '#22c55e',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Save Changes
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
};

export default TransactionLimits;
