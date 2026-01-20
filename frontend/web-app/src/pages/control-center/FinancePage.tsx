import { KpiCard, Panel, StatusChip, Timeline } from '../../components/control-center/ControlWidgets';
import styles from './FinancePage.module.css';

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
    title: 'Guarantee pool auto-replenish',
    detail: 'System triggered 25K EGP top-up at 71% threshold.',
    timestamp: '08:45 UTC • FIN-12',
  },
  {
    title: 'Dual approval: Large refund',
    detail: 'Finance Controller + Compliance approved 82K EGP buyer refund.',
    timestamp: '06:23 UTC • FIN-08',
  },
  {
    title: 'Escrow balance alert',
    detail: 'EGP balance dropped below 10M threshold, auto-alert sent.',
    timestamp: '04:15 UTC • FIN-03',
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

      <div className={styles.panels}>
        <Panel title="Escrow Ledger" subtitle="Recent transactions">
          <table className={styles.table}>
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
                      tone={
                        row.status === 'Released'
                          ? 'healthy'
                          : row.status === 'Queued'
                            ? 'warning'
                            : 'critical'
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Dual Control Matrix" subtitle="Multi-person approvals">
          <div className={styles.dualControl}>
            {dualControl.map((item) => (
              <div key={item.name} className={styles.dualControlItem}>
                <div>
                  <h4>{item.name}</h4>
                  <p>{item.detail}</p>
                </div>
                <StatusChip
                  label={item.status}
                  tone={
                    item.status === 'Ready'
                      ? 'healthy'
                      : item.status === 'Triggered 6m ago'
                        ? 'warning'
                        : 'critical'
                  }
                />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className={styles.panels}>
        <Panel title="Financial Flows" subtitle="System integrations">
          <div className={styles.flows}>
            {flows.map((flow) => (
              <div key={flow.title} className={styles.flowItem}>
                <h4>{flow.title}</h4>
                <p>{flow.desc}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Finance Command Log" subtitle="Critical financial actions">
          <Timeline items={timeline} />
        </Panel>
      </div>
    </div>
  );
}
