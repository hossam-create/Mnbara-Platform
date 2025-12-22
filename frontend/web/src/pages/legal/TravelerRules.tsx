export default function TravelerRules() {
    return (
      <div className="prose prose-blue max-w-none">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Traveler Rules & Standards</h1>
          <p className="text-gray-500 text-sm mb-8">Being a Trusted Carrier</p>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">1. Offer Accuracy</h2>
              <p>
                  When making an offer to bring an item, ensure you have:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                  <li>Sufficient luggage space.</li>
                  <li>Available funds to purchase the item (if buying on behalf of Shopper).</li>
                  <li>A confirmed travel date.</li>
              </ul>
          </section>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">2. Communication</h2>
              <p>
                  You must respond to Shopper messages within 24 hours. While traveling, update your status (e.g., "Boarding", "Landed", "At Hotel") promptly.
              </p>
          </section>

          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">3. Item Condition</h2>
              <p>
                  You are responsible for the item's condition while it is in your care. Keep items in their original packaging. If you damage an item, you are liable for its cost.
              </p>
          </section>
      </div>
    );
  }
