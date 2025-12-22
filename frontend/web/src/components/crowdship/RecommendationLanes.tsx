/**
 * Recommendation Lanes Component
 * Sprint 2: Display "Why recommended", "Safer alternatives", "Higher risk allowed"
 * 
 * CONSTRAINTS:
 * - Advisory display only
 * - No execution
 * - User choice always allowed
 */

import React, { useState } from 'react';
import { RecommendationLanes as RecommendationLanesType, LaneOption } from '../../services/crowdship-ai.service';

interface RecommendationLanesProps {
  lanes: RecommendationLanesType | null;
  onOptionSelect?: (option: LaneOption, lane: 'recommended' | 'safer' | 'higherRisk') => void;
  isLoading?: boolean;
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
  MINIMAL: '#10b981',
};

const LANE_CONFIG = {
  recommended: { title: '✓ Recommended', color: '#22c55e', bgColor: '#f0fdf4', borderColor: '#86efac' },
  safer: { title: '🛡️ Safer Alternatives', color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#93c5fd' },
  higherRisk: { title: '⚠️ Higher Risk – Allowed if You Choose', color: '#f97316', bgColor: '#fff7ed', borderColor: '#fdba74' },
};

export const RecommendationLanes: React.FC<RecommendationLanesProps> = ({ lanes, onOptionSelect, isLoading = false }) => {
  const [expandedLane, setExpandedLane] = useState<string | null>('recommended');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <span style={styles.loadingIcon}>🔄</span>
          Analyzing options...
        </div>
      </div>
    );
  }

  if (!lanes) return null;

  const handleOptionClick = (option: LaneOption, lane: 'recommended' | 'safer' | 'higherRisk') => {
    setSelectedOption(option.action);
    onOptionSelect?.(option, lane);
  };

  const renderLaneOption = (option: LaneOption, lane: 'recommended' | 'safer' | 'higherRisk') => {
    const isSelected = selectedOption === option.action;
    const riskColor = RISK_COLORS[option.riskLevel] || '#6b7280';

    return (
      <div
        key={option.action}
        style={{ ...styles.option, borderColor: isSelected ? riskColor : '#e5e7eb', backgroundColor: isSelected ? '#f9fafb' : 'white' }}
        onClick={() => handleOptionClick(option, lane)}
        role="button"
        tabIndex={0}
      >
        <div style={styles.optionHeader}>
          <span style={styles.optionLabel}>{option.label}</span>
          <span style={{ ...styles.riskBadge, backgroundColor: riskColor }}>{option.riskLevel}</span>
        </div>
        <p style={styles.optionDesc}>{option.description}</p>
        {option.conditions.length > 0 && (
          <div style={styles.conditions}>
            {option.conditions.slice(0, 3).map((cond, i) => (
              <span key={i} style={styles.conditionTag}>• {cond}</span>
            ))}
          </div>
        )}
        {option.userChoiceAllowed && (
          <div style={styles.userChoice}>
            <span style={styles.checkIcon}>{isSelected ? '✓' : '○'}</span>
            <span>Select this option</span>
          </div>
        )}
      </div>
    );
  };

  const renderLane = (
    laneKey: 'recommended' | 'safer' | 'higherRisk',
    options: LaneOption[],
    config: typeof LANE_CONFIG.recommended
  ) => {
    if (options.length === 0) return null;
    const isExpanded = expandedLane === laneKey;

    return (
      <div style={{ ...styles.lane, backgroundColor: config.bgColor, borderColor: config.borderColor }}>
        <div style={styles.laneHeader} onClick={() => setExpandedLane(isExpanded ? null : laneKey)}>
          <span style={{ ...styles.laneTitle, color: config.color }}>{config.title}</span>
          <span style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <div style={styles.laneContent}>
            {options.map((opt) => renderLaneOption(opt, laneKey))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Why Recommended Panel */}
      {lanes.whyRecommended.length > 0 && (
        <div style={styles.whyPanel}>
          <div style={styles.whyHeader}>
            <span style={styles.whyIcon}>💡</span>
            <span style={styles.whyTitle}>Why This is Recommended</span>
          </div>
          <ul style={styles.whyList}>
            {lanes.whyRecommended.map((reason, i) => (
              <li key={i} style={styles.whyItem}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation Lanes */}
      <div style={styles.lanesContainer}>
        {renderLane('recommended', lanes.recommended, LANE_CONFIG.recommended)}
        {renderLane('safer', lanes.saferAlternatives, LANE_CONFIG.safer)}
        {renderLane('higherRisk', lanes.higherRiskAllowed, LANE_CONFIG.higherRisk)}
      </div>

      {/* Advisory Notice */}
      <div style={styles.advisory}>
        ℹ️ All options are advisory only. Your choice will not execute any actions automatically.
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { marginTop: '16px' },
  loading: { display: 'flex', alignItems: 'center', gap: '8px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', justifyContent: 'center' },
  loadingIcon: { animation: 'spin 1s linear infinite' },
  whyPanel: { backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: '8px', padding: '12px', marginBottom: '16px' },
  whyHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  whyIcon: { fontSize: '18px' },
  whyTitle: { fontWeight: 600, fontSize: '14px', color: '#854d0e' },
  whyList: { margin: 0, paddingLeft: '20px' },
  whyItem: { fontSize: '13px', color: '#713f12', marginBottom: '4px' },
  lanesContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  lane: { border: '1px solid', borderRadius: '8px', overflow: 'hidden' },
  laneHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', cursor: 'pointer' },
  laneTitle: { fontWeight: 600, fontSize: '14px' },
  expandIcon: { fontSize: '12px', color: '#6b7280' },
  laneContent: { padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  option: { border: '2px solid', borderRadius: '6px', padding: '12px', cursor: 'pointer', transition: 'all 0.15s' },
  optionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  optionLabel: { fontWeight: 600, fontSize: '14px' },
  riskBadge: { padding: '2px 8px', borderRadius: '4px', color: 'white', fontSize: '11px', fontWeight: 500 },
  optionDesc: { fontSize: '13px', color: '#4b5563', margin: '0 0 8px 0' },
  conditions: { display: 'flex', flexDirection: 'column', gap: '2px' },
  conditionTag: { fontSize: '11px', color: '#6b7280' },
  userChoice: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' },
  checkIcon: { fontSize: '14px', color: '#22c55e' },
  advisory: { marginTop: '12px', padding: '10px', backgroundColor: '#dbeafe', borderRadius: '6px', fontSize: '12px', color: '#1e40af' },
};

export default RecommendationLanes;
