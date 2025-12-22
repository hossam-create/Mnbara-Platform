export default function MoneyBackGuarantee() {
    return (
      <div className="prose prose-blue max-w-none font-sans">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
             <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-3xl shadow-lg">🛡️</div>
             <div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 m-0">MnBarh Money Back Guarantee</h1>
                <p className="text-gray-500 text-sm mt-1">We protect you if your item doesn't arrive or isn't as described.</p>
             </div>
          </div>
  
          <div className="bg-blue-50 border-1 border-blue-200 rounded-xl p-6 mb-8 text-blue-900">
              <h3 className="text-lg font-bold mb-2 m-0">Our Core Promise</h3>
              <p className="mb-0">
                  It's simple: Get the exact item you ordered, or get your money back. This covers virtually every purchase on MnBarh.
              </p>
          </div>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">1. When are you covered?</h2>
              <ul className="list-disc pl-5 mt-4 space-y-2 text-gray-600">
                  <li><strong>Item Not Received:</strong> The traveler did not deliver the item by the agreed date.</li>
                  <li><strong>Item Not as Described:</strong> You received the wrong color, model, or it arrived damaged.</li>
                  <li><strong>Counterfeit Goods:</strong> The item delivered is not authentic.</li>
              </ul>
          </section>

          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">2. How to get a refund</h2>
              <ol className="list-decimal pl-5 mt-4 space-y-4 text-gray-600">
                  <li>
                      <strong>Contact the Traveler:</strong> Using MnBarh chat, let them know there's an issue. Most travelers are happy to fix it.
                  </li>
                  <li>
                      <strong>Open a Request:</strong> If not resolved within 3 days, go to your <strong>Orders</strong> page and select "Return or Item Not Received".
                  </li>
                  <li>
                      <strong>We Step In:</strong> If the traveler doesn't resolve the issue within 48 hours, ask MnBarh to step in. We will review the chat logs and proof of handover. If we decide in your favor, we will refund you 100% of the item cost + original shipping fee.
                  </li>
              </ol>
          </section>

          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">3. Timelines</h2>
              <p className="text-gray-600">
                  You have <strong>30 days</strong> from the actual (or latest estimated) delivery date to report an issue. After this period, funds are released to the Traveler.
              </p>
          </section>
      </div>
    );
  }
