import styles from './PaymentAdvisoryCard.module.css';
import { getPaymentQuote } from '@/services/payments/payment_quote.service';

type PaymentAdvisoryCardProps = {
  productPrice: number;
  travelerCurrency?: string;
};

export function PaymentAdvisoryCard({ productPrice, travelerCurrency }: PaymentAdvisoryCardProps) {
  const quote = getPaymentQuote({ product_price: productPrice, traveler_currency: travelerCurrency });

  return (
    <section className={styles.card} aria-labelledby="payment-advisory-heading">
      <header>
        <p className={styles.badge}>Advisory only</p>
        <h2 id="payment-advisory-heading" className={styles.heading}>
          Payment readiness overview
        </h2>
      </header>

      <div className={styles.grid}>
        <div className={styles.row}>
          <span>Product price</span>
          <span>${quote.product_price.toFixed(2)}</span>
        </div>
        <div className={styles.row}>
          <span>Traveler reward preview</span>
          <span>${quote.traveler_fee.toFixed(2)}</span>
        </div>
        <div className={styles.row}>
          <span>Platform fee preview</span>
          <span>${quote.platform_fee.toFixed(2)}</span>
        </div>
        <div className={styles.row}>
          <span>FX estimation (USD → {quote.estimated_fx.target_currency})</span>
          <span>{quote.estimated_fx.rate.toFixed(2)}</span>
        </div>
        <div className={styles.row}>
          <span>Estimated total</span>
          <span className={styles.total}>${quote.total_estimated.toFixed(2)}</span>
        </div>
      </div>

      <p className={styles.notice}>Buyer payment is required before any traveler action.</p>
      <p className={styles.pspNotice}>Funds held securely by the PSP — Mnbarh never stores your money.</p>
      <p className={styles.notice}>Manual release happens only after proof of delivery + human approval.</p>

      <ul className={styles.statusList}>
        <li>PSP provider: {String(quote.PSP_PROVIDER)}</li>
        <li>Wallet status: {quote.WALLET_STATUS} (PSP custody)</li>
        <li>Escrow status: {quote.ESCROW_STATUS} — manual release only</li>
        <li>{quote.estimated_fx.disclaimer}</li>
      </ul>

      <ul className={styles.safetyList}>
        <li>Device fingerprint + IP logging attached to every intent.</li>
        <li>Name match (KYC-lite) required before capture.</li>
        <li>Disputes default to manual Trust & Safety review.</li>
      </ul>
    </section>
  );
}
