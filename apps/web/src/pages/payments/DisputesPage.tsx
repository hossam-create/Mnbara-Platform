import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const DisputesPage: React.FC = () => {
  return (
    <ContentPageLayout title="Disputes & Resolutions" showSidebar={false}>
      <section>
        <h2>Step-by-step dispute flow</h2>
        <ol>
          <li>Open a dispute within 72 hours of delivery attempt or missed delivery.</li>
          <li>Provide evidence: photos, receipts, chat history, timestamps.</li>
          <li>We acknowledge receipt and keep funds held during review.</li>
          <li>Manual review target: 3–5 business days; complex cases may take longer.</li>
          <li>Outcome: refund (full/partial), release of funds to traveler, or denial with reasons.</li>
        </ol>
      </section>

      <section>
        <h2>Evidence required</h2>
        <ul>
          <li>Clear photos of item condition at pickup and delivery.</li>
          <li>Receipts or order confirmations where applicable.</li>
          <li>In-app chat showing agreements, timing, and confirmations.</li>
          <li>Timestamps for pickup, transit check-ins (if any), and delivery.</li>
        </ul>
      </section>

      <section>
        <h2>SLA expectations</h2>
        <ul>
          <li>We aim to review disputes within 3–5 business days.</li>
          <li>If more time is needed, we will notify you and keep funds held until a decision is made.</li>
          <li>Decisions are evidence-based; missing proof may limit available remedies.</li>
        </ul>
      </section>

      <section>
        <h2>Manual review note</h2>
        <ul>
          <li>No automated decisions—every dispute is human-reviewed.</li>
          <li>We may request additional evidence; timely responses help speed resolution.</li>
          <li>Chargebacks initiated through banks can affect timelines; we will coordinate but cannot guarantee outcomes.</li>
        </ul>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default DisputesPage;
