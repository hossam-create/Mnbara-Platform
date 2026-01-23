import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const TrustSafetyTipsPage: React.FC = () => {
  return (
    <ContentPageLayout title="Safety Tips" showSidebar={false}>
      <section>
        <h2>Communication rules</h2>
        <ul>
          <li>Keep all messaging in-app so it is logged and reviewable.</li>
          <li>Never share payment details or accept off-platform payments.</li>
          <li>Confirm key details (item, price, deadlines, meeting spot) in writing.</li>
          <li>Report suspicious behavior immediately using in-app reporting.</li>
        </ul>
      </section>

      <section>
        <h2>Delivery proof tips</h2>
        <ul>
          <li>Pickup: photo of item, receipt or confirmation, and timestamp.</li>
          <li>Transit: optional check-in photos for high-value or urgent items.</li>
          <li>Delivery: photos of handover, packaging condition, and buyer confirmation in chat.</li>
          <li>Store all proofs inside the platform; avoid external apps.</li>
        </ul>
      </section>

      <section>
        <h2>Common scams to avoid</h2>
        <ul>
          <li>Off-platform payment requests or refunds.</li>
          <li>Pressure to skip evidence or rush handover without photos.</li>
          <li>Requests to ship prohibited items or misdeclare customs.</li>
          <li>Fake payment screenshots—only platform payment status counts.</li>
        </ul>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default TrustSafetyTipsPage;
