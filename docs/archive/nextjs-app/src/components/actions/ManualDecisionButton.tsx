'use client';

import { useState } from 'react';
import { evaluateTrustRules, type TrustInput } from '@/services/trust/trust_rules.service';
import { logManualDecision } from '@/lib/audit/controlAudit';
import styles from './ManualDecisionButton.module.css';

type ManualDecisionButtonProps = {
  actionLabel: string;
  actionName: string;
  userId: string;
  trustInput: TrustInput;
};

export function ManualDecisionButton({ actionLabel, actionName, userId, trustInput }: ManualDecisionButtonProps) {
  const decision = evaluateTrustRules(trustInput);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setStatusMessage(null);
    try {
      await logManualDecision({
        userId,
        action: actionName,
        confirmedBy: 'human',
      });
      setStatusMessage('Decision logged. Proceed manually with your chosen workflow.');
      setModalOpen(false);
    } catch (error) {
      setStatusMessage('Could not log decision. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.root}>
      {decision.warnings.length > 0 && (
        <ul className={styles.warningList}>
          {decision.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {decision.blocks.length > 0 && (
        <ul className={styles.warningList}>
          {decision.blocks.map((block) => (
            <li key={block}>{block}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className={styles.button}
        onClick={() => setModalOpen(true)}
        disabled={decision.blocks.length > 0}
      >
        {actionLabel}
      </button>

      {statusMessage && <p className={styles.status}>{statusMessage}</p>}

      {modalOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Manual confirmation required</h3>
            <p>{decision.advisory}</p>
            <p>
              Action: <strong>{actionName}</strong>
            </p>
            {decision.warnings.length > 0 && (
              <ul className={styles.warningList}>
                {decision.warnings.map((warning) => (
                  <li key={`modal-${warning}`}>{warning}</li>
                ))}
              </ul>
            )}
            {decision.blocks.length > 0 && (
              <ul className={styles.warningList}>
                {decision.blocks.map((block) => (
                  <li key={`modal-block-${block}`}>{block}</li>
                ))}
              </ul>
            )}
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancel} onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirm}
                onClick={handleConfirm}
                disabled={submitting || decision.blocks.length > 0}
              >
                {submitting ? 'Logging…' : 'Confirm & log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
