import React, { useEffect, useState } from 'react';
import styles from './ControlCenter.module.css';
import { KpiCard, Panel, StatusChip } from './ControlWidgets';

// Mock data interfaces matching our new services
interface Campaign {
  id: string;
  name: string;
  budget: string;
  spend: string;
  status: 'ACTIVE' | 'PAUSED';
  roas: string;
}

interface SeoStat {
  pageType: string;
  indexed: number;
  errors: number;
  lastCrawl: string;
}

const MarketingPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: 'CMP-9921', name: 'Summer Sale (Electronics)', budget: '$500/day', spend: '$342', status: 'ACTIVE', roas: '4.2x' },
    { id: 'CMP-9925', name: 'Vintage Watches Push', budget: '$120/day', spend: '$89', status: 'ACTIVE', roas: '3.8x' },
    { id: 'CMP-9800', name: 'Q1 Brand Awareness', budget: '$1000/day', spend: '$0', status: 'PAUSED', roas: '-' },
  ]);

  const [seoStats, setSeoStats] = useState<SeoStat[]>([
    { pageType: 'Product Listings', indexed: 1420500, errors: 12, lastCrawl: '2h ago' },
    { pageType: 'Category Pages', indexed: 4500, errors: 0, lastCrawl: '5h ago' },
    { pageType: 'Storefronts', indexed: 1200, errors: 3, lastCrawl: '1d ago' },
  ]);

  const kpis = [
    { icon: '💸', label: 'Ad Revenue (Today)', value: '$12,450', trend: { value: '+15%' } },
    { icon: '🕸️', label: 'Indexed Pages', value: '1.4M', trend: { value: '+2.1%' } },
    { icon: '📈', label: 'Organic Traffic', value: '850k', trend: { value: '+5%' } },
  ];

  return (
    <div className={styles.page}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Marketing & Growth</h1>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Manage Ad Campaigns and SEO Performance</p>
      </header>

      <div className={styles.grid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.panels}>
        {/* Ad Service Integration */}
        <Panel title="Active Ad Campaigns" subtitle="Real-time bidding performance">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Campaign Name</th>
                <th>Budget</th>
                <th>Spend (Today)</th>
                <th>ROAS</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.budget}</td>
                  <td>{c.spend}</td>
                  <td style={{ color: '#22c55e', fontWeight: 600 }}>{c.roas}</td>
                  <td>
                    <StatusChip 
                      label={c.status} 
                      tone={c.status === 'ACTIVE' ? 'healthy' : 'neutral'} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* SEO Service Integration */}
        <Panel title="SEO Health" subtitle="Google Indexing Status (seo-service)">
           <table className={styles.table}>
            <thead>
              <tr>
                <th>Page Type</th>
                <th>Indexed Pages</th>
                <th>Crawl Errors</th>
                <th>Last Crawl</th>
              </tr>
            </thead>
            <tbody>
              {seoStats.map((s) => (
                <tr key={s.pageType}>
                  <td>{s.pageType}</td>
                  <td>{s.indexed.toLocaleString()}</td>
                  <td style={{ color: s.errors > 0 ? '#ef4444' : '#fff' }}>{s.errors}</td>
                  <td>{s.lastCrawl}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.8rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Sitemap Generator Status</strong>
             ✅ Daily Job: Success (Generated 140 sitemaps) <br/>
             ℹ️ Next Run: 22:00 UTC
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default MarketingPage;
