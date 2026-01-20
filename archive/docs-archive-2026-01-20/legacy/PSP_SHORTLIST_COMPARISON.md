# PSP Shortlist - System & Integration Comparison

| **PSP** | **Region** | **Cards** | **Bank Transfer** | **Wallets** | **Webhooks** | **Idempotency** | **Reconciliation** | **Escrow/Hold** | **Sandbox** | **SLA** |
|---------|-----------|----------|-------------------|-------------|-------------|-----------------|-------------------|------------|-----------|---------|
| **Stripe** | US/EU/MENA | ✅ Full | ✅ ACH/SEPA/Wire | ✅ Apple/Google | ✅ Native | ✅ Idempotency-Key | ✅ API + Dashboard | ✅ Holds (Charges) | ✅ Full | 99.9% |
| **Adyen** | US/EU/MENA | ✅ Full | ✅ SEPA/Wire | ✅ Digital Wallets | ✅ Native | ✅ Idempotency-Key | ✅ API + Reports | ✅ Holds (Authorizations) | ✅ Full | 99.95% |
| **Paymob** | MENA | ✅ Full | ✅ Local Banks | ✅ Wallet (Fawry) | ✅ Native | ✅ Idempotency-Key | ✅ Dashboard | ⚠️ Limited | ✅ Full | 99.5% |
| **2Checkout** | US/EU/MENA | ✅ Full | ✅ ACH/SEPA | ✅ Digital Wallets | ✅ Native | ✅ Idempotency-Key | ✅ API + Dashboard | ✅ Holds | ✅ Full | 99.9% |
| **Wise** | US/EU/MENA | ⚠️ Limited | ✅ Multi-Currency | ✅ Wise Account | ⚠️ Webhooks | ✅ Idempotency-Key | ✅ API | ❌ No | ✅ Full | 99.8% |
| **PayPal** | US/EU/MENA | ✅ Full | ✅ ACH/SEPA | ✅ PayPal Wallet | ✅ Native | ✅ Idempotency-Key | ✅ API + Dashboard | ✅ Holds (Auth) | ✅ Full | 99.9% |
| **Square** | US/EU | ✅ Full | ✅ ACH | ✅ Square Cash | ✅ Native | ✅ Idempotency-Key | ✅ Dashboard | ✅ Holds | ✅ Full | 99.9% |
| **Razorpay** | MENA/Asia | ✅ Full | ✅ Local Banks | ✅ Wallet | ✅ Native | ✅ Idempotency-Key | ✅ Dashboard | ✅ Holds | ✅ Full | 99.9% |
| **Flutterwave** | MENA/Africa | ✅ Full | ✅ Local Banks | ✅ Mobile Money | ✅ Native | ✅ Idempotency-Key | ✅ Dashboard | ⚠️ Limited | ✅ Full | 99.5% |
| **Checkout.com** | US/EU/MENA | ✅ Full | ✅ SEPA/Wire | ✅ Digital Wallets | ✅ Native | ✅ Idempotency-Key | ✅ API + Dashboard | ✅ Holds | ✅ Full | 99.95% |

---

## Key Findings

### API Maturity Leaders
- **Stripe, Adyen, Checkout.com**: Enterprise-grade webhooks, full idempotency support, comprehensive reconciliation APIs
- **PayPal, 2Checkout**: Mature ecosystems with strong webhook reliability

### Escrow/Hold Support
- **Strong**: Stripe, Adyen, PayPal, 2Checkout, Checkout.com, Square, Razorpay
- **Limited**: Paymob, Flutterwave (require custom implementation)
- **None**: Wise (FX-only, no holds)

### Regional Coverage
- **US/EU/MENA**: Stripe, Adyen, 2Checkout, PayPal, Checkout.com, Wise
- **MENA-Specific**: Paymob (Egypt), Razorpay (India/MENA), Flutterwave (Africa/MENA)
- **Best for Cross-Border**: Wise (FX), Adyen (multi-currency), Checkout.com

### Sandbox & SLA
- **All have production-grade sandboxes**
- **Highest SLA**: Adyen (99.95%), Checkout.com (99.95%)
- **Standard SLA**: Stripe, PayPal, Square, Razorpay (99.9%)

---

## Recommendation by Use Case

| **Use Case** | **Primary** | **Secondary** | **Tertiary** |
|-------------|-----------|--------------|------------|
| **Global Marketplace** | Adyen | Checkout.com | Stripe |
| **MENA Focus** | Paymob | Razorpay | Flutterwave |
| **Cross-Border FX** | Wise | Adyen | Checkout.com |
| **Escrow-Heavy** | Stripe | Adyen | PayPal |
| **High-Volume** | Checkout.com | Adyen | Stripe |
| **Cost-Optimized** | Razorpay | Paymob | Flutterwave |

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025  
**Status:** PSP Evaluation Complete
