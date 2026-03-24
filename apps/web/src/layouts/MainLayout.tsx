import { ReactNode } from 'react';
import Header from '../components/layout/Header';
import CategoryNav from '../components/layout/CategoryNav';
import Footer from '../components/layout/Footer';

/**
 * MainLayout - Canonical layout wrapper for all pages
 * 
 * Structure:
 * 1. Header (logo, search, traveler dropdown, user actions) - STICKY
 * 2. Category Navigation (soft containers)
 * 3. Icon Strip (TWO-LAYER: light blue bg + white floating box)
 * 4. Page Content (children)
 * 5. Footer
 */

interface MainLayoutProps {
  children: ReactNode;
  /** Skip the category nav on certain pages */
  hideCategoryNav?: boolean;
}

export default function MainLayout({ 
  children, 
  hideCategoryNav = false
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      {!hideCategoryNav && <CategoryNav />}
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

