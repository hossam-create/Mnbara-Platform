export default function FeeSchedule() {
    return (
      <div className="prose prose-blue max-w-none">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Fee Schedule</h1>
          
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Shopper Fees</h2>
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50 text-gray-600 font-bold">
                      <tr>
                          <th scope="col" className="px-6 py-4">Transaction Value</th>
                          <th scope="col" className="px-6 py-4">Service Fee</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr className="border-b border-gray-100">
                          <td className="px-6 py-4">$0 - $100</td>
                          <td className="px-6 py-4">10%</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                          <td className="px-6 py-4">$101 - $500</td>
                          <td className="px-6 py-4">8%</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                          <td className="px-6 py-4">$500+</td>
                          <td className="px-6 py-4">6%</td>
                      </tr>
                  </tbody>
              </table>
          </section>

           <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Traveler Payouts</h2>
              <p>Travelers receive the full <strong>Reward</strong> amount listed on the order. MnBarh does not deduct fees from the Traveler's reward.</p>
          </section>
      </div>
    );
  }
