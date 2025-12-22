/**
 * Intent Chip Component
 * Sprint 2: Editable intent classification display
 * 
 * CONSTRAINTS:
 * - Read-only advisory display
 * - Editable when feature flag enabled
 * - No execution - display only
 */

import React, { useState } from 'react';
import { MarketIntent, MarketIntentResult } from '../../services/crowdship-ai.service';

interface IntentChipProps {
  intent: MarketIntentResult | null;
  onIntentChange?: (newIntent: MarketIntent) => void;
  isEditable?: boolean;
  isLoading?: boolean;
}

const INTENT_CONFIG: Record<MarketIntent, { label: string; color: string; icon: string; description: string }> = {
  BUY_FROM_ABROAD: { label: 'Buy from Abroad', color: '#3b82f6', icon: '🌍', description: 'Purchase item from international seller' },
  TRAVEL_MATCH: { label: 'Travel Match', color: '#8b5cf6', icon: '✈️', description: 'Match with traveler for delivery' },
  PRICE_VERIFY: { label: 'Price Verify', color: '#f59e0b', icon: '💰', description: 'Verify pricing before purchase' },
  BROWSE: { label: 'Browsing', color: '#6b7280', icon: '👀', description: 'Exploring options' },
  UNKNOWN: { label: 'Unknown', color: '#9ca3af', icon: '❓', description: 'Intent not determined' },
};

const ALL_INTENTS: MarketIntent[] = ['BUY_FROM_ABROAD', 'TRAVEL_MATCH', 'PRICE_VERIFY', 'BROWSE', 'UNKNOWN'];

export const IntentChip: React.FC<IntentChipProps> = ({ intent, onIntentChange, isEditable = false, isLoading = false }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<MarketIntent>(intent?.intent || 'UNKNOWN');

  if (isLoading) {
    return (
      <div style={styles.chip}>
        <span style={styles.loadingDot}>●</span>
        <span>Analyzing intent...</span>
      </div>
    );
  }

  if (!intent) return null;

  const config = INTENT_CONFIG[selectedIntent];
  const canEdit = isEditable && intent.editable;

  const handleIntentSelect = (newIntent: MarketIntent) => {
    setSelectedIntent(newIntent);
    setIsDropdownOpen(false);
    onIntentChange?.(newIntent);
  };

  return (
    <div style={styles.container}>
      <div
        style={{ ...styles.chip, backgroundColor: config.color, cursor: canEdit ? 'pointer' : 'default' }}
        onClick={() => canEdit && setIsDropdownOpen(!isDropdownOpen)}
        role={canEdit ? 'button' : undefined}
        tabIndex={canEdit ? 0 : undefined}
      >
        <span style={styles.icon}>{config.icon}</span>
        <span style={styles.label}>{config.label}</span>
        {canEdit && <span style={styles.editIcon}>▼</span>}
      </div>

      {/* Confidence indicator */}
      <div style={styles.confidenceBar}>
        <div style={{ ...styles.confidenceFill, width: `${intent.confidence * 100}%`, backgroundColor: config.color }} />
      </div>
      <span style={styles.confidenceText}>{intent.confidenceLevel} confidence ({Math.round(intent.confidence * 100)}%)</span>

      {/* Dropdown for editing */}
      {isDropdownOpen && canEdit && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>Change Intent Classification</div>
          {ALL_INTENTS.map((intentOption) => {
            const optConfig = INTENT_CONFIG[intentOption];
            return (
              <div
                key={intentOption}
                style={{ ...styles.dropdownItem, backgroundColor: selectedIntent === intentOption ? '#f3f4f6' : 'white' }}
                onClick={() => handleIntentSelect(intentOption)}
              >
                <span style={styles.optionIcon}>{optConfig.icon}</span>
                <div style={styles.optionContent}>
                  <div style={styles.optionLabel}>{optConfig.label}</div>
                  <div style={styles.optionDesc}>{optConfig.description}</div>
                </div>
              </div>
            );
          })}
          <div style={styles.dropdownFooter}>
            ℹ️ Changing intent is advisory only - no actions will be executed
          </div>
        </div>
      )}

      {/* Signal breakdown */}
      {intent.signals.length > 0 && (
        <div style={styles.signals}>
          <span style={styles.signalsLabel}>Signals:</span>
          {intent.signals.map((signal, i) => (
            <span key={i} style={styles.signalTag}>
              {signal.source}: {signal.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { position: 'relative', display: 'inline-block' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '16px', color: 'white', fontSize: '13px', fontWeight: 500 },
  icon: { fontSize: '14px' },
  label: {},
  editIcon: { fontSize: '10px', marginLeft: '4px' },
  loadingDot: { animation: 'pulse 1s infinite' },
  confidenceBar: { height: '3px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' },
  confidenceFill: { height: '100%', transition: 'width 0.3s ease' },
  confidenceText: { fontSize: '11px', color: '#6b7280', marginTop: '2px', display: 'block' },
  dropdown: { position: 'absolute', top: '100%', left: 0, marginTop: '8px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '280px' },
  dropdownHeader: { padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: 600, color: '#374151' },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', transition: 'background-color 0.15s' },
  optionIcon: { fontSize: '18px' },
  optionContent: { flex: 1 },
  optionLabel: { fontSize: '13px', fontWeight: 500 },
  optionDesc: { fontSize: '11px', color: '#6b7280' },
  dropdownFooter: { padding: '10px 12px', borderTop: '1px solid #e5e7eb', fontSize: '11px', color: '#6b7280', backgroundColor: '#f9fafb' },
  signals: { marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' },
  signalsLabel: { fontSize: '11px', color: '#6b7280' },
  signalTag: { fontSize: '10px', padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px', color: '#4b5563' },
};

export default IntentChip;
