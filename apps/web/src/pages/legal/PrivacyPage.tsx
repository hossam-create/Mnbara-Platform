import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const PrivacyPage: React.FC = () => {
  return (
    <ContentPageLayout title="Privacy Policy" showSidebar={false}>
      <section>
        <h2>Data we collect</h2>
        <ul>
          <li>Account and contact details (name, email, phone if provided).</li>
          <li>Transaction data (orders, requests, payments, disputes, payouts status).</li>
          <li>Device and usage data (logs, IP, browser, language, interactions).</li>
          <li>In-app messages and uploaded evidence for safety and dispute handling.</li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To provide the marketplace experience, payments, and dispute handling.</li>
          <li>To prevent fraud and keep the platform safe.</li>
          <li>To communicate about transactions, support, and policy changes.</li>
          <li>To improve performance and reliability via analytics.</li>
        </ul>
      </section>

      <section>
        <h2>Sharing</h2>
        <ul>
          <li>Payment processors, fraud and security partners, and support vendors.</li>
          <li>Law enforcement or regulators when legally required.</li>
          <li>No selling of personal data.</li>
        </ul>
      </section>

      <section>
        <h2>Retention</h2>
        <ul>
          <li>Kept as long as needed for legal, accounting, and safety purposes.</li>
          <li>Dispute-related evidence may be retained to comply with legal obligations.</li>
        </ul>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>We use cookies to keep you signed in, secure your account, and measure site performance. Manage cookies in your browser settings.</p>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>Access, update, or request deletion where applicable.</li>
          <li>Opt-out of marketing emails via unsubscribe links.</li>
          <li>Change language and notification preferences in your account.</li>
        </ul>
      </section>

      <section>
        <h2>Security</h2>
        <p>We apply reasonable safeguards, but no system is 100% secure. Use strong passwords and keep credentials confidential.</p>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default PrivacyPage;
