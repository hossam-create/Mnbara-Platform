# External Projects Integration (Full)

**Purpose:** All projects under `docs/external-projects/` are **fully integrated** into the Mnbara platform so they run at full capacity inside the main codebase—no "reference only."

**Related:** [MNBARA_MASTER_DOCUMENTATION.md](./MNBARA_MASTER_DOCUMENTATION.md)

---

## 1. Overview

| External Project | Where It Lives in Main Project | What Was Done |
|------------------|--------------------------------|----------------|
| **Real-Time-Bike-Auction-System-Backend** | `backend/services/auction-service/` | Scheduler (SCHEDULED→ACTIVE), Buy Now, anti-sniping and idempotency already present; added `startScheduledAuctions()`, `buyNow()` in RealtimeBidService, route `POST /auctions/:id/buy-now`. |
| **SmartContractEscrowSystem** | `backend/services/escrow-service/blockchain/` | Copied `EscrowContract.sol` and README; fiat escrow stays in parent service; this is used for future crypto escrow. |
| **KYC-Website** | `backend/services/kyc-service/` + `frontend/web-app/src/pages/kyc/` + API Gateway | KYC flow: ID + selfie (camera or upload). Gateway route `/api/v1/kyc` → kyc-service; new page `/trust/kyc` and `apiService.kyc.submit` / `getStatus`. |
| **mobile/flutter_app** | `mobile-app-flutter/` (root) | Full app copied; config points to platform API Gateway. |
| **stripe-connect-sample** | Already implemented in `backend/services/stripe-connect-service/` | No copy; service already implements Connect onboarding. Sample remains under docs for Stripe reference. |
| **xyOps** | Optional ops stack: `docker-compose.yml` + `docs/external-projects/xyops/` | Job scheduling, workflows, server monitoring, alerting. Run as optional service; admin can link to it. See §3.7. |
| **SiriusScan, openskills** | `docs/external-projects/` | Kept as reference; not part of core marketplace (security/skills). |

---

## 2. What “Full Integration” Means

- **كود مدمج (integrated code):** Logic or assets from the external project live in the main repo and are used by the platform (e.g. auction scheduler, buy-now, KYC page, Solidity contract, Flutter app).
- **مرجع فقط (reference only):** Previously we only linked to external projects from READMEs. Now, everything that is part of the product is **integrated**; only non–core projects (SiriusScan, xyops, openskills) stay as reference.

---

## 3. Per-Project Details

### 3.1 Real-Time-Bike-Auction-System-Backend

- **In auction-service:**
  - **startScheduledAuctions()** in `auction.service.ts`: every minute (same cron as endExpiredAuctions), auctions with `status=SCHEDULED` and `auctionStartsAt <= now` are started (status → ACTIVE).
  - **buyNow(listingId, userId)** in `realtime-bid.service.ts`: instant purchase at `buyNowPrice` with row locking; auction set to ENDED_AWAITING_SETTLEMENT, winner set.
  - **Route:** `POST /api/auctions/:auctionId/buy-now` in `realtime-bid.routes.ts`.
- Anti-sniping, idempotency, and real-time bids were already in place; Bike logic is fully merged.

### 3.2 SmartContractEscrowSystem

- **Location:** `backend/services/escrow-service/blockchain/`
- **Contents:** `EscrowContract.sol` (createTransaction, addSignature, lock, release, dispute, resolve, getStatus) and `README.md` for build/deploy and backend integration.
- **Usage:** Fiat escrow remains in the main escrow-service; this contract is for future crypto/blockchain escrow when the platform supports it.

### 3.3 KYC-Website

- **Backend:** Existing `kyc-service` (TypeScript) already has `/kyc/submit` and `/kyc/status`. No MongoDB; platform uses its own DB.
- **Gateway:** Route added in `backend/services/api-gateway/src/config/routes.config.ts`: `/api/v1/kyc` → kyc-service (pathRewrite to `/kyc`). Env: `KYC_SERVICE_URL`.
- **Frontend:** New page `frontend/web-app/src/pages/kyc/KYCVerificationPage.tsx`: ID type, ID number, full name, ID photo upload, selfie (camera or file). Calls `apiService.kyc.submit(formData)` and `apiService.kyc.getStatus()`. Route: **`/trust/kyc`**.

### 3.4 mobile/flutter_app (منبره)

- **Location:** `mobile-app-flutter/` at repo root (copied from `docs/external-projects/mobile/flutter_app/`).
- **Config:** `lib/core/config/app_config.dart` uses platform API base URL (e.g. gateway). All features (auth, cart, checkout, Stripe, bilingual, etc.) are in the main repo.

### 3.5 stripe-connect-sample

- **Integration:** The platform’s **stripe-connect-service** already implements Connect onboarding (create account, account link, refresh, status, balance, payouts). No separate copy of the sample in the codebase; the sample in `docs/external-projects/stripe-connect-sample/` remains as Stripe’s reference.

### 3.6 SiriusScan, openskills

- Remain under `docs/external-projects/` as reference (security scanning, skills). Not merged into core marketplace code.

### 3.7 xyOps (عمليات التشغيل والمراقبة)

**ما هو xyOps؟**  
منصة موحّدة لجدولة المهام (أقوى من cron)، أتمتة سير العمل (Workflow)، مراقبة السيرفرات، التنبيهات، والاستجابة للحوادث. مناسبة لفرق التشغيل التي تدير بنية منصة منبرة.

**التكامل مع منبرة:**
- **المصدر:** `docs/external-projects/xyops/` (مشروع كامل، BSD-3-Clause).
- **تشغيل كخدمة اختيارية:** في `docker-compose.yml` تمت إضافة خدمة **xyops** (صورة `ghcr.io/pixlcore/xyops:latest`) على المنافذ 5522 (واجهة ويب) و 5523. تشغيلها مع المنصة: `docker compose up -d xyops` أو إدراجها في نفس الـ stack.
- **الاستخدام:** فتح `http://localhost:5522` (مستخدم افتراضي `admin` / كلمة مرور `admin`). يمكنك جدولة jobs لخدمات منبرة، مراقبة صحة السيرفرات، وإعداد تنبيهات وworkflows.
- **رابط من الأدمن (اختياري):** إذا وُجد متغير `VITE_XYOPS_URL` أو رابط في لوحة التحكم، يمكن ربط "عمليات التشغيل" بصفحة xyOps.
- **لا يُدمج داخل كود المنصة:** xyOps تطبيق مستقل؛ التكامل = تشغيله بجانب المنصة وربطه تشغيلياً.

---

## 4. Where Things Live (Summary)

| Item | Path |
|------|------|
| Auction scheduler + Buy Now | `backend/services/auction-service/src/` (auction.service.ts, realtime-bid.service.ts, realtime-bid.routes.ts, index.ts cron) |
| Blockchain escrow contract | `backend/services/escrow-service/blockchain/EscrowContract.sol` |
| KYC API route | API Gateway → kyc-service; frontend `apiService.kyc` |
| KYC verification page | `frontend/web-app/src/pages/kyc/KYCVerificationPage.tsx`, route `/trust/kyc` |
| Flutter app | `mobile-app-flutter/` (root) |
| xyOps (optional) | `docker-compose.yml` service `xyops` (profile `ops`), ports 5522/5523; source `docs/external-projects/xyops/` |
| Reference-only | `docs/external-projects/stripe-connect-sample/`, `SiriusScan/`, `openskills/` |

---

## 5. Mobile Apps

- **mobile-app/** (root): React Native app (crowdshipping).
- **mobile-app-flutter/** (root): Flutter app (منبره e-commerce), fully integrated from external-projects.

---

*Last updated: February 2026 — Full integration (كود مدمج) completed.*
