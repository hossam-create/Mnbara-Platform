import styles from './control-center.module.css';
import { KpiCard, Panel, StatusChip, Timeline } from '@/components/control-center/ControlWidgets';

const kpis = [
  { icon: '🛰️', label: 'Corridors Online', value: '12', trend: { value: '+2 today' } },
  { icon: '⚡', label: 'Live Alerts', value: '8', trend: { value: '+3 vs avg', direction: 'down' as const } },
  { icon: '🛡️', label: 'Risk Dials', value: 'Moderate', trend: { value: '↺ recalib. 3m' } },
  { icon: '📦', label: 'Active Missions', value: '143', trend: { value: '+18', direction: 'up' as const } },
] as const;

const alerts = [
  {
    title: 'New Corridor Spike',
    detail: 'Riyadh → Cairo ops up 34% in last 2h. Verify staffing & KYC load.',
    badge: 'Ops',
    tone: 'warning',
  },
  {
    title: 'Traveler Device Drift',
    detail: '3 trusted travelers triggered new-device risk in the same ASN.',
    badge: 'Security',
    tone: 'critical',
  },
  {
    title: 'Guarantee Pool',
    detail: 'EGP wallet drawdown reached 72% utilization. Top up recommended.',
    badge: 'Finance',
    tone: 'warning',
  },
];

const disputeRows = [
  {
    id: 'DSP-341',
    buyer: 'Nada K.',
    traveler: 'TRV-442',
    age: '3h',
    status: 'Awaiting evidence',
  },
  {
    id: 'DSP-332',
    buyer: 'Omar R.',
    traveler: 'TRV-319',
    age: '8h',
    status: 'Panel voting',
  },
  {
    id: 'DSP-327',
    buyer: 'Sarah W.',
    traveler: 'TRV-112',
    age: '22h',
    status: 'Escalated',
  },
];

const timeline = [
  {
    title: 'Kill switch rehearsal succeeded',
    detail: 'Operations and Security jointly rehearsed corridor shutdown playbook.',
    timestamp: '07:32 UTC • ORCH-21',
  },
  {
    title: 'Dual approval: Guarantee refund',
    detail: 'Finance Controller + Compliance Officer approved 48K EGP payout.',
    timestamp: '05:17 UTC • FIN-09',
  },
  {
    title: 'IAM policy change deployed',
    detail: 'Keycloak realm enforced hardware MFA for Finance Controller role.',
    timestamp: '01:04 UTC • SEC-57',
  },
];

export default function ControlCenterPage() {
  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.panels}>
        <Panel title="Bridge Radar" subtitle="Global posture">
          <div className={styles.radar}>
            <div className={styles.radarSweep} />
            <div className={styles.radarMarkers}>
              <div>
                <StatusChip label="Americas" />
                <small>All corridors nominal</small>
              </div>
              <div>
                <StatusChip label="MENA" tone="warning" />
                <small>Manual reviews +12%</small>
              </div>
              <div>
                <StatusChip label="APAC" tone="critical" />
                <small>Escalations active</small>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Live Alerts" subtitle="Zero-bypass automation">
          <div className={styles.alerts}>
            {alerts.map((alert) => (
              <div key={alert.title} className={styles.alert}>
                <div>
                  <strong>{alert.title}</strong>
                  <span>{alert.detail}</span>
                </div>
                <StatusChip label={alert.badge} tone={alert.tone as 'healthy' | 'warning' | 'critical'} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className={styles.panels}>
        <Panel title="Dispute Deck" subtitle="Escalation queue">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Buyer</th>
                <th>Traveler</th>
                <th>Age</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {disputeRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.buyer}</td>
                  <td>{row.traveler}</td>
                  <td>{row.age}</td>
                  <td>
                    <StatusChip
                      label={row.status}
                      tone={
                        row.status === 'Escalated'
                          ? 'critical'
                          : row.status === 'Panel voting'
                            ? 'warning'
                            : 'healthy'
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Command Log" subtitle="Last critical actions">
          <Timeline items={timeline} />
        </Panel>
      </div>
    </div>
  );
}
