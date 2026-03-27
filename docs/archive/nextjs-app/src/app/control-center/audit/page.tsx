import styles from './audit.module.css';
import { KpiCard, Panel, StatusChip, Timeline } from '@/components/control-center/ControlWidgets';

const kpis = [
  { icon: '📜', label: 'Log shards', value: '48', trend: { value: '+4 new' } },
  { icon: '⛓️', label: 'Hash chain', value: 'Stable', trend: { value: '0 breaks detected' } },
  { icon: '📦', label: 'Exports queued', value: '6', trend: { value: '+1 vs 24h', direction: 'down' as const } },
] as const;

const hashes = [
  {
    name: 'Buyer trust actions',
    hash: '0x8f3a4d...b9c2',
    detail: 'Last append 07:48 UTC • Seq# 9,140',
  },
  {
    name: 'Finance approvals',
    hash: '0xde21c1...023a',
    detail: 'Last append 06:12 UTC • Seq# 2,311',
  },
  {
    name: 'RBAC changes',
    hash: '0xaf901b...d552',
    detail: 'Last append 03:44 UTC • Seq# 784',
  },
] as const;

const exportsList = [
  {
    name: 'Founders cold storage bundle',
    size: '142 MB',
    status: 'Delivering',
    scope: 'Finance + IAM + Disputes',
  },
  {
    name: 'Compliance weekly digest',
    size: '26 MB',
    status: 'Signed',
    scope: 'Audit logs • attachments excluded',
  },
  {
    name: 'Ops arbitration transcript',
    size: '11 MB',
    status: 'Queued',
    scope: 'DSP-332 full evidence trail',
  },
] as const;

const timeline = [
  {
    title: 'Immutable hash sealed',
    detail: 'Audit officer sealed block #19042 (finance actions).',
    timestamp: '08:02 UTC • AUD-18',
  },
  {
    title: 'Evidence chain shared',
    detail: 'DSP-327 transcript exported to founders vault.',
    timestamp: '05:56 UTC • AUD-12',
  },
  {
    title: 'RBAC diff notarized',
    detail: 'Identity team change-set hashed + archived.',
    timestamp: '02:21 UTC • AUD-07',
  },
] as const;

export default function AuditPage() {
  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.panels}>
        <Panel title="Hash anchors" subtitle="Append-only registers">
          <div className={styles.hashGrid}>
            {hashes.map((hash) => (
              <div key={hash.name} className={styles.hashCard}>
                <strong>{hash.name}</strong>
                <p>{hash.detail}</p>
                <code>{hash.hash}</code>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Exports & attestations" subtitle="No deletes. No edits.">
          <div className={styles.exportList}>
            {exportsList.map((item) => (
              <div key={item.name} className={styles.exportItem}>
                <strong>{item.name}</strong>
                <p>
                  {item.scope} • {item.size}
                </p>
                <StatusChip label={item.status} tone={item.status === 'Delivering' ? 'healthy' : 'warning'} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Audit command log" subtitle="Recent notarized events">
        <Timeline items={timeline} />
      </Panel>
    </div>
  );
}
