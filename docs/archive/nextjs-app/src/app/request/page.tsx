import Link from 'next/link';
import { ActionConsentGate } from '@/components/legal/ActionConsentGate';
import { ManualDecisionButton } from '@/components/actions/ManualDecisionButton';
import styles from './page.module.css';

const processSteps = [
  {
    label: 'Step 01',
    title: 'Outline what you need',
    copy: 'Share product details, sizing, and any packaging notes. Mnbarh rewards clarity.',
  },
  {
    label: 'Step 02',
    title: 'Set the traveler reward',
    copy: 'Add your delivery window and the thank-you amount. The better the brief, the faster offers arrive.',
  },
  {
    label: 'Step 03',
    title: 'Approve the perfect courier',
    copy: 'Review traveler badges, ratings, and travel itineraries before confirming the match.',
  },
];

export default function RequestPage() {
  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>Create a request</p>
          <h1 className={styles.title}>Brief travelers with confidence</h1>
          <p className={styles.subtitle}>
            Mnbarh empowers you to craft requests that travelers trust. Provide the details, choose your
            reward, and our verified community takes care of the journey.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.processGrid}>
            {processSteps.map((step) => (
              <article key={step.title} className={styles.processCard}>
                <span className={styles.processLabel}>{step.label}</span>
                <h2 className={styles.processTitle}>{step.title}</h2>
                <p className={styles.processBody}>{step.copy}</p>
              </article>
            ))}
          </div>

          <aside className={styles.aside}>
            <h3 className={styles.asideHeading}>Need inspiration?</h3>
            <p className={styles.asideCopy}>
              Browse live requests to see what resonates with travelers, then tailor your own. We recommend
              attaching reference images or product links whenever possible.
            </p>
            <div className={styles.actionRow}>
              <Link href="/browse" className={styles.secondaryButton}>
                View live collections
              </Link>
              <Link href="/request/create" className={styles.primaryButton}>
                Start your request
              </Link>
            </div>
            <div className={styles.legalGate}>
              <ActionConsentGate
                legalSlug="dispute-policy"
                description="Confirm you’ve reviewed Mnbarh’s dispute ladder before launching a request — mirroring eBay’s order confirmation gating."
                buttonLabel="I will follow the dispute policy"
                buttonHref="/request/create"
                pagePath="/request"
              />
            </div>
            <div className={styles.manualCheckpoint}>
              <p className={styles.manualHint}>
                Manual checkpoint — the system may advise, but only you can confirm. This action is audited.
              </p>
              <ManualDecisionButton
                actionLabel="Log manual confirmation"
                actionName="request_manual_confirmation"
                userId="anonymous"
                trustInput={{
                  declaredValueUSD: 300,
                  corridorRisk: 'high',
                  travelerTrustScore: 0.4,
                }}
              />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
