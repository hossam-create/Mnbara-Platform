'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { LegalSlug } from '@/data/legalPages';
import { LegalConsentField } from './LegalConsentField';
import styles from './ActionConsentGate.module.css';

type ActionConsentGateProps = {
  legalSlug: LegalSlug;
  description: string;
  buttonLabel: string;
  buttonHref?: string;
  onProceed?: () => void;
  pagePath: string;
  userId?: string;
};

export function ActionConsentGate({
  legalSlug,
  description,
  buttonLabel,
  buttonHref,
  onProceed,
  pagePath,
  userId,
}: ActionConsentGateProps) {
  const [accepted, setAccepted] = useState(false);

  const handleBlockedClick = (event: React.MouseEvent) => {
    if (!accepted) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onProceed?.();
  };

  return (
    <div className={styles.root}>
      <p className={styles.description}>{description}</p>
      <LegalConsentField
        legalSlug={legalSlug}
        actionLabel="I have read and agree to this policy"
        onConsentChange={setAccepted}
        pagePath={pagePath}
        userId={userId}
      />

      {buttonHref ? (
        <Link
          href={buttonHref}
          className={styles.primaryButton}
          aria-disabled={!accepted}
          tabIndex={accepted ? 0 : -1}
          onClick={handleBlockedClick}
        >
          {buttonLabel}
        </Link>
      ) : (
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!accepted}
          onClick={handleBlockedClick}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
