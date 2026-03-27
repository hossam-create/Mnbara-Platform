@echo off
echo 🛡️  MNbarh Production Safety Checklist
echo =====================================
echo Final verification before production launch
echo.

echo 🔐 1. ENVIRONMENT VARIABLES CHECK
echo    Required secrets to verify manually:
echo    - STRIPE_SECRET_KEY
echo    - PAYMOB_API_KEY
echo    - JWT_SECRET
echo    - DATABASE_URL
echo    - AWS_ACCESS_KEY_ID
echo.
echo    Run: echo %STRIPE_SECRET_KEY% to check if set
echo.

echo 🚨 2. KILL SWITCH CHECK
echo    Run this SQL query to verify:
echo    SELECT value FROM system_control WHERE key = 'SYSTEM_FINANCIAL_MODE';
echo    Expected result: ACTIVE
echo.

echo 🔗 3. WEBHOOK SECURITY CHECK
echo    Verify these files have proper security:
if exist "backend\services\payment-service\src\webhooks\stripe.ts" (
    echo    ✅ Found: backend\services\payment-service\src\webhooks\stripe.ts
    echo    Check for: raw body parsing, signature verification
) else (
    echo    ❌ Missing: stripe.ts webhook file
)

echo.
echo ⚖️  4. RECONCILIATION CHECK
echo    Verify reconciliation is read-only:
if exist "backend\services\wallet-service\src\reconciliation\index.ts" (
    echo    ✅ Found: reconciliation file
    echo    Ensure: No UPDATE/INSERT queries on wallet/ledger tables
) else (
    echo    ❌ Missing: reconciliation file
)

echo.
echo 👑 5. ADMIN ROLES CHECK
echo    Verify admin roles are defined:
if exist "backend\services\auth-service\src\roles\definitions.ts" (
    echo    ✅ Found: admin roles file
    echo    Ensure: ADMIN, SUPER_ADMIN roles with proper permissions
) else (
    echo    ❌ Missing: admin roles file
)

echo.
echo 🎭 6. MOCK ADAPTERS CHECK
echo    Verify no test mocks in production:
if exist "backend\services\payment-service\src\index.ts" (
    echo    ✅ Found: payment service main file
    echo    Check: No NODE_ENV=production with mock adapters
)

echo.
echo 📋 FINAL CHECKLIST
echo ===================
echo.
echo Before production launch, manually verify:
echo ✅ ENV secrets are real (not placeholders)
echo ✅ Kill switch = ACTIVE in database
echo ✅ Webhooks use raw body + signature verification
echo ✅ Reconciliation is read-only
echo ✅ Admin roles defined with RBAC
echo ✅ No mock adapters in production build
echo.
echo If all items are ✅ → You are ready for launch! 🚀
echo If any items show ❌ → Fix before proceeding
echo.
echo Additional checks:
echo • SSL/TLS certificates
echo • Rate limiting configuration
echo • Database backup procedures
echo • Monitoring and alerting

pause