import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const FeesPage: React.FC = () => {
  return (
    <ContentPageLayout title="Payments & Fees" showSidebar={false}>
      <section>
        <h2>Fee structure</h2>
        <ul>
          <li>Base service fee: tiered by item value with min $3 and max $50.</li>
          <li>Urgent surcharge: +2% when deadline is under 48 hours.</li>
          <li>International surcharge: +1% for cross-border deliveries.</li>
          <li>High-value surcharge: +0.5% for items above $1,000.</li>
        </ul>
      </section>

      <section>
        <h2>Fee table</h2>
        <table>
          <thead>
            <tr>
              <th>Item value</th>
              <th>Base rate</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>$0 - $50</td><td>8%</td></tr>
            <tr><td>$51 - $200</td><td>6%</td></tr>
            <tr><td>$201 - $500</td><td>5%</td></tr>
            <tr><td>$501 - $1,000</td><td>4%</td></tr>
            <tr><td>$1,001+</td><td>3%</td></tr>
          </tbody>
        </table>
        <p>Minimum fee: $3.00 • Maximum fee: $50.00</p>
      </section>

      <section>
        <h2>When fees are charged</h2>
        <ul>
          <li>At request creation: item amount + service fee are charged.</li>
          <li>Item amount is held until delivery confirmation or dispute resolution.</li>
          <li>Service fee is collected immediately and is generally non-refundable after 1 hour.</li>
        </ul>
      </section>

      <section>
        <h2>Examples</h2>
        <ul>
          <li>Phone $1,199 (international + urgent): 3% base ($35.97) +2% ($23.98) +1% ($11.99) = $71.94 total fee.</li>
          <li>Laptop $800 (domestic): 4% = $32.00 fee.</li>
          <li>Book $25 (domestic): 8% = $2.00 → min fee applies = $3.00.</li>
        </ul>
      </section>

      <section>
        <h2>Receipts</h2>
        <p>Receipts show item cost, each fee component, total paid, and payment method. Funds are held until delivery is confirmed.</p>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default FeesPage;
