import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const TrustSafetyPage: React.FC = () => {
  return (
    <ContentPageLayout title="Trust & Safety" showSidebar={false}>
      <section>
        <h2>Platform guarantees</h2>
        <ul>
          <li>Payments are collected upfront; item amount is held until delivery is confirmed or a dispute is resolved.</li>
          <li>Service fees are separated immediately; payouts to travelers are manual and only after confirmation.</li>
          <li>All in-app communication is logged to support evidence-based reviews.</li>
          <li>Clear dispute and cancellation flows with published timelines and refund rules.</li>
        </ul>
      </section>

      <section>
        <h2>Limitations</h2>
        <ul>
          <li>No guarantee of product authenticity or condition without evidence.</li>
          <li>Delivery times may vary due to travel, weather, or customs.</li>
          <li>No recovery guarantee for prohibited, seized, or confiscated items.</li>
          <li>No instant payouts; no immunity from chargebacks initiated by banks.</li>
        </ul>
      </section>

      <section>
        <h2>How disputes, delivery, and payments are handled</h2>
        <ul>
          <li><strong>Delivery flow:</strong> Request → Accept → Pickup → In progress → Delivered → Rating.</li>
          <li><strong>Payments:</strong> Captured at request creation; item amount held; released after delivery confirmation or dispute outcome.</li>
          <li><strong>Disputes:</strong> File within 72 hours of delivery attempt; provide photos, receipts, chat logs; manual review target 3–5 business days.</li>
          <li><strong>Refunds:</strong> Based on timing and evidence per Cancellation & Refund Policy; processing fee usually retained.</li>
        </ul>
      </section>

      <section>
        <h2>Your responsibilities</h2>
        <ul>
          <li>Keep all communication and proof (photos, receipts, timestamps) on-platform.</li>
          <li>Verify item condition at pickup and delivery; capture evidence.</li>
          <li>Follow local laws, customs, and prohibited-item rules.</li>
          <li>Respond promptly to the other party and to support requests for evidence.</li>
        </ul>
      </section>

      <section>
        <h2>How to get help</h2>
        <ul>
          <li>Use the in-app “Report issue” on any order or request.</li>
          <li>Open a dispute with photos, receipts, and chat history if needed.</li>
          <li>Contact support for urgent safety concerns.</li>
        </ul>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default TrustSafetyPage;
