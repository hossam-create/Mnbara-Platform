import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * DepartmentsDropdown - Categories Tree
 * 
 * Location: Next to "mnbarh live" in CategoryNav
 * Icon: Grid/Squares
 * Text: Bold
 * Content: Deep category tree
 */

const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

type SubCategory = {
  name: string;
  slug: string;
};

type Category = {
  name: string;
  slug: string;
  subs?: SubCategory[];
};

const categoryTree: Category[] = [
  {
    name: 'nav.electronics',
    slug: '/category/electronics',
    subs: [
      { name: 'nav.sub.mobiles', slug: '/category/electronics/mobiles' },
      { name: 'nav.sub.laptops', slug: '/category/electronics/laptops' },
      { name: 'nav.sub.accessories', slug: '/category/electronics/accessories' },
    ]
  },
  {
    name: 'nav.fashion',
    slug: '/category/fashion',
    subs: [
      { name: 'nav.sub.men', slug: '/category/fashion/men' },
      { name: 'nav.sub.women', slug: '/category/fashion/women' },
      { name: 'nav.sub.kids', slug: '/category/fashion/kids' },
    ]
  },
  { name: 'nav.homeGarden', slug: '/category/home-garden' },
  { name: 'nav.toys', slug: '/category/toys' },
  { name: 'nav.collectibles', slug: '/category/collectibles' },
  { name: 'nav.clothing', slug: '/category/clothing' },
  { name: 'nav.health', slug: '/category/health' },
];

export default function DepartmentsDropdown() {
  const { t } = useTranslation();

  return (
    <Menu as="div" className="relative text-left">
      <Menu.Button className="flex items-center gap-2 px-3 py-1.5 text-gray-900 font-bold text-sm hover:text-brand-blue transition-colors rounded-full hover:bg-gray-100">
        <GridIcon />
        <span>{t('nav.departments')}</span>
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
        <Menu.Items className="absolute left-0 z-50 mt-2 w-64 origin-top-left rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none divide-y divide-gray-100">
          <div className="py-2">
            {categoryTree.map((cat) => (
              <Menu.Item key={cat.slug}>
                {({ active }) => (
                  <div className="relative group">
                    <Link
                      to={cat.slug}
                      className={`
                        flex items-center justify-between px-4 py-2.5 text-sm font-medium
                        ${active ? 'bg-gray-50 text-brand-blue' : 'text-gray-700'}
                      `}
                    >
                      {t(cat.name)}
                      {cat.subs && <ChevronRightIcon />}
                    </Link>

                    {/* Submenu on Hover */}
                    {cat.subs && (
                      <div className="hidden group-hover:block absolute left-full top-0 w-48 bg-white shadow-xl rounded-xl -ml-2 py-2 ring-1 ring-black/5">
                        {cat.subs.map((sub) => (
                          <Link
                            key={sub.slug}
                            to={sub.slug}
                            className="block px-4 py-2 text-sm text-gray-600 hover:text-brand-blue hover:bg-gray-50"
                          >
                            {t(sub.name)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
