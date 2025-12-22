import Link from 'next/link';
import { ActionConsentGate } from '@/components/legal/ActionConsentGate';
import styles from './page.module.css';

export default function RegisterPage() {
  return (
    <div className={styles.root}>
      <div className={styles.panel}>
        <h1 className={styles.heading}>Create your Mnbarh profile</h1>
        <p className={styles.copy}>
          Mnbarh profiles unlock trusted exchanges between seekers and travelers. Identity verification takes cues
          from eBay’s onboarding so every action stays manual and auditable.
        </p>
        <div className={styles.inset}>
          <div className={styles.stub} />
          <div className={styles.stub} />
          <div className={styles.stub} />
          <div className={styles.ctaStub} />
        </div>

        <ActionConsentGate
          legalSlug="user-agreement"
          description="To proceed, acknowledge the Mnbarh User Agreement mirroring eBay’s marketplace rules."
          buttonLabel="Continue to profile setup"
          buttonHref="/request"
          pagePath="/register"
        />

        <p className={styles.meta}>
          Already part of the collective?{' '}
          <Link href="/login" className={styles.metaLink}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
