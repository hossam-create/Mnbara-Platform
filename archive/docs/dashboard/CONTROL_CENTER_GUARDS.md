# Ship Control Panel – RBAC & Audit Logging Guide

This document explains how to enforce role-based access and append-only audit logging inside the Ship Control Panel. It is scoped to the Next.js frontend (App Router) and complements the backend IAM/audit services.

---

## 1. RBAC guard utilities

**Location:** `src/lib/rbac/`

| File | Purpose |
| --- | --- |
| `controlRoles.ts` | Canonical list of Ship Control roles, modules, and access matrix. |
| `controlGuard.ts` | Runtime helpers for checking/deriving module access. |

### 1.1 Session context

```ts
import { assertControlAccess, type ControlSessionContext } from '@/lib/rbac/controlGuard';

async function getControlSession(): Promise<ControlSessionContext> {
  const session = await getKeycloakSession(); // your existing auth helper
  return {
    userId: session.user.id,
    roles: session.user.controlRoles as ControlRole[], // ensure this comes from Keycloak custom claim
    sessionId: session.sessionId,
    sourceIp: session.ip,
    userAgent: session.userAgent,
  };
}
```

### 1.2 Enforcing access in a server component or route

```ts
import { assertControlAccess } from '@/lib/rbac/controlGuard';

export default async function SecurityPage() {
  const ctx = await getControlSession();
  assertControlAccess(ctx, 'security');

  // render page or fetch data...
}
```

### 1.3 Feature-flagged UI

Client components can safely hide navigation/actions for modules the user cannot access:

```ts
import { deriveAllowedModules } from '@/lib/rbac/controlGuard';
import { controlNavSections } from '@/components/control-center/navConfig';

const allowed = new Set(deriveAllowedModules(sessionCtx));
const safeSections = controlNavSections.map((section) => ({
  ...section,
  items: section.items.filter((item) => allowed.has(item.module)),
}));
```

> **Important**: UI hiding is not security. Always keep the `assertControlAccess` check on server boundaries (pages, API routes, server actions).

---

## 2. Audit logging helpers

**Location:** `src/lib/audit/controlAudit.ts`

Two high-level helpers wrap the `/api/audit/*` routes:

```ts
import { logLegalConsent, logManualDecision } from '@/lib/audit/controlAudit';
```

| Helper | When to call | Payload |
| --- | --- | --- |
| `logLegalConsent` | Any time an operator accepts a legal/ops acknowledgement (KYC, policy, kill-switch training). | `{ userId, page, legalSlug }` and optional `timestamp`, `sourceIp`. |
| `logManualDecision` | Before executing any irreversible admin action (refund, ban, escalation). | `{ userId, action, confirmedBy: 'human' }` and optional metadata. |

### 2.1 Client usage example

```ts
await logManualDecision({
  userId,
  action: 'refund_release',
  confirmedBy: 'human',
});
```

This automatically POSTs to `/api/audit/decision`. Failures bubble up so you can block UI until logging succeeds.

### 2.2 Server usage example

When you build a server action or route that performs the actual payout:

```ts
import { logManualDecision } from '@/lib/audit/controlAudit';

export async function releaseFunds(payload) {
  const ctx = await getControlSession();
  assertControlAccess(ctx, 'finance');

  await logManualDecision({
    userId: ctx.userId,
    action: 'payout_release',
    timestamp: new Date().toISOString(),
    sourceIp: ctx.sourceIp,
    confirmedBy: 'human',
  });

  await financeService.releasePayout(payload);
}
```

---

## 3. API route guard pattern

Example for `/app/api/control-center/finance/adjust/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { assertControlAccess } from '@/lib/rbac/controlGuard';
import { logManualDecision } from '@/lib/audit/controlAudit';

export async function POST(request: NextRequest) {
  const ctx = await getControlSession(request); // include IP/UA extraction
  assertControlAccess(ctx, 'finance');

  const body = await request.json();

  await logManualDecision({
    userId: ctx.userId,
    action: `finance.adjust:${body.reason}`,
    confirmedBy: 'human',
    sourceIp: ctx.sourceIp,
  });

  await financeClient.adjust(body);
  return NextResponse.json({ status: 'ok' });
}
```

---

## 4. Operational checklist

1. **All control-center routes** must call `assertControlAccess`.
2. **All irreversible actions** must call `logManualDecision` before mutating state.
3. **All consent/policy checkboxes** must call `logLegalConsent`.
4. Expose guard failures as “Permission denied. Contact Security Officer.”
5. Mirror audit payloads into backend append-only store (current `/api/audit/*` just console logs; replace with real service when available).
6. Do not add delete endpoints. Append-only or soft-disable only.

Following these steps keeps human control verifiable and reduces the risk of bypassing the zero-trust posture described in the Ship Control specification.
