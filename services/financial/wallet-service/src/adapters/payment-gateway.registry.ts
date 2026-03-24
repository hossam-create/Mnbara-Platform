import { PaymentGateway } from '../interfaces/payment-gateway.interface';
import { StripeAdapter } from './stripe.adapter';
import { PaymobAdapter } from './paymob.adapter';

// In a real app, strict DI container or configuration injection validation
const adapters: Record<string, PaymentGateway> = {
  // Enforce env vars. If missing, the adapter constructor will throw.
  // We use empty strings as catch-all if env is undefined, letting the adapter throw a specific error.
  stripe: new StripeAdapter(process.env.STRIPE_API_KEY || '', process.env.STRIPE_WEBHOOK_SECRET || ''),
  paymob: new PaymobAdapter(
    process.env.PAYMOB_API_KEY || '', 
    process.env.PAYMOB_INTEGRATION_ID || '', 
    process.env.PAYMOB_HMAC_SECRET || '', 
    process.env.PAYMOB_IFRAME_ID
  ),
};


export const getPaymentGateway = (name: string): PaymentGateway => {
  const adapter = adapters[name.toLowerCase()];
  if (!adapter) {
    throw new Error(`Payment Gateway '${name}' not supported`);
  }
  return adapter;
};
