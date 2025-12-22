export default function ListingPolicies() {
    return (
      <div className="prose prose-blue max-w-none">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Listing & Ad Policies</h1>
          <p className="text-gray-500 text-sm mb-8">Truth in Advertising</p>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">1. Shopper Requests</h2>
              <p>
                  When posting a request for an item:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                  <li><strong>Specifics:</strong> detailed description (Color, Size, Model #) is required.</li>
                  <li><strong>Link:</strong> Providing a direct link to the product on an online store (e.g., Amazon, Apple) is highly recommended.</li>
                  <li><strong>Prohibitions:</strong> Do not request items listed in the "Prohibited Items" policy.</li>
              </ul>
          </section>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">2. Misleading Listings</h2>
              <p>
                  We do not allow listings that misrepresent the item or the reward. For example, listing a "Rolex Watch" with a reward of $5 implies it is a replica, which is prohibited.
              </p>
          </section>
      </div>
    );
  }
