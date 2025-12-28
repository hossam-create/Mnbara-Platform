import React from 'react';
import eBayFeeCalculator from '../components/calculator/eBayFeeCalculator';

const FeeCalculatorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Fee Calculator
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Transparent pricing. Know exactly what you earn.
          </p>
        </div>
        
        <eBayFeeCalculator />
      </div>
    </div>
  );
};

export default FeeCalculatorPage;
