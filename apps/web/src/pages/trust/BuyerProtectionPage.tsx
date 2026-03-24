import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const TrustBuyerProtectionPage: React.FC = () => {
  return (
    <ContentPageLayout title="Buyer Protection" showSidebar={false}>
      <section>
        <h2>What’s protected</h2>
        <ul>
          <li>Paid through the platform with on-platform communication and proof.</li>
          <li>Item not delivered or materially different from description (with evidence).</li>
          <li>Unauthorized off-platform requests rejected; payments held until delivery confirmation.</li>
        </ul>
      </section>

      <section>
        <h2>Not covered</h2>
        <ul>
          <li>Quality or authenticity claims without evidence.</li>
          <li>Customs, taxes, or delays due to travel, weather, or regulation.</li>
          <li>Prohibited items, off-platform payments, or communication.</li>
        </ul>
      </section>

      <section>
        <h2>Dispute steps & timelines</h2>
        <ol>
          <li>Open a dispute within 72 hours of delivery attempt or missed delivery.</li>
          <li>Provide photos, receipts, chat history, and timestamps.</li>
          <li>Manual review target: 3–5 business days.</li>
          <li>Outcome: refund (full/partial) or release of funds to traveler.</li>
        </ol>
      </section>

      <section>
        <h2>Refund expectations</h2>
        <ul>
          <li>Item amount: refunded when evidence supports buyer claim.</li>
          <li>Service fees: generally non-refundable after 1 hour unless no traveler found/expired.</li>
          <li>Processing fee: typically retained except on expiry.</li>
          <li>Funds returned to original payment method; bank timelines apply.</li>
        </ul>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default TrustBuyerProtectionPage;
