import { ControlModule } from '@/lib/rbac/controlRoles';

export type ControlNavItem = {
  name: string;
  href: string;
  module: ControlModule;
  icon?: string;
  description?: string;
};

export type ControlNavSection = {
  title: string;
  items: ControlNavItem[];
};

export const controlNavSections: ControlNavSection[] = [
  {
    title: 'Bridge',
    items: [
      {
        name: 'System Overview',
        href: '/control-center',
        module: 'overview',
        icon: '🧭',
        description: 'Health, corridors, alerts',
      },
      {
        name: 'Analytics & Signals',
        href: '/control-center/analytics',
        module: 'analytics',
        icon: '📈',
        description: 'Funnel, friction, abuse',
      },
    ],
  },
  {
    title: 'Trust & Security',
    items: [
      {
        name: 'Identity & Access',
        href: '/control-center/identity',
        module: 'identity',
        icon: '👥',
        description: 'Employees, roles, sessions',
      },
      {
        name: 'Threat Center',
        href: '/control-center/security',
        module: 'security',
        icon: '🛡️',
        description: 'Anomalies, incidents',
      },
      {
        name: 'Audit & Compliance',
        href: '/control-center/audit',
        module: 'audit',
        icon: '📜',
        description: 'Immutable logs, exports',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        name: 'Operations Panel',
        href: '/control-center/operations',
        module: 'operations',
        icon: '💼',
        description: 'Queues & verifications',
      },
      {
        name: 'Disputes & Arbitration',
        href: '/control-center/disputes',
        module: 'disputes',
        icon: '⚖️',
        description: 'Evidence & decisions',
      },
      {
        name: 'Logistics & Shipping',
        href: '/control-center/logistics',
        module: 'logistics',
        icon: '🚚',
        description: 'Delivery proofs, corridors',
      },
    ],
  },
  {
    title: 'Finance & Controls',
    items: [
      {
        name: 'Finance Desk',
        href: '/control-center/finance',
        module: 'finance',
        icon: '💰',
        description: 'Deposits, guarantees, refunds',
      },
      {
        name: 'Feature Flags',
        href: '/control-center/feature-flags',
        module: 'featureFlags',
        icon: '🧪',
        description: 'Releases, kill switches',
      },
      {
        name: 'Engineering Deck',
        href: '/control-center/engineering',
        module: 'engineering',
        icon: '👨‍💻',
        description: 'Deployments, logs',
      },
    ],
  },
];
