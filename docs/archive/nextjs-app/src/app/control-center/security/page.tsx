import styles from './security.module.css';
import { KpiCard, Panel, StatusChip, Timeline } from '@/components/control-center/ControlWidgets';

const kpis = [
  { icon: '🛡️', label: 'Active shields', value: '5/7', trend: { value: '2 warming', direction: 'down' as const } },
  { icon: '🚨', label: 'Open incidents', value: '4', trend: { value: '-1 vs 24h' } },
  { icon: '📡', label: 'Signals ingest', value: '146/sec', trend: { value: '+8%', direction: 'up' as const } },
];

const threats = [
  {
    title: 'ASN cluster mimicking trusted devices',
    desc: 'Three devices cloned BRIDGE_OPERATOR fingerprints from the same ASN. Hardware challenge enforced.',
    severity: 'critical',
    playbook: 'Device clamp + kill switch ready',
  },
  {
    title: 'Traveler payout reroute attempt',
    desc: 'Finance Controller token intercepted but blocked by dual approval guard.',
    severity: 'warning',
    playbook: 'Escalate to compliance',
  },
  {
    title: 'Keycloak realm drift detected',
    desc: 'New SAML integration requested without SRE signature.',
    severity: 'warning',
    playbook: 'Pending engineering sign-off',
  },
];

const intel = [
  {
    headline: 'Wazuh flagged new bash history artifacts on Ops jump box',
    detail: 'Patch window scheduled with SRE.',
  },
  {
    headline: 'Grafana guardrail: corridor latency spike in Lagos edge',
    detail: 'Auto throttled traveler auto-approval.',
  },
  {
    headline: 'OpenSearch audit log ingestion healthy',
    detail: 'No gaps detected last 24h.',
  },
];

const playbooks = [
  {
    name: 'Bridge kill switch',
    scope: 'Disables payments + traveler onboarding in <90s',
    status: 'Tested 3h ago',
  },
  {
    name: 'Traveler identity breach',
    scope: 'Locks device tokens, rotates escrow keys, alerts founders',
    status: 'Ready',
  },
  {
    name: 'Finance dual attestation failure',
    scope: 'Quorum override requires Super Admin',
    status: 'Pending simulation',
  },
];

const timeline = [
  {
    title: 'Incident SEC-441 restored shields',
    detail: 'SRE redeployed risk-scoring lambda after drift alert.',
    timestamp: '08:11 UTC',
  },
  {
    title: 'Threat hunt completed',
    detail: 'Zero malware indicators in Cairo HQ subnet.',
    timestamp: '04:39 UTC',
  },
  {
    title: 'Key escrow rotated',
    detail: 'Compliance Officer + Security Officer dual sign-off.',
    timestamp: '01:12 UTC',
  },
];

export default function SecurityPage() {
  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.panels}>
        <Panel title="Threat queue" subtitle="Ordered by blast radius">
          <div className={styles.threatList}>
            {threats.map((threat) => (
              <div key={threat.title} className={styles.threatItem}>
                <h4>{threat.title}</h4>
                <p>{threat.desc}</p>
                <StatusChip label={threat.playbook} tone={threat.severity as 'critical' | 'warning' | 'healthy'} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Signals & intel" subtitle="Feeds from Wazuh • Grafana • OpenSearch">
          <div className={styles.intelGrid}>
            {intel.map((item) => (
              <div key={item.headline} className={styles.intelCard}>
                <strong>{item.headline}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Playbooks" subtitle="Human-in-the-loop runbooks">
        <div className={styles.playbookList}>
          {playbooks.map((playbook) => (
            <div key={playbook.name} className={styles.playbook}>
              <header>
                <strong>{playbook.name}</strong>
                <StatusChip
                  label={playbook.status}
                  tone={playbook.status === 'Pending simulation' ? 'warning' : 'healthy'}
                />
              </header>
              <p>{playbook.scope}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Security command log" subtitle="Latest enforced actions">
        <Timeline items={timeline} />
      </Panel>
    </div>
  );
}
