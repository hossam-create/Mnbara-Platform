# MNbarh Platform - Bank Readiness & Compliance Package

## 1. System Architecture Overview

The MNbarh Financial Platform is architected on a **Zero-Trust, Ledger-Centric** model. The system creates a separation of concerns between transaction initiation (Frontend/Gateway) and financial finality (Ledger/Payout).

### 1.1 Wallet Service (Ledger-Only)
The core financial engine is the `Wallet Service`, which operates strictly on an append-only ledger model.
-   **No Mutable Balances:** There are no database columns storing mutable account balances.
-   **Derivation:** All balances are derived dynamically by summing confirmed ledger entries.
-   **Immutability:** Once a ledger entry is committed, it cannot be altered or deleted. Corrective actions require new countervailing entries.

### 1.2 Ledger Model
The ledger records atomic financial events ensuring double-entry bookkeeping principles where applicable within the platform scope.
-   **Atomic Writes:** All writes are wrapped in strict serializable transactions.
-   **Traceability:** Every entry is linked to a specific `referenceId` (e.g., Order ID, Payout ID) and an `idempotencyKey` to prevent duplication.

### 1.3 Escrow Service
The platform enforces a strict **Hold/Release** mechanism for marketplace transactions.
-   **HOLD:** Funds are debited from the Buyer and credited to a system-controlled `Escrow Wallet`.
-   **RELEASE:** Upon verified delivery/completion, funds are debited from the `Escrow Wallet` and credited to the Seller's `Available Balance`.
-   **REFUND:** In dispute scenarios, funds reverse from `Escrow` back to the Buyer.

### 1.4 Payment Gateway & Reconciliation
-   **Ingress:** External funds enter via Payment Gateways (e.g., Stripe, PayPal). The system treats webhook notifications as authoritative triggers for ledger credits only after signature verification.
-   **Reconciliation:** A read-only service periodically verifies external gateway reports against internal ledger state to detect discrepancies (e.g., chargebacks, missing webhooks). This service has no write authority.

### 1.5 Payout Service
The only egress point for funds.
-   **Dual-Approval:** High-value payouts require secondary authorization.
-   **Bank Adapter:** An abstraction layer communicates with external banking rails. The system waits for asynchronous confirmation from the bank before marking a payout as `SETTLED`.

---

## 2. Funds Flow Diagram (Textual)

This section details the lifecycle of funds from ingestion to disbursement.

### 2.1 Ingestion (Buyer Top-up/Purchase)
1.  **Initiation:** Buyer initiates payment via Frontend.
2.  **Processing:** Gateway processes the charge.
3.  **Confirmation:** Gateway sends a secure webhook to the Platform.
4.  **Ledger Entry:** Platform allows credit to Buyer's Wallet **only** upon successful webhook verification.
    *   *Result:* `Buyer Balance > 0`

### 2.2 Transaction Integrity (Escrow Hold)
1.  **Order Placement:** Buyer commits to an order.
2.  **Atomic Swap:** System performs an atomic ledger transaction:
    *   Debit `Buyer Wallet`.
    *   Credit `Escrow Wallet`.
3.  **Lock:** Funds are now legally held by the Platform, accessible to neither Buyer nor Seller.

### 2.3 Settlement (Escrow Release)
1.  **Trigger:** Delivery confirmation or service completion event.
2.  **Ledger Entry:** System performs an atomic ledger transaction:
    *   Debit `Escrow Wallet`.
    *   Credit `Seller Wallet`.
3.  **Availability:** Funds become part of the Seller's `Available Balance` eligible for payout.

### 2.4 Disbursement (Payout)
1.  **Request:** Seller requests withdrawal.
2.  **Validation:** System checks `Available Balance` (excluding pending escrow).
3.  **Hold:** Payout amount is immediately debited from `Seller Wallet` to a `Payout Suspense` account to prevent double-spending.
4.  **Execution:** Instruction sent to Bank Adapter.
5.  **Settlement:** Upon bank confirmation `AGREED/PROCESSED`, the transaction is finalized. If failed, funds reverse from `Suspense` back to `Seller Wallet`.

---

## 3. Control & Safeguards Matrix

| Risk Category | Control Implementation | Enforcement Mechanism | Evidence / Audit |
| :--- | :--- | :--- | :--- |
| **Double Spend** | Append-only Ledger + Atomic Transactions | Application-layer Locking & Queueing | Ledger Logs / Transaction Hashes |
| **Tampering** | Immutable Ledger Rows | Database Permissions (No `UPDATE`/`DELETE`) | DB Query Logs |
| **Unauth. Payout** | Dual-Approval Workflow | Payout Service Logic Gates | Approval Audit Trail |
| **Replay Attacks** | Idempotency Keys | Unique Constraint on `(provider, ref_id)` | Gateway Ingestion Logs |
| **Fake Webhooks** | Signature Verification | Crypto-Signing Middleware | Security Exception Logs |
| **Race Conditions** | Serializable Isolation | Database Transaction Level | Stress Test Reports |

---

## 4. Escrow & Guarantee Explanation

### 4.1 Escrow Guarantees
The Escrow system guarantees that:
1.  **Solvency:** A seller cannot withdraw funds that are tied to active, unfulfilled orders.
2.  **Refundability:** Funds remain available for return to the buyer if the seller fails to deliver.

### 4.2 Limitations (What is NOT Guaranteed)
-   **External Insolvency:** The system cannot guarantee funds if the underlying holding bank becomes insolvent.
-   **Legal Disputes:** Escrow release logic is programmatic based on platform signals; complex legal disputes are handled via administrative override (refunds).

### 4.3 Reconciliation Independence
The Reconciliation Service serves purely as a watchdog. It identifies discrepancies but **never** creates ledger entries automatically. Human intervention or specific replay tools are required to rectify accounting breaks ensuring no automated feedback loops can corrupt the ledger.

---

## 5. Bank Interaction Boundaries

### 5.1 Bank Authority
The Bank/Gateway is authoritative for **External Reality** (User's bank account actually received money).
-   **The Bank CAN:** Confirm deposits, Confirm payout settlement, Issue Chargebacks.
-   **The Bank CANNOT:** Direct internal ledger movements without specific platform commands (e.g., a webhook trigger).

### 5.2 Ledger Primacy
For the purpose of user balances within the platform, the **Ledger is Authoritative**.
-   The Bank is treated as an I/O peripheral.
-   This separation ensures that temporary bank outages or latency do not result in data corruption within the platform's financial state.

---

## 6. Audit & Traceability

### 6.1 End-to-End Tracing
Every financial change is traceable via a chain of IDs:
`Gateway Transaction ID` -> `Platform Webhook ID` -> `Ledger Entry ID` -> `User Balance Change`

### 6.2 Logs
1.  **Command Logs:** Record the intent (e.g., "User requested Payout").
2.  **Ledger Logs:** Record the financial fact (e.g., "Main Wallet Debited 100 USD").
3.  **Reconciliation Logs:** Record the verification fact (e.g., "Ledger matches Stripe Report for Date X").

---

## 7. FAQ for Regulator / Bank Partner

**Q: Can money move within the system without passing through Escrow?**
A: No. Peer-to-peer transfers are bound by the same ledger rules. Marketplace transactions strictly enforce the Escrow wallet step to ensure consumer protection.

**Q: Can a developer or admin manually edit a user's balance?**
A: No. The database schema prevents direct balance modification. An admin must create a "Manual Adjustment" ledger entry, which creates an immutable audit trail of the action and the responsible identity.

**Q: Who authorizes payouts?**
A: Payouts are programmatically authorized based on available ledger balance. High-value thresholds trigger a requirement for human review/digital signature before the instruction is released to the banking rail.

**Q: What happens if webhooks are delayed?**
A: The user's balance will not update until the webhook arrives and is verified. This "fail-safe" approach prevents crediting funds that have not been confirmed captured by the gateway.

**Q: How are disputes handled financially?**
A: If a dispute is resolved in favor of the buyer, the system executes a `REFUND` transaction from the Escrow Wallet. This preserves the integrity of the Seller's earned funds from other completed orders.

**Q: What prevents a replay attack where a deposit is counted twice?**
A: All financial ingestion endpoints enforce strict Idempotency Checks. A transaction reference submitted a second time will be rejected by the ingestion layer before reaching the ledger.

---

## 8. Final Compliance Statement

The MNbarh Financial Platform architecture complies with strict financial safety principles, prioritizing data integrity and separation of concerns. By enforcing an immutable, ledged-based source of truth and isolating external banking interactions from internal state management, the system eliminates single points of failure regarding financial authority. The platform is designed to be audit-ready, secure against common financial attack vectors, and is prepared for controlled production deployment under regulatory oversight.
