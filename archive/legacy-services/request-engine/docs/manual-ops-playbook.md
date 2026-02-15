# Manual Ops Playbook — Payments, Escrow, Payouts

This is an operational checklist for real-money flows. Use after Stripe payment success and during delivery/payout.

## When payment succeeded (Stripe `payment_intent.succeeded`)
- Verify request status is `ACCEPTED` or `IN_PROGRESS` eligible for funding; if not, halt and investigate.
- Confirm amounts recorded: `item_amount` (escrow hold) and `platform_fee` (recognized revenue).
- Ensure receipt is generated and stored (PDF/email-ready) with fee breakdown and payment method summary.
- Notify requester and traveler that funds are secured and awaiting traveler acceptance (if not already accepted).
- Set `escrow_hold_amount = item_amount` and keep `payout_status = pending_delivery`.
- Monitor for immediate disputes or cancellations per policy timing.

## Monitor delivery (while in progress)
- Track status updates: `ACCEPTED → IN_PROGRESS → DELIVERED`.
- Collect/verify evidence: pickup photo, delivery photo, receipts, chat confirmations.
- If traveler cancels: mark request accordingly, initiate refund per policy (service fee usually retained), release hold.
- If requester cancels: apply timing table for refunds; adjust escrow hold accordingly.
- If dispute opened: keep funds held; begin evidence review; set `dispute_status = open`.

## When delivery confirmed
- Validate delivery proof (photo + chat confirmation/time stamp); ensure no open disputes.
- Mark `escrow_releasable = true`; set `payout_status = ready_for_manual_payout`.
- Update timeline/status history; notify requester and traveler of pending payout.
- If dispute exists, do not release; route to dispute resolution first.

## Manual payout (not automated)
- Confirm payee identity and payout details (bank/Wallet/PSP).
- Calculate payable = item_amount minus any agreed adjustments or refunds.
- Execute payout via approved manual channel; record transaction reference.
- Update system: `payout_status = paid`, store payout reference, date, amount, operator.
- Send payout confirmation to traveler and delivery completion confirmation to requester.

## If dispute arises
- Keep escrow held until decision.
- Collect evidence from both sides; target review SLA 3–5 business days.
- Possible outcomes: full refund, partial refund, or release to traveler.
- Update receipt/ledger accordingly; issue refund receipt if applicable.

## If cancellation occurs
- Apply timing policy for requester-initiated cancellations.
- If traveler cancels, refund requester item_amount; retain service fee per policy.
- If no traveler found (expiry), refund item_amount + service fee; waive processing fee.
- Update `escrow_hold_amount` to 0 when funds are released/refunded.

## Daily reconciliation checklist
- Reconcile Stripe payments vs internal Payment records (status, amounts, fees).
- Verify all succeeded payments have receipts and escrow flags set.
- Review pending payouts and disputes; prioritize oldest items.
- Confirm notifications were sent for status changes.

## Incident handling
- Payment mismatch: freeze payout; investigate PI/charge data; correct records.
- Fraud suspicion: pause payout; flag account; escalate to Trust & Safety.
- Chargeback notice: lock related payout; gather evidence; respond via Stripe.

## Key statuses to track
- Payment: pending, requires_action, succeeded, failed, canceled, refunded
- Request: CREATED, VISIBLE_TO_TRAVELERS, ACCEPTED, IN_PROGRESS, DELIVERED, CANCELLED, EXPIRED
- Payout: pending_delivery, ready_for_manual_payout, paid, held
- Dispute: open, under_review, resolved_refund, resolved_release

## Communications
- Success: “Payment received. Funds secured. Waiting for traveler acceptance.”
- In-progress: “Funds held in escrow until delivery confirmation.”
- Ready for payout: “Delivery confirmed. Preparing payout.”
- Dispute: “Funds held during review. Please provide evidence.”

_Last updated: 2026-01-21. Owner: Payments/Operations._
