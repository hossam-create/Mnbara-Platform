import { useState } from 'react';
import { RoleBasedConsent, useRoleBasedConsent, type UserRole } from '../ui';

export function BuyerConsentExample() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState('');

  const { isConsentOpen, openConsent, closeConsent, RoleBasedConsent: ConsentComponent } = useRoleBasedConsent();

  const handlePurchase = () => {
    openConsent('buyer', {
      productName: 'iPhone 15 Pro',
      amount: 999.99
    });
  };

  const handleConfirmPurchase = async () => {
    setIsProcessing(true);
    setLastAction('Purchase confirmed with buyer consent');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsProcessing(false);
    closeConsent();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Flow Example</h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            💡 <strong>Minimal Friction:</strong> Simple warning with single checkbox confirmation
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Product Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Product:</span>
              <span className="font-medium">iPhone 15 Pro</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Price:</span>
              <span className="font-bold text-green-600">$999.99</span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          Purchase with Buyer Consent
        </button>

        {lastAction && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm">✅ {lastAction}</p>
          </div>
        )}
      </div>

      <ConsentComponent 
        onConfirm={handleConfirmPurchase} 
        isLoading={isProcessing}
      />
    </div>
  );
}

export function TravelerConsentExample() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState('');

  const { isConsentOpen, openConsent, closeConsent, RoleBasedConsent: ConsentComponent } = useRoleBasedConsent();

  const handleAcceptDelivery = () => {
    openConsent('traveler', {
      requestDetails: {
        productName: 'MacBook Pro 16\"',
        deliveryLocation: 'Dubai, UAE',
        estimatedReward: 250.00,
        requestId: 'REQ-789123'
      }
    });
  };

  const handleConfirmDelivery = async () => {
    setIsProcessing(true);
    setLastAction('Delivery responsibility accepted with traveler consent');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    closeConsent();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Traveler Flow Example</h3>
      
      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-orange-800 text-sm">
            ⚖️ <strong>Strict Flow:</strong> Multi-step mandatory review with scroll enforcement
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Delivery Request</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Product:</span>
              <span className="font-medium">MacBook Pro 16\"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery To:</span>
              <span className="font-medium">Dubai, UAE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reward:</span>
              <span className="font-bold text-green-600">$250.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Request ID:</span>
              <span className="text-xs text-gray-500">REQ-789123</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleAcceptDelivery}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          Accept Delivery with Traveler Consent
        </button>

        {lastAction && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm">✅ {lastAction}</p>
          </div>
        )}
      </div>

      <ConsentComponent 
        onConfirm={handleConfirmDelivery} 
        isLoading={isProcessing}
      />
    </div>
  );
}

export default function RoleBasedConsentShowcase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-100 min-h-screen">
      <BuyerConsentExample />
      <TravelerConsentExample />
      
      <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role-Based Consent Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Buyer Flow (Minimal Friction)</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Single modal with simple warning</li>
              <li>• One checkbox confirmation</li>
              <li>• Quick purchase confirmation</li>
              <li>• Lightweight user experience</li>
              <li>• Focus on transaction speed</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-orange-800 mb-2">Traveler Flow (Strict Process)</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Multi-step mandatory review</li>
              <li>• Full-screen modal with scroll enforcement</li>
              <li>• Comprehensive liability acceptance</li>
              <li>• Detailed risk acknowledgment</li>
              <li>• Cannot proceed without full consent</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Same Legal Content:</strong> Both flows present the same legal terms but with different UX intensity 
            based on role-specific risk profiles and responsibilities.
          </p>
        </div>
      </div>
    </div>
  );
}