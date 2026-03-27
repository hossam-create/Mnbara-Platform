# Control Center Deployment Checklist

Ensure the following steps are completed before deploying the Control Center modules to production.

## 1. Environment Configuration
- [ ] `VITE_PAYMOB_API_KEY` is set in the production environment.
- [ ] `VITE_PAYMOB_IFRAME_ID` and `VITE_PAYMOB_INTEGRATION_ID` are configured for the production merchant account.
- [ ] Backend `AuditAction` enums are synced with the frontend logging calls.

## 2. RBAC Verification
- [ ] Verify that only users with `admin` or `super_admin` roles can access `/control-center/*` routes.
- [ ] Ensure `DashboardLayout.tsx` correctly hides the "Ship Control" menu for unauthorized users (if applicable).

## 3. UI/UX Consistency
- [ ] Dark glassmorphism styles are rendering correctly across all browsers.
- [ ] Review all mock widgets (Operations, Logistics, etc.) for any "TODO" or placeholder text that needs real-time data binding.

## 4. Audit & Security
- [ ] Confirm `logManualDecision` is called for every sensitive action in the UI.
- [ ] Verify that the `/api/audit/event` endpoint is reachable and authorized.

## 5. Post-Deployment Verification
- [ ] Run a manual smoke test on the `Operations` and `Disputes` pages.
- [ ] Check the backend logs to confirm audit events are being recorded with the correct metadata.
