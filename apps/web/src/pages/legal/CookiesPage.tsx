import React from 'react';
import ContentPageLayout from '@/components/layout/ContentPageLayout';

const CookiesPage: React.FC = () => {
  return (
    <ContentPageLayout title="Cookies" showSidebar={false}>
      <section>
        <h2>Why we use cookies</h2>
        <ul>
          <li>Keep you signed in and secure your account sessions.</li>
          <li>Remember language and basic preferences.</li>
          <li>Measure site performance and reliability.</li>
        </ul>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>You can manage or block cookies in your browser settings.</li>
          <li>Some essential cookies are required for login, checkout, and security.</li>
        </ul>
      </section>

      <section>
        <h2>Data handling</h2>
        <ul>
          <li>We do not sell personal data.</li>
          <li>Analytics and security partners may process cookie data to keep the service reliable.</li>
        </ul>
      </section>

      <p className="text-sm text-gray-500 mt-10">Last updated: 2026-01-21 • Need help? Contact support.</p>
    </ContentPageLayout>
  );
};

export default CookiesPage;
