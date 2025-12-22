# Weekly Tasks – Mnbarh Platform

## Week of 2025-12-22

### Control Center – Ship Panel
- [x] Scaffold control center route structure (layout, shared navigation, base styles).
- [x] Implement key modules placeholder pages with mock widgets (overview, IAM, security, finance, audit).
- [x] Document/integrate logging + RBAC guard usage and provide follow-up instructions.
- [x] Create remaining control-center module pages (operations, disputes, logistics, analytics, featureFlags, engineering) with mock widgets and RBAC guards.

### Payments & Trust
- [x] Wire payment intent API to fetch real buyer-trust signals and feed them into fraud evaluation.
- [x] Persist device events and admin actions by calling backend auth/admin services.
- [x] Verify flows + update docs/UI to reflect live data hookup.

### Technical Debt
- [x] Fix TypeScript lint errors for Next.js module declarations (`next/server`, `next/link`).
- [x] Ensure environment variables are documented for Paymob integration.

### Documentation
- [x] Update README with control-center access and RBAC usage.
- [x] Add deployment checklist for control-center UI.

---

## Notes
- The control center UI follows M-Dash styling with dark glassmorphism.
- All irreversible admin actions must call `logManualDecision` before state mutation.
- RBAC guards must be enforced on every control-center page and API route.