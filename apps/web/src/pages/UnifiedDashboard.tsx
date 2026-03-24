import React from 'react';
import { Link } from 'react-router-dom';
import styles from './UnifiedDashboard.module.css';

const dashboardTypes = [
  {
    id: 'admin',
    title: 'Admin Dashboard',
    description: 'Website administration and business management',
    icon: '⚙️',
    path: '/admin',
    features: ['CMS Management', 'Ads Control', 'Content Management', 'Business Analytics'],
    color: '#3b82f6'
  },
  {
    id: 'control-center',
    title: 'Control Center',
    description: 'System operations and financial controls',
    icon: '🛡️',
    path: '/control-center',
    features: ['Escrow Control', 'Financial Guarantees', 'Dispute Management', 'System Monitoring'],
    color: '#dc2626'
  },
  {
    id: 'founder',
    title: 'Founder Dashboard',
    description: 'Platform metrics and business insights',
    icon: '📊',
    path: '/founder',
    features: ['Today\'s Pulse', 'Trust Health', 'Money Movement', 'Growth Signals'],
    color: '#059669'
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    description: 'User behavior and performance analytics',
    icon: '📈',
    path: '/features/analytics',
    features: ['User Analytics', 'Performance Metrics', 'Behavior Insights', 'Growth Tracking'],
    color: '#7c3aed'
  },
  {
    id: 'seller',
    title: 'Seller Dashboard',
    description: 'Seller tools and marketplace management',
    icon: '🏪',
    path: '/seller/dashboard',
    features: ['Sales Management', 'Order Tracking', 'Product Listings', 'Performance Analytics'],
    color: '#ea580c'
  }
];

export default function UnifiedDashboard() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>MNBARA DASHBOARDS</h1>
        <p>Choose the right dashboard for your role and needs</p>
      </div>

      <div className={styles.grid}>
        {dashboardTypes.map((dashboard) => (
          <Link 
            key={dashboard.id} 
            to={dashboard.path}
            className={styles.dashboardCard}
            style={{ '--accent-color': dashboard.color }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.icon}>{dashboard.icon}</div>
              <h2>{dashboard.title}</h2>
            </div>
            
            <p className={styles.description}>{dashboard.description}</p>
            
            <div className={styles.features}>
              <h3>Key Features:</h3>
              <ul>
                {dashboard.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className={styles.access}>
              <span className={styles.role}>
                {dashboard.id === 'admin' && 'Administrators'}
                {dashboard.id === 'control-center' && 'System Operators'}
                {dashboard.id === 'founder' && 'Founders/Executives'}
                {dashboard.id === 'analytics' && 'Data Analysts'}
                {dashboard.id === 'seller' && 'Sellers'}
              </span>
              <span className={styles.arrow}>→</span>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.info}>
          <h3>Dashboard Access Guide</h3>
          <div className={styles.guide}>
            <div className={styles.guideItem}>
              <strong>Admin Dashboard:</strong> For website administrators managing content, ads, and business operations
            </div>
            <div className={styles.guideItem}>
              <strong>Control Center:</strong> For system operators managing financial controls, escrow, and system health
            </div>
            <div className={styles.guideItem}>
              <strong>Founder Dashboard:</strong> For founders and executives monitoring platform health and growth
            </div>
            <div className={styles.guideItem}>
              <strong>Analytics Dashboard:</strong> For data analysts studying user behavior and performance
            </div>
            <div className={styles.guideItem}>
              <strong>Seller Dashboard:</strong> For marketplace sellers managing their business and listings
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
