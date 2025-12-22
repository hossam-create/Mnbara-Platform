export default function ProhibitedItems() {
    return (
      <div className="prose prose-blue max-w-none">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Prohibited & Restricted Items</h1>
          <p className="text-gray-500 text-sm mb-8">Strictly Enforced</p>
  
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 text-sm text-red-800">
              <strong>Warning:</strong> Listing prohibited items may result in immediate account suspension and reporting to local authorities.
          </div>
  
          <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Prohibited Items</h2>
              <ul className="list-disc pl-5 mt-4 space-y-2 text-gray-600">
                  <li><strong>Alcohol & Drugs:</strong> Any narcotics, steroids, or controlled substances.</li>
                  <li><strong>Weapons:</strong> Firearms, ammunition, knives, or explosives.</li>
                  <li><strong>Hazardous Materials:</strong> Radioactive, toxic, or flammable materials.</li>
                  <li><strong>Counterfeit Goods:</strong> Fake brands, pirated media, or replicas.</li>
                  <li><strong>Live Animals:</strong> Use specialized carriers only (Restricted).</li>
                  <li><strong>Currency:</strong> Cash, bonds, or stock certificates.</li>
              </ul>
          </section>
      </div>
    );
  }
