import React, { useState } from 'react';
import styles from './ControlCenter.module.css';
import { KpiCard, Panel } from './ControlWidgets';

// Types
interface BiometricEnrollment {
  id: string;
  type: 'FACE_ID' | 'FINGERPRINT' | 'IRIS' | 'VOICE';
  deviceId: string;
  deviceName: string;
  enrolledAt: string;
  lastUsedAt: string | null;
  isActive: boolean;
}

interface UserBiometrics {
  userId: string;
  email: string;
  name: string;
  enrollments: BiometricEnrollment[];
  totalVerifications: number;
  failedAttempts: number;
  lastActivity: string;
}

// Mock data
const mockUsers: UserBiometrics[] = [
  {
    userId: 'user-001',
    email: 'ahmed@example.com',
    name: 'Ahmed Mohamed',
    enrollments: [
      {
        id: 'enroll-001',
        type: 'FACE_ID',
        deviceId: 'iphone-14-pro',
        deviceName: 'iPhone 14 Pro',
        enrolledAt: '2024-01-15T10:30:00Z',
        lastUsedAt: '2024-12-28T08:45:00Z',
        isActive: true
      },
      {
        id: 'enroll-002',
        type: 'FINGERPRINT',
        deviceId: 'macbook-m2',
        deviceName: 'MacBook Pro M2',
        enrolledAt: '2024-02-20T14:00:00Z',
        lastUsedAt: '2024-12-27T16:30:00Z',
        isActive: true
      }
    ],
    totalVerifications: 156,
    failedAttempts: 3,
    lastActivity: '2024-12-28T08:45:00Z'
  },
  {
    userId: 'user-002',
    email: 'fatima@business.com',
    name: 'Fatima Al-Rashid',
    enrollments: [
      {
        id: 'enroll-003',
        type: 'FINGERPRINT',
        deviceId: 'samsung-s24',
        deviceName: 'Samsung Galaxy S24',
        enrolledAt: '2024-03-10T09:15:00Z',
        lastUsedAt: '2024-12-28T06:20:00Z',
        isActive: true
      }
    ],
    totalVerifications: 89,
    failedAttempts: 1,
    lastActivity: '2024-12-28T06:20:00Z'
  },
  {
    userId: 'user-003',
    email: 'mohamed@shop.com',
    name: 'Mohamed Hassan',
    enrollments: [
      {
        id: 'enroll-004',
        type: 'FACE_ID',
        deviceId: 'pixel-8',
        deviceName: 'Google Pixel 8',
        enrolledAt: '2024-06-01T11:00:00Z',
        lastUsedAt: null,
        isActive: false
      }
    ],
    totalVerifications: 12,
    failedAttempts: 8,
    lastActivity: '2024-11-15T14:30:00Z'
  }
];

const kpis = [
  { icon: '🔐', label: 'Total Enrollments', value: '4,892', trend: { value: '+124' } },
  { icon: '👤', label: 'Active Users', value: '3,156', trend: { value: '+8%' } },
  { icon: '✅', label: 'Success Rate', value: '98.2%', trend: { value: '+0.3%' } },
  { icon: '⚠️', label: 'Failed Today', value: '23', trend: { value: '-12', direction: 'down' as const } },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'FACE_ID': return '👤';
    case 'FINGERPRINT': return '👆';
    case 'IRIS': return '👁️';
    case 'VOICE': return '🎤';
    default: return '🔒';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'FACE_ID': return '#3b82f6';
    case 'FINGERPRINT': return '#22c55e';
    case 'IRIS': return '#a855f7';
    case 'VOICE': return '#f59e0b';
    default: return '#6b7280';
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const BiometricStatus: React.FC = () => {
  const [users, setUsers] = useState<UserBiometrics[]>(mockUsers);
  const [selectedUser, setSelectedUser] = useState<UserBiometrics | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const filteredUsers = users.filter(user => {
    if (filter === 'ALL') return true;
    const hasActive = user.enrollments.some(e => e.isActive);
    return filter === 'ACTIVE' ? hasActive : !hasActive;
  });

  const handleToggleEnrollment = (userId: string, enrollmentId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.userId !== userId) return u;
      return {
        ...u,
        enrollments: u.enrollments.map(e =>
          e.id === enrollmentId ? { ...e, isActive: !e.isActive } : e
        )
      };
    }));
  };

  const handleRevokeAll = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.userId !== userId) return u;
      return {
        ...u,
        enrollments: u.enrollments.map(e => ({ ...e, isActive: false }))
      };
    }));
    setSelectedUser(null);
  };

  const totalEnrollments = users.reduce((sum, u) => sum + u.enrollments.length, 0);
  const activeEnrollments = users.reduce(
    (sum, u) => sum + u.enrollments.filter(e => e.isActive).length, 
    0
  );

  return (
    <div className={styles.page}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔐 Biometric Authentication Status
        </h1>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>
          Monitor and manage user biometric enrollments
        </p>
      </header>

      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Stats Overview */}
      <Panel title="Enrollment Overview" subtitle="Biometric methods breakdown">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', padding: '0.5rem' }}>
          {[
            { type: 'FACE_ID', label: 'Face ID', count: 2, active: 1 },
            { type: 'FINGERPRINT', label: 'Fingerprint', count: 2, active: 2 },
            { type: 'IRIS', label: 'Iris Scan', count: 0, active: 0 },
            { type: 'VOICE', label: 'Voice Print', count: 0, active: 0 }
          ].map(item => (
            <div 
              key={item.type}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center',
                borderBottom: `3px solid ${getTypeColor(item.type)}`
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {getTypeIcon(item.type)}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#a0a0a0', marginTop: '0.25rem' }}>
                {item.active}/{item.count} active
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0' }}>
        {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: 'none',
              background: filter === status ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      <div className={styles.panels} style={{ gridTemplateColumns: selectedUser ? '1fr 380px' : '1fr' }}>
        {/* Users List */}
        <Panel title="User Enrollments" subtitle={`${filteredUsers.length} users with biometric data`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' }}>
            {filteredUsers.map(user => {
              const activeCount = user.enrollments.filter(e => e.isActive).length;
              const successRate = user.totalVerifications > 0 
                ? (((user.totalVerifications - user.failedAttempts) / user.totalVerifications) * 100).toFixed(1)
                : '0';
              
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{user.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '0.8rem',
                        color: activeCount > 0 ? '#22c55e' : '#ef4444'
                      }}>
                        {activeCount}/{user.enrollments.length} active
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.25rem' }}>
                        {successRate}% success
                      </div>
                    </div>
                  </div>

                  {/* Enrollment Icons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {user.enrollments.map(enrollment => (
                      <div
                        key={enrollment.id}
                        style={{
                          padding: '0.35rem 0.6rem',
                          borderRadius: '6px',
                          background: enrollment.isActive 
                            ? `${getTypeColor(enrollment.type)}20`
                            : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${enrollment.isActive ? getTypeColor(enrollment.type) : 'rgba(255,255,255,0.1)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.65rem',
                          opacity: enrollment.isActive ? 1 : 0.5
                        }}
                      >
                        <span>{getTypeIcon(enrollment.type)}</span>
                        <span>{enrollment.deviceName}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.5rem' }}>
                    Last active: {formatDate(user.lastActivity)}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Detail Panel */}
        {selectedUser && (
          <Panel title="User Details" subtitle={selectedUser.name}>
            <div style={{ padding: '0.5rem' }}>
              {/* Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  padding: '0.75rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>
                    {selectedUser.totalVerifications}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#a0a0a0' }}>Total Verifications</div>
                </div>
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  padding: '0.75rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
                    {selectedUser.failedAttempts}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#a0a0a0' }}>Failed Attempts</div>
                </div>
              </div>

              {/* Enrollments */}
              <h4 style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem' }}>
                ENROLLED DEVICES
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedUser.enrollments.map(enrollment => (
                  <div
                    key={enrollment.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      border: `1px solid ${enrollment.isActive ? getTypeColor(enrollment.type) : 'rgba(255,255,255,0.05)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(enrollment.type)}</span>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                            {enrollment.type.replace('_', ' ')}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#666' }}>
                            {enrollment.deviceName}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEnrollment(selectedUser.userId, enrollment.id);
                        }}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: enrollment.isActive ? '#ef4444' : '#22c55e',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        {enrollment.isActive ? 'Revoke' : 'Activate'}
                      </button>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginTop: '0.5rem',
                      fontSize: '0.65rem',
                      color: '#666'
                    }}>
                      <span>Enrolled: {formatDate(enrollment.enrolledAt)}</span>
                      <span>Used: {formatDate(enrollment.lastUsedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Revoke All Button */}
              <button
                onClick={() => handleRevokeAll(selectedUser.userId)}
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ⚠️ Revoke All Enrollments
              </button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
};

export default BiometricStatus;
