import styles from './identity.module.css';
import { KpiCard, Panel, StatusChip, Timeline } from '@/components/control-center/ControlWidgets';

const identityKpis = [
  { icon: '👤', label: 'Active operators', value: '38', trend: { value: '+5 new this week' } },
  { icon: '🔐', label: 'Hardware MFA', value: '94%', trend: { value: '+3%', direction: 'up' as const } },
  { icon: '🌐', label: 'Trusted devices', value: '112', trend: { value: '-2 revoked', direction: 'down' as const } },
];

const guardrails = [
  {
    title: 'Dual attestation for Finance Controller',
    detail: 'All roles touching payouts require supervisor countersign.',
    tone: 'warning',
  },
  {
    title: 'Geo-fenced sessions',
    detail: 'Keycloak realm bound to Cairo HQ CIDR + hardware VPN.',
    tone: 'healthy',
  },
  {
    title: 'Session drift monitor',
    detail: 'SRE alerted on IP/device mismatch during privileged actions.',
    tone: 'critical',
  },
] as const;

const invites = [
  { email: 'nadia@mnbarh.com', role: 'Security Officer', issuedBy: 'Ali F.', expires: '15m' },
  { email: 'ziad@mnbarh.com', role: 'Operations Lead', issuedBy: 'HQ Ops Bot', expires: '48m' },
] as const;

const sessions = [
  {
    user: 'Mariam El-Sayed',
    role: 'BRIDGE_OPERATOR',
    origin: '10.4.22.8 (Cairo HQ)',
    device: 'YubiKey + Secure laptop',
    lastAction: 'Approved corridor override • 04:12 UTC',
  },
  {
    user: 'Tamer Hegazy',
    role: 'SECURITY_OFFICER',
    origin: '10.4.31.44 (VPN)',
    device: 'MacBook Pro + Keycard',
    lastAction: 'Revoked stale session • 03:48 UTC',
  },
  {
    user: 'Reem Adel',
    role: 'FINANCE_CONTROLLER',
    origin: '10.4.12.61 (HQ)',
    device: 'Secure desktop',
    lastAction: 'Queued audit export • 01:27 UTC',
  },
] as const;

const timeline = [
  {
    title: 'Role policy updated',
    detail: 'BRIDGE_OPERATOR now inherits feature flag read-only scope.',
    timestamp: '06:18 UTC • RBAC-14',
  },
  {
    title: 'Sudo window closed',
    detail: 'Engineering SRE elevated window auto-closed after 45m.',
    timestamp: '03:02 UTC • IAM-33',
  },
] as const;

export default function IdentityPage() {
  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {identityKpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.panels}>
        <Panel title="Guardrails" subtitle="Cannot be bypassed">
          <div className={styles.guardrails}>
            {guardrails.map((item) => (
              <div key={item.title} className={styles.guardrail}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <StatusChip label="Enforced" tone={item.tone} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Pending invitations" subtitle="Expire under 1 hour">
          <div className={styles.invites}>
            {invites.map((invite) => (
              <div key={invite.email} className={styles.inviteItem}>
                <strong>{invite.email}</strong>
                <p>
                  Role: {invite.role} • Issued by {invite.issuedBy} • Expires in {invite.expires}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Privileged sessions" subtitle="Hardware MFA + IP pinning required">
        <div className={styles.sessionGrid}>
          {sessions.map((session) => (
            <div key={session.user} className={styles.sessionCard}>
              <h4>{session.user}</h4>
              <p>{session.role}</p>
              <p>{session.origin}</p>
              <p>{session.device}</p>
              <p>{session.lastAction}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="IAM command log" subtitle="Recent critical changes">
        <Timeline items={timeline} />
      </Panel>
    </div>
  );
}
