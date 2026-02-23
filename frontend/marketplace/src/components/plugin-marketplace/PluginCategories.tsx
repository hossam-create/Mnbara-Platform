import React from 'react';
import { PluginCategory } from '../../types/plugin.types';
import styles from './PluginCategories.module.css';

interface PluginCategoriesProps {
  selected: string;
  onChange: (category: string) => void;
}

const categories: Array<{ id: string; name: string; icon: string }> = [
  { id: 'all', name: 'All Categories', icon: '🌟' },
  { id: 'payments', name: 'Payments', icon: '💳' },
  { id: 'shipping', name: 'Shipping', icon: '🚚' },
  { id: 'analytics', name: 'Analytics', icon: '📊' },
  { id: 'marketing', name: 'Marketing', icon: '📢' },
  { id: 'security', name: 'Security', icon: '🔒' },
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'integrations', name: 'Integrations', icon: '🔗' },
  { id: 'communication', name: 'Communication', icon: '💬' },
  { id: 'inventory', name: 'Inventory', icon: '📦' },
  { id: 'customer-support', name: 'Customer Support', icon: '🎧' },
  { id: 'automation', name: 'Automation', icon: '🤖' },
  { id: 'custom', name: 'Custom', icon: '🔧' },
];

export const PluginCategories: React.FC<PluginCategoriesProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div className={styles.categories}>
      {categories.map((category) => (
        <button
          key={category.id}
          className={`${styles.category} ${selected === category.id ? styles.active : ''}`}
          onClick={() => onChange(category.id)}
        >
          <span className={styles.icon}>{category.icon}</span>
          <span className={styles.name}>{category.name}</span>
        </button>
      ))}
    </div>
  );
};