/**
 * Intent Funnel Panel
 * Sprint 3 Live Ops: READ-ONLY intent flow funnel display
 *
 * CONSTRAINTS:
 * - Display only
 * - No controls
 * - No mutations
 */

import React from 'react';

export interface IntentFlowFunnel {
  timestamp: string;
  period: '1h' | '24h' | '7d';
  stages: {
    intentClassified: number;
    corridorAssessed: number;
    trustGatingPassed: number;
    trustGatingFailed: number;
    recommendationGenerated: number;
    confirmationRequested: number;
    confirmationCompleted: number;
    confirmationDeclined: number;
  };
  conversionRates: {
    classifiedToAssessed: number;
    assessedToTrustPassed: number;
    trustPassedToRecommended: number;
    recommendedToConfirmed: number;
    overallConversion: number;
  };
}

interface IntentFunnelPanelProps {
  funnel: IntentFlowFunnel | null;
  isLoading?: boolean;
}

const STAGE_CONFIG = [
  { key: 'intentClassified', label: 'Intent Classified', color: '#3b82f6' },
  { key: 'corridorAssessed', label: 'Corridor Assessed', color: '#8b5cf6' },
  { key: 'trustGatingPassed', label: 'Trust Passed', color: '#22c55e' },
  { key: 'recommendationGenerated', label: 'Recommendation', color: '#f59e0b' },
  { key: 'confirmationCompleted', label: 'Confirmed', color: '#10b981' },
];

export const IntentFunnelPanel: React.FC<IntentFunnelPanelProps> = ({ funnel, isLoading = false }) => {
  if (isLoading || !funnel) {
    return (
      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>📊 Intent Flow Funnel</h3>
          <span style={styles.badge}>READ-ONLY</span>
        </div>
        <div style={styles.loading}>Loading funnel metrics...</div>
      </div>
    );
  }

  const maxValue = Math.max(...Object.values(funnel.stages), 1);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>📊 Intent Flow Funnel</h3>
        <div style={styles.headerRight}>
          <span style={styles.periodBadge}>{funnel.period}</span>
          <span style={styles.badge}>READ-ONLY</span>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div style={styles.funnelContainer}>
        {STAGE_CONFIG.map((stage, index) => {
          const value = funnel.stages[stage.key as keyof typeof funnel.stages] || 0;
          const width = Math.max(20, (value / maxValue) * 100);

          return (
            <div key={stage.key} style={styles.funnelStage}>
              <div style={styles.stageLabel}>
                <span>{stage.label}</span>
                <span style={styles.stageValue}>{value.toLocaleString()}</span>
              </div>
              <div style={styles.barContainer}>
                <div
                  style={{
                    ...styles.bar,
                    width: `${width}%`,
                    backgroundColor: stage.color,
                  }}
                />
              </div>
              {index < STAGE_CONFIG.length - 1 && <div style={styles.arrow}>↓</div>}
            </div>
          );
        })}
      </div>

      {/* Trust Gating Breakdown */}
      <div style={styles.trustSection}>
        <h4 style={styles.sectionTitle}>Trust Gating Breakdown</h4>
        <div style={styles.trustGrid}>
          <div style={{ ...styles.trustCard, borderColor: '#22c55e' }}>
            <span style={styles.trustValue}>{funnel.stages.trustGatingPassed}</span>
            <span style={styles.trustLabel}>Passed</span>
          </div>
          <div style={{ ...styles.trustCard, borderColor: '#ef4444' }}>
            <span style={styles.trustValue}>{funnel.stages.trustGatingFailed}</span>
            <span style={styles.trustLabel}>Failed</span>
          </div>
          <div style={{ ...styles.trustCard, borderColor: '#6b7280' }}>
            <span style={styles.trustValue}>{funnel.stages.confirmationDeclined}</span>
            <span style={styles.trustLabel}>Declined</span>
          </div>
        </div>
      </div>

      {/* Conversion Rates */}
      <div style={styles.conversionSection}>
        <h4 style={styles.sectionTitle}>Conversion Rates</h4>
        <div style={styles.conversionGrid}>
          <div style={styles.conversionItem}>
            <span style={styles.conversionRate}>{funnel.conversionRates.classifiedToAssessed}%</span>
            <span style={styles.conversionLabel}>Classified → Assessed</span>
          </div>
          <div style={styles.conversionItem}>
            <span style={styles.conversionRate}>{funnel.conversionRates.assessedToTrustPassed}%</span>
            <span style={styles.conversionLabel}>Assessed → Trust Passed</span>
          </div>
          <div style={styles.conversionItem}>
            <span style={styles.conversionRate}>{funnel.conversionRates.recommendedToConfirmed}%</span>
            <span style={styles.conversionLabel}>Recommended → Confirmed</span>
          </div>
          <div style={{ ...styles.conversionItem, backgroundColor: '#f0fdf4' }}>
            <span style={{ ...styles.conversionRate, color: '#15803d' }}>{funnel.conversionRates.overallConversion}%</span>
            <span style={styles.conversionLabel}>Overall Conversion</span>
          </div>
        </div>
      </div>

      <div style={styles.timestamp}>Last updated: {new Date(funnel.timestamp).toLocaleString()}</div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  headerRight: { display: 'flex', gap: '8px', alignItems: 'center' },
  title: { margin: 0, fontSize: '18px', fontWeight: 600 },
  badge: { fontSize: '10px', padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '12px', fontWeight: 500 },
  periodBadge: { fontSize: '12px', padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '4px', fontWeight: 500 },
  loading: { textAlign: 'center', padding: '40px', color: '#6b7280' },
  funnelContainer: { marginBottom: '24px' },
  funnelStage: { marginBottom: '8px' },
  stageLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' },
  stageValue: { fontWeight: 600 },
  barContainer: { height: '24px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' },
  bar: { height: '100%', transition: 'width 0.3s ease', borderRadius: '4px' },
  arrow: { textAlign: 'center', color: '#9ca3af', fontSize: '12px', margin: '4px 0' },
  trustSection: { marginBottom: '20px' },
  sectionTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' },
  trustGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  trustCard: { border: '2px solid', borderRadius: '8px', padding: '12px', textAlign: 'center' },
  trustValue: { display: 'block', fontSize: '24px', fontWeight: 700 },
  trustLabel: { fontSize: '12px', color: '#6b7280' },
  conversionSection: { marginBottom: '16px' },
  conversionGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' },
  conversionItem: { backgroundColor: '#f9fafb', borderRadius: '6px', padding: '12px', textAlign: 'center' },
  conversionRate: { display: 'block', fontSize: '20px', fontWeight: 700, color: '#374151' },
  conversionLabel: { fontSize: '10px', color: '#6b7280' },
  timestamp: { fontSize: '11px', color: '#9ca3af', textAlign: 'right' },
};

export default IntentFunnelPanel;
