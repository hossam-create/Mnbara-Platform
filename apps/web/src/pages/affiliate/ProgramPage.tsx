import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const AffiliateProgramPage: React.FC = () => {
  return (
    <ContentPageLayout title="Affiliate Program" showSidebar={false}>
      <section>
        <h2>How it works</h2>
        <ul>
          <li>Share your unique affiliate link to bring new buyers to the platform.</li>
          <li>Commission applies on qualified first transactions completed through your link.</li>
          <li>Attribution window: clicks within 30 days that lead to a completed transaction.</li>
        </ul>
      </section>

      <section>
        <h2>Commission eligibility</h2>
        <ul>
          <li>No self-referrals or duplicate accounts.</li>
          <li>No misleading claims, spam, or paid search on our brand terms.</li>
          <li>Transactions must be completed and not refunded or charged back.</li>
        </ul>
      </section>

      <section>
        <h2>Payment timing</h2>
        <ul>
          <li>Payouts are manual and processed on a disclosed cadence after the return/refund window.</li>
          <li>We may hold or reject commissions for suspected fraud or policy violations.</li>
          <li>Provide accurate payout details when requested to receive payment.</li>
        </ul>
      </section>

      <section>
        <h2>Prohibited traffic</h2>
        <ul>
          <li>Spam, incentivized clicks, cookie stuffing, or malware.</li>
          <li>Misleading promotions or false offers.</li>
          <li>Brand bidding on search terms without written approval.</li>
        </ul>
      </section>

      <section>
        <h2>Termination</h2>
        <ul>
          <li>We may suspend or terminate accounts involved in fraud, abuse, or policy breaches.</li>
          <li>Ineligible traffic voids commissions.</li>
        </ul>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default AffiliateProgramPage;
