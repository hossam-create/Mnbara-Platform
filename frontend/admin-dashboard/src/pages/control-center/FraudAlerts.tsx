import React, { useState, useEffect } from 'react';
import styles from './ControlCenter.module.css';
import { KpiCard, Panel } from './ControlWidgets';

// Types for fraud alerts
interface FraudSignal {
  type: string;
  severity: number;
  description: string;
}

interface FraudAlert {
  id: string;
  transactionId: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals: FraudSignal[];
  recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'DECLINE' | 'CHALLENGE';
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'DECLINED';
  createdAt: string;
}

// Mock data for demonstration
const mockAlerts: FraudAlert[] = [
  {
    id: 'alert-001',
    transactionId: 'txn-12345',
    userId: 'user-100',
    userEmail: 'user@example.com',
    amount: 2500,
    currency: 'USD',
    riskScore: 0.85,
    riskLevel: 'CRITICAL',
    signals: [
      { type: 'VELOCITY_ANOMALY', severity: 0.6, description: '15 transactions in last hour' },
      { type: 'GEO_ANOMALY', severity: 0.4, description: 'New country: Russia' }
    ],
    recommendation: 'DECLINE',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  },
  {
    id: 'alert-002',
    transactionId: 'txn-12346',
    userId: 'user-101',
    userEmail: 'buyer@test.com',
    amount: 850,
    currency: 'EUR',
    riskScore: 0.62,
    riskLevel: 'HIGH',
    signals: [
      { type: 'NEW_DEVICE', severity: 0.3, description: 'Unrecognized device' },
      { type: 'AMOUNT_ANOMALY', severity: 0.4, description: '5x average transaction' }
    ],
    recommendation: 'CHALLENGE',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'alert-003',
    transactionId: 'txn-12347',
    userId: 'user-102',
    userEmail: 'seller@shop.com',
    amount: 320,
    currency: 'SAR',
    riskScore: 0.45,
    riskLevel: 'MEDIUM',
    signals: [
      { type: 'TIME_ANOMALY', severity: 0.2, description: 'Transaction at 3:00 AM' }
    ],
    recommendation: 'MANUAL_REVIEW',
    status: 'REVIEWED',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

const kpis = [
  { icon: '🔒', label: 'Pending Alerts', value: '12', trend: { value: '+3', direction: 'up' as const } },
  { icon: '⚠️', label: 'Critical Risks', value: '2', trend: { value: '-1', direction: 'down' as const } },
  { icon: '✅', label: 'Resolved Today', value: '47', trend: { value: '+15%' } },
  { icon: '📊', label: 'Avg Risk Score', value: '0.42', trend: { value: '-5%', direction: 'down' as const } },
];

const getRiskColor = (level: string) => {
  switch (level) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH': return '#f97316';
    case 'MEDIUM': return '#eab308';
    case 'LOW': return '#22c55e';
    default: return '#6b7280';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return '#f59e0b';
    case 'REVIEWED': return '#3b82f6';
    case 'APPROVED': return '#22c55e';
    case 'DECLINED': return '#ef4444';
    default: return '#6b7280';
  }
};

const FraudAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>(mockAlerts);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'ALL') return true;
    return alert.riskLevel === filter;
  });

  const handleAction = (alertId: string, action: 'APPROVED' | 'DECLINED') => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, status: action } : a
    ));
    setSelectedAlert(null);
  };

  return (
    <div className={styles.page}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🛡️ Fraud Detection & Security
        </h1>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>
          Real-time fraud monitoring and transaction security alerts
        </p>
      </header>

      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0', flexWrap: 'wrap' }}>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: 'none',
              background: filter === level ? (level === 'ALL' ? '#3b82f6' : getRiskColor(level)) : 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {level}
          </button>
        ))}
      </div>

      <div className={styles.panels} style={{ gridTemplateColumns: selectedAlert ? '1fr 400px' : '1fr' }}>
        {/* Alerts List */}
        <Panel title="Active Alerts" subtitle={`${filteredAlerts.length} alerts requiring attention`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' }}>
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                style={{
                  background: selectedAlert?.id === alert.id 
                    ? 'rgba(59, 130, 246, 0.15)' 
                    : 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  border: `1px solid ${selectedAlert?.id === alert.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span 
                        style={{ 
                          background: getRiskColor(alert.riskLevel),
                          color: 'white',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 600
                        }}
                      >
                        {alert.riskLevel}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#a0a0a0' }}>
                        {alert.transactionId}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                      {alert.amount.toLocaleString()} {alert.currency}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      {alert.userEmail}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div 
                      style={{ 
                        color: getStatusColor(alert.status),
                        fontSize: '0.7rem',
                        fontWeight: 500
                      }}
                    >
                      {alert.status}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.5rem' }}>
                      Score: {(alert.riskScore * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.25rem', 
                  marginTop: '0.5rem' 
                }}>
                  {alert.signals.slice(0, 2).map((signal, idx) => (
                    <span 
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.6rem',
                        color: '#a0a0a0'
                      }}
                    >
                      {signal.type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Alert Details Panel */}
        {selectedAlert && (
          <Panel title="Alert Details" subtitle={`Transaction ${selectedAlert.transactionId}`}>
            <div style={{ padding: '0.5rem' }}>
              {/* Risk Score Gauge */}
              <div style={{ 
                textAlign: 'center', 
                padding: '1.5rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '12px',
                marginBottom: '1rem'
              }}>
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: 700,
                  color: getRiskColor(selectedAlert.riskLevel)
                }}>
                  {(selectedAlert.riskScore * 100).toFixed(0)}
                </div>
                <div style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>Risk Score</div>
              </div>

              {/* Transaction Info */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>TRANSACTION</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#666' }}>Amount:</span>
                    <span style={{ marginLeft: '0.5rem', fontWeight: 500 }}>
                      {selectedAlert.amount} {selectedAlert.currency}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>User:</span>
                    <span style={{ marginLeft: '0.5rem' }}>{selectedAlert.userId}</span>
                  </div>
                </div>
              </div>

              {/* Signals */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>RISK SIGNALS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedAlert.signals.map((signal, idx) => (
                    <div 
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${getRiskColor(signal.severity > 0.5 ? 'HIGH' : 'MEDIUM')}`
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                        {signal.type.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#a0a0a0' }}>
                        {signal.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendation */}
              <div style={{ 
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#a78bfa', marginBottom: '0.25rem' }}>
                  🤖 AI RECOMMENDATION
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {selectedAlert.recommendation.replace(/_/g, ' ')}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedAlert.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleAction(selectedAlert.id, 'APPROVED')}
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
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleAction(selectedAlert.id, 'DECLINED')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Decline
                  </button>
                </div>
              )}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
};

export default FraudAlerts;
