import { ActionConsentGate } from '@/components/legal/ActionConsentGate';
import styles from './page.module.css';

const steps = [
  {
    label: 'Step 01',
    title: 'Confirm identity documents',
    copy: 'Upload a government ID plus a secondary document (passport, license, or residency card). Mnbarh mirrors eBay’s identity checks to preserve marketplace trust.',
  },
  {
    label: 'Step 02',
    title: 'Record a live selfie',
    copy: 'We compare biometric markers with your submitted ID. Video is stored with layered encryption and deleted after verification.',
  },
  {
    label: 'Step 03',
    title: 'Validate payout details',
    copy: 'Provide IBAN or PayPal credentials so escrow releases remain auditable. Funds stay locked until seekers confirm delivery.',
  },
];

export default function KycPage() {
  return (
    <div className={styles.root}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>Traveler verification</p>
          <h1 className={styles.title}>Complete Mnbarh KYC</h1>
          <p className={styles.subtitle}>
            Mnbarh enforces eBay-grade identity controls. Every traveler manually acknowledges the Privacy, Cookies, and Trust policies before payouts are enabled.
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.stepsGrid}>
            {steps.map((step) => (
              <article key={step.title} className={styles.stepCard}>
                <p className={styles.stepLabel}>{step.label}</p>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepBody}>{step.copy}</p>
              </article>
            ))}
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelHeading}>Consent is mandatory</h3>
            <p className={styles.panelCopy}>
              Before we collect KYC evidence, confirm that you&apos;ve read Mnbarh&apos;s Privacy Policy and Trust & Guarantee program. This mirrors the modal workflow on eBay&apos;s seller onboarding.
            </p>

            <ActionConsentGate
              legalSlug="privacy"
              description="Consent to Mnbarh’s privacy practices before submitting identity documents."
              buttonLabel="I consent to data processing"
              buttonHref="/kyc/upload"
              pagePath="/kyc"
            />

            <ActionConsentGate
              legalSlug="trust-and-guarantee"
              description="Acknowledge Mnbarh’s Trust & Guarantee so payouts remain escrowed until seekers sign off."
              buttonLabel="Proceed to traveler screening"
              buttonHref="/kyc/upload"
              pagePath="/kyc"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
