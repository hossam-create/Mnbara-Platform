export type ControlModule = 
  | 'overview'
  | 'analytics'
  | 'identity'
  | 'security'
  | 'audit'
  | 'operations'
  | 'disputes'
  | 'logistics'
  | 'finance'
  | 'featureFlags'
  | 'engineering';

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
    title: 'control.sections.bridge',
    items: [
      {
        name: 'control.nav.systemOverview',
        href: '/control-center',
        module: 'overview',
        icon: '🧭',
        description: 'control.nav.systemOverviewDesc',
      },
      {
        name: 'control.nav.analytics',
        href: '/control-center/analytics',
        module: 'analytics',
        icon: '📈',
        description: 'control.nav.analyticsDesc',
      },
    ],
  },
  {
    title: 'control.sections.trust',
    items: [
      {
        name: 'control.nav.identity',
        href: '/control-center/identity',
        module: 'identity',
        icon: '👥',
        description: 'control.nav.identityDesc',
      },
      {
        name: 'control.nav.threatCenter',
        href: '/control-center/security',
        module: 'security',
        icon: '🛡️',
        description: 'control.nav.threatCenterDesc',
      },
      {
        name: 'control.nav.audit',
        href: '/control-center/audit',
        module: 'audit',
        icon: '📜',
        description: 'control.nav.auditDesc',
      },
    ],
  },
  {
    title: 'control.sections.operations',
    items: [
      {
        name: 'control.nav.operationsPanel',
        href: '/control-center/operations',
        module: 'operations',
        icon: '💼',
        description: 'control.nav.operationsPanelDesc',
      },
      {
        name: 'control.nav.disputes',
        href: '/control-center/disputes',
        module: 'disputes',
        icon: '⚖️',
        description: 'control.nav.disputesDesc',
      },
      {
        name: 'control.nav.logistics',
        href: '/control-center/logistics',
        module: 'logistics',
        icon: '🚚',
        description: 'control.nav.logisticsDesc',
      },
    ],
  },
  {
    title: 'control.sections.finance',
    items: [
      {
        name: 'control.nav.financeDesk',
        href: '/control-center/finance',
        module: 'finance',
        icon: '💰',
        description: 'control.nav.financeDeskDesc',
      },
      {
        name: 'control.nav.featureFlags',
        href: '/control-center/feature-flags',
        module: 'featureFlags',
        icon: '🧪',
        description: 'control.nav.featureFlagsDesc',
      },
      {
        name: 'control.nav.engineering',
        href: '/control-center/engineering',
        module: 'engineering',
        icon: '👨‍💻',
        description: 'control.nav.engineeringDesc',
      },
    ],
  },
];
