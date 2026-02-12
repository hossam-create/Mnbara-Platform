@echo off
REM Archive Organization Script
REM Created: January 31, 2026

echo ========================================
echo Moving Completed Reports to Archive
echo ========================================
echo.

REM Create archive directories if they don't exist
if not exist "archive\phase-reports\custodii" mkdir "archive\phase-reports\custodii"
if not exist "archive\phase-reports\p2p-exchange" mkdir "archive\phase-reports\p2p-exchange"
if not exist "archive\phase-reports\disputes" mkdir "archive\phase-reports\disputes"
if not exist "archive\phase-reports\auction" mkdir "archive\phase-reports\auction"
if not exist "archive\phase-reports\payments" mkdir "archive\phase-reports\payments"
if not exist "archive\phase-reports\wallet" mkdir "archive\phase-reports\wallet"
if not exist "archive\implementation-reports" mkdir "archive\implementation-reports"
if not exist "archive\testing-reports" mkdir "archive\testing-reports"
if not exist "archive\project-management" mkdir "archive\project-management"

echo Moving Custodii files...
move /Y CUSTODII_*.md archive\phase-reports\custodii\ 2>nul
move /Y PHASE_4.1_*.md archive\phase-reports\custodii\ 2>nul
move /Y PHASE_4.2_*.md archive\phase-reports\custodii\ 2>nul

echo Moving P2P Exchange files...
move /Y P2P_EXCHANGE_*.md archive\phase-reports\p2p-exchange\ 2>nul
move /Y PHASE_8_*.md archive\phase-reports\p2p-exchange\ 2>nul
move /Y UPTIME_MONITORING_*.md archive\phase-reports\p2p-exchange\ 2>nul

echo Moving Disputes files...
move /Y DISPUTES_*.md archive\phase-reports\disputes\ 2>nul

echo Moving Auction files...
move /Y AUCTION_*.md archive\phase-reports\auction\ 2>nul
move /Y TRUST_SAFETY_*.md archive\phase-reports\auction\ 2>nul
move /Y EVENT_*.md archive\phase-reports\auction\ 2>nul
move /Y RULES_ENGINE_*.md archive\phase-reports\auction\ 2>nul
move /Y SEEDED_RULES_*.md archive\phase-reports\auction\ 2>nul
move /Y RULE_*.md archive\phase-reports\auction\ 2>nul

echo Moving Payments files...
move /Y PAYMENTS_*.md archive\phase-reports\payments\ 2>nul
move /Y PAYMENT_*.md archive\phase-reports\payments\ 2>nul
move /Y RATE_LIMITING_*.md archive\phase-reports\payments\ 2>nul

echo Moving Wallet files...
move /Y WALLET_*.md archive\phase-reports\wallet\ 2>nul
move /Y MANUAL_PAYOUT_*.md archive\phase-reports\wallet\ 2>nul

echo Moving Implementation Reports...
move /Y *_COMPLETE.md archive\implementation-reports\ 2>nul
move /Y *_COMPLETION_REPORT.md archive\implementation-reports\ 2>nul
move /Y *_IMPLEMENTATION_*.md archive\implementation-reports\ 2>nul
move /Y *_SUMMARY.md archive\implementation-reports\ 2>nul
move /Y *_CERTIFICATION.md archive\implementation-reports\ 2>nul
move /Y IMPLEMENTATION_*.md archive\implementation-reports\ 2>nul
move /Y FEATURES_*.md archive\implementation-reports\ 2>nul
move /Y SECURITY_*.md archive\implementation-reports\ 2>nul

echo Moving Testing Reports...
move /Y BACKEND_TESTS_*.md archive\testing-reports\ 2>nul
move /Y MOCK_DATA_*.md archive\testing-reports\ 2>nul
move /Y TASK_*.md archive\testing-reports\ 2>nul
move /Y DEBUG_*.md archive\testing-reports\ 2>nul
move /Y DEBUGGING_*.md archive\testing-reports\ 2>nul
move /Y REFACTORING_*.md archive\testing-reports\ 2>nul
move /Y OPTIMIZATION_*.md archive\testing-reports\ 2>nul
move /Y PHASE_7_*.md archive\testing-reports\ 2>nul

echo Moving Project Management files...
move /Y PROJECT_*.md archive\project-management\ 2>nul
move /Y IMPLEMENTATION_PROGRESS_TRACKER.md archive\project-management\ 2>nul
move /Y REALITY_CHECK_*.md archive\project-management\ 2>nul
move /Y QUICK_START_*.md archive\project-management\ 2>nul
move /Y TASKS_MD_*.md archive\project-management\ 2>nul
move /Y PHASE_5_*.md archive\project-management\ 2>nul
move /Y PHASE_6_*.md archive\project-management\ 2>nul
move /Y USER_JOURNEY_*.md archive\project-management\ 2>nul
move /Y SIGNAL_*.md archive\implementation-reports\ 2>nul
move /Y ENUM_*.md archive\implementation-reports\ 2>nul
move /Y STRICT_*.md archive\implementation-reports\ 2>nul
move /Y UPDATED_*.md archive\implementation-reports\ 2>nul

echo.
echo ========================================
echo Archive Organization Complete!
echo ========================================
echo.
echo Active files remaining in root:
echo - README.md
echo - Mnbarh_BUILD_MAP.md
echo - PHASE_1_EXECUTION_CHECKLIST.md
echo - FAST_TRACK_LAUNCH_STRATEGY.md
echo - ORIGINAL_VISION_VS_CURRENT_REALITY.md
echo - ACTIVE_FILES_INDEX.md
echo - CLEANUP_ARCHIVE_PLAN.md
echo.
echo All completed work archived in: archive\
echo.
pause
