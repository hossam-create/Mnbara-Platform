/**
 * Corridor Advisory Panel Component
 * Sprint 2: Complete advisory display for US → MENA corridor
 * 
 * Combines: Intent Chip, Trust Scores, Risk Assessment, Recommendation Lanes
 * 
 * CONSTRAINTS:
 * - Advisory display only
 * - No execution
 * - Feature-flagged
 */

import React from 'react';
import { IntentChip } from './IntentChip';
import { RecommendationLanes } from './RecommendationLanes';
import {
  MarketIntentResult,
  CorridorAssessment,
  RecommendationLanes as RecommendationLanesType,
  TrustScoreResult,
  RiskAssessmentResult,
  LaneOption,
  getFeatureFlags,
} from '../../services/crowdship-ai.service';

interface CorridorAdvisoryPanelProps {
  intent: MarketIntentResult | null;
  corridorAssessment: CorridorAssessment | null;
  buyerTrust: TrustScoreResult | null;
  travelerTrust: TrustScoreResult | null;
  riskAssessment: RiskAssessmentResult | null;
  recommendationLanes: RecommendationLanesType | null;
  onIntentChange?: (intent: string) => void;
  onOptionSelect?: (option: LaneOption, lane: string) => void;
  isLoading?: boolean;
  correlationId?: string;
}

const getTrustColor = (level: string): string => {
  const colors: Record<string, string> = {
    VERIFIED: '#22c55e', TRUSTED: '#3b82f6', STANDARD: '#f59e0b', NEW: '#6b7280', RESTRICTED: '#ef4444',
  };
  return colors[level] || '#6b7280';
};

const getRiskColor = (level: string): string => {
  const colors: Record<string, string> = {
    CRITICAL: '#dc2626', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e', MINIMAL: '#10b981',
  };
  return colors[level] || '#6b7280';
};

export const CorridorAdvisoryPanel: React.FC<CorridorAdvisoryPanelProps> = ({
  intent,
  corridorAssessment,
  buyerTrust,
  travelerTrust,
  riskAssessment,
  recommendationLanes,
  onIntentChange,
  onOptionSelect,
  isLoading = false,
  correlationId,
}) => {
  const flags = getFeatureFlags();

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.aiIcon}>🤖</span>
          <span>AI Corridor Advisory</span>
          <span style={styles.badge}>Loading...</span>
        </div>
        <div style={styles.loading}>Analyzing corridor and generating recommendations...</div>
      </div>
    );
  }

  const hasData = intent || corridorAssessment || buyerTrust || travelerTrust || riskAssessment || recommendationLanes;
  if (!hasData) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.aiIcon}>🤖</span>
        <span>AI Corridor Advisory</span>
        <span style={styles.badge}>Read-Only</span>
        {correlationId && <span style={styles.correlationId}>ID: {correlationId.slice(-8)}</span>}
      </div>

      {/* Intent Classification */}
      {flags.intentChipUi && intent && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Intent Classification</h4>
          <IntentChip intent={intent} onIntentChange={onIntentChange} isEditable={intent.editable} />
        </div>
      )}

      {/* Corridor Assessment */}
      {corridorAssessment && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Corridor Assessment</h4>
          <div style={styles.corridorCard}>
            <div style={styles.corridorHeader}>
              <span style={styles.corridorName}>{corridorAssessment.corridorName}</span>
              <span style={{ ...styles.supportedBadge, backgroundColor: corridorAssessment.isSupported ? '#22c55e' : '#ef4444' }}>
                {corridorAssessment.isSupported ? 'Supported' : 'Not Supported'}
              </span>
            </div>
            
            <div style={styles.corridorStats}>
              <div style={styles.stat}>
                <span style={styles.statLabel}>Risk Multiplier</span>
                <span style={styles.statValue}>{corridorAssessment.riskMultiplier}x</span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statLabel}>Value Band</span>
                <span style={styles.statValue}>{corridorAssessment.valueBand.label}</span>
              </div>
            </div>

            {/* Trust Gating */}
            {flags.trustGating && (
              <div style={{ ...styles.trustGating, backgroundColor: corridorAssessment.trustGating.passed ? '#f0fdf4' : '#fef2f2' }}>
                <div style={styles.trustGatingHeader}>
                  <span>{corridorAssessment.trustGating.passed ? '✓' : '✗'}</span>
                  <span style={{ fontWeight: 600 }}>Trust Gating: {corridorAssessment.trustGating.passed ? 'Passed' : 'Not Met'}</span>
                  {corridorAssessment.trustGating.isHighValue && <span style={styles.highValueBadge}>High Value</span>}
                </div>
                <div style={styles.trustDetails}>
                  <span>Buyer: {corridorAssessment.trustGating.actualBuyerTrust} (req: {corridorAssessment.trustGating.requiredBuyerTrust})</span>
                  <span>Traveler: {corridorAssessment.trustGating.actualTravelerTrust} (req: {corridorAssessment.trustGating.requiredTravelerTrust})</span>
                </div>
                {corridorAssessment.trustGating.downgradeReason && (
                  <div style={styles.downgradeReason}>⚠️ {corridorAssessment.trustGating.downgradeReason}</div>
                )}
              </div>
            )}

            {/* Escrow Recommendation */}
            <div style={styles.escrowRec}>
              <span style={styles.escrowIcon}>{corridorAssessment.escrowRecommendation.recommended ? '🛡️' : '○'}</span>
              <div>
                <div style={styles.escrowLabel}>
                  Escrow: {corridorAssessment.escrowRecommendation.recommended ? 'Recommended' : 'Optional'}
                </div>
                <div style={styles.escrowReason}>{corridorAssessment.escrowRecommendation.reason}</div>
                <div style={styles.escrowNote}>Note: Escrow is never enforced - your choice</div>
              </div>
            </div>

            {/* Warnings */}
            {corridorAssessment.warnings.length > 0 && (
              <div style={styles.warnings}>
                {corridorAssessment.warnings.map((w, i) => (
                  <div key={i} style={styles.warning}>⚠️ {w}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trust Scores */}
      {(buyerTrust || travelerTrust) && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Trust Scores</h4>
          <div style={styles.trustGrid}>
            {buyerTrust && (
              <div style={styles.trustCard}>
                <div style={styles.trustCardHeader}>Buyer</div>
                <div style={{ ...styles.trustScore, color: getTrustColor(buyerTrust.level) }}>{buyerTrust.score}/100</div>
                <div style={{ ...styles.trustLevel, backgroundColor: getTrustColor(buyerTrust.level) }}>{buyerTrust.level}</div>
              </div>
            )}
            {travelerTrust && (
              <div style={styles.trustCard}>
                <div style={styles.trustCardHeader}>Traveler</div>
                <div style={{ ...styles.trustScore, color: getTrustColor(travelerTrust.level) }}>{travelerTrust.score}/100</div>
                <div style={{ ...styles.trustLevel, backgroundColor: getTrustColor(travelerTrust.level) }}>{travelerTrust.level}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {riskAssessment && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Risk Assessment</h4>
          <div style={styles.riskCard}>
            <div style={styles.riskHeader}>
              <span style={{ ...styles.riskBadge, backgroundColor: getRiskColor(riskAssessment.overallRisk) }}>
                {riskAssessment.overallRisk}
              </span>
              <span style={styles.riskScore}>Score: {riskAssessment.riskScore}/100</span>
            </div>
            {riskAssessment.flags.length > 0 && (
              <div style={styles.riskFlags}>
                {riskAssessment.flags.slice(0, 3).map((flag, i) => (
                  <div key={i} style={styles.riskFlag}>
                    <span style={styles.flagCode}>{flag.code}</span>
                    <span style={styles.flagMessage}>{flag.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendation Lanes */}
      {recommendationLanes && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Recommendations</h4>
          <RecommendationLanes lanes={recommendationLanes} onOptionSelect={onOptionSelect} />
        </div>
      )}

      {/* Disclaimer */}
      <div style={styles.disclaimer}>
        ℹ️ This is an advisory panel only. No actions have been or will be executed automatically.
        All decisions require explicit user confirmation.
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', backgroundColor: '#f9fafb', marginTop: '16px' },
  header: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 600, fontSize: '16px' },
  aiIcon: { fontSize: '24px' },
  badge: { marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '12px' },
  correlationId: { fontSize: '10px', color: '#6b7280', fontFamily: 'monospace' },
  loading: { textAlign: 'center', padding: '40px', color: '#6b7280' },
  section: { marginBottom: '20px' },
  sectionTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' },
  corridorCard: { backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' },
  corridorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  corridorName: { fontWeight: 600, fontSize: '16px' },
  supportedBadge: { padding: '4px 10px', borderRadius: '4px', color: 'white', fontSize: '12px' },
  corridorStats: { display: 'flex', gap: '24px', marginBottom: '12px' },
  stat: { display: 'flex', flexDirection: 'column' },
  statLabel: { fontSize: '11px', color: '#6b7280' },
  statValue: { fontSize: '18px', fontWeight: 600 },
  trustGating: { padding: '12px', borderRadius: '6px', marginBottom: '12px' },
  trustGatingHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  highValueBadge: { padding: '2px 6px', backgroundColor: '#fbbf24', borderRadius: '4px', fontSize: '10px', fontWeight: 600 },
  trustDetails: { display: 'flex', gap: '16px', fontSize: '12px', color: '#4b5563' },
  downgradeReason: { marginTop: '8px', fontSize: '12px', color: '#b91c1c' },
  escrowRec: { display: 'flex', gap: '10px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' },
  escrowIcon: { fontSize: '20px' },
  escrowLabel: { fontWeight: 500, fontSize: '13px' },
  escrowReason: { fontSize: '12px', color: '#6b7280' },
  escrowNote: { fontSize: '11px', color: '#9ca3af', fontStyle: 'italic', marginTop: '4px' },
  warnings: { marginTop: '12px' },
  warning: { fontSize: '12px', color: '#b45309', padding: '4px 0' },
  trustGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  trustCard: { backgroundColor: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb', textAlign: 'center' },
  trustCardHeader: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
  trustScore: { fontSize: '28px', fontWeight: 700 },
  trustLevel: { display: 'inline-block', padding: '4px 12px', borderRadius: '4px', color: 'white', fontSize: '12px', marginTop: '4px' },
  riskCard: { backgroundColor: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' },
  riskHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  riskBadge: { padding: '6px 14px', borderRadius: '4px', color: 'white', fontSize: '13px', fontWeight: 600 },
  riskScore: { fontSize: '14px', color: '#6b7280' },
  riskFlags: { marginTop: '8px' },
  riskFlag: { display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid #f3f4f6' },
  flagCode: { fontSize: '11px', fontWeight: 600, color: '#b45309', minWidth: '120px' },
  flagMessage: { fontSize: '12px', color: '#4b5563' },
  disclaimer: { marginTop: '16px', padding: '12px', backgroundColor: '#dbeafe', borderRadius: '6px', fontSize: '12px', color: '#1e40af' },
};

export default CorridorAdvisoryPanel;
