export type ControlRole =
  | 'BRIDGE_OPERATOR'
  | 'SECURITY_OFFICER'
  | 'OPERATIONS_LEAD'
  | 'FINANCE_CONTROLLER'
  | 'COMPLIANCE_OFFICER'
  | 'ENGINEERING_SRE'
  | 'SUPER_ADMIN';

export type ControlModule =
  | 'overview'
  | 'identity'
  | 'security'
  | 'operations'
  | 'disputes'
  | 'finance'
  | 'logistics'
  | 'analytics'
  | 'featureFlags'
  | 'engineering'
  | 'audit';

export const CONTROL_MODULES: ControlModule[] = [
  'overview',
  'identity',
  'security',
  'operations',
  'disputes',
  'finance',
  'logistics',
  'analytics',
  'featureFlags',
  'engineering',
  'audit',
];

export const controlRoleMatrix: Record<ControlRole, ControlModule[]> = {
  BRIDGE_OPERATOR: ['overview', 'analytics'],
  SECURITY_OFFICER: ['overview', 'identity', 'security', 'audit'],
  OPERATIONS_LEAD: ['overview', 'operations', 'disputes', 'logistics'],
  FINANCE_CONTROLLER: ['overview', 'finance', 'disputes', 'audit'],
  COMPLIANCE_OFFICER: ['overview', 'audit', 'finance'],
  ENGINEERING_SRE: ['overview', 'featureFlags', 'engineering', 'analytics'],
  SUPER_ADMIN: [
    'overview',
    'identity',
    'security',
    'operations',
    'disputes',
    'finance',
    'logistics',
    'analytics',
    'featureFlags',
    'engineering',
    'audit',
  ],
};

export const controlRoleDescriptions: Record<ControlRole, string> = {
  BRIDGE_OPERATOR: 'Monitors global system state and risk posture.',
  SECURITY_OFFICER: 'Owns IAM, anomaly response, and threats.',
  OPERATIONS_LEAD: 'Oversees traveler/buyer workflows and manual approvals.',
  FINANCE_CONTROLLER: 'Controls deposits, guarantees, and refunds with dual approval.',
  COMPLIANCE_OFFICER: 'Handles immutable logs, legal exports, and policy checks.',
  ENGINEERING_SRE: 'Manages feature flags, deployments, and observability.',
  SUPER_ADMIN: 'Limited to meta-configuration. Cannot bypass dual-control.',
};

export function canAccess(role: ControlRole, module: ControlModule) {
  return controlRoleMatrix[role]?.includes(module);
}
