import React from 'react';
import { KpiCard, Panel, StatusChip } from '../../components/control-center/ControlWidgets';
import styles from './FounderDashboard.module.css';

const todayStats = [
  { 
    icon: '👥', 
    label: 'Active Users', 
    value: '2,847',
    helper: 'People using platform right now',
    note: 'Not necessarily doing anything meaningful'
  },
  { 
    icon: '🔄', 
    label: 'Transactions in Progress', 
    value: '156',
    helper: 'Orders currently being fulfilled',
    note: "Haven't completed yet—anything could still go wrong"
  },
  { 
    icon: '💬', 
    label: 'Support Queue', 
    value: '23',
    helper: 'Unresolved support tickets',
    note: 'Low number isn\'t always good—might mean people aren\'t asking'
  },
  { 
    icon: '🟢', 
    label: 'System Status', 
    value: 'Healthy',
    helper: 'All services responding',
    note: 'Doesn\'t mean everything is working perfectly for users'
  },
];

const trustHealth = [
  { 
    icon: '⚖️', 
    label: 'Dispute Rate', 
    value: '2.3%',
    helper: 'Orders ending in disputes',
    note: 'Lower is better, but zero might mean people aren\'t reporting issues'
  },
  { 
    icon: '⏱️', 
    label: 'Resolution Time', 
    value: '18h',
    helper: 'Average time to resolve disputes',
    note: 'Faster isn\'t always fairer'
  },
  { 
    icon: '😊', 
    label: 'Satisfaction Score', 
    value: '4.6/5',
    helper: 'User satisfaction with resolutions',
    note: 'Only from people who responded to surveys'
  },
  { 
    icon: '🛡️', 
    label: 'Guarantee Claims', 
    value: '1.2%',
    helper: 'Orders using buyer protection',
    note: 'Higher usage means people trust the system'
  },
];

const moneyMovement = [
  { 
    icon: '💰', 
    label: 'Escrow Balance', 
    value: 'EGP 12.4M',
    helper: 'Money held in trust',
    note: 'Other people\'s money'
  },
  { 
    icon: '💸', 
    label: 'Owed to Users', 
    value: 'EGP 847K',
    helper: 'Pending payouts to sellers & travelers',
    note: 'Cash flow obligation'
  },
  { 
    icon: '📈', 
    label: 'Daily Volume', 
    value: 'EGP 2.1M',
    helper: 'Total transaction value today',
    note: 'Gross, not net revenue'
  },
  { 
    icon: '🏦', 
    label: 'Bank Balance', 
    value: 'EGP 45.2M',
    helper: 'Company cash reserves',
    note: 'Available for operations and growth'
  },
];

const growthSignals = [
  { 
    icon: '👤', 
    label: 'New Users This Week', 
    value: '342',
    helper: 'People who signed up',
    note: 'Signups aren\'t customers—most won\'t transact'
  },
  { 
    icon: '🎯', 
    label: 'First Transactions', 
    value: '28',
    helper: 'New users who completed their first order',
    note: 'One transaction doesn\'t mean they\'ll come back'
  },
  { 
    icon: '🔄', 
    label: 'Repeat Rate', 
    value: '23%',
    helper: 'Users who came back for another order',
    note: 'Industry average is 15-25%'
  },
  { 
    icon: '📊', 
    label: 'Corridor Growth', 
    value: '+18%',
    helper: 'Growth in travel corridors',
    note: 'Specific corridors, not overall platform'
  },
];

const attentionItems = [
  {
    title: 'Guarantee Pool Utilization',
    detail: 'EGP wallet drawdown reached 72% utilization. Top up recommended.',
    severity: 'warning',
    action: 'Top up guarantee pool'
  },
  {
    title: 'Dispute Resolution Delay',
    detail: 'DSP-327 has been escalated for 22h without resolution.',
    severity: 'critical',
    action: 'Review escalated dispute'
  },
  {
    title: 'New Corridor Spike',
    detail: 'Riyadh → Cairo ops up 34% in last 2h. Verify staffing.',
    severity: 'info',
    action: 'Check corridor capacity'
  },
];

export default function FounderDashboard() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>FOUNDER DASHBOARD</h1>
        <p className={styles.lastUpdated}>Last updated: Now</p>
      </div>

      {/* Today's Pulse */}
      <section className={styles.section}>
        <h2>TODAY'S PULSE</h2>
        <div className={styles.grid}>
          {todayStats.map((stat) => (
            <div key={stat.label} className={styles.kpiCard}>
              <div className={styles.kpiIcon}>{stat.icon}</div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>{stat.label}</p>
                <p className={styles.kpiValue}>{stat.value}</p>
                <p className={styles.kpiHelper}>{stat.helper}</p>
                <p className={styles.kpiNote}>{stat.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Health */}
      <section className={styles.section}>
        <h2>TRUST HEALTH</h2>
        <div className={styles.grid}>
          {trustHealth.map((stat) => (
            <div key={stat.label} className={styles.kpiCard}>
              <div className={styles.kpiIcon}>{stat.icon}</div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>{stat.label}</p>
                <p className={styles.kpiValue}>{stat.value}</p>
                <p className={styles.kpiHelper}>{stat.helper}</p>
                <p className={styles.kpiNote}>{stat.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Money Movement */}
      <section className={styles.section}>
        <h2>MONEY MOVEMENT</h2>
        <div className={styles.grid}>
          {moneyMovement.map((stat) => (
            <div key={stat.label} className={styles.kpiCard}>
              <div className={styles.kpiIcon}>{stat.icon}</div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>{stat.label}</p>
                <p className={styles.kpiValue}>{stat.value}</p>
                <p className={styles.kpiHelper}>{stat.helper}</p>
                <p className={styles.kpiNote}>{stat.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Growth Signals */}
      <section className={styles.section}>
        <h2>GROWTH SIGNALS</h2>
        <div className={styles.grid}>
          {growthSignals.map((stat) => (
            <div key={stat.label} className={styles.kpiCard}>
              <div className={styles.kpiIcon}>{stat.icon}</div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>{stat.label}</p>
                <p className={styles.kpiValue}>{stat.value}</p>
                <p className={styles.kpiHelper}>{stat.helper}</p>
                <p className={styles.kpiNote}>{stat.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Things That Need Attention */}
      <section className={styles.section}>
        <h2>THINGS THAT NEED ATTENTION</h2>
        <div className={styles.attentionGrid}>
          {attentionItems.map((item) => (
            <div key={item.title} className={styles.attentionCard}>
              <div className={styles.attentionHeader}>
                <h3>{item.title}</h3>
                <StatusChip 
                  label={item.severity} 
                  tone={
                    item.severity === 'critical' ? 'critical' :
                    item.severity === 'warning' ? 'warning' : 'healthy'
                  } 
                />
              </div>
              <p className={styles.attentionDetail}>{item.detail}</p>
              <button className={styles.attentionAction}>
                {item.action}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
