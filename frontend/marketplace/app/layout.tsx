import type { Metadata } from 'next';
import Providers from '@/providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Mnbara - Marketplace',
  description: 'eBay-Level E-commerce Marketplace for Mnbara Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
