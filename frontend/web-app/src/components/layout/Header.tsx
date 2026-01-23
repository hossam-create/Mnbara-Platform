import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo.svg';
import logoAr from '../../assets/logo-ar.svg';
import travelIcon from '../../travel_icon.svg';
import TravelerDropdown from './TravelerDropdown';
import FulfillmentDropdown from './FulfillmentDropdown';
import TravelerModal from '../modals/TravelerModal';
import PasteLinkModal from '../modals/PasteLinkModal';

// ============ ICONS ============
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const CartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function Header() {
  const [isTravelerModalOpen, setIsTravelerModalOpen] = useState(false);
  const [isPasteLinkModalOpen, setIsPasteLinkModalOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const currentLogo = i18n.language === 'ar' ? logoAr : logo;

  return (
    <>
      {/* STICKY HEADER - FIXED HEIGHT */}
      <header className="bg-brand-blue sticky top-0 z-[100]" style={{ height: '120px' }}>
        
        {/* Top Utility Bar - Height 32px */}
        <div className="bg-brand-blueDark/30" style={{ height: '32px' }}>
          <div className="max-w-[1400px] mx-auto px-4 h-full">
            <div className="flex items-center justify-between h-full text-xs text-white font-normal">
              {/* Left Links */}
              <div className="flex items-center gap-4">
                <span>
                  {t('header.welcome')}{' '}
                  <Link to="/auth/login" className="underline hover:text-brand-yellow font-bold">
                    {t('header.signIn')}
                  </Link>
                  {' '}{t('header.or')}{' '}
                  <Link to="/auth/register" className="underline hover:text-brand-yellow font-bold">
                    {t('header.register')}
                  </Link>
                </span>
                <Link to="/payments/fees" className="hover:text-brand-yellow font-normal">
                  Fees
                </Link>
                <Link to="/deals" className="hover:text-brand-yellow font-normal">
                  {t('header.dailyDeals')}
                </Link>
                <Link to="/help" className="hover:text-brand-yellow font-normal">
                  {t('header.helpContact')}
                </Link>
                <Link to="/affiliate/program" className="hover:text-brand-yellow font-normal">
                  Affiliate
                </Link>
                <button 
                  onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
                  className="hover:text-brand-yellow font-bold border-l pl-4 ml-2 border-white/20"
                >
                  {i18n.language === 'en' ? 'العربية' : 'English'}
                </button>
              </div>

              {/* Right Links */}
              <div className="flex items-center gap-4">
                <Link to="/sell" className="hover:text-brand-yellow font-bold">
                  {t('header.sell')}
                </Link>
                <button className="flex items-center hover:text-brand-yellow font-normal">
                  {t('header.watchlist')}
                  <ChevronDownIcon />
                </button>
                <button className="flex items-center hover:text-brand-yellow font-bold">
                  {t('header.myMnbarh')}
                  <ChevronDownIcon />
                </button>
                <button className="p-1 hover:text-brand-yellow" aria-label="Notifications">
                  <BellIcon />
                </button>
                <Link to="/cart" className="p-1 hover:text-brand-yellow" aria-label="Shopping Cart">
                  <CartIcon />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header Row - Creative Gradient */}
        <div style={{ height: '80px' }} className="flex items-center bg-gradient-to-r from-[#0071DC] to-[#005bb7] shadow-lg relative z-20">
          <div className="max-w-[1400px] mx-auto px-4 w-full">
            <div className="flex items-center gap-4 w-full">
              
              {/* Logo - LEFT */}
              <Link to="/" className="flex-shrink-0 relative z-50">
                <img 
                  src={currentLogo} 
                  alt="MNbarh" 
                  className={`${i18n.language === 'ar' ? 'h-[160px]' : 'h-8'} w-auto transition-all duration-300 object-contain drop-shadow-md`} 
                />
              </Link>

              {/* Traveler Capsule */}
              <TravelerDropdown />

              {/* Fulfillment Dropdown (Blue, Interactive) */}
              <div className="hidden lg:block shrink-0">
                 <FulfillmentDropdown />
              </div>

              {/* Search Bar Container */}
              <div className="flex-1 flex justify-center max-w-xl lg:mx-0">
                 <div className="flex w-full h-[44px] rounded-full bg-white overflow-hidden shadow-sm">
                  <input
                    type="text"
                    placeholder={t('header.searchPlaceholder')}
                    className="flex-1 px-4 text-sm text-gray-900 placeholder-gray-500 outline-none font-normal"
                  />
                  <button className="bg-brand-yellow hover:bg-yellow-400 text-brand-text w-[48px] flex items-center justify-center transition-colors">
                    <SearchIcon />
                  </button>
                </div>
              </div>

              {/* Right Icons - Globe & Link */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsTravelerModalOpen(true)}
                  className="text-white hover:text-brand-yellow transition-colors"
                  aria-label="Travel & earn"
                >
                  <img src={travelIcon} alt="Travel" className="w-10 h-10 object-contain hover:scale-110 transition-transform drop-shadow-sm" />
                </button>
                <button
                  onClick={() => setIsPasteLinkModalOpen(true)}
                  className="text-white hover:text-brand-yellow transition-colors"
                  aria-label="Paste a product link"
                >
                  <LinkIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <TravelerModal isOpen={isTravelerModalOpen} onClose={() => setIsTravelerModalOpen(false)} />
      <PasteLinkModal isOpen={isPasteLinkModalOpen} onClose={() => setIsPasteLinkModalOpen(false)} />
    </>
  );
}
