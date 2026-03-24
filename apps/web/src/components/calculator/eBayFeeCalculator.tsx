import React, { useState, useEffect } from 'react';
import { InformationCircleIcon, CurrencyDollarIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';

interface FeeBreakdown {
  finalValueFee: number;
  referralFee: number;
  adFee: number;
  subscriptionFee: number;
  regulatoryOperatingFee: number;
  totalFees: number;
}

interface ProfitCalculation {
  revenue: number;
  costs: number;
  netProfit: number;
  margin: number;
  breakEven: number;
}

const eBayFeeCalculator: React.FC = () => {
  // Inputs
  const [soldPrice, setSoldPrice] = useState<number>(100);
  const [shippingCharge, setShippingCharge] = useState<number>(10);
  const [itemCost, setItemCost] = useState<number>(50);
  const [sellerLevel, setSellerLevel] = useState<string>('standard');
  const [storeType, setStoreType] = useState<string>('none');
  const [adRate, setAdRate] = useState<number>(0);
  const [category, setCategory] = useState<string>('other');

  // Outputs
  const [fees, setFees] = useState<FeeBreakdown>({
    finalValueFee: 0,
    referralFee: 0,
    adFee: 0,
    subscriptionFee: 0,
    regulatoryOperatingFee: 0,
    totalFees: 0,
  });
  const [profit, setProfit] = useState<ProfitCalculation>({
    revenue: 0,
    costs: 0,
    netProfit: 0,
    margin: 0,
    breakEven: 0,
  });

  // Constants (Mock eBay Fee Structure)
  const STANDARD_FVF_RATE = 0.1325; // 13.25%
  const TOP_RATED_DISCOUNT = 0.10; // 10% off FVF
  const STORE_SUBSCRIPTION_RATES: Record<string, number> = {
    none: 0,
    basic: 21.95,
    premium: 59.95,
    anchor: 299.95,
  };
  const PER_ORDER_FEE = 0.30;
  const REGULATORY_FEE_RATE = 0.0035; // 0.35%

  const calculateFees = () => {
    const totalRevenue = Number(soldPrice) + Number(shippingCharge);
    
    // 1. Final Value Fee
    let fvfRate = STANDARD_FVF_RATE;
    if (storeType !== 'none') fvfRate -= 0.01; // Fee discount for stores (simplified)
    
    let fvf = totalRevenue * fvfRate + PER_ORDER_FEE;
    
    // Apply Top Rated Discount
    if (sellerLevel === 'top_rated_plus') {
      fvf = fvf * (1 - TOP_RATED_DISCOUNT);
    }

    // 2. Ad Fees
    const adFee = totalRevenue * (Number(adRate) / 100);

    // 3. Regulatory Fee
    const regFee = totalRevenue * REGULATORY_FEE_RATE;

    const totalFees = fvf + adFee + regFee;

    setFees({
      finalValueFee: fvf,
      referralFee: 0, // Not applicable in this simple model
      adFee,
      subscriptionFee: STORE_SUBSCRIPTION_RATES[storeType] / 30, // Approx daily cost
      regulatoryOperatingFee: regFee,
      totalFees,
    });

    const totalCosts = Number(itemCost) + Number(shippingCharge) + totalFees;
    const netProfit = totalRevenue - totalCosts; // Shipping charge is revenue but also cost if you pay valid shipping, simplified here assuming seller keeps shipping overage or pays exact.
    // Actually, net profit = (SoldPrice + ShippingCharge) - (ItemCost + ActualShippingCost + Fees).
    // Let's assume ShippingCharge inputted is what buyer pays, and we need an "Actual Shipping Cost" input for accuracy, but for now assuming break-even on shipping.
    // Let's refine: Profit = (Sold + ShippingCharged) - (ItemCost + ShippingPaid + Fees). 
    // We will assume Shipping Paid = Shipping Charged for simplicity unless added.
    
    const calculatedProfit = (Number(soldPrice) + Number(shippingCharge)) - (Number(itemCost) + Number(shippingCharge) + totalFees); 
    // Simplified: Profit = SoldPrice - ItemCost - Fees. (Assuming shipping is pass-through)

    setProfit({
      revenue: totalRevenue,
      costs: Number(itemCost) + totalFees, // Treat shipping as pass-through
      netProfit: calculatedProfit,
      margin: (calculatedProfit / totalRevenue) * 100,
      breakEven: Number(itemCost) / (1 - (totalFees/totalRevenue)), // Rough estimate
    });
  };

  useEffect(() => {
    calculateFees();
  }, [soldPrice, shippingCharge, itemCost, sellerLevel, storeType, adRate, category]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Selling Profit Calculator</h2>
        <p className="text-gray-500">Estimate your fees and potential profits before you list.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-blue-600" />
              Listing Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sold Price</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={soldPrice}
                    onChange={(e) => setSoldPrice(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 pl-7 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Charge (to Buyer)</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={shippingCharge}
                    onChange={(e) => setShippingCharge(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 pl-7 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Cost</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={itemCost}
                    onChange={(e) => setItemCost(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 pl-7 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
              Seller Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seller Level</label>
                <select
                  value={sellerLevel}
                  onChange={(e) => setSellerLevel(e.target.value)}
                  className="block w-full rounded-md border-gray-300 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="top_rated">Top Rated</option>
                  <option value="top_rated_plus">Top Rated Plus (-10% Fees)</option>
                  <option value="below_standard">Below Standard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Subscription</label>
                <select
                  value={storeType}
                  onChange={(e) => setStoreType(e.target.value)}
                  className="block w-full rounded-md border-gray-300 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="none">None</option>
                  <option value="basic">Basic Store</option>
                  <option value="premium">Premium Store</option>
                  <option value="anchor">Anchor Store</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promoted Listing Ad Rate (%)</label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    value={adRate}
                    onChange={(e) => setAdRate(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 py-2 pr-8 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <PresentationChartLineIcon className="h-6 w-6 mr-2 text-blue-200" />
              Results
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-blue-200 text-sm mb-1">Net Profit</p>
                <p className="text-3xl font-bold text-white">${profit.netProfit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm mb-1">Profit Margin</p>
                <p className={`text-3xl font-bold ${profit.margin > 15 ? 'text-green-300' : profit.margin > 0 ? 'text-yellow-300' : 'text-red-300'}`}>
                  {profit.margin.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-100">Total Fees (Platform Revenue)</span>
                <span className="text-2xl font-semibold text-white">${fees.totalFees.toFixed(2)}</span>
              </div>
              <p className="text-xs text-blue-200 text-right">Mnbara collects this amount</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Breakdown</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Final Value Fee</span>
                <span className="font-medium text-gray-900">${fees.finalValueFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Ad Fees</span>
                <span className="font-medium text-gray-900">${fees.adFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Regulatory Fee</span>
                <span className="font-medium text-gray-900">${fees.regulatoryOperatingFee.toFixed(2)}</span>
              </div>
              
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Costs</span>
                <span className="font-semibold text-red-600">${profit.costs.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
             <h4 className="font-medium text-green-900 mb-2">Profit Analysis</h4>
             <ul className="text-sm text-green-800 space-y-1">
                <li>• You keep <strong>{((profit.netProfit / profit.revenue) * 100).toFixed(1)}%</strong> of the sale price.</li>
                <li>• Platform fees are <strong>{((fees.totalFees / profit.revenue) * 100).toFixed(1)}%</strong> of the total.</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default eBayFeeCalculator;
