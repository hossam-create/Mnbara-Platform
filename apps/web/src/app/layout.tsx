import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mnbarh - Your eBay-Level Marketplace for Everything',
  description: 'Discover millions of products on Mnbarh. Buy and sell electronics, fashion, home & garden, collectibles, and more at great prices.',
  keywords: 'marketplace, buy, sell, electronics, fashion, home, garden, collectibles, auction, shopping',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}