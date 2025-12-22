/**
 * Confirmation Checkpoint Component
 * Sprint 2: Human confirmation required before actions
 * 
 * CONSTRAINTS:
 * - NO background actions
 * - Explicit user confirmation required
 * - All checkpoints logged for audit
 */

import React, { useState } from 'react';
import { HumanConfirmationCheckpoint, recordConfirmation } from '../../services/crowdship-ai.service';

interface ConfirmationCheckpointProps {
  checkpoint: HumanConfirmationCheckpoint;
  onConfirm: (checkpointId: string, confirmed: boolean) => void;
  onCancel?: () => void;
  isProcessing?: boolean;
}

const CHECKPOINT_ICONS: Record<string, string> = {
  CONTACT_TRAVELER: '📨',
  SELECT_PAYMENT: '💳',
  PROCEED_CROSS_BORDER: '🌍',
};

const CHECKPOINT_COLORS: Record<string, { bg: string; border: string; accent: string }> = {
  CONTACT_TRAVELER: { bg: '#eff6ff', border: '#3b82f6', accent: '#1d4ed8' },
  SELECT_PAYMENT: { bg: '#f0fdf4', border: '#22c55e', accent: '#15803d' },
  PROCEED_CROSS_BORDER: { bg: '#fef3c7', border: '#f59e0b', accent: '#b45309' },
};

export const ConfirmationCheckpoint: React.FC<ConfirmationCheckpointProps> = ({
  checkpoint,
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = CHECKPOINT_COLORS[checkpoint.type] || CHECKPOINT_COLORS.CONTACT_TRAVELER;
  const icon = CHECKPOINT_ICONS[checkpoint.type] || '✓';

  const handleConfirm = async () => {
    if (!isChecked || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await recordConfirmation(checkpoint.checkpointId, true);
      onConfirm(checkpoint.checkpointId, true);
    } catch (error) {
      console.error('Failed to record confirmation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      await recordConfirmation(checkpoint.checkpointId, false);
      onConfirm(checkpoint.checkpointId, false);
    } catch (error) {
      console.error('Failed to record decline:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ ...styles.container, backgroundColor: colors.bg, borderColor: colors.border }}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.icon}>{icon}</span>
        <div style={styles.headerContent}>
          <h3 style={{ ...styles.title, color: colors.accent }}>{checkpoint.title}</h3>
          <p style={styles.description}>{checkpoint.description}</p>
        </div>
      </div>

      {/* Warnings */}
      {checkpoint.warnings.length > 0 && (
        <div style={styles.warningsSection}>
          <div style={styles.warningsHeader}>⚠️ Please note:</div>
          <ul style={styles.warningsList}>
            {checkpoint.warnings.map((warning, i) => (
              <li key={i} style={styles.warningItem}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirmation Checkbox */}
      {checkpoint.requiredConfirmation && (
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            style={styles.checkbox}
            disabled={isProcessing || isSubmitting}
          />
          <span style={styles.checkboxText}>{checkpoint.confirmationText}</span>
        </label>
      )}

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button
          style={{ ...styles.button, ...styles.cancelButton }}
          onClick={onCancel || handleDecline}
          disabled={isProcessing || isSubmitting}
        >
          Cancel
        </button>
        <button
          style={{
            ...styles.button,
            ...styles.confirmButton,
            backgroundColor: colors.accent,
            opacity: (!isChecked && checkpoint.requiredConfirmation) || isSubmitting ? 0.5 : 1,
          }}
          onClick={handleConfirm}
          disabled={(!isChecked && checkpoint.requiredConfirmation) || isProcessing || isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Confirm & Continue'}
        </button>
      </div>

      {/* Audit Notice */}
      <div style={styles.auditNotice}>
        🔒 This confirmation will be logged for audit purposes
      </div>
    </div>
  );
};

interface ConfirmationCheckpointListProps {
  checkpoints: HumanConfirmationCheckpoint[];
  onAllConfirmed: () => void;
  onCancel: () => void;
}

export const ConfirmationCheckpointList: React.FC<ConfirmationCheckpointListProps> = ({
  checkpoints,
  onAllConfirmed,
  onCancel,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  if (checkpoints.length === 0) {
    onAllConfirmed();
    return null;
  }

  const currentCheckpoint = checkpoints[currentIndex];
  const progress = ((currentIndex + 1) / checkpoints.length) * 100;

  const handleConfirm = (checkpointId: string, confirmed: boolean) => {
    if (!confirmed) {
      onCancel();
      return;
    }

    const newConfirmed = new Set(confirmedIds);
    newConfirmed.add(checkpointId);
    setConfirmedIds(newConfirmed);

    if (currentIndex < checkpoints.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onAllConfirmed();
    }
  };

  return (
    <div style={styles.listContainer}>
      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <span style={styles.progressText}>
          Step {currentIndex + 1} of {checkpoints.length}
        </span>
      </div>

      {/* Current Checkpoint */}
      <ConfirmationCheckpoint
        checkpoint={currentCheckpoint}
        onConfirm={handleConfirm}
        onCancel={onCancel}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { border: '2px solid', borderRadius: '12px', padding: '20px', maxWidth: '500px' },
  header: { display: 'flex', gap: '12px', marginBottom: '16px' },
  icon: { fontSize: '32px' },
  headerContent: { flex: 1 },
  title: { margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 },
  description: { margin: 0, fontSize: '14px', color: '#4b5563' },
  warningsSection: { backgroundColor: '#fef3c7', borderRadius: '8px', padding: '12px', marginBottom: '16px' },
  warningsHeader: { fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#92400e' },
  warningsList: { margin: 0, paddingLeft: '20px' },
  warningItem: { fontSize: '13px', color: '#78350f', marginBottom: '4px' },
  checkboxLabel: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px', cursor: 'pointer' },
  checkbox: { marginTop: '2px', width: '18px', height: '18px', cursor: 'pointer' },
  checkboxText: { fontSize: '14px', color: '#374151', lineHeight: 1.4 },
  actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  button: { padding: '10px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'opacity 0.15s' },
  cancelButton: { backgroundColor: '#f3f4f6', color: '#374151' },
  confirmButton: { color: 'white' },
  auditNotice: { marginTop: '12px', fontSize: '11px', color: '#6b7280', textAlign: 'center' },
  listContainer: {},
  progressContainer: { marginBottom: '16px' },
  progressBar: { height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.3s ease' },
  progressText: { fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block', textAlign: 'center' },
};

export default ConfirmationCheckpoint;
