import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const TermsPage: React.FC = () => {
  return (
    <ContentPageLayout title="Terms of Service" showSidebar={false}>
      <section>
        <h2>Platform role</h2>
        <ul>
          <li>We operate a marketplace connecting buyers, sellers, and travelers. We do not own the items and do not guarantee authenticity or delivery timing.</li>
          <li>Payments are collected upfront; item amounts are held until delivery confirmation or dispute resolution. Service fees are taken immediately.</li>
          <li>Payouts to travelers are manual after confirmation or resolved disputes.</li>
        </ul>
      </section>

      <section>
        <h2>User responsibilities</h2>
        <ul>
          <li>Provide accurate information; comply with laws, customs, and prohibited-item rules.</li>
          <li>Keep all communication and evidence on-platform; no off-platform payments.</li>
          <li>Protect account credentials; you are responsible for activity on your account.</li>
        </ul>
      </section>

      <section>
        <h2>Payments and disputes</h2>
        <ul>
          <li>Charges occur at request creation; refunds follow the Cancellation & Refund Policy.</li>
          <li>Disputes require evidence (photos, receipts, chat). Manual review target: 3–5 business days.</li>
          <li>Chargebacks initiated via banks may affect timelines; we will coordinate but outcomes are not guaranteed.</li>
        </ul>
      </section>

      <section>
        <h2>Liability limits</h2>
        <ul>
          <li>Service is provided “as is.” We are not liable for delays from travel, weather, or customs.</li>
          <li>We are not liable for prohibited items, seizures, or authenticity claims without evidence.</li>
          <li>Where permitted by law, our liability is limited to the amounts paid to us for the transaction in dispute.</li>
        </ul>
      </section>

      <section>
        <h2>Termination and enforcement</h2>
        <ul>
          <li>We may suspend or terminate accounts for fraud, policy violations, or legal risk.</li>
          <li>Evidence must remain on-platform; off-platform behavior may void protections.</li>
        </ul>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>These terms are governed by applicable local law; disputes follow the Dispute Resolution process. Venue will be specified in your account locale or as required by law.</p>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default TermsPage;
