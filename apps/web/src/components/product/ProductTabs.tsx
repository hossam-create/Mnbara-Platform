
interface ProductTabsProps {
  activeTab: 'about' | 'shipping' | 'payments';
  setActiveTab: (t: 'about' | 'shipping' | 'payments') => void;
}

export default function ProductTabs({ activeTab, setActiveTab }: ProductTabsProps) {
  return (
    <div className="mt-12 border-t border-gray-200">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'about', label: 'About this item' },
          { id: 'shipping', label: 'Shipping, returns & payments' },
          { id: 'payments', label: 'Seller assumes all responsibility' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-4 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-8">
        {activeTab === 'about' && (
          <div>
            <h3 className="text-lg font-semibold mb-6 text-gray-900">Item specifics</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex">
                <span className="text-gray-600 w-40">Condition:</span>
                <span className="font-medium text-gray-900">New</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-40">Brand:</span>
                <span className="font-medium text-gray-900">Apple</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-40">Model:</span>
                <span className="font-medium text-gray-900">iPhone 15 Pro Max</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-40">Storage Capacity:</span>
                <span className="font-medium text-gray-900">256 GB</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-40">Color:</span>
                <span className="font-medium text-gray-900">Natural Titanium</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-40">Network:</span>
                <span className="font-medium text-gray-900">Unlocked</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-40">Screen Size:</span>
                <span className="font-medium text-gray-900">6.7 in</span>
              </div>
              <div className="flex">
                <span className="text-gray-600 w-40">Operating System:</span>
                <span className="font-medium text-gray-900">iOS</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-12 mb-6 text-gray-900">Item description from the seller</h3>
            <div className="text-sm text-gray-700 space-y-4 leading-relaxed">
              <p>Brand New Apple iPhone 15 Pro Max 256GB in Natural Titanium color. Factory unlocked for all carriers worldwide.</p>
              <p><strong>What's in the box:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>iPhone 15 Pro Max</li>
                <li>USB-C to USB-C Cable</li>
                <li>Documentation</li>
              </ul>
              <p><strong>Key Features:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>A17 Pro chip with 6-core GPU</li>
                <li>6.7" Super Retina XDR display with ProMotion</li>
                <li>48MP Main camera system with 5x optical zoom</li>
                <li>Titanium design - lightest Pro model ever</li>
                <li>Action button for quick access</li>
                <li>All-day battery life</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="text-sm">
            <h3 className="text-lg font-semibold mb-6 text-gray-900">Shipping and handling</h3>
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 border-b text-sm font-semibold text-gray-900">Item location</th>
                  <th className="text-left p-4 border-b text-sm font-semibold text-gray-900">Ships to</th>
                  <th className="text-left p-4 border-b text-sm font-semibold text-gray-900">Service</th>
                  <th className="text-left p-4 border-b text-sm font-semibold text-gray-900">Delivery</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 text-gray-700">Edison, New Jersey, United States</td>
                  <td className="p-4 text-gray-700">Worldwide</td>
                  <td className="p-4 text-gray-700">Standard Shipping (USPS First Class)</td>
                  <td className="p-4 text-gray-700">Estimated between Wed, Jan 8 and Mon, Jan 13</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-lg font-semibold mt-12 mb-6 text-gray-900">Return policy</h3>
            <table className="w-full border border-gray-200">
              <tbody>
                <tr className="border-b">
                  <td className="p-4 bg-gray-50 w-48 font-medium text-gray-900">After receiving the item</td>
                  <td className="p-4 text-gray-700">Buyer has 30 days to request a return</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 bg-gray-50 font-medium text-gray-900">Return shipping</td>
                  <td className="p-4 text-gray-700">Buyer pays for return shipping</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="text-sm text-gray-700">
            <p>Seller assumes all responsibility for this listing.</p>
            <p className="mt-3 text-gray-600">Item ID: 395012847563</p>
          </div>
        )}
      </div>
    </div>
  );
}
