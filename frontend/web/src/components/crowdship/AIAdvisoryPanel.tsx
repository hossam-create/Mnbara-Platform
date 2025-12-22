/**
 * AI Advisory Panel Component
 * Sprint 1: Display AI Core outputs in UI (read-only)
 * 
 * CONSTRAINTS:
 * - Display only - NO execution
 * - Advisory information only
 * - Explanations visible to users
 * - Feature-flagged
 */

import React from 'react';

// Types matching backend AI Core
export type TrustLevel = 'VERIFIED' | 'TRUSTED' | 'STANDARD' | 'NEW' | 'RESTRICTED';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
export type RecommendedAction = 'PROCEED' | 'PROCEED_WITH_ESCROW' | 'REQUIRE_VERIFICATION' | 'MANUAL_REVIEW' | 'DECLINE';

export interface TrustScoreResult {
  userId: string;
  role: 'BUYER' | 'TRAVELER';
  score: number;
  level: TrustLevel;
  factors: Array<{ name: string; weight: number; value: number; contribution: number; explanation: string }>;
  computedAt: string;
}

export interface RiskAssessmentResult {
  requestId: string;
  overallRisk: RiskLevel;
  riskScore: number;
  factors: Array<{ category: string; score: number; weight: number; description: string }>;
  flags: Array<{ code: string; severity: RiskLevel; message: string; recommendation: string }>;
  recommendations: string[];
  assessedAt: string;
}

export interface DecisionRecommendationResult {
  requestId: string;
  travelerId: string;
  action: RecommendedAction;
  confidence: number;
  reasoning: Array<{ step: number; factor: string; evaluation: string; impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' }>;
  warnings: string[];
  disclaimer: string;
  generatedAt: string;
}


interface AIAdvisoryPanelProps {
  buyerTrust?: TrustScoreResult | null;
  travelerTrust?: TrustScoreResult | null;
  riskAssessment?: RiskAssessmentResult | null;
  recommendation?: DecisionRecommendationResult | null;
  isLoading?: boolean;
  isEnabled?: boolean;
}

const getTrustLevelColor = (level: TrustLevel): string => {
  const colors: Record<TrustLevel, string> = {
    VERIFIED: '#22c55e',
    TRUSTED: '#3b82f6',
    STANDARD: '#f59e0b',
    NEW: '#6b7280',
    RESTRICTED: '#ef4444',
  };
  return colors[level];
};

const getRiskLevelColor = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    CRITICAL: '#dc2626',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
    MINIMAL: '#10b981',
  };
  return colors[level];
};

const getActionColor = (action: RecommendedAction): string => {
  const colors: Record<RecommendedAction, string> = {
    PROCEED: '#22c55e',
    PROCEED_WITH_ESCROW: '#3b82f6',
    REQUIRE_VERIFICATION: '#f59e0b',
    MANUAL_REVIEW: '#f97316',
    DECLINE: '#ef4444',
  };
  return colors[action];
};

const getImpactIcon = (impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'): string => {
  return impact === 'POSITIVE' ? '✓' : impact === 'NEGATIVE' ? '✗' : '○';
};

export const AIAdvisoryPanel: React.FC<AIAdvisoryPanelProps> = ({
  buyerTrust,
  travelerTrust,
  riskAssessment,
  recommendation,
  isLoading = false,
  isEnabled = true,
}) => {
  if (!isEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.aiIcon}>🤖</span>
          <span>AI Advisory</span>
        </div>
        <div style={styles.loading}>Loading AI analysis...</div>
      </div>
    );
  }

  if (!buyerTrust && !travelerTrust && !riskAssessment && !recommendation) {
    return null;
  }


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.aiIcon}>🤖</span>
        <span>AI Advisory</span>
        <span style={styles.badge}>Read-Only</span>
      </div>

      {/* Trust Scores Section */}
      {(buyerTrust || travelerTrust) && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Trust Scores</h4>
          <div style={styles.trustGrid}>
            {buyerTrust && (
              <div style={styles.trustCard}>
                <div style={styles.trustHeader}>Buyer</div>
                <div style={{ ...styles.trustScore, color: getTrustLevelColor(buyerTrust.level) }}>
                  {buyerTrust.score}/100
                </div>
                <div style={{ ...styles.trustLevel, backgroundColor: getTrustLevelColor(buyerTrust.level) }}>
                  {buyerTrust.level}
                </div>
                <div style={styles.factorsList}>
                  {buyerTrust.factors.slice(0, 3).map((f, i) => (
                    <div key={i} style={styles.factor}>
                      <span>{f.name.replace(/_/g, ' ')}</span>
                      <span>{Math.round(f.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {travelerTrust && (
              <div style={styles.trustCard}>
                <div style={styles.trustHeader}>Traveler</div>
                <div style={{ ...styles.trustScore, color: getTrustLevelColor(travelerTrust.level) }}>
                  {travelerTrust.score}/100
                </div>
                <div style={{ ...styles.trustLevel, backgroundColor: getTrustLevelColor(travelerTrust.level) }}>
                  {travelerTrust.level}
                </div>
                <div style={styles.factorsList}>
                  {travelerTrust.factors.slice(0, 3).map((f, i) => (
                    <div key={i} style={styles.factor}>
                      <span>{f.name.replace(/_/g, ' ')}</span>
                      <span>{Math.round(f.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Assessment Section */}
      {riskAssessment && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Risk Assessment</h4>
          <div style={styles.riskCard}>
            <div style={styles.riskHeader}>
              <span style={{ ...styles.riskLevel, backgroundColor: getRiskLevelColor(riskAssessment.overallRisk) }}>
                {riskAssessment.overallRisk}
              </span>
              <span style={styles.riskScore}>Score: {riskAssessment.riskScore}/100</span>
            </div>
            {riskAssessment.flags.length > 0 && (
              <div style={styles.flagsList}>
                {riskAssessment.flags.map((flag, i) => (
                  <div key={i} style={{ ...styles.flag, borderLeftColor: getRiskLevelColor(flag.severity) }}>
                    <div style={styles.flagCode}>{flag.code}</div>
                    <div style={styles.flagMessage}>{flag.message}</div>
                    <div style={styles.flagRecommendation}>💡 {flag.recommendation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Recommendation Section */}
      {recommendation && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Recommendation</h4>
          <div style={styles.recommendationCard}>
            <div style={styles.actionHeader}>
              <span style={{ ...styles.actionBadge, backgroundColor: getActionColor(recommendation.action) }}>
                {recommendation.action.replace(/_/g, ' ')}
              </span>
              <span style={styles.confidence}>
                {Math.round(recommendation.confidence * 100)}% confidence
              </span>
            </div>
            
            <div style={styles.reasoningList}>
              <h5 style={styles.reasoningTitle}>Reasoning</h5>
              {recommendation.reasoning.map((step, i) => (
                <div key={i} style={styles.reasoningStep}>
                  <span style={styles.stepIcon}>{getImpactIcon(step.impact)}</span>
                  <span style={styles.stepFactor}>{step.factor}:</span>
                  <span style={styles.stepEval}>{step.evaluation}</span>
                </div>
              ))}
            </div>

            {recommendation.warnings.length > 0 && (
              <div style={styles.warningsList}>
                <h5 style={styles.warningsTitle}>⚠️ Warnings</h5>
                {recommendation.warnings.map((warning, i) => (
                  <div key={i} style={styles.warning}>{warning}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={styles.disclaimer}>
        ℹ️ {recommendation?.disclaimer || 'This is an advisory recommendation only. No actions have been executed.'}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: '#f9fafb', marginTop: '16px' },
  header: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '16px' },
  aiIcon: { fontSize: '20px' },
  badge: { marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '12px' },
  loading: { textAlign: 'center', padding: '20px', color: '#6b7280' },
  section: { marginBottom: '16px' },
  sectionTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' },
  trustGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  trustCard: { backgroundColor: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' },
  trustHeader: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
  trustScore: { fontSize: '24px', fontWeight: 700 },
  trustLevel: { display: 'inline-block', padding: '2px 8px', borderRadius: '4px', color: 'white', fontSize: '11px', marginTop: '4px' },
  factorsList: { marginTop: '8px', fontSize: '11px' },
  factor: { display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#6b7280' },
  riskCard: { backgroundColor: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' },
  riskHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  riskLevel: { padding: '4px 12px', borderRadius: '4px', color: 'white', fontSize: '12px', fontWeight: 600 },
  riskScore: { fontSize: '14px', color: '#6b7280' },
  flagsList: { marginTop: '8px' },
  flag: { padding: '8px', marginBottom: '8px', backgroundColor: '#fef3c7', borderLeft: '3px solid', borderRadius: '4px' },
  flagCode: { fontSize: '11px', fontWeight: 600, color: '#92400e' },
  flagMessage: { fontSize: '12px', marginTop: '2px' },
  flagRecommendation: { fontSize: '11px', color: '#6b7280', marginTop: '4px' },
  recommendationCard: { backgroundColor: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' },
  actionHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  actionBadge: { padding: '6px 16px', borderRadius: '4px', color: 'white', fontSize: '14px', fontWeight: 600 },
  confidence: { fontSize: '14px', color: '#6b7280' },
  reasoningList: { marginTop: '12px' },
  reasoningTitle: { fontSize: '12px', fontWeight: 600, marginBottom: '8px' },
  reasoningStep: { display: 'flex', gap: '8px', padding: '4px 0', fontSize: '12px' },
  stepIcon: { width: '16px' },
  stepFactor: { fontWeight: 500, minWidth: '100px' },
  stepEval: { color: '#6b7280' },
  warningsList: { marginTop: '12px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '4px' },
  warningsTitle: { fontSize: '12px', fontWeight: 600, marginBottom: '4px' },
  warning: { fontSize: '11px', padding: '2px 0' },
  disclaimer: { marginTop: '12px', padding: '8px', backgroundColor: '#dbeafe', borderRadius: '4px', fontSize: '11px', color: '#1e40af' },
};

export default AIAdvisoryPanel;
