import { fetchApi } from '@/lib/serverApi';
import { AutomationSuggestion, AutomationReport } from '@/services/ops/automation_advisor';
import styles from './page.module.css';

export const metadata = {
  title: 'Operational Suggestions | Mnbarh Trust Ops',
};

const typeCopy: Record<AutomationSuggestion['type'], string> = {
  delivery_overdue: 'Delivery Overdue Alert',
  buyer_inactive: 'Buyer Reminder',
  risk_flag: 'Trust & Safety Flag',
};

const severityCopy: Record<AutomationSuggestion['severity'], string> = {
  low: 'Low urgency — monitor',
  medium: 'Medium — respond within 24h',
  high: 'High — escalate now',
};

async function loadSuggestions() {
  return fetchApi<AutomationReport>('/api/ops/suggestions', {
    next: { revalidate: 60 },
  });
}

export default async function OpsSuggestionsPage() {
  const report = await loadSuggestions();

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <p className={styles.kicker}>Ops advisory only</p>
        <h1 className={styles.title}>Faster operations without losing human control</h1>
        <p className={styles.subtitle}>
          These signals are auto-generated timers, reminders, and risk flags. They never release funds, ban accounts,
          or resolve disputes — every card below is a suggestion that still needs a human click.
        </p>
      </div>

      <section className={styles.summaryBar}>
        <span className={styles.timestamp}>Generated at {new Date(report.generatedAt).toLocaleString()}</span>
        <div className={styles.badgeRow}>
          <span className={styles.badge}>Auto-status</span>
          <span className={styles.badge}>Auto-reminder draft</span>
          <span className={styles.badge}>Manual release only</span>
        </div>
      </section>

      <div className={styles.suggestionsGrid}>
        {report.suggestions.map((suggestion) => (
          <article key={suggestion.id} className={styles.card}>
            <header className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{typeCopy[suggestion.type]}</h2>
              <span className={styles.typePill}>{suggestion.type.replace('_', ' ')}</span>
            </header>
            <p className={styles.severity}>{severityCopy[suggestion.severity]}</p>
            <p className={styles.summary}>{suggestion.summary}</p>
            <div className={styles.recommended}>
              <p>{suggestion.recommendedAction}</p>
              <p className={styles.manualReminder}>Manual confirmation required</p>
            </div>
            <ul className={styles.metaList}>
              <li>Order: {suggestion.orderId}</li>
              {'metadata' in suggestion &&
                Object.entries(suggestion.metadata).map(([key, value]) => (
                  <li key={`${suggestion.id}-${key}`}>
                    {key}: {String(value)}
                  </li>
                ))}
              <li>Corridor risk: {suggestion.corridorRisk}</li>
            </ul>
            {suggestion.timer && (
              <p className={styles.timer}>
                Triggered {new Date(suggestion.timer.triggeredAt).toLocaleString()} · next reminder{' '}
                {new Date(suggestion.timer.nextReminderAt).toLocaleString()}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
