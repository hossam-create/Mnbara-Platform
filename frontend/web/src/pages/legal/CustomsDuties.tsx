export default function CustomsDuties() {
    return (
      <div className="prose prose-blue max-w-none">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Customs & Import Duties</h1>
          <p className="text-gray-500 text-sm mb-8">Who pays what?</p>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">1. The Golden Rule</h2>
              <p>
                  <strong>The Shopper (Buyer) is responsible for all import duties and taxes.</strong> However, the Traveler facilitates the payment at the airport/border.
              </p>
          </section>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">2. For Travelers</h2>
              <ul className="list-disc pl-5 mt-4 space-y-2 text-gray-600">
                  <li><strong>Declare Everything:</strong> You must declare items you are carrying for others if required by the destination country's customs laws.</li>
                  <li><strong>Keep Receipts:</strong> If customs charges you a fee, you MUST get an official receipt.</li>
                  <li><strong>Reimbursement:</strong> Upload the receipt to the MnBarh chat. The Shopper will reimburse you through the app (as an "Extra Charge").</li>
              </ul>
          </section>

          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">3. For Shoppers</h2>
              <p>
                  Be aware of your country's duty-free allowances. If your item (e.g., a new iPhone) attracts customs tax, you agree to pay this cost. Refusal to pay valid customs fees will result in the loss of your Money Back Guarantee protection.
              </p>
          </section>
      </div>
    );
  }
