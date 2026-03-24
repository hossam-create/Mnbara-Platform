import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const TrustSellerProtectionPage: React.FC = () => {
  return (
    <ContentPageLayout title="Seller / Traveler Protection" showSidebar={false}>
      <section>
        <h2>When you’re protected</h2>
        <ul>
          <li>You accept requests only through the platform (no off-platform deals).</li>
          <li>You provide pickup and delivery proof: photos, receipts, timestamps, and in-app chat.</li>
          <li>You follow routes and item rules (no prohibited items; comply with customs and transport laws).</li>
          <li>You keep status updated (pickup, in-progress, delivered) inside the app.</li>
        </ul>
      </section>

      <section>
        <h2>Common risks we help reduce</h2>
        <ul>
          <li>Buyer unresponsiveness: funds remain held until a resolution.</li>
          <li>Fraudulent claims: evidence-based review protects compliant travelers.</li>
          <li>Failed buyer payments: payments are captured upfront before visibility to travelers.</li>
          <li>Auto-relist: if a buyer cancels early, the request can be made visible again (per policy) to new travelers.</li>
        </ul>
      </section>

      <section>
        <h2>Evidence required</h2>
        <ul>
          <li>Pickup: photo of item, receipt or order confirmation, timestamp.</li>
          <li>Transit: optional check-ins for high-value or urgent items.</li>
          <li>Delivery: photos, handover confirmation, chat confirmation from buyer when possible.</li>
          <li>All communication: keep in-app; avoid external messaging for admissible evidence.</li>
        </ul>
      </section>

      <section>
        <h2>Not covered</h2>
        <ul>
          <li>Prohibited or dangerous goods, or customs seizures.</li>
          <li>Off-platform payments or communication.</li>
          <li>Missing evidence of pickup/delivery.</li>
          <li>Guarantees of on-time delivery when travel, weather, or customs intervene.</li>
        </ul>
      </section>

      <section>
        <h2>Outcomes</h2>
        <ul>
          <li>With sufficient evidence, held funds are released to you after manual review.</li>
          <li>If evidence is insufficient, buyer-facing remedies may apply (partial or full refund).</li>
          <li>Repeated violations can lead to loss of protection, suspension, or payout holds.</li>
        </ul>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default TrustSellerProtectionPage;
