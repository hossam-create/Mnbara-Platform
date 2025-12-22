import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
const manrope = Manrope({ subsets: ['latin'], variable: '--font-mnbarh' });

export const metadata: Metadata = {
  title: 'Mnbarh – Premier Travel Sourcing',
  description: 'Discover coveted items worldwide with trusted travelers and curated requests.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${manrope.className}`}>{children}</body>
    </html>
  );
}
