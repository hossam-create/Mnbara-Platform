import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'USD' | 'SAR' | 'EUR' | 'EGP';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (priceInUSD: number) => string;
  rates: Record<Currency, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const RATES: Record<Currency, number> = {
  USD: 1,
  SAR: 3.75,
  EUR: 0.92,
  EGP: 48.50
};

const SYMBOLS: Record<Currency, string> = {
  USD: '$',
  SAR: 'SAR ',
  EUR: '€',
  EGP: 'EGP '
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');

  const formatPrice = (priceInUSD: number) => {
    const rate = RATES[currency];
    const converted = priceInUSD * rate;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, rates: RATES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
