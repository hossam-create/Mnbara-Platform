import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const CommunityGuidelinesPage: React.FC = () => {
  return (
    <ContentPageLayout title="Community Guidelines" showSidebar={false}>
      <section>
        <h2>Acceptable behavior</h2>
        <ul>
          <li>Communicate respectfully; stay on-platform for all coordination.</li>
          <li>Be truthful in listings, requests, bids, and delivery commitments.</li>
          <li>Respond promptly to questions, disputes, and support requests.</li>
          <li>Provide evidence (photos, receipts, timestamps) when asked.</li>
        </ul>
      </section>

      <section>
        <h2>Prohibited actions</h2>
        <ul>
          <li>Off-platform payments or solicitation to bypass fees.</li>
          <li>Fraud, shill bidding, fake disputes, or misrepresentation.</li>
          <li>Harassment, hate speech, or abusive conduct.</li>
          <li>Transporting or listing prohibited, dangerous, or illegal items.</li>
          <li>Attempting to circumvent evidence collection or platform rules.</li>
        </ul>
      </section>

      <section>
        <h2>Enforcement</h2>
        <ul>
          <li>We may warn, limit, suspend, or terminate accounts for violations.</li>
          <li>Payouts may be held or forfeited in cases of fraud or policy breaches.</li>
          <li>Serious violations may be reported to authorities where required.</li>
        </ul>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default CommunityGuidelinesPage;
