import styles from './finance.module.css';
import { KpiCard, Panel, StatusChip, Timeline } from '@/components/control-center/ControlWidgets';

const kpis = [
  { icon: '💰', label: 'Escrow balance', value: 'EGP 12.4M', trend: { value: '+420K today' } },
  { icon: '🏦', label: 'Guarantee pool', value: '72% utilized', trend: { value: '+5%', direction: 'down' as const } },
  { icon: '🧾', label: 'Pending refunds', value: '36', trend: { value: '-4 vs 24h', direction: 'up' as const } },
];

const ledgerRows = [
  { id: 'TX-8841', corridor: 'CAI → DXB', amount: 'EGP 21,430', type: 'Traveler payout', status: 'Released' },
  { id: 'TX-8832', corridor: 'CAI → JED', amount: 'EGP 54,900', type: 'Guarantee replenishment', status: 'Queued' },
  { id: 'TX-8815', corridor: 'CAI → RUH', amount: 'EGP 9,120', type: 'Buyer refund', status: 'Awaiting approval' },
];

const dualControl = [
  {
    name: 'Refund above 50K',
    detail: 'Finance Controller + Compliance Officer required',
    status: 'Ready',
  },
  {
    name: 'Guarantee pool top-up',
    detail: 'Finance Controller + Super Admin',
    status: 'Triggered 6m ago',
  },
  {
    name: 'Escrow bank switch',
    detail: 'Security Officer + Super Admin + Legal',
    status: 'Dormant',
  },
];

const flows = [
  {
    title: 'Paymob settlement feed',
    desc: 'Last ingest 05:12 UTC • Latency 6s • HMAC verified',
  },
  {
    title: 'Risk-adjusted reserves',
    desc: 'Auto-calculated hourly, manual override disabled',
  },
  {
    title: 'Pending payouts',
    desc: '18 traveler wallets waiting dual release',
  },
];

const timeline = [
  {
    title: 'Dual approval: Refund DSP-332',
    detail: 'Finance + Compliance recorded with append-only hash.',
    timestamp: '07:45 UTC • FIN-12',
  },
  {
    title: 'Guarantee pool alert acknowledged',
    detail: 'Finance Controller initiated top-up workflow.',
    timestamp: '06:02 UTC • FIN-09',
  },
  {
    title: 'Audit export delivered',
    detail: 'Immutable ledger snapshot sent to founders’ cold storage.',
    timestamp: '02:14 UTC • AUD-05',
  },
];

export default function FinancePage() {
  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <Panel title="Ledger surface" subtitle="Latest reconciled entries">
        <table className={styles.ledgerTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Corridor</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ledgerRows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.corridor}</td>
                <td>{row.amount}</td>
                <td>{row.type}</td>
                <td>
                  <StatusChip
                    label={row.status}
                    tone={row.status === 'Released' ? 'healthy' : row.status === 'Queued' ? 'warning' : 'critical'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className={styles.panels}>
        <Panel title="Dual-control guardrails" subtitle="Immutable approvals only">
          <div className={styles.dualControlList}>
            {dualControl.map((item) => (
              <div key={item.name} className={styles.dualItem}>
                <header>
                  <strong>{item.name}</strong>
                  <StatusChip label={item.status} tone={item.status === 'Ready' ? 'healthy' : 'warning'} />
                </header>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Financial flows" subtitle="Live feeds from PSP + treasury">
          <div className={styles.flowsGrid}>
            {flows.map((flow) => (
              <div key={flow.title} className={styles.flowCard}>
                <h4>{flow.title}</h4>
                <p>{flow.desc}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Finance command log" subtitle="Dual approvals & exports">
        <Timeline items={timeline} />
      </Panel>
    </div>
  );
}
