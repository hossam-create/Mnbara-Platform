export default function ShippingPolicy() {
    return (
      <div className="prose prose-blue max-w-none">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Shipping & Handover Policy</h1>
          <p className="text-gray-500 text-sm mb-8">Strict Crowdshipping Rules</p>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">1. Crowdshipping Fundamentals</h2>
              <p>
                  MnBarh is a peer-to-peer delivery platform. Items are carried by <strong>Travelers</strong> in their luggage, not by traditional courier companies. This ensures speed and lower costs, but requires strict adherence to international travel laws.
              </p>
          </section>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">2. Handover Methods</h2>
              <ul className="list-disc pl-5 mt-4 space-y-2 text-gray-600">
                  <li><strong>In-Person Meetup (Recommended):</strong> Meet in a safe, public place (e.g., mall, hotel lobby). Inspect the item together before marking as "Received".</li>
                  <li><strong>Local Courier:</strong> The Traveler may use a local bike messenger (e.g., Uber Package, Careem Box) to send the item to your door once they arrive in your city.</li>
              </ul>
          </section>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8 text-sm text-yellow-800">
              <strong>Important:</strong> Never mark an order as "Received" in the app until you physically have the item in your hands and have inspected it.
          </div>

          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">3. Packaging & Safety</h2>
              <p>
                  Travelers have the right to inspect packaging to ensure compliance with airline security rules. Do not seal items excessively if asking a traveler to carry a package, as they may need to open it for customs inspection.
              </p>
          </section>
      </div>
    );
  }
