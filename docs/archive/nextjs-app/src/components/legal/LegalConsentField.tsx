'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { LegalSlug } from '@/data/legalPages';
import { legalModalPreviews } from '@/data/legalPages';
import { logLegalConsent } from '@/lib/audit/controlAudit';
import styles from './LegalConsentField.module.css';

type LegalConsentFieldProps = {
  legalSlug: LegalSlug;
  actionLabel: string;
  onConsentChange?: (accepted: boolean) => void;
  userId?: string;
  pagePath: string;
};

export function LegalConsentField({
  legalSlug,
  actionLabel,
  onConsentChange,
  userId = 'anonymous',
  pagePath,
}: LegalConsentFieldProps) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const preview = legalModalPreviews[legalSlug];

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextChecked = event.target.checked;
    setChecked(nextChecked);
    onConsentChange?.(nextChecked);

    if (!nextChecked) {
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await logLegalConsent({
        userId,
        page: pagePath,
        legalSlug,
      });
    } catch (err) {
      setError('Could not record consent. Please try again.');
      setChecked(false);
      onConsentChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.checkboxRow}>
        <input
          id={`${legalSlug}-consent`}
          type="checkbox"
          className={styles.checkbox}
          checked={checked}
          onChange={handleChange}
          required
        />
        <label htmlFor={`${legalSlug}-consent`}>
          {actionLabel}
        </label>
      </div>

      <div className={styles.actions}>
        <Link href={`/legal/${legalSlug}`} target="_blank" className={styles.link}>
          View full policy ↗
        </Link>
        <button
          type="button"
          className={styles.modalButton}
          onClick={() => {
            setShowModal(true);
          }}
        >
          Read summary
        </button>
      </div>

      {error && <p role="alert">{error}</p>}

      {showModal && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <h3 className={styles.modalHeading}>Before you continue</h3>
            <p className={styles.modalBody}>{preview.previewEn}</p>
            <p className={styles.modalBody} dir="rtl" lang="ar">
              {preview.previewAr}
            </p>
            <div className={styles.modalFooter}>
              <Link href={`/legal/${legalSlug}`} className={styles.link} target="_blank">
                Open full legal page ↗
              </Link>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => {
                  setShowModal(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p>Recording acceptance…</p>}
    </div>
  );
}
