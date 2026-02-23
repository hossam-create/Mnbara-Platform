import React from 'react';
import { useTranslation } from 'react-i18next';
import Footer from './Footer';
import Header from './Header';

interface ContentPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  showSidebar?: boolean;
}

export default function ContentPageLayout({ 
  children, 
  title,
  className = "",
  showSidebar = true
}: ContentPageLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className={`flex-grow container mx-auto px-4 py-8 ${className}`}>
        {title && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <div className="h-1 w-20 bg-brand-primary mt-4 rounded-full"></div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Optional Sidebar for Navigation */}
          {showSidebar && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
               <nav className="sticky top-24 space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-4 px-2">{t('footer.about')}</h3>
                  <SidebarLink to="/about" label={t('footer.about')} />
                  <SidebarLink to="/policies/buyer-protection" label={t('footer.links.moneyBack')} />
                  <SidebarLink to="/policies/seller-protection" label={t('footer.links.sellerProtection')} />
                  <SidebarLink to="/policies/disputes" label={t('footer.links.disputes')} />
                  <SidebarLink to="/help/shipping" label={t('footer.links.shipping')} />
                  <SidebarLink to="/help/fees" label={t('footer.links.fees')} />
                  <SidebarLink to="/contact" label={t('footer.links.contact')} />
               </nav>
            </aside>
          )}

          {/* Main Content Area */}
          <div className="flex-1 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <article className="prose prose-blue max-w-none">
              {children}
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Helper for Sidebar Links (needs to be capable of checking active state if using NavLink)
import { NavLink } from 'react-router-dom';

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive 
            ? 'bg-brand-blueLight/10 text-brand-primary' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      {label}
    </NavLink>
  );
}
