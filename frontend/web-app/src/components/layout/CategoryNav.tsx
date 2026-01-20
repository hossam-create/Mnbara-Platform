import { Link } from 'react-router-dom';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import DepartmentsDropdown from './DepartmentsDropdown';
import { useTranslation } from 'react-i18next';

/**
 * CategoryNav - Strict UI Fix
 * 
 * Layer 1: Background #F2F4F8 (Light Blue-Gray/Off-white)
 * Layer 2: White Pills with Shadow
 * Order: mnbarh live -> Departments -> Saved -> Categories -> More
 */

const ChevronDownIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const VideoCameraIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const categories = [
  { name: 'nav.mnbarhLive', slug: '/live', highlight: true },
  { name: 'nav.saved', slug: '/saved' },
  { name: 'nav.newArrivals', slug: '/new-arrivals' },
  { name: 'nav.electronics', slug: '/category/electronics' },
  { name: 'nav.fashion', slug: '/category/fashion' },
  { name: 'nav.homeGarden', slug: '/category/home-garden' },
  { name: 'nav.collectibles', slug: '/category/collectibles' },
  { name: 'nav.toys', slug: '/category/toys' },
];

const moreCategories = [
  { name: 'nav.giftCards', slug: '/gift-cards' },
  { name: 'nav.brandOutlet', slug: '/brand-outlet' },
  { name: 'nav.wallet', slug: '/wallet' },
];

export default function CategoryNav() {
  const { t } = useTranslation();

  return (
    // Layer 1: Background #F2F4F8 (Light Blue-Gray/Off-white)
    <nav className="bg-[#F2F4F8] border-b border-gray-200 py-3">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1">
          
          {/* 1. Mnbarh Live - Creative & Capitalized */}
          <Link
             to="/live"
             className="flex items-center gap-2 px-4 py-1.5 rounded-full text-brand-blue font-bold text-sm bg-white shadow-sm hover:shadow-md hover:scale-105 transition-all whitespace-nowrap group"
          >
             <div className="relative">
                <VideoCameraIcon />
                {/* Pulsing Red Dot for "Live" effect */}
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
             </div>
             <span>{t('nav.mnbarhLive')}</span>
          </Link>

          {/* 2. Departments Dropdown (Grid Icon) */}
          <div className="bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
             <DepartmentsDropdown />
          </div>

          <div className="h-4 w-px bg-gray-300 mx-1"></div>

          {/* 3. Categories Pills (Layer 2) */}
          {categories.slice(1).map((cat) => (
            <Link
              key={cat.slug}
              to={cat.slug}
              className="px-4 py-1.5 rounded-full text-sm font-normal text-gray-700 bg-white shadow-sm hover:shadow-md hover:text-brand-blue transition-all whitespace-nowrap"
            >
              {t(cat.name)}
            </Link>
          ))}

          {/* 4. More Dropdown */}
          <Menu as="div" className="relative">
             <Menu.Button className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-normal text-gray-700 bg-white shadow-sm hover:shadow-md transition-all whitespace-nowrap">
              <span>{t('nav.more')}</span>
              <ChevronDownIcon />
            </Menu.Button>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                <div className="py-2">
                  {moreCategories.map((item) => (
                    <Menu.Item key={item.slug}>
                      {({ active }) => (
                        <Link
                          to={item.slug}
                          className={`
                            block px-4 py-2 text-sm font-normal
                            ${active ? 'bg-gray-50 text-brand-blue' : 'text-gray-700'}
                          `}
                        >
                          {t(item.name)}
                        </Link>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </nav>
  );
}
