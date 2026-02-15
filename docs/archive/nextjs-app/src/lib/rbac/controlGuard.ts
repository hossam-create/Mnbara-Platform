import { ControlModule, ControlRole, canAccess, controlRoleMatrix } from './controlRoles';

export type ControlSessionContext = {
  userId: string;
  roles: ControlRole[];
  sessionId?: string;
  sourceIp?: string;
  userAgent?: string;
};

type AccessErrorDetail = {
  userId: string;
  roles: ControlRole[];
  module: ControlModule;
};

export class ControlAccessError extends Error {
  constructor(public readonly detail: AccessErrorDetail) {
    super(`User ${detail.userId} lacks access to ${detail.module}`);
  }
}

export function hasControlAccess(ctx: ControlSessionContext, module: ControlModule) {
  return ctx.roles?.some((role) => canAccess(role, module)) ?? false;
}

export function assertControlAccess(ctx: ControlSessionContext, module: ControlModule) {
  if (!hasControlAccess(ctx, module)) {
    throw new ControlAccessError({
      userId: ctx.userId,
      roles: ctx.roles,
      module,
    });
  }
}

export function deriveAllowedModules(ctx: ControlSessionContext): ControlModule[] {
  const modules = new Set<ControlModule>();
  ctx.roles?.forEach((role) => {
    const allowed = controlRoleMatrix[role] ?? [];
    allowed.forEach((moduleItem: ControlModule) => modules.add(moduleItem));
  });
  return Array.from(modules);
}
