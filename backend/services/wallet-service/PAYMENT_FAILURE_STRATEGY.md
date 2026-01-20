# Payment Failure & Reconciliation Strategy

## Failure Matrix

| Scenario | System State | User Experience | Handling Strategy |
| :--- | :--- | :--- | :--- |
| **Payment Success, Webhook Delayed** | Funds deducted at gateway, Wallet not credited. | User sees "Processing..." spinner. | **Async Recovery**: Webhook eventually arrives. Ledger updated atomically. **UX**: Client polls status endpoint. |
| **Webhook Arrives Before Redirect** | Wallet credited immediately. | User redirected to "Success" page. | **Idempotency**: Client redirect triggers status check. If webhook comes again later, it is ignored (already processed). |
| **Payment Failed (Card Declined)** | Gateway records failure. | User sees error message. | **Audit**: Webhook `PAYMENT_FAILED` logged in `PaymentEvent`. No Ledger update. User prompted to retry. |
| **Double Webhook Delivery** | multiple requests with same Event ID. | Transparent. | **Strict Idempotency**: `PaymentEvent` table constraint prevents duplicate processing. 2nd request returns 200 OK immediately. |
| **Lost Webhook (Gateway Outage)** | Funds deducted, Webhook NEVER arrives. | user blocked on "Processing". | **Reconciliation Job**: Job polls gateway for status of "Pending" orders. If success found but no Ledger Entry, triggers synthetic event processing. |
| **Signature Mismatch** | Attack attempt or config error. | User unaffected (or payment fails). | **Security**: Request rejected (400). Alert logged. |

## Reconciliation Strategy

### 1. Passive Recovery (Webhook Retries)
Gateways (Stripe, Paymob) automatically retry webhooks with exponential backoff for up to 3 days (Stripe) or 24 hours (Others).
- **Service Action**: Return `500` for transient errors (DB connection) to trigger retry. Return `400` or `200` for permanent errors to stop retry.

### 2. Active Recovery (Polling / Reconciliation Job)
For critical "Lost Webhook" scenarios where the gateway stops retrying or network completely dropped packet:

**Algorithm:**
1.  Identify `PaymentIntent` IDs that are `PENDING` > 15 minutes.
2.  For each ID, call `gateway.getPaymentDetails(id)`.
3.  Compare Gateway Status vs. Internal Status.
    -   If Gateway `SUCCESS` && Internal `MISSING`: **Trigger Recovery**.
    -   If Gateway `FAILED`: Mark Internal as Failed.
4.  **Recovery Action**: Invoke `PaymentProcessingService.processWebhook` with a "Synthetic" payload constructed from the polling result.

### 3. Manual Intervention
Admin Control Center provides "Check Status" button for specific transactions.
- Calls `PaymentReconciliationService.reconcileOne(gateway, id)`.
