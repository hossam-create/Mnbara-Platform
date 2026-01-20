import { useState } from 'react';

/**
 * Filter Sidebar - Marketplace search filters
 * Categories, Condition, Price Range, Shipping Options
 */

// Icons
const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg 
    className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-semibold text-sm text-gray-900">{title}</span>
        <ChevronDownIcon open={isOpen} />
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}

interface FilterCheckboxProps {
  label: string;
  count?: number;
  checked?: boolean;
  onChange?: () => void;
}

function FilterCheckbox({ label, count, checked = false, onChange }: FilterCheckboxProps) {
  return (
    <label className="flex items-center gap-3 py-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-brand-blue focus:ring-2 focus:ring-brand-blue"
      />
      <span className="text-sm text-gray-700 group-hover:text-brand-blue font-normal">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-500 font-normal">({count.toLocaleString()})</span>
      )}
    </label>
  );
}

export default function FilterSidebar() {
  return (
    <aside className="w-[220px] flex-shrink-0">
      {/* Category Filter */}
      <FilterSection title="Category">
        <ul className="space-y-2">
          <li>
            <a href="#" className="text-sm text-brand-blue hover:underline block py-1 font-medium">
              Electronics
            </a>
            <ul className="ml-4 space-y-1">
              <li><a href="#" className="text-sm text-gray-600 hover:text-brand-blue block py-1 font-normal">Cell Phones & Accessories</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-brand-blue block py-1 font-normal">Computers & Tablets</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-brand-blue block py-1 font-normal">Cameras & Photo</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-brand-blue block py-1 font-normal">Video Games & Consoles</a></li>
            </ul>
          </li>
          <li><a href="#" className="text-sm text-gray-600 hover:text-brand-blue block py-1 font-normal">Fashion</a></li>
          <li><a href="#" className="text-sm text-gray-600 hover:text-brand-blue block py-1 font-normal">Home & Garden</a></li>
          <li><a href="#" className="text-sm text-gray-600 hover:text-brand-blue block py-1 font-normal">Sporting Goods</a></li>
        </ul>
      </FilterSection>

      {/* Condition Filter */}
      <FilterSection title="Condition">
        <div className="space-y-1">
          <FilterCheckbox label="New" count={12543} />
          <FilterCheckbox label="Open box" count={1234} />
          <FilterCheckbox label="Certified - Refurbished" count={856} />
          <FilterCheckbox label="Seller refurbished" count={432} />
          <FilterCheckbox label="Used" count={8765} />
          <FilterCheckbox label="For parts or not working" count={234} />
        </div>
      </FilterSection>

      {/* Price Filter */}
      <FilterSection title="Price">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="$ Min"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent font-normal"
              />
            </div>
            <span className="text-gray-400 font-normal">to</span>
            <div className="flex-1">
              <input
                type="text"
                placeholder="$ Max"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent font-normal"
              />
            </div>
          </div>
          <button className="w-full py-2 text-sm text-brand-blue border border-brand-blue rounded-md hover:bg-brand-blue hover:text-white transition-colors font-semibold">
            Apply
          </button>
          <div className="space-y-2">
            <FilterCheckbox label="Under $25" count={4532} />
            <FilterCheckbox label="$25 to $50" count={3421} />
            <FilterCheckbox label="$50 to $100" count={2876} />
            <FilterCheckbox label="$100 to $200" count={1543} />
            <FilterCheckbox label="Over $200" count={987} />
          </div>
        </div>
      </FilterSection>

      {/* Buying Format */}
      <FilterSection title="Buying Format">
        <div className="space-y-2">
          <FilterCheckbox label="All Listings" checked />
          <FilterCheckbox label="Accepts Offers" count={5432} />
          <FilterCheckbox label="Auction" count={1234} />
          <FilterCheckbox label="Buy It Now" count={18765} />
        </div>
      </FilterSection>

      {/* Item Location */}
      <FilterSection title="Item Location" defaultOpen={false}>
        <div className="space-y-2">
          <FilterCheckbox label="US Only" />
          <FilterCheckbox label="North America" />
          <FilterCheckbox label="Worldwide" />
        </div>
      </FilterSection>

      {/* Shipping Options */}
      <FilterSection title="Shipping Options">
        <div className="space-y-2">
          <FilterCheckbox label="Free Shipping" count={12543} />
          <FilterCheckbox label="Local Pickup" count={3456} />
        </div>
      </FilterSection>

      {/* Show Only */}
      <FilterSection title="Show Only" defaultOpen={false}>
        <div className="space-y-2">
          <FilterCheckbox label="Free Returns" count={8765} />
          <FilterCheckbox label="Returns Accepted" count={15432} />
          <FilterCheckbox label="Authorized Seller" count={2345} />
          <FilterCheckbox label="Completed Items" />
          <FilterCheckbox label="Sold Items" />
          <FilterCheckbox label="Deals & Savings" count={1234} />
        </div>
      </FilterSection>
    </aside>
  );
}
