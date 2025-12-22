import { useState } from 'react';
import BuyerConsentModal from './BuyerConsentModal';
import TravelerConsentFlow from './TravelerConsentFlow';

export type UserRole = 'buyer' | 'traveler';

interface RoleBasedConsentProps {
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  context?: {
    productName?: string;
    amount?: number;
    requestDetails?: {
      productName: string;
      deliveryLocation: string;
      estimatedReward: number;
      requestId: string;
    };
  };
}

export default function RoleBasedConsent({
  role,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  context = {}
}: RoleBasedConsentProps) {
  const [consentGiven, setConsentGiven] = useState(false);

  const handleConfirm = () => {
    setConsentGiven(true);
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <>
      {role === 'buyer' && (
        <BuyerConsentModal
          isOpen={isOpen}
          onClose={onClose}
          onConfirm={handleConfirm}
          isLoading={isLoading}
          productName={context.productName}
          amount={context.amount}
        />
      )}
      
      {role === 'traveler' && (
        <TravelerConsentFlow
          isOpen={isOpen}
          onClose={onClose}
          onConfirm={handleConfirm}
          isLoading={isLoading}
          requestDetails={context.requestDetails}
        />
      )}
    </>
  );
}

export function useRoleBasedConsent() {
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('buyer');
  const [context, setContext] = useState({});

  const openConsent = (role: UserRole, contextData = {}) => {
    setCurrentRole(role);
    setContext(contextData);
    setIsConsentOpen(true);
  };

  const closeConsent = () => {
    setIsConsentOpen(false);
    setContext({});
  };

  return {
    isConsentOpen,
    currentRole,
    context,
    openConsent,
    closeConsent,
    RoleBasedConsent: ({ onConfirm, isLoading }: { onConfirm: () => void; isLoading?: boolean }) => (
      <RoleBasedConsent
        role={currentRole}
        isOpen={isConsentOpen}
        onClose={closeConsent}
        onConfirm={onConfirm}
        isLoading={isLoading}
        context={context}
      />
    )
  };
}