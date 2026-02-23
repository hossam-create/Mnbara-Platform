import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const CancellationRefundsPage: React.FC = () => {
  return (
    <ContentPageLayout title="Cancellation & Refunds" showSidebar={false}>
      <section>
        <h2>Cancellation timing</h2>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Item amount refund</th>
              <th>Service fee</th>
              <th>Processing fee</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Within 1 hour</td><td>100%</td><td>Refunded</td><td>Retained</td></tr>
            <tr><td>1–6 hours</td><td>90%</td><td>Retained</td><td>Retained</td></tr>
            <tr><td>6–24 hours</td><td>75%</td><td>Retained</td><td>Retained</td></tr>
            <tr><td>After 24h pre-acceptance</td><td>50%</td><td>Retained</td><td>Retained</td></tr>
            <tr><td>After acceptance</td><td>25%</td><td>Retained</td><td>Retained</td></tr>
            <tr><td>After pickup / in-progress</td><td>0%</td><td>Retained</td><td>Retained</td></tr>
            <tr><td>No traveler found (expiry)</td><td>100%</td><td>Refunded</td><td>Waived</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Who pays fees</h2>
        <ul>
          <li>Service fee: non-refundable after 1 hour except when no traveler is found/expiry.</li>
          <li>Processing fee: always retained except when no traveler is found/expiry.</li>
          <li>Traveler cancellations: requester receives 100% item refund; service fee retained.</li>
        </ul>
      </section>

      <section>
        <h2>Escrow behavior</h2>
        <ul>
          <li>Item amount is held until delivery confirmation or dispute outcome.</li>
          <li>On cancellation, held funds are released according to the timing table above.</li>
          <li>On disputes, funds remain held until manual review finishes.</li>
        </ul>
      </section>

      <section>
        <h2>Refund processing</h2>
        <ul>
          <li>Refunds are initiated to the original payment method.</li>
          <li>Bank timelines apply (typically 3–5 business days).</li>
          <li>We will notify you when a refund is initiated.</li>
        </ul>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default CancellationRefundsPage;
